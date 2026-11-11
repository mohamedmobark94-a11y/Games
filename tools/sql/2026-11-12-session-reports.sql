-- Roadmap phase 2: an archive of every session report (docs reports keeps only the latest one per student).
-- A trigger on docs copies each saved report into session_reports, whoever saved it (the site's generator,
-- or the task that copies reports from the claude.ai generator). One row per student + date + session:
-- saving the same session again updates its row. Teacher only (RLS); nothing is deleted.

create table if not exists public.session_reports (
  id uuid primary key default gen_random_uuid(),
  student_id uuid null references public.students(id) on delete set null,
  student_key text not null,
  report_date date not null,
  session int not null default 0,
  data jsonb not null,
  text text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (student_key, report_date, session)
);
create index if not exists session_reports_student_date on public.session_reports (student_id, report_date);
alter table public.session_reports enable row level security;
drop policy if exists "teacher only" on public.session_reports;
create policy "teacher only" on public.session_reports for all to authenticated using (public.is_teacher()) with check (public.is_teacher());

-- p_key: the report's id in docs reports (the generator's student id); p_data: the report as saved there
create or replace function public.archive_report(p_key text, p_data jsonb)
returns void language plpgsql security definer set search_path to 'public' as $$
declare
  d date; ds text := coalesce(p_data->>'date', ''); sid uuid; skey text := p_key; ses int;
begin
  if ds ~ '^\d{1,2}/\d{1,2}/\d{4}$' then d := to_date(ds, 'DD/MM/YYYY');
  elsif ds ~ '^\d{4}-\d{2}-\d{2}' then d := left(ds, 10)::date;
  elsif (p_data->>'savedAt') ~ '^\d+$' then d := (to_timestamp((p_data->>'savedAt')::bigint / 1000.0) at time zone 'Africa/Cairo')::date;
  else return; end if;
  ses := coalesce(nullif(substring(coalesce(p_data->>'session', '') from '\d+'), '')::int, 0);
  select s.id, s.slug into sid, skey from public.students s where s.slug = p_key or p_key = any(s.keys) order by (s.slug = p_key) desc limit 1;
  skey := coalesce(skey, p_key);
  insert into public.session_reports (student_id, student_key, report_date, session, data, text)
  values (sid, skey, d, ses, p_data,
          (select string_agg(x, E'\n') from jsonb_array_elements_text(case when jsonb_typeof(p_data->'all') = 'array' then p_data->'all' else '[]'::jsonb end) x))
  on conflict (student_key, report_date, session) do update
    set data = excluded.data, text = excluded.text, student_id = coalesce(excluded.student_id, session_reports.student_id), updated_at = now();
end $$;
revoke all on function public.archive_report(text, jsonb) from public, anon, authenticated;

create or replace function public.docs_archive_report() returns trigger language plpgsql security definer set search_path to 'public' as $$
begin
  if new.collection = 'reports' then
    begin perform public.archive_report(new.id, new.data);
    exception when others then raise warning 'archive_report %: %', new.id, sqlerrm; end;   -- never blocks saving the report
  end if;
  return new;
end $$;
drop trigger if exists docs_archive_report on public.docs;
create trigger docs_archive_report after insert or update on public.docs for each row execute function public.docs_archive_report();

-- one-time fill: the reports already saved, then the generator's own last report per student (kv lastReports)
select public.archive_report(id, data) from public.docs where collection = 'reports';
select public.archive_report(
  coalesce((select r.id from public.docs r where r.collection = 'reports' and r.data->>'student' = e.key limit 1), lower(regexp_replace(e.key, '\s+', '-', 'g'))),
  jsonb_build_object('student', e.key, 'date', e.value->>'date', 'session', e.value->>'session', 'rating', e.value->>'rating', 'savedAt', e.value->'savedAt',
    'subject', e.value->>'subject', 'encourage', e.value->>'encourage', 'source', 'kv lastReports') || coalesce(e.value->'lists', '{}'::jsonb))
from public.kv, jsonb_each(kv.value::jsonb) e where kv.key = 'lastReports'
  and not exists (select 1 from public.docs r where r.collection = 'reports' and r.data->>'date' = e.value->>'date' and r.data->>'session' = e.value->>'session'
                  and (r.data->>'student' = e.key or r.id = lower(regexp_replace(e.key, '\s+', '-', 'g'))));
