/* Runs the report generator (built for claude.ai) on the Tarteel site.
   The generator asks claude.use('db') for a small document store and window.storage for its settings;
   here both are served by the site's Supabase database, for the signed-in teacher only.
   AI, downloads, uploads and Claude's scheduled tasks are not available on the site: those features
   fall back to what the generator already does without them. */
(function(){
  const sb = supabase.createClient(TQ.url, TQ.key);
  window.__tqSb = sb;

  const ready = (async () => {
    const s = await sb.auth.getSession();
    if(!s.data.session){ try{ (window.top || window).location.href = TQ.site + 'app/'; }catch(_){ location.href = TQ.site + 'app/'; } throw new Error('not signed in'); }
    return s.data.session;
  })();

  const split = path => { const i = String(path).indexOf('/'); return [path.slice(0, i), path.slice(i + 1)]; };
  const snapDoc = (id, row) => ({id, exists: !!row, data: () => row ? row.data : undefined});

  function docRef(path){
    const [col, id] = split(path);
    return {
      id,
      async get(){ await ready; const r = await sb.from('docs').select('data').eq('collection', col).eq('id', id).maybeSingle(); if(r.error) throw r.error; return snapDoc(id, r.data); },
      async set(data){ await ready; const r = await sb.from('docs').upsert({collection: col, id, data}); if(r.error) throw r.error; },
      async update(patch){
        await ready;
        const cur = await sb.from('docs').select('data').eq('collection', col).eq('id', id).maybeSingle();
        if(cur.error) throw cur.error;
        if(!cur.data) throw new Error('No document to update: ' + path);
        const r = await sb.from('docs').update({data: Object.assign({}, cur.data.data, patch)}).eq('collection', col).eq('id', id);
        if(r.error) throw r.error;
      },
      async delete(){ await ready; const r = await sb.from('docs').delete().eq('collection', col).eq('id', id); if(r.error) throw r.error; },
      onSnapshot(cb, err){
        let off = false, ch = null;
        const pull = () => this.get().then(s => { if(!off) cb(s); }, e => { if(err) err(e); });
        ready.then(() => {
          pull();
          ch = sb.channel('doc-' + col + '-' + id + '-' + Math.random().toString(36).slice(2))
            .on('postgres_changes', {event: '*', schema: 'public', table: 'docs', filter: 'collection=eq.' + col}, p => {
              const row = p.new && p.new.id ? p.new : p.old; if(row && row.id === id) pull();
            }).subscribe();
        }, e => { if(err) err(e); });
        return () => { off = true; if(ch) sb.removeChannel(ch); };
      }
    };
  }

  function colRef(col, opts){
    opts = opts || {};
    const q = {
      orderBy(field, dir){ return colRef(col, Object.assign({}, opts, {order: [field, dir || 'asc']})); },
      limit(n){ return colRef(col, Object.assign({}, opts, {limit: n})); },
      doc(id){ return docRef(col + '/' + id); },
      async get(){
        await ready;
        let r = await sb.from('docs').select('id,data').eq('collection', col).limit(5000);
        if(r.error) throw r.error;
        let rows = r.data || [];
        // «دروس اليوم»: a day runs 06:00 → 06:00 Cairo time; lists made early for a later day wait for their day
        if(col === 'days'){
          const c = new Date(new Date(Date.now() - 6 * 3600e3).toLocaleString('en-US', {timeZone: 'Africa/Cairo'}));
          const today = c.getFullYear() + '-' + String(c.getMonth() + 1).padStart(2, '0') + '-' + String(c.getDate()).padStart(2, '0');
          rows = rows.filter(x => String(x.id) <= today);
        }
        if(opts.order){ const [f, d] = opts.order, key = x => (x.data && x.data[f] != null) ? x.data[f] : x.id;
          rows.sort((a, b) => { const A = key(a), B = key(b); return (A > B ? 1 : A < B ? -1 : 0) * (d === 'desc' ? -1 : 1); }); }
        if(opts.limit) rows = rows.slice(0, opts.limit);
        const docs = rows.map(x => ({id: x.id, exists: true, data: () => x.data}));
        return {docs, size: docs.length, empty: !docs.length, forEach: f => docs.forEach(f)};
      },
      onSnapshot(cb, err){
        let off = false, ch = null, t = 0;
        const pull = () => q.get().then(s => { if(!off) cb(s); }, e => { if(err) err(e); });
        ready.then(() => {
          pull();
          ch = sb.channel('col-' + col + '-' + Math.random().toString(36).slice(2))
            .on('postgres_changes', {event: '*', schema: 'public', table: 'docs', filter: 'collection=eq.' + col}, () => { clearTimeout(t); t = setTimeout(pull, 250); })
            .subscribe();
        }, e => { if(err) err(e); });
        return () => { off = true; if(ch) sb.removeChannel(ch); };
      }
    };
    return q;
  }

  const DBshim = {doc: docRef, collection: c => colRef(c)};

  window.claude = {
    use(name){
      if(name === 'db') return ready.then(() => DBshim);
      // «دروس اليوم» → «حفظ»: instead of starting Claude's task directly, leave a request in the database;
      // the scheduled task «طلبات تحضير الدروس من الموقع» picks it up and builds the lesson on the site
      if(name === 'mcp') return ready.then(() => ({
        async callTool(server, tool, args){
          if(tool !== 'fire_trigger') throw new Error('not available on the site');
          const id = 'req-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);
          const r = await sb.from('docs').insert({collection: 'prepjobs', id, data: {trigger_id: (args && args.trigger_id) || '', text: (args && args.text) || '', status: 'queued', at: Date.now()}});
          if(r.error) throw r.error;
          return {ok: true, queued: id};
        }
      }));
      return Promise.resolve(null);      // AI, downloads and uploads: not on the site (yet)
    }
  };

  // the generator's settings (last report per student, signature, …) follow the teacher to any device
  window.storage = {
    async get(key){ await ready; const r = await sb.from('kv').select('value').eq('key', key).maybeSingle(); return r.data ? {value: r.data.value} : null; },
    async set(key, value){ await ready; await sb.from('kv').upsert({key, value: String(value)}); return true; }
  };

  /* ---------- the report fills itself from the day's lesson ----------
     When a student is chosen in the report, the lesson saved for the report's date (docs lessons, id YYYY-MM-DD-<key>)
     fills «Lesson Content» (its summary / headlines; headlines_en for an English report), «Homework», and the link box
     with the student's own page (student.html?k=…, not the homework link). A part the teacher wrote himself is never
     written over (typing, voice typing or ✨ tidy all count); «↺ من الدرس» fills all three again on purpose. */
  function lessonFill(){
    const $g = id => document.getElementById(id);
    if(window.__tqLessonFill || !$g('student') || !$g('list-lesson') || !$g('list-hw') || !$g('hwLink')) return;
    window.__tqLessonFill = true;
    const fold = v => String(v || '').normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase()
      .replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').replace(/\s+/g, ' ');
    const isAr = a => { const t = [].concat(a || []).join(' '); return (t.match(/[؀-ۿ]/g) || []).length > (t.match(/[A-Za-z]/g) || []).length; };
    const lines = v => (Array.isArray(v) ? v : String(v || '').split(/\n+/)).map(x => String(x == null ? '' : x).trim()).filter(Boolean);
    const esc = x => String(x).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
    const call = (f, ...a) => { try{ return typeof window[f] === 'function' ? window[f](...a) : undefined; }catch(e){ console.warn(f, e); } };

    let students = null, hand = {}, current = null, filling = false;
    /* the teacher's own words in a part: typed, voice typing (genMic) or ✨ tidy (genCheck) */
    window.__tqHand = k => { if(!filling) hand[k] = true; };
    /* the generator emptying a part itself (last report, pasted report, new report…) means what is there now is not typed by hand */
    const clr = window.clearList;
    if(typeof clr === 'function') window.clearList = function(k){ if(!filling) hand[k] = false; return clr.apply(this, arguments); };
    document.addEventListener('input', e => {
      if(!e.isTrusted || !e.target || !e.target.closest) return;
      if(e.target.closest('#list-lesson')) hand.lesson = true;
      else if(e.target.closest('#list-hw')) hand.hw = true;
      else if(e.target.id === 'hwLink') e.target.dataset.tqPage = '';
    }, true);
    document.addEventListener('click', e => {
      const b = e.isTrusted && e.target && e.target.closest && e.target.closest('.del-btn'); if(!b) return;
      if(b.closest('#list-lesson')) hand.lesson = true; else if(b.closest('#list-hw')) hand.hw = true;
    }, true);

    /* the report's date (dd/mm/yyyy); without one, today's teaching day (06:00 → 06:00 Cairo) */
    function reportDay(){
      const m = String(($g('date') || {}).value || '').trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
      if(m) return m[3] + '-' + m[2].padStart(2, '0') + '-' + m[1].padStart(2, '0');
      const c = new Date(new Date(Date.now() - 6 * 3600e3).toLocaleString('en-US', {timeZone: 'Africa/Cairo'}));
      return c.getFullYear() + '-' + String(c.getMonth() + 1).padStart(2, '0') + '-' + String(c.getDate()).padStart(2, '0');
    }
    function findStudent(name){
      const f = fold(name); if(!f) return null;
      const id = call('studentIdOf', name) || '';
      return (students || []).find(s => id && (s.slug === id || (s.keys || []).indexOf(id) >= 0))
        || (students || []).find(s => [s.name_en, s.name_ar, s.slug].concat(s.keys || []).some(n => n && fold(n) === f)) || null;
    }
    async function findLesson(name, st, day){
      const r = await sb.from('docs').select('id,data').eq('collection', 'lessons').like('id', day + '-%');
      const rows = (r.data || []).filter(x => x.data);
      const keys = [call('studentIdOf', name)].concat(st ? [st.slug].concat(st.keys || []) : []).filter(Boolean);
      const key = x => x.id.slice(day.length + 1);
      return rows.find(x => keys.indexOf(key(x)) >= 0)
        || rows.find(x => call('sameStudent', x.data.student, name))
        || rows.find(x => st && [st.name_en, st.name_ar].some(n => n && fold(n) === fold(x.data.student))) || null;
    }
    /* the lesson's points in the report's language only (an Arabic report never gets English lines, and back) */
    function contentOf(L){
      const ar = (call('effectiveLang') || 'en') === 'ar';
      return (ar ? [L.headlines_ar, L.summary, L.headlines] : [L.headlines_en, L.headlines, L.summary])
        .map(lines).find(a => a.length && isAr(a) === ar) || [];
    }
    const pageOf = st => st && st.portal_token ? new URL('app/student.html', TQ.site).href + '?k=' + st.portal_token : '';

    /* the bar on top of «Lesson Content»: what was filled, and the ↺ button */
    const sec = $g('list-lesson').closest('.section-body') || $g('list-lesson').parentNode;
    const bar = document.createElement('div'); bar.id = 'tqFromLesson';
    bar.style.cssText = 'display:none;align-items:center;gap:8px;flex-wrap:wrap;margin:0 0 10px;padding:8px 10px;border:1.5px solid #c99a3f;border-radius:9px;background:#fffdf6;font-size:12.5px;line-height:1.55;direction:rtl;text-align:right';
    bar.innerHTML = '<span id="tqFlMsg" style="flex:1;min-width:160px;color:#5c4409"></span>' +
      '<button type="button" id="tqFlGo" style="border:1.5px solid #c99a3f;background:#fff;color:#8a6620;border-radius:8px;padding:4px 11px;font:inherit;font-weight:700;cursor:pointer;white-space:nowrap">↺ من الدرس</button>';
    sec.prepend(bar);
    const say = (html, can) => { bar.style.display = html ? 'flex' : 'none'; $g('tqFlMsg').innerHTML = html; $g('tqFlGo').disabled = !can; $g('tqFlGo').style.opacity = can ? 1 : .45; };

    function put(force){
      const L = current && current.lesson; if(!L) return [[], []];
      const done = [], kept = [];
      filling = true;
      try{
        const a = contentOf(L);
        if(a.length){ if(force || !hand.lesson){ call('clearList', 'lesson'); a.forEach(x => call('addItem', 'lesson', x)); call('setToggle', 'lesson', true); hand.lesson = false; done.push('محتوى الدرس'); } else kept.push('محتوى الدرس'); }
        const h = lines(L.homework);
        if(h.length){ if(force || !hand.hw){ call('clearList', 'hw'); h.forEach(x => call('addItem', 'hw', x)); call('setToggle', 'hw', true); hand.hw = false; done.push('الواجب'); } else kept.push('الواجب'); }
        const f = $g('hwLink'), url = pageOf(current.st);
        if(url){
          if(force || f.dataset.hand !== '1' || f.dataset.tqPage === '1' || !f.value.trim()){
            /* marked as set by hand, so the generator's own «homework link» filler leaves the student's page in place */
            f.value = url; f.dataset.auto = ''; f.dataset.hand = '1'; f.dataset.tqPage = '1'; call('setToggle', 'hwlink', true); done.push('لينك صفحة الطالب');
          } else if(f.value.trim() !== url) kept.push('اللينك');
        }
      } finally { filling = false; }
      call('render'); call('saveDraft');
      return [done, kept];
    }
    function report(res){
      const L = current.lesson, [done, kept] = res || [[], []];
      say('📚 درس ' + esc(current.day) + ': <b>' + esc(L.title || current.id) + '</b>' +
        (done.length ? ' — اتملى: ' + esc(done.join(' · ')) : '') +
        (kept.length ? '<br><span style="color:#8a978f">سبت اللي كتبته بإيدك في: ' + esc(kept.join(' · ')) + ' (اضغط ↺ لو عايز الدرس مكانه)</span>' : ''), true);
    }

    let lastKey = '', seen = '', busy = false;
    async function check(){
      if(busy) return;
      const name = String($g('student').value || '').trim(), day = reportDay(), k = name + '|' + day;
      if(k !== seen){ seen = k; return; }          // wait until the name stops changing (typing)
      if(k === lastKey) return;
      lastKey = k; current = null;
      if(!name){ say('', false); return; }
      busy = true;
      try{
        await ready;
        if(!students){ const r = await sb.from('students').select('id,slug,keys,name_ar,name_en,portal_token'); students = r.data || []; }
        const st = findStudent(name), row = await findLesson(name, st, day);
        if(k !== String($g('student').value || '').trim() + '|' + reportDay()){ lastKey = ''; return; }   // changed meanwhile: look again
        if(!row){ say('<span style="color:#8a978f">مفيش درس متسجّل لـ' + esc(name) + ' يوم ' + esc(day) + ' — التقرير ماتغيّرش.</span>', false); return; }
        current = {id: row.id, day, lesson: row.data, st};
        report(put(false));
      }catch(e){ console.warn('lessonFill', e); }
      finally{ busy = false; }
    }
    $g('tqFlGo').onclick = () => { if(current) report(put(true)); };
    setInterval(check, 600);
  }
  window.addEventListener('load', () => setTimeout(lessonFill, 900));
})();
