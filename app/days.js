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
  function ui(sb){
    if(window.__tqDayUi) return; window.__tqDayUi = true;
    const L = document.getElementById('tdList'); if(!sb || !L) return;
    const K = kit(sb), esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
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
    /* the list itself: make sure today's sessions are all there (the teacher page does this too, every 30 minutes) */
    K.ensure().catch(e => console.warn('days.ensure', e));
    paintUp();
  }

  window.TQDays = {kit, ui, today, labelOf, slotOf};
})();
