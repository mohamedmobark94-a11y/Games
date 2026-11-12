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
