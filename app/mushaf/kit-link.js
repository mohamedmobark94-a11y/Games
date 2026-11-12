/* The site's corrector ⇄ the class tools (assets/session-kit.js):
   the student's name starts the traffic-light counter, and every change is kept in kv
   «signals:<date>:<student key>» so the day's session report (gen-shim) can add data.signals. */
(function(){
  if(!window.TQKit) return;
  const st = document.getElementById('mzStudent');
  const keyOf = n => { try{ return (typeof window.studentIdOf === 'function' && window.studentIdOf(n)) || n; }catch(_){ return n; } };
  const bind = () => { const n = (st && st.value || '').trim(); if(n) TQKit.student(n, keyOf(n)); };
  if(st){ st.addEventListener('change', bind); st.addEventListener('blur', bind); }
  setTimeout(bind, 1500); setTimeout(bind, 4000);   // after the student list arrives (web.js)
  let t = null, last = null;
  TQKit.onSignals(s => { last = s; clearTimeout(t); t = setTimeout(push, 1500); });
  async function push(){
    const s = last, sb = window.__tqSb; if(!s || !s.name || !sb) return;
    const key = 'signals:' + s.date + ':' + (s.key || s.name);
    try{ await sb.from('kv').upsert({key, value: JSON.stringify({green: s.green, yellow: s.yellow, red: s.red, name: s.name, at: Date.now()})}); }catch(_){}
  }
})();
/* 7-ب: who the students are for TQFX.cheer — the name clips live in the private storage (private/voice/names/<slug>.mp3,
   copied there by the Edge add-on), played through short-lived signed links. Arabic students: text + sound only. */
(function(){
  if(!window.TQFX || !TQFX.person) return;
  let tries = 0;
  (function wait(){
    const list = window.__mzStudents, sb = window.__tqSb;
    if(!list || !sb){ if(++tries < 40) setTimeout(wait, 500); return; }
    const clean = n => String(n || '').replace(/\s*\(.*?\)\s*/g, ' ').replace(/^(sheikh|brother|sister|الشيخ)\s+/i, '').trim();
    list.forEach(s => TQFX.person(s.slug, {en: clean(s.name_en), ar: clean(s.name_ar), lang: s.lang || 'en', keys: [s.name_en, s.name_ar].concat(s.keys || []).filter(Boolean)}));
    const en = list.filter(s => s.lang !== 'ar').map(s => s.slug);
    if(TQKit.refresh) TQKit.refresh();
    if(!en.length) return;
    sb.storage.from('private').createSignedUrls(en.map(x => 'voice/names/' + x + '.mp3'), 60 * 60 * 12).then(r => {
      (r.data || []).forEach((x, i) => { if(x && x.signedUrl && !x.error) TQFX.person(en[i], {url: x.signedUrl}); });
      if(TQKit.refresh) TQKit.refresh();
    }).catch(() => {});
  })();
})();
