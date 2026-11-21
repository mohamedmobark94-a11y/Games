/* «دروس اليوم» built by the site itself (no scheduled task, no calendar).
   A teaching day runs 06:00 → 06:00 Cairo time; its list is docs days/<YYYY-MM-DD>.
   Source: the weekly roster (kv deskRoster) + private rules (kv dayRules):
     {skip:[roster names: review only, no lesson prep], hide:[roster names left out], keys:{rosterName: planKey},
      days:{rosterName:[weekdays 0=Sun…]} (wins over the roster), times:{rosterName:{weekday:'HH:MM'}},
      names:{slug: name shown in the list}, split:{rosterName:[slug, slug…]} (one slot shared by several students, in order)}
   Every session gets the student's last report (docs reports) in its note.
   One-off changes live in the day rows themselves: an extra class (extra:true), a moved class (moved:{from, time}),
   and off:[slug…] = regular sessions taken off that day (moved away or cancelled), so the roster does not add them back.
   Used by the teacher page (TQDays.kit(db).ensure(today)) and inside the report generator (TQDays.ui(sb): the
   «➕ حصة استثنائية / نقل موعد» box under «دروس اليوم»). */
(function(){
  const DN = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  const MN = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
  const pad = n => String(n).padStart(2, '0');
  const iso = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  const dateOf = id => { const p = String(id).split('-').map(Number); return new Date(p[0], p[1] - 1, p[2], 12); };
  const addDays = (id, n) => { const d = dateOf(id); d.setDate(d.getDate() + n); return iso(d); };
  const cairoNow = ms => new Date(new Date(ms).toLocaleString('en-US', {timeZone: 'Africa/Cairo'}));
  const today = () => iso(cairoNow(Date.now() - 6 * 3600e3));      // the teaching day we are in now
  const hm = h => +h.slice(0, 2) * 60 + +h.slice(3, 5);
  const fmt = x => { x = ((Math.round(x) % 1440) + 1440) % 1440; return pad(Math.floor(x / 60)) + ':' + pad(x % 60); };
  const fold = v => String(v == null ? '' : v).trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').replace(/^(brother|sister|sheikh|shaikh|الشيخ|الاخ|الاخت)\s+/, '').replace(/[\s_]+/g, '-');
  const labelOf = id => { const d = dateOf(id); return DN[d.getDay()] + ' ' + d.getDate() + ' ' + MN[d.getMonth()] + ' ' + d.getFullYear(); };
  /* minutes from the start of the teaching day's date (a session after midnight = 1440 + …) */
  const ordOf = t => { const m = String(t || '').match(/(\d\d):(\d\d)/); return m ? (/غد/.test(t) ? 1440 : 0) + hm(m[1] + ':' + m[2]) : 9999; };
  const spanOf = t => { const m = String(t || '').match(/(\d\d:\d\d)\s*[–-]\s*(\d\d:\d\d)/); return m ? ((hm(m[2]) - hm(m[1])) + 1440) % 1440 || 30 : 0; };
  /* a calendar date + clock time → which teaching day it belongs to, and how it is written in the list */
  function slotOf(dateId, time, mins){
    const early = hm(time) < 360, day = early ? addDays(dateId, -1) : dateId;
    return {day, time: (early ? 'غدًا ' + DN[dateOf(dateId).getDay()] + ' ' : '') + time + '–' + fmt(hm(time) + (+mins || 30))};
  }
  const isAutoNote = n => !n || /^(من الجدول الأسبوعي|آخر تقرير|مفيش تقرير سابق|مراجعة قرآن فقط)/.test(n);

  function kit(sb){
    let C = null;
    async function load(force){
      if(C && !force && Date.now() - C.at < 60000) return C;
      const [kv, st, rp] = await Promise.all([
        sb.from('kv').select('key,value').in('key', ['deskRoster', 'dayRules']),
        sb.from('students').select('slug,keys,name_ar,name_en,active'),
        sb.from('docs').select('id,data').eq('collection', 'reports')]);
      if(kv.error) throw kv.error;
      const K = {}; (kv.data || []).forEach(r => { try{ K[r.key] = JSON.parse(r.value); }catch(e){ K[r.key] = {}; } });
      C = {at: Date.now(), R: K.deskRoster || {}, rules: K.dayRules || {}, S: (st.data || []).filter(s => s.active !== false), reps: rp.data || []};
      return C;
    }
    /* who is this: a plan key, a slug, an old alias or a name → the students row */
    function stOf(k){
      if(!C || k == null || k === '') return null;
      const f = fold(k);
      return C.S.find(s => s.slug === k || (s.keys || []).indexOf(k) >= 0) ||
        C.S.find(s => fold(s.slug) === f || (s.keys || []).some(x => fold(x) === f) || fold(s.name_ar) === f || fold(s.name_en) === f) || null;
    }
    const canon = it => it.slug || ((stOf(it.key) || (it.key ? null : stOf(it.name)) || {}).slug) || String(it.key || it.name || '');
    const nameOf = (st, fallback, key) => (C.rules.names || {})[st ? st.slug : key] || (st && st.name_ar) || fallback;
    /* the newest report of a student (any of his old ids); a group with no students row is found by its name */
    function reportOf(st, name){
      if(!st && !name) return null;
      const ks = new Set((st ? [st.slug].concat(st.keys || []) : [name]).map(fold)), nm = new Set((st ? [st.name_ar, st.name_en] : [name]).filter(Boolean).map(fold));
      const when = r => { const m = String(r.data && r.data.date || '').match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/); return m ? m[3] + pad(m[2]) + pad(m[1]) : String(r.data && r.data.savedAt || ''); };
      /* the report under the student's own id first; old aliases only when there is none
         (an alias can be shared, e.g. a parent's review report filed under the child's old id) */
      const newest = list => list.sort((a, b) => when(b) > when(a) ? 1 : -1)[0] || null;
      return (st && newest(C.reps.filter(r => fold(r.id) === fold(st.slug)))) ||
        newest(C.reps.filter(r => ks.has(fold(r.id)) || nm.has(fold(r.data && r.data.student))));
    }
    function reportLine(st, name){
      const r = reportOf(st, name);
      if(!r) return 'مفيش تقرير سابق';
      const d = r.data || {}, first = v => (Array.isArray(v) ? v : [v]).map(x => String(x || '').trim()).find(Boolean) || '';
      const cut = (s, n) => s.length > n ? s.slice(0, n - 1) + '…' : s;
      const what = ['lesson', 'tajwid', 'arabic', 'islamic'].map(k => first(d[k])).find(Boolean) || '';
      const hw = first(d.hw);
      return 'آخر تقرير ' + (d.date || '') + (what ? ': ' + cut(what, 110) : '') + (hw ? ' — واجب: ' + cut(hw, 90) : '');
    }
    /* the sessions the roster gives this teaching day */
    function rosterItems(D){
      const R = C.R, rules = C.rules, skip = new Set(rules.skip || []), hide = new Set(rules.hide || []), keys = rules.keys || {}, times = rules.times || {}, split = rules.split || {};
      const wd = dateOf(D).getDay(), tw = (wd + 1) % 7, out = [];
      (R.students || []).forEach(s => {
        if(!/^\d\d:\d\d$/.test(s.time || '') || hide.has(s.name)) return;
        const at = w => (times[s.name] && times[s.name][w]) || s.time, slots = [], sd = (rules.days || {})[s.name] || s.days || [];
        if(sd.indexOf(wd) >= 0 && hm(at(wd)) >= 360) slots.push({start: hm(at(wd)), tom: false});
        if(sd.indexOf(tw) >= 0 && hm(at(tw)) < 360) slots.push({start: 1440 + hm(at(tw)), tom: true});
        const parts = split[s.name] || [null], len = (+s.mins || 30) / parts.length;
        slots.forEach(sl => parts.forEach((slug, i) => {
          /* a key in dayRules wins (a review-only parent can share a name with his child's old report ids) */
          const st = slug ? stOf(slug) : keys[s.name] ? stOf(keys[s.name]) : stOf(s.name);
          const a = sl.start + i * len, review = skip.has(s.name);
          out.push({key: slug || keys[s.name] || (st && st.slug) || s.id, slug: st ? st.slug : (slug || keys[s.name] || s.id), name: nameOf(st, s.name, slug || keys[s.name]),
            time: (sl.tom ? 'غدًا ' + DN[tw] + ' ' : '') + fmt(a) + '–' + fmt(a + len), ord: a, rid: s.id,
            note: (review ? 'مراجعة قرآن فقط · ' : '') + reportLine(st, st ? null : s.name), review: review || undefined, need: false, pick: true, status: ''});
        }));
      });
      out.sort((a, b) => a.ord - b.ord);
      return out.map(x => { delete x.ord; if(!x.review) delete x.review; return x; });
    }
    /* rid = the roster's own id, used only for matching; it is not saved */
    const bare = x => { const y = Object.assign({}, x); delete y.rid; return y; };
    const stamp = () => new Date().toLocaleTimeString('en-GB', {timeZone: 'Africa/Cairo', hour: '2-digit', minute: '2-digit'});
    async function getDay(D){
      const r = await sb.from('docs').select('data').eq('collection', 'days').eq('id', D).maybeSingle();
      if(r.error) throw r.error;
      return r.data ? r.data.data : null;
    }
    async function putDay(D, data){
      const r = await sb.from('docs').upsert({collection: 'days', id: D, data});
      if(r.error) throw r.error;
    }
    /* make sure the day has every roster session (minus the ones taken off), each with the last report.
       Items already there keep everything (lesson link, homework, ticks, notes, order); only an empty time
       and an automatic note are filled in. */
    async function ensure(D, opt){
      D = D || today(); await load(opt && opt.force);
      const base = rosterItems(D), cur = await getDay(D);
      if(!cur){
        const data = {id: D, label: labelOf(D) + ' (6 ص ← 6 ص)', updated: stamp(), auto: 'roster', window: '06-06', items: base.map(bare)};
        await putDay(D, data); return data;
      }
      const items = (cur.items || []).map(x => Object.assign({}, x)), off = new Set(cur.off || []), before = JSON.stringify(cur.items || []);
      /* the same session: same student, or the same key (older lists used the roster's own id as key) */
      const have = {}, byKey = {};
      items.forEach(it => { if(!it.extra && !it.moved){ const c = canon(it); if(!have[c]) have[c] = it; if(it.key && !byKey[it.key]) byKey[it.key] = it; } });
      const add = [];
      base.forEach(b => {
        if(off.has(b.slug)) return;
        const it = have[b.slug] || byKey[b.key] || byKey[b.rid];
        if(!it){ add.push(bare(b)); return; }
        if(!it.time) it.time = b.time;
        if(!it.slug) it.slug = b.slug;
        if(isAutoNote(it.note) && it.note !== b.note) it.note = b.note;
      });
      /* extras and moved classes get their report line too (after the «➕ / ↔» part) */
      items.forEach(it => { if((it.extra || it.moved) && it.slug && /·\s*(آخر تقرير|مفيش تقرير سابق)/.test(it.note || '')){
        const ln = reportLine(stOf(it.slug)); it.note = it.note.replace(/(آخر تقرير|مفيش تقرير سابق)[\s\S]*$/, ln); } });
      let all = items;
      if(add.length) all = items.concat(add).sort((p, q) => ordOf(p.time) - ordOf(q.time));
      if(JSON.stringify(all) === before) return cur;
      const data = Object.assign({}, cur, {items: all, label: cur.label || labelOf(D) + ' (6 ص ← 6 ص)', updated: stamp()});
      await putDay(D, data); return data;
    }
    const sortItems = list => list.slice().sort((p, q) => ordOf(p.time) - ordOf(q.time));
    function findIn(day, slug){ return (day.items || []).findIndex(it => !it.extra && !it.moved && canon(it) === slug); }
    /* ↔ move a regular class from teaching day `from` to a calendar date + time (same day = new time) */
    async function move(from, slug, toDate, time, mins){
      const A = await ensure(from), i = findIn(A, slug);
      if(i < 0) throw new Error('الطالب ده مالوش حصة في ' + labelOf(from) + ' — اختار اليوم الصح.');
      const it = A.items[i], len = +mins || spanOf(it.time) || 30, to = slotOf(toDate, time, len);
      const moved = Object.assign({}, it, {slug, time: to.time, moved: {from, time: it.time},
        note: '↔ اتنقلت من ' + labelOf(from) + ' ' + String(it.time || '').replace(/^غد\S*\s+\S+\s+/, '') + ' · ' + reportLine(stOf(slug))});
      if(to.day === from){
        A.items = sortItems(A.items.map((x, k) => k === i ? moved : x)); A.updated = stamp();
        A.off = Array.from(new Set((A.off || []).concat([slug])));   // so the roster does not add the old time back
        await putDay(from, A); return {from: A, to: A};
      }
      A.items = A.items.filter((x, k) => k !== i); A.off = Array.from(new Set((A.off || []).concat([slug]))); A.updated = stamp();
      await putDay(from, A);
      const B = await ensure(to.day);
      B.off = (B.off || []).filter(x => x !== slug);
      B.items = sortItems((B.items || []).concat([moved])); B.updated = stamp();
      await putDay(to.day, B); return {from: A, to: B};
    }
    /* ➕ a one-off class (any student, any date) */
    async function extra(slugOrName, dateId, time, mins){
      await load(); const st = stOf(slugOrName), to = slotOf(dateId, time, mins);
      const B = await ensure(to.day), slug = st ? st.slug : fold(slugOrName);
      const it = {key: slug + '-x' + time.replace(':', ''), slug, name: nameOf(st, slugOrName), time: to.time, extra: true,
        note: '➕ حصة استثنائية · ' + reportLine(st), need: false, pick: true, status: ''};
      B.items = sortItems((B.items || []).filter(x => x.key !== it.key).concat([it])); B.updated = stamp();
      await putDay(to.day, B); return B;
    }
    /* 🚫 no class this day */
    async function cancel(D, slug){
      const A = await ensure(D), i = findIn(A, slug);
      if(i < 0) throw new Error('الطالب ده مالوش حصة في ' + labelOf(D) + '.');
      const it = A.items[i];
      A.items = A.items.filter((x, k) => k !== i);
      A.off = Array.from(new Set((A.off || []).concat([slug])));
      A.offInfo = Object.assign({}, A.offInfo, {[slug]: {name: it.name, time: it.time}}); A.updated = stamp();
      await putDay(D, A); return A;
    }
    /* the changes from today on (for the list with «↩ رجّع») */
    async function upcoming(){
      await load();
      const D0 = today(), r = await sb.from('docs').select('id,data').eq('collection', 'days').gte('id', D0).lte('id', addDays(D0, 45)).order('id', {ascending: true});
      if(r.error) throw r.error;
      const out = [], movedAway = new Set();
      (r.data || []).forEach(row => (row.data.items || []).forEach(it => { if(it.moved) movedAway.add(it.moved.from + '|' + it.slug); }));
      (r.data || []).forEach(row => {
        const d = row.data || {};
        (d.items || []).forEach(it => {
          if(it.extra) out.push({kind: 'extra', day: row.id, slug: it.slug, key: it.key, text: '➕ ' + it.name + ' · حصة استثنائية ' + labelOf(row.id) + ' ' + it.time});
          else if(it.moved) out.push({kind: 'moved', day: row.id, slug: it.slug, key: it.key, text: '↔ ' + it.name + ' · من ' + labelOf(it.moved.from) + ' ' + it.moved.time + ' ← ' + (row.id === it.moved.from ? '' : labelOf(row.id) + ' ') + it.time});
        });
        (d.off || []).forEach(slug => { if(movedAway.has(row.id + '|' + slug)) return;
          const info = (d.offInfo || {})[slug] || {}, st = stOf(slug);
          out.push({kind: 'off', day: row.id, slug, text: '🚫 ' + (info.name || nameOf(st, slug)) + ' · مفيش حصة ' + labelOf(row.id) + (info.time ? ' ' + info.time : '')}); });
      });
      /* a class moved from a past day into the future shows up too (its «from» day is before today) */
      return out;
    }
    /* ↩ undo one change */
    async function undo(ch){
      const B = await getDay(ch.day); if(!B) return;
      if(ch.kind === 'extra'){ B.items = (B.items || []).filter(x => x.key !== ch.key); B.updated = stamp(); await putDay(ch.day, B); return; }
      if(ch.kind === 'off'){ B.off = (B.off || []).filter(x => x !== ch.slug); if(B.offInfo) delete B.offInfo[ch.slug]; await putDay(ch.day, B); await ensure(ch.day, {force: true}); return; }
      if(ch.kind === 'moved'){
        const it = (B.items || []).find(x => x.key === ch.key && x.moved); if(!it) return;
        const from = it.moved.from, back = Object.assign({}, it, {time: it.moved.time, note: ''});
        delete back.moved;
        if(from === ch.day){ B.items = sortItems(B.items.map(x => x === it ? back : x)); B.off = (B.off || []).filter(x => x !== ch.slug); B.updated = stamp(); await putDay(ch.day, B); await ensure(ch.day, {force: true}); return; }
        B.items = B.items.filter(x => x !== it); B.updated = stamp(); await putDay(ch.day, B);
        const A = (await getDay(from)) || {id: from, label: labelOf(from) + ' (6 ص ← 6 ص)', auto: 'roster', window: '06-06', items: []};
        A.off = (A.off || []).filter(x => x !== ch.slug);
        A.items = sortItems((A.items || []).concat([back])); A.updated = stamp();
        await putDay(from, A); await ensure(from, {force: true});
      }
    }
    /* who can be picked: roster sessions first (by their list name), then every other student */
    async function people(){
      await load();
      const seen = {}, out = [], keys = C.rules.keys || {}, split = C.rules.split || {};
      const hide = new Set(C.rules.hide || []);
      (C.R.students || []).filter(s => /^\d\d:\d\d$/.test(s.time || '') && !hide.has(s.name)).forEach(s => (split[s.name] || [keys[s.name] || s.name]).forEach(k => {
        const st = (split[s.name] || keys[s.name]) ? stOf(k) : stOf(s.name), slug = st ? st.slug : (keys[s.name] || s.id);
        if(seen[slug]) return; seen[slug] = 1; out.push({slug, name: nameOf(st, s.name, slug), mins: +s.mins || 30, roster: true}); }));
      C.S.forEach(st => { if(seen[st.slug] || /^zz-/.test(st.slug)) return; seen[st.slug] = 1; out.push({slug: st.slug, name: nameOf(st, st.name_en || st.slug), mins: 30}); });
      return out;
    }
    return {today, addDays, labelOf, load, ensure, move, extra, cancel, upcoming, undo, people, rosterItems: D => load().then(() => rosterItems(D))};
  }

  /* ---------- inside the report generator: the box under «دروس اليوم» ---------- */
  /* the cards of «دروس اليوم» say «مفيش درس محفوظ / مفيش تقرير محفوظ على الجهاز ده» when the generator cannot match
     the name (e.g. «رضا» vs a report saved as «Reda») or the student only has Qur'an homework, no lesson page.
     Fill those lines from the site: the newest lesson (docs lessons) or else the newest homework (assignments),
     and the newest saved report (docs reports). */
  function gaps(sb, L, esc){
    let D = null, busy = false, t = null;
    const shortD = s => { const d = new Date(s); return isNaN(d) ? '' : d.getDate() + '/' + (d.getMonth() + 1); };
    async function data(){
      if(D && Date.now() - D.at < 60000) return D;
      const [st, ls, rp, as] = await Promise.all([
        sb.from('students').select('id,slug,keys,name_ar,name_en'),
        sb.from('docs').select('id,data').eq('collection', 'lessons').order('id', {ascending: false}).limit(400),
        sb.from('docs').select('id,data').eq('collection', 'reports'),
        sb.from('assignment_targets').select('student_id,token,sent_at,released,assignments(title,created_at)').order('sent_at', {ascending: false}).limit(400)]);
      D = {at: Date.now(), st: st.data || [], ls: ls.data || [], rp: rp.data || [], as: as.data || []};
      return D;
    }
    const nk = v => fold(v).replace(/[^\p{L}\p{N}]+/gu, '');   // names compared without spaces, dashes or brackets
    const namesOf = s => [s.slug, s.name_ar, s.name_en].concat(s.keys || []).filter(Boolean).map(nk);
    function who(name, d){
      const f = nk(name), parts = fold(name).split('-').map(nk); if(!f) return null;
      return d.st.find(s => namesOf(s).indexOf(f) >= 0) || d.st.find(s => namesOf(s).some(n => n && parts.indexOf(n) >= 0)) || null;
    }
    async function fill(){
      if(busy) return;
      const rows = [...L.querySelectorAll('.td-row')].filter(r => !r.dataset.tqGap && [...r.querySelectorAll('.td-dim')].some(x => /مفيش (درس|تقرير) محفوظ/.test(x.textContent)));
      if(!rows.length) return;
      busy = true;
      try{
        const d = await data(), site = (window.TQ && TQ.site) || 'https://mohamedmobark94-a11y.github.io/Games/';
        rows.forEach(r => {
          r.dataset.tqGap = '1';
          const nm = r.querySelector('.td-nm'); const s = nm && who((nm.firstChild || {}).textContent || nm.textContent, d); if(!s) return;
          const names = namesOf(s), today = new Date().toISOString().slice(0, 10);
          r.querySelectorAll('.td-dim').forEach(x => {
            if(/مفيش درس محفوظ/.test(x.textContent)){
              const l = d.ls.find(l => l.id <= today + '~' && (l.id.slice(11) === s.slug || names.indexOf(nk((l.data || {}).student)) >= 0));
              if(l){ const v = l.data || {};
                x.outerHTML = '<span>' + esc(shortD(l.id.slice(0, 10)) + ' · ' + (v.title || '')) + (v.url ? ' · <a href="' + esc(v.url) + '" target="_blank" rel="noopener">فتحه</a>' : '') + (v.hw ? ' · <a href="' + esc(v.hw) + '" target="_blank" rel="noopener">الواجب</a> <button type="button" class="td-mini" data-hwc="' + esc(v.hw) + '">نسخ اللينك</button>' : '') + '</span>'; return; }
              const a = d.as.find(a => a.student_id === s.id && a.assignments);
              if(a){ const u = site + 'app/hw.html?t=' + a.token;
                x.outerHTML = '<span>' + esc(shortD(a.sent_at || a.assignments.created_at) + ' · ' + a.assignments.title) + ' · <a href="' + esc(u) + '" target="_blank" rel="noopener">الواجب</a> <button type="button" class="td-mini" data-hwc="' + esc(u) + '">نسخ اللينك</button>' + (a.released ? '' : ' <small style="color:#b45309">(مخفي لسه)</small>') + '</span>'; }
            } else if(/مفيش تقرير محفوظ/.test(x.textContent)){
              const p = d.rp.filter(p => p.id === s.slug || names.indexOf(nk(p.id)) >= 0 || names.indexOf(nk((p.data || {}).studentId)) >= 0 || names.indexOf(nk((p.data || {}).student)) >= 0)
                .sort((a, b) => (+(b.data || {}).savedAt || 0) - (+(a.data || {}).savedAt || 0))[0];
              if(!p) return; const v = p.data || {};
              let key = ''; try{ key = Object.keys(lastReports || {}).find(k => names.indexOf(nk(k)) >= 0) || ''; }catch(_){}
              x.outerHTML = '<span>حصة ' + esc(v.session || '?') + ' · <bdi dir="ltr">' + esc(v.date || '') + '</bdi>' + (key ? ' <button type="button" class="td-mini" data-lr="' + esc(key) + '">افتحه في الفورم (حصة +1)</button>' : '') + '</span>';
            }
          });
        });
      }catch(e){ console.warn('days.gaps', e); }
      busy = false;
    }
    new MutationObserver(() => { clearTimeout(t); t = setTimeout(fill, 250); }).observe(L, {childList: true, subtree: true});
    setTimeout(fill, 500);
  }

  /* «دروس اليوم» lives on the first page, above the report form, in its own gold card (Mohamed wants everything
     in one place). The tab «📅 دروس اليوم» now jumps to that card. The card folds; the choice is remembered. */
  function home(){
    const td = document.querySelector('#page-today .td'), rep = document.getElementById('page-report');
    if(!td || !rep || document.getElementById('tqToday')) return;
    const st = document.createElement('style');
    st.textContent = '#tqToday{max-width:1340px;margin:16px auto 4px;padding:0 20px}' +
      '#tqToday .tq-card{border:2px solid #c9a227;border-radius:18px;background:linear-gradient(180deg,#fffaf0,#fff 140px);box-shadow:0 6px 22px rgba(138,109,11,.13);overflow:hidden}' +
      '#tqToday .tq-bar{display:flex;align-items:center;gap:12px;width:100%;padding:14px 18px;border:0;background:linear-gradient(90deg,#0e4d3c,#177a5b);color:#fff;font:inherit;cursor:pointer;text-align:start;direction:rtl}' +
      '#tqToday .tq-bar b{font-size:18px}#tqToday .tq-sum{flex:1;font-size:13px;opacity:.92}' +
      '#tqToday .tq-pill{background:#f5d76e;color:#3d2f00;border-radius:999px;padding:3px 11px;font-size:12.5px;font-weight:800;white-space:nowrap}' +
      '#tqToday .tq-arr{font-size:16px;transition:transform .2s}#tqToday.shut .tq-arr{transform:rotate(-90deg)}' +
      '#tqToday .tq-in{padding:6px 14px 14px}#tqToday.shut .tq-in{display:none}' +
      '#tqToday .td-head h2{display:none}#tqToday .td{max-width:none;margin:0}#tqToday #page-today{display:block!important;padding:0;margin:0;max-width:none}';
    document.head.appendChild(st);
    const box = document.createElement('section'); box.id = 'tqToday';
    let shut = false; try{ shut = localStorage.getItem('tqTodayShut') === '1'; }catch(_){}
    if(shut) box.classList.add('shut');
    box.innerHTML = '<div class="tq-card"><button type="button" class="tq-bar" aria-expanded="' + !shut + '"><span class="tq-arr">▾</span><b>📅 دروس اليوم</b><span class="tq-sum"></span><span class="tq-pill" hidden></span></button><div class="tq-in"></div></div>';
    /* move the whole page (not only .td): the generator listens for clicks/typing on #page-today itself */
    box.querySelector('.tq-in').appendChild(document.getElementById('page-today'));
    rep.insertBefore(box, rep.firstChild);
    const bar = box.querySelector('.tq-bar'), sum = box.querySelector('.tq-sum'), pill = box.querySelector('.tq-pill');
    bar.onclick = () => { const s = box.classList.toggle('shut'); bar.setAttribute('aria-expanded', !s); try{ localStorage.setItem('tqTodayShut', s ? '1' : '0'); }catch(_){} };
    const paint = () => {
      const t = document.getElementById('tdTitle'), rows = td.querySelectorAll('.td-chip').length, picked = td.querySelectorAll('.td-chip.on').length;
      sum.textContent = (t ? t.textContent.replace(/^دروس اليوم\s*·?\s*/, '') : '') + (rows ? ' · ' + rows + ' حصة' : '');
      pill.hidden = !picked; pill.textContent = picked + ' مختار';
    };
    new MutationObserver(paint).observe(td, {childList: true, subtree: true, characterData: true}); paint();
    /* «افتحه في الفورم»: the generator fills the form below the card — take the eye there and show it worked */
    box.addEventListener('click', e => {
      const b = e.target.closest && e.target.closest('[data-lr]'); if(!b) return;
      setTimeout(() => {
        const w = rep.querySelector('.wrap') || document.getElementById('lastPick'); if(!w) return;
        w.scrollIntoView({behavior: 'smooth', block: 'start'});
        try{ const fr = window.frameElement; if(fr && window.parent !== window){   // the site shows the generator in a tall frame: scroll the outer page too
          const P = window.parent; P.scrollTo({top: fr.getBoundingClientRect().top + P.scrollY + w.getBoundingClientRect().top - 12, behavior: 'smooth'}); } }catch(_){}
        w.style.transition = 'box-shadow .3s'; w.style.boxShadow = '0 0 0 4px #c9a227'; setTimeout(() => { w.style.boxShadow = ''; }, 1800);
        let t = document.getElementById('tqToast');
        if(!t){ t = document.createElement('div'); t.id = 'tqToast'; t.style.cssText = 'position:fixed;bottom:22px;left:50%;transform:translateX(-50%);background:#0e4d3c;color:#fff;padding:11px 18px;border-radius:12px;font-weight:700;z-index:99999;box-shadow:0 6px 20px rgba(0,0,0,.2);direction:rtl'; document.body.appendChild(t); }
        t.textContent = '✓ اتفتح آخر تقرير لـ ' + b.dataset.lr + ' في الفورم تحت (الحصة الجاية +1)'; t.hidden = false; clearTimeout(t._h); t._h = setTimeout(() => { t.hidden = true; }, 3500);
      }, 200);
    });
    const show = () => { box.classList.remove('shut'); bar.setAttribute('aria-expanded', 'true'); setTimeout(() => box.scrollIntoView({behavior: 'smooth', block: 'start'}), 60); };
    if(window.Desk && Desk.go && !Desk.__tqHome){ const go = Desk.go; Desk.go = p => p === 'today' ? (go('report'), show()) : go(p); Desk.__tqHome = true; }
    /* the separate tab is no longer needed: its badge moves into the card's bar, the tab itself is hidden */
    const tab = document.querySelector('.tabb[data-page="today"]');
    if(tab){ const bd = document.getElementById('todayBadge'); if(bd) bar.insertBefore(bd, pill); tab.style.display = 'none'; }
    const pt = document.getElementById('page-today'); if(pt && pt.classList.contains('on') && window.Desk) Desk.go('today');
  }

  /* Picking a student (step ١) = open his last report in the form, as the next session (+1).
     The old step ٢ (a card per student) goes away from the top: the same card (👁 the homework, last lesson,
     new lesson / continue, notes…) shows lower down, with the other tools, as «🧰 أدوات الطالب». */
  function pickOpens(L, after){
    const st = document.createElement('style');
    st.textContent = '#tdList>.td-chips-h{display:none}#tdList{margin-top:12px}' +
      '#tqTools{margin-top:12px;font-weight:800;color:#0e4d3c;font-size:15px}#tqTools[hidden]{display:none}' +
      '.td-chip.on{box-shadow:0 0 0 2px #c9a227}';
    document.head.appendChild(st);
    const hd = document.createElement('div'); hd.id = 'tqTools'; hd.textContent = '🧰 أدوات الطالب المختار';
    after.after(hd); hd.after(L);
    const fix = () => {
      hd.hidden = !L.querySelector('.td-row');
      const h = document.querySelector('#tdChips .td-chips-h');
      if(h && !/تقريره/.test(h.textContent)) h.textContent = '١. اختار الطالب ← يفتح تقريره في الفورم (الحصة الجاية +1)';
      const sub = document.getElementById('tdSub');
      if(sub && !/تقريره/.test(sub.textContent)) sub.textContent = 'دوس على الطالب يفتح تقريره (حصة +1). أدواته (الواجب، آخر درس، الملاحظات) تحت في «🧰 أدوات الطالب».';
    };
    new MutationObserver(fix).observe(document.querySelector('#page-today .td') || L, {childList: true, subtree: true}); fix();
    const toast = t => {
      let x = document.getElementById('tqToast');
      if(!x){ x = document.createElement('div'); x.id = 'tqToast'; x.style.cssText = 'position:fixed;bottom:22px;left:50%;transform:translateX(-50%);background:#0e4d3c;color:#fff;padding:11px 18px;border-radius:12px;font-weight:700;z-index:99999;box-shadow:0 6px 20px rgba(0,0,0,.2);direction:rtl'; document.body.appendChild(x); }
      x.textContent = t; x.hidden = false; clearTimeout(x._h); x._h = setTimeout(() => { x.hidden = true; }, 4000);
    };
    const open = (i, name, n) => {
      const b = document.querySelector('#tdr' + i + ' [data-lr]');
      if(b) return b.click();
      if(n < 50) return setTimeout(() => open(i, name, n + 1), 150);      // the card, or its report button (filled from the database), is still coming
      toast('مفيش تقرير محفوظ لـ ' + name + ' لسه — اختاره في الفورم تحت واكتب أول تقرير');
    };
    /* on the window, in the capture phase: before the generator's own click handler turns the chip on/off */
    window.addEventListener('click', e => {
      const c = e.target.closest && e.target.closest('#tdChips .td-chip'); if(!c) return;
      const i = c.dataset.ch, name = (c.firstChild && c.firstChild.textContent || c.textContent).replace(/^[+✓\s]+/, '').replace(/\d\d:\d\d.*$/, '').trim();
      if(c.classList.contains('on')) return;      // a second tap un-picks him (the generator does that)
      setTimeout(() => open(i, name, 0), 120);
    }, true);
  }

  /* 🔄 «شوف تحديثات جدولي»: read the teacher's Google Calendar (edge function cal-sessions, through the secret
     iCal address saved once in kv 'calIcs') for one teaching day, compare it with the list, show what changed
     (➕ new class · ⏰ new time · 🚫 not in the calendar) and apply the ticked changes. */
  function calSync(sb, K, L, esc){
    if(document.getElementById('tqCal')) return;
    const host = document.querySelector('#tqToday .td') || L.parentNode, chips = document.getElementById('tdChips');
    const box = document.createElement('div'); box.id = 'tqCal';
    box.style.cssText = 'margin:4px 0 12px;border:1.5px solid #9cc8b5;border-radius:12px;padding:10px 12px;background:#f3fbf7;direction:rtl';
    const btn = 'padding:9px 14px;border:0;border-radius:10px;font:inherit;font-weight:800;cursor:pointer';
    box.innerHTML = '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">' +
      '<button type="button" id="tqCalGo" style="' + btn + ';background:#177a5b;color:#fff">🔄 شوف تحديثات جدولي</button>' +
      '<select id="tqCalDay" style="padding:8px;border:1px solid #9cc8b5;border-radius:10px;font:inherit;background:#fff"><option value="0">النهارده</option><option value="1">بكرة</option><option value="2">بعد بكرة</option></select>' +
      '<span id="tqCalMsg" style="font-size:13px;color:#4d6459">بيقارن «دروس اليوم» بـ Google Calendar</span></div><div id="tqCalOut"></div>';
    host.insertBefore(box, chips && chips.parentNode === host ? chips : host.firstChild);
    const $ = id => document.getElementById(id), msg = (t, c) => { const m = $('tqCalMsg'); m.textContent = t; m.style.color = c || '#4d6459'; };
    const nk = v => fold(v).replace(/[^\p{L}\p{N}]+/gu, '');
    const lev = (a, b) => { const m = a.length, n = b.length, d = Array.from({length: m + 1}, (_, i) => [i]); for(let j = 1; j <= n; j++) d[0][j] = j;
      for(let i = 1; i <= m; i++) for(let j = 1; j <= n; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); return d[m][n]; };
    function slugsOf(summary, C){
      const R = C.R.students || [], rules = C.rules, f = nk(summary);
      if((rules.hide || []).some(h => nk(h) === f)) return [];
      const ro = R.find(s => nk(s.name) === f);
      if(ro){ const sp = (rules.split || {})[ro.name]; if(sp) return sp; const k = (rules.keys || {})[ro.name]; if(k) return [k]; }
      const k2 = Object.keys(rules.keys || {}).find(n => nk(n) === f); if(k2) return [rules.keys[k2]];
      const one = t => { const g = nk(t); if(!g) return null;
        const names = s => [s.slug, s.name_ar, s.name_en].concat(s.keys || []).filter(Boolean).map(nk);
        let st = C.S.find(s => names(s).indexOf(g) >= 0);
        if(!st && g.length >= 4) st = C.S.find(s => names(s).some(n => n.length >= 4 && lev(n, g) <= 1));
        return st ? st.slug : null; };
      const whole = one(summary); if(whole) return [whole];
      const parts = String(summary).split(/\s*[,،&+]\s*|\s+و(?=\S)|\s+and\s+/i).map(x => x.trim()).filter(Boolean);
      if(parts.length < 2) return [];
      const got = parts.map(one); return got.every(Boolean) ? got : got.filter(Boolean);
    }
    const startOf = t => ordOf(t);
    let plan = [];
    $('tqCalGo').onclick = async () => {
      const off = +$('tqCalDay').value, D = addDays(today(), off), out = $('tqCalOut');
      out.innerHTML = ''; msg('⏳ بيقرا الجدول…');
      try{
        const r = await sb.functions.invoke('cal-sessions', {body: {from: D + 'T06:00', to: addDays(D, 1) + 'T06:00'}});
        if(r.error) throw r.error;
        const res = r.data || {};
        if(res.need === 'ics') return askIcs(out);
        if(res.error) throw new Error(res.error);
        const C = await K.load(true), day = await K.ensure(D);
        const items = (day.items || []), evs = res.events || [], seen = new Set(), unknown = [];
        plan = [];
        evs.forEach(ev => {
          const slugs = slugsOf(ev.summary, C); if(!slugs.length){ unknown.push(ev); return; }
          const s0 = (ev.date === D ? 0 : 1440) + hm(ev.time), len = (+ev.mins || 30) / slugs.length;
          slugs.forEach((slug, i) => {
            seen.add(slug);
            const it = items.find(x => x.slug === slug || x.key === slug);
            const a = s0 + i * len, t = fmt(a), nm = (it && it.name) || ((C.S.find(s => s.slug === slug) || {}).name_ar) || slug;
            if(!it) plan.push({op: 'add', slug, date: ev.date, time: t, mins: Math.round(len), text: '➕ ' + nm + ' · حصة ' + t + ' (مش في القايمة)'});
            else{ const o = startOf(it.time); if(o < s0 || o >= s0 + (+ev.mins || 30)){
              if(it.extra) plan.push({op: 'add', slug, date: ev.date, time: t, mins: Math.round(len), text: '⏰ ' + nm + ' · في الجدول ' + t + ' (في القايمة ' + it.time + ')'});
              else plan.push({op: 'move', slug, date: ev.date, time: t, mins: Math.round(len), text: '⏰ ' + nm + ' · من ' + String(it.time).replace(/^غد\S*\s+\S+\s+/, '') + ' ← ' + t}); } }
          });
        });
        items.forEach(it => { const sl = it.slug || it.key; if(!sl || seen.has(sl) || it.extra) return;
          plan.push({op: 'cancel', slug: sl, text: '🚫 ' + it.name + ' · ' + String(it.time || '').replace(/^غد\S*\s+\S+\s+/, '') + ' (مش في الجدول)'}); });
        const lbl = K.labelOf(D);
        if(!plan.length){ msg('✓ ' + lbl + ': القايمة مطابقة للجدول (' + evs.length + ' موعد في الجدول)', '#177a5b');
          if(unknown.length) out.innerHTML = '<div style="font-size:12.5px;color:#6b7c74;margin-top:6px">مواعيد تانية في الجدول اتسابت: ' + esc(unknown.map(e => e.summary + ' ' + e.time).join(' · ')) + '</div>';
          return; }
        msg(lbl + ': فيه ' + plan.length + ' تغيير — علّم اللي عايزه ودوس «طبّق»', '#8a6d0b');
        out.innerHTML = '<div style="margin-top:8px">' + plan.map((p, i) => '<label style="display:flex;gap:8px;align-items:flex-start;padding:6px 4px;border-bottom:1px dashed #cfe3d9;cursor:pointer"><input type="checkbox" data-cp="' + i + '" checked style="width:18px;height:18px;margin-top:2px"><span>' + esc(p.text) + '</span></label>').join('') +
          (unknown.length ? '<div style="font-size:12.5px;color:#6b7c74;margin-top:6px">اتسابت (مش طلاب): ' + esc(unknown.map(e => e.summary + ' ' + e.time).join(' · ')) + '</div>' : '') +
          '<button type="button" id="tqCalApply" style="' + btn + ';background:#8a6d0b;color:#fff;margin-top:10px;width:100%">✓ طبّق التغييرات المعلّمة</button></div>';
        $('tqCalApply').onclick = async () => {
          const pick = plan.filter((p, i) => { const c = out.querySelector('[data-cp="' + i + '"]'); return c && c.checked; });
          if(!pick.length) return msg('مفيش حاجة متعلّمة.');
          $('tqCalApply').disabled = true; msg('⏳ بيطبّق…'); let ok = 0; const bad = [];
          for(const p of pick){
            try{
              if(p.op === 'add') await K.extra(p.slug, p.date, p.time, p.mins);
              else if(p.op === 'move') await K.move(D, p.slug, p.date, p.time, p.mins);
              else if(p.op === 'cancel') await K.cancel(D, p.slug);
              ok++;
            }catch(e){ bad.push(p.text + ': ' + (e.message || e)); }
          }
          out.innerHTML = bad.length ? '<div style="color:#b42318;font-size:13px;margin-top:6px">' + bad.map(esc).join('<br>') + '</div>' : '';
          msg('✓ اتطبّق ' + ok + ' تغيير' + (bad.length ? ' · ⚠️ ' + bad.length + ' ما اتطبّقش' : ''), bad.length ? '#b42318' : '#177a5b');
          try{ if(window.__tdRender) setTimeout(window.__tdRender, 800); }catch(_){}
        };
      }catch(e){ msg('⚠️ ' + (e.message || e), '#b42318'); }
    };
    function askIcs(out){
      msg('محتاج لينك جدولك مرة واحدة بس', '#8a6d0b');
      out.innerHTML = '<div style="margin-top:8px;font-size:13px;line-height:1.8">افتح <b>Google Calendar</b> على الكمبيوتر ← ⚙️ <b>الإعدادات</b> ← من الشمال اختار تقويمك (اسمك) ← انزل لـ <b>«دمج التقويم»</b> ← انسخ <b>«العنوان السري بتنسيق iCal»</b> والصقه هنا. اللينك ده سري وبيتحفظ عندك بس.</div>' +
        '<div style="display:flex;gap:8px;margin-top:8px"><input id="tqCalIcs" dir="ltr" placeholder="https://calendar.google.com/calendar/ical/…/basic.ics" style="flex:1;min-width:0;padding:9px;border:1px solid #9cc8b5;border-radius:10px;font:inherit">' +
        '<button type="button" id="tqCalSave" style="' + btn + ';background:#177a5b;color:#fff">حفظ</button></div>';
      $('tqCalSave').onclick = async () => {
        const v = $('tqCalIcs').value.trim();
        if(!/^https:\/\/calendar\.google\.com\/calendar\/ical\/.+\.ics/.test(v)) return msg('ده مش لينك iCal من Google Calendar — لازم يبدأ بـ https://calendar.google.com/calendar/ical/', '#b42318');
        const r = await sb.from('kv').upsert({key: 'calIcs', value: v});
        if(r.error) return msg('⚠️ ' + r.error.message, '#b42318');
        out.innerHTML = ''; msg('✓ اتحفظ — بيقرا الجدول…', '#177a5b'); $('tqCalGo').click();
      };
    }
  }

  function ui(sb){
    try{ home(); }catch(e){ console.warn('days.home', e); }
    if(window.__tqDayUi) return; window.__tqDayUi = true;
    const L = document.getElementById('tdList'); if(!sb || !L) return;
    const K = kit(sb), esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
    gaps(sb, L, esc);
    try{ calSync(sb, K, L, esc); }catch(e){ console.warn('days.cal', e); }
    /* the generator still says the list comes from a 1 AM task: it now comes from the weekly schedule */
    const sub = document.getElementById('tdSub'); if(sub && /١ بعد/.test(sub.textContent)) sub.textContent = 'القايمة بتتبني لوحدها من الجدول الأسبوعي (٦ ص ← ٦ ص) ومعاها آخر تقرير لكل طالب.';
    const em = L.querySelector('.td-empty'); if(em && /١ بالليل/.test(em.textContent)) em.textContent = 'بتتحمّل القايمة من الجدول الأسبوعي…';
    const box = document.createElement('div'); box.id = 'tqDayBox';
    box.style.cssText = 'margin-top:12px;border:1.5px solid #c9a227;border-radius:12px;padding:12px;background:#fffbea;direction:rtl';
    const inp = 'padding:9px;border:1px solid #e3d39a;border-radius:10px;font:inherit;background:#fff;min-width:0';
    box.innerHTML =
      '<button type="button" id="tqDayOpen" style="width:100%;padding:11px;border:0;border-radius:10px;background:#8a6d0b;color:#fff;font:inherit;font-weight:700;cursor:pointer">➕ حصة استثنائية / نقل موعد</button>' +
      '<div id="tqDayForm" hidden style="margin-top:10px">' +
        '<div id="tqDayKind" style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px">' +
          [['extra', '➕ حصة استثنائية'], ['move', '↔ نقل موعد'], ['cancel', '🚫 مفيش حصة']].map((x, i) =>
            '<button type="button" data-k="' + x[0] + '" style="flex:1 1 120px;padding:8px;border:1.5px solid #c9a227;border-radius:10px;font:inherit;font-weight:700;cursor:pointer;background:' + (i ? '#fff' : '#f3e3a3') + '">' + x[1] + '</button>').join('') + '</div>' +
        '<div style="display:grid;grid-template-columns:auto 1fr;gap:8px 10px;align-items:center">' +
          '<label for="tqDayWho">الطالب</label><select id="tqDayWho" style="' + inp + '"></select>' +
          '<label for="tqDayFrom" data-f="from">يوم الحصة</label><input type="date" id="tqDayFrom" data-f="from" style="' + inp + '">' +
          '<label for="tqDayTo" data-f="to">اليوم الجديد</label><input type="date" id="tqDayTo" data-f="to" style="' + inp + '">' +
          '<label for="tqDayAt" data-f="to">الساعة (القاهرة)</label><input type="time" id="tqDayAt" data-f="to" step="300" style="' + inp + '">' +
          '<label for="tqDayLen" data-f="to">المدة</label><select id="tqDayLen" data-f="to" style="' + inp + '">' + [30, 45, 60, 90, 120].map(m => '<option value="' + m + '">' + m + ' دقيقة</option>').join('') + '</select>' +
        '</div>' +
        '<button type="button" id="tqDayGo" style="margin-top:10px;width:100%;padding:11px;border:0;border-radius:10px;background:#177a5b;color:#fff;font:inherit;font-weight:700;cursor:pointer">حفظ</button>' +
        '<div id="tqDayMsg" style="margin-top:6px;font-size:13.5px;min-height:18px"></div>' +
        '<div style="font-size:12px;color:#7a6a2e;margin-top:2px">الحصة اللي بعد ١٢ بالليل وقبل ٦ الصبح بتظهر في قايمة اليوم اللي قبلها (زي «غدًا السبت 04:00»).</div>' +
      '</div>' +
      '<div id="tqDayUp" style="margin-top:10px"></div>';
    const ex = document.getElementById('tdExtra'); (ex || L).after(box);
    const $ = id => document.getElementById(id), msg = (t, c) => { $('tqDayMsg').textContent = t; $('tqDayMsg').style.color = c || '#4d6459'; };
    let kind = 'extra', P = [];
    const calToday = () => { const c = cairoNow(Date.now()); return iso(c); };
    function show(){
      box.querySelectorAll('[data-k]').forEach(b => b.style.background = b.dataset.k === kind ? '#f3e3a3' : '#fff');
      box.querySelectorAll('[data-f="from"]').forEach(e => e.hidden = kind === 'extra');
      box.querySelectorAll('[data-f="to"]').forEach(e => e.hidden = kind === 'cancel');
      $('tqDayLen').hidden = $('tqDayLen').previousSibling.hidden = kind !== 'extra';
      const list = kind === 'extra' ? P : P.filter(p => p.roster), was = $('tqDayWho').value;
      $('tqDayWho').innerHTML = '<option value="">— اختار —</option>' + list.map(p => '<option value="' + esc(p.slug) + '">' + esc(p.name) + '</option>').join('');
      if(list.some(p => p.slug === was)) $('tqDayWho').value = was;
      $('tqDayGo').textContent = kind === 'extra' ? '➕ ضيف الحصة' : kind === 'move' ? '↔ انقل الحصة' : '🚫 شيل الحصة من اليوم ده';
      msg('');
    }
    async function paintUp(){
      const U = $('tqDayUp');
      try{
        const list = await K.upcoming();
        U.innerHTML = list.length ? '<b style="color:#7a5c00">📅 التعديلات الجاية</b>' + list.map((c, i) =>
          '<div style="display:flex;gap:8px;align-items:center;margin-top:6px;padding:7px 9px;background:#fff;border:1px solid #eadfb4;border-radius:9px;font-size:13.5px">' +
          '<span style="flex:1">' + esc(c.text) + '</span><button type="button" data-u="' + i + '" style="padding:5px 9px;border:1px solid #c9a227;border-radius:8px;background:#fff;font:inherit;cursor:pointer">↩ رجّع</button></div>').join('') : '';
        U.querySelectorAll('[data-u]').forEach(b => b.onclick = async () => { b.disabled = true; b.textContent = '⏳';
          try{ await K.undo(list[+b.dataset.u]); }catch(e){ msg('⚠️ ' + (e.message || e), '#b42318'); } paintUp(); });
      }catch(e){ U.textContent = ''; }
    }
    box.querySelectorAll('[data-k]').forEach(b => b.onclick = () => { kind = b.dataset.k; show(); });
    $('tqDayOpen').onclick = async () => {
      const f = $('tqDayForm'); f.hidden = !f.hidden; if(f.hidden) return;
      if(!$('tqDayFrom').value) $('tqDayFrom').value = $('tqDayTo').value = calToday();
      msg('…'); try{ P = await K.people(); show(); }catch(e){ msg('⚠️ ' + (e.message || e), '#b42318'); }
    };
    $('tqDayWho').onchange = () => { const p = P.find(x => x.slug === $('tqDayWho').value); if(p && kind === 'extra') $('tqDayLen').value = String([30, 45, 60, 90, 120].indexOf(p.mins) >= 0 ? p.mins : 30); };
    $('tqDayGo').onclick = async () => {
      const who = $('tqDayWho').value, at = $('tqDayAt').value, from = $('tqDayFrom').value, to = $('tqDayTo').value, b = $('tqDayGo');
      if(!who) return msg('اختار الطالب الأول.', '#b42318');
      if(kind !== 'cancel' && (!to || !/^\d\d:\d\d$/.test(at))) return msg('اكتب اليوم والساعة.', '#b42318');
      if(kind !== 'extra' && !from) return msg('اختار يوم الحصة.', '#b42318');
      b.disabled = true; msg('⏳ بيتحفظ…');
      try{
        const name = (P.find(x => x.slug === who) || {}).name || who;
        if(kind === 'extra'){ await K.extra(who, to, at, $('tqDayLen').value); msg('✓ اتضافت حصة لـ' + name + ' يوم ' + K.labelOf(to) + ' الساعة ' + at, '#177a5b'); }
        else if(kind === 'move'){ await K.move(from, who, to, at); msg('✓ حصة ' + name + ' اتنقلت ليوم ' + K.labelOf(to) + ' الساعة ' + at, '#177a5b'); }
        else { await K.cancel(from, who); msg('✓ اتشالت حصة ' + name + ' يوم ' + K.labelOf(from), '#177a5b'); }
        paintUp();
      }catch(e){ msg('⚠️ ' + (e.message || e), '#b42318'); }
      b.disabled = false;
    };
    try{ pickOpens(L, box); }catch(e){ console.warn('days.pick', e); }
    /* the list itself: make sure today's sessions are all there (the teacher page does this too, every 30 minutes) */
    K.ensure().catch(e => console.warn('days.ensure', e));
    paintUp();
  }

  window.TQDays = {kit, ui, today, labelOf, slotOf};
})();
