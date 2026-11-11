-- Roadmap phase 1: stars, streak and badges on the student page.
-- Adds a `rewards` field to get_portal (everything else is unchanged). No new table.
--   stars       = sum of the best score of each handed-in homework
--   done        = homework handed in
--   streak      = homework handed in one after another, newest first
--                 (an open homework younger than 3 days does not break it)
--   best_streak = longest such run; the page gives badges at 3, 5 and 10
CREATE OR REPLACE FUNCTION public.get_portal(p_token text)
 RETURNS json
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select json_build_object(
    'student', json_build_object('name_ar', s.name_ar, 'name_en', s.name_en, 'lang', s.lang),
    'lessons', coalesce((select json_agg(json_build_object(
        'date', d.data->>'date', 'title', d.data->>'title', 'subject', d.data->>'subject',
        'summary', d.data->'summary', 'homework', d.data->>'homework', 'url', d.data->>'url',
        'hw', case when exists (select 1 from public.assignment_targets t2 where t2.student_id = s.id and not t2.released and d.data->>'hw' like '%' || t2.token || '%') then null else d.data->>'hw' end)
        order by d.id desc)
      from public.docs d where d.collection='lessons' and substring(d.id from 12) = any(s.keys)), '[]'::json),
    'report', (select json_build_object('date', d.data->>'date', 'session', d.data->>'session', 'subject', d.data->>'subject', 'rating', d.data->>'rating',
        'lesson', d.data->'lesson', 'hw', d.data->'hw', 'tajwid', d.data->'tajwid', 'arabic', d.data->'arabic', 'arabichw', d.data->'arabichw',
        'islamic', d.data->'islamic', 'islamichw', d.data->'islamichw', 'encourage', d.data->>'encourage')
      from public.docs d where d.collection='reports' and d.id = any(s.keys)
      order by (d.data->>'savedAt')::bigint desc nulls last limit 1),
    'homework', coalesce((select json_agg(json_build_object('title', a.title, 'kind', a.kind, 'subject', a.subject, 'due_date', a.due_date,
        'token', t.token, 'sent_at', t.sent_at,
        'last', (select json_build_object('score', x.score, 'max_score', x.max_score, 'status', x.status, 'feedback', x.feedback, 'feedback_audio', x.feedback_audio, 'submitted_at', x.submitted_at)
                 from public.submissions x where x.target_id = t.id order by x.submitted_at desc limit 1))
        order by t.sent_at desc)
      from public.assignment_targets t join public.assignments a on a.id = t.assignment_id where t.student_id = s.id and t.released), '[]'::json),
    'corrections', coalesce((select json_agg(json_build_object('id', c.id, 'date', c.report_date, 'n', c.n, 'items', c.items) order by c.created_at desc)
      from (select id, report_date, n, items, created_at from public.correction_reports where student_id = s.id order by created_at desc limit 30) c), '[]'::json),
    'rewards', (
      with h as (
        select t.sent_at,
          (select max(x.score) from public.submissions x where x.target_id = t.id) best,
          exists (select 1 from public.submissions x where x.target_id = t.id) done
        from public.assignment_targets t
        where t.student_id = s.id and t.released
      ), c as (
        select sent_at, done, row_number() over (order by sent_at) - row_number() over (partition by done order by sent_at) g
        from h where done or sent_at < now() - interval '3 days'
      )
      select json_build_object(
        'stars', coalesce((select round(sum(best)) from h), 0),
        'done', (select count(*) from h where done),
        'streak', (select count(*) from c where done and sent_at > coalesce((select max(sent_at) from c where not done), '-infinity')),
        'best_streak', coalesce((select max(n) from (select count(*) n from c where done group by g) z), 0)))
  )
  from public.students s where s.portal_token = p_token and s.active and length(p_token) >= 24;
$function$;
