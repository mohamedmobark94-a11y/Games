/* Session kit: three small classroom tools for live reading sessions (Quran, Noor Al-Bayan).
     <script src="…/tq-fx.js"></script>            (optional: sounds + recorded voice)
     <script src="…/assets/session-kit.js"></script>
     TQKit.mount(el)   puts the three cards inside el (a sidebar)
   ⏱ Timer (30s … 3 min, ring), 🚀 Repetitions (rocket flies to the moon, target 2–10), ⭐ Stars (0–5).
   Nothing is saved: each tool resets with its own button. */
(function(){
  const css = `
.tk{font-family:'Cairo','Plus Jakarta Sans',system-ui,sans-serif;display:flex;flex-direction:column;gap:10px}
.tk-c{background:#fff;border:1px solid #e3ece7;border-radius:14px;padding:11px 13px;box-shadow:0 1px 3px rgba(16,40,30,.06)}
.tk-h{display:flex;align-items:center;justify-content:space-between;gap:6px;margin-bottom:6px}
.tk-h b{font-size:15px;color:#0e4d3c}.tk-h small{font:700 10px 'Plus Jakarta Sans',sans-serif;color:#8a978f;letter-spacing:.6px;text-transform:uppercase}
.tk-fold{border:0;background:none;cursor:pointer;font-size:12px;color:#6b7d74}
.tk-c.off .tk-b{display:none}
.tk-ring{position:relative;width:132px;height:132px;margin:2px auto 6px}
.tk-ring svg{width:100%;height:100%;transform:rotate(-90deg)}
.tk-ring .t{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center}
.tk-ring .t b{font:800 30px 'Plus Jakarta Sans',sans-serif;color:#0e4d3c;direction:ltr}
.tk-ring .t span{font-size:11px;color:#6b7d74;font-weight:700}
.tk-ring.end .t b{color:#b42318}
.tk-chips{display:flex;flex-wrap:wrap;gap:5px;justify-content:center;margin-bottom:7px}
.tk-chips button{min-width:40px;min-height:30px;border:1.5px solid #e3ece7;border-radius:99px;background:#fff;font:700 12.5px 'Cairo',sans-serif;color:#16241e;cursor:pointer}
.tk-chips button.on{background:#177a5b;border-color:#177a5b;color:#fff}
.tk-row{display:grid;grid-template-columns:1fr 1fr;gap:7px}
.tk-row.three{grid-template-columns:auto 1fr auto}
.tk-btn{min-height:40px;border:0;border-radius:11px;background:#177a5b;color:#fff;font:800 14px 'Cairo',sans-serif;cursor:pointer}
.tk-btn.gold{background:#c99a3f}.tk-btn.pale{background:#fff;color:#0e4d3c;border:1.5px solid #e3ece7}
.tk-btn:active{transform:scale(.97)}
.tk-sky{position:relative;height:74px;border-radius:12px;background:linear-gradient(180deg,#14213d,#2b3a67);overflow:hidden;margin:4px 0 6px}
.tk-sky i{position:absolute;width:3px;height:3px;border-radius:50%;background:#fff;opacity:.7}
.tk-path{position:absolute;left:34px;right:44px;top:50%;border-top:2px dashed rgba(255,255,255,.35)}
.tk-dot{position:absolute;top:50%;width:9px;height:9px;margin:-4px 0 0 -4px;border-radius:50%;background:rgba(255,255,255,.35)}
.tk-dot.on{background:#ffd166;box-shadow:0 0 8px #ffd166}
.tk-rocket{position:absolute;top:50%;left:34px;width:40px;height:40px;margin:-20px 0 0 -20px;transition:left .7s cubic-bezier(.3,1.4,.5,1)}
.tk-moon{position:absolute;right:8px;top:50%;width:36px;height:36px;margin-top:-18px;border-radius:50%;background:radial-gradient(circle at 35% 35%,#fff7d6,#f3d27a 60%,#d9a93e);box-shadow:0 0 16px rgba(255,214,102,.7)}
.tk-sky.won .tk-moon{animation:tkglow 1s ease-in-out 3}
@keyframes tkglow{50%{box-shadow:0 0 34px #ffd166;transform:scale(1.15)}}
.tk-cnt{text-align:center;font-size:13px;color:#4d6459;font-weight:700;margin-bottom:6px}
.tk-cnt b{font:800 20px 'Plus Jakarta Sans',sans-serif;color:#0e4d3c}
.tk-stars{display:flex;justify-content:center;gap:4px;margin:4px 0 6px}
.tk-stars button{border:0;background:none;cursor:pointer;padding:0;width:36px;height:36px}
.tk-stars svg{width:100%;height:100%}
.tk-stars .on path{fill:#f5b301;stroke:#d48c00}
.tk-stars path{fill:#e6ece9;stroke:#cfd8d3;stroke-width:1.5;transition:fill .2s}
.tk-stars .pop{animation:tkpop .45s}
@keyframes tkpop{40%{transform:scale(1.35) rotate(-8deg)}}
.tk-sel{height:30px;border:1.5px solid #e3ece7;border-radius:8px;font:700 13px 'Cairo',sans-serif;color:#16241e;background:#fff}

.tk-float{position:fixed;right:14px;bottom:14px;width:262px;max-height:calc(100vh - 28px);overflow:auto;z-index:60;background:#f5f3ec;border:1px solid #cfe3d8;border-radius:16px;box-shadow:0 12px 40px rgba(0,0,0,.18);padding:0 8px 8px}
.tk-fh{position:sticky;top:0;z-index:2;display:flex;align-items:center;gap:8px;margin:0 -8px 8px;padding:8px 12px;background:#c99a3f;color:#fff;border-radius:16px 16px 0 0;font:800 14px 'Cairo',sans-serif;cursor:pointer}
.tk-fh span{flex:1}
.tk-float.min{width:auto;padding:0}.tk-float.min .tk-fh{margin:0;border-radius:16px}.tk-float.min .tk{display:none}
`;
  const fx = (k, el) => { try{ if(window.TQFX && TQFX[k]) TQFX[k](el); }catch(_){} };
  let ac = null;
  function chime(){ // timer end: three soft bells (works without tq-fx)
    try{ ac = ac || new (window.AudioContext || window.webkitAudioContext)(); if(ac.state === 'suspended') ac.resume();
      [0, .35, .7].forEach((t, i) => { const o = ac.createOscillator(), g = ac.createGain(); o.frequency.value = [880, 988, 1318][i];
        g.gain.setValueAtTime(.0001, ac.currentTime + t); g.gain.exponentialRampToValueAtTime(.25, ac.currentTime + t + .02);
        g.gain.exponentialRampToValueAtTime(.0001, ac.currentTime + t + .9); o.connect(g).connect(ac.destination); o.start(ac.currentTime + t); o.stop(ac.currentTime + t + 1); });
    }catch(_){}
  }
  const STAR = '<svg viewBox="0 0 24 24"><path d="M12 2.6l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.4l-5.8 3.1 1.1-6.5L2.6 9.4l6.5-.9z"/></svg>';
  const ROCKET = '<svg viewBox="0 0 64 64"><g transform="rotate(90 32 32)"><path d="M32 4c10 8 14 20 12 34H20C18 24 22 12 32 4z" fill="#f1f5f9" stroke="#94a3b8" stroke-width="2"/><circle cx="32" cy="24" r="6" fill="#38bdf8" stroke="#0369a1" stroke-width="2"/><path d="M20 38l-8 10 10-2zM44 38l8 10-10-2z" fill="#ef4444"/><path d="M26 40h12l-6 16z" fill="#f59e0b"/><path d="M29 42h6l-3 8z" fill="#fde047"/></g></svg>';

  function mount(host){
    if(!host || host.querySelector('.tk')) return;
    if(!document.getElementById('tk-css')){ const s = document.createElement('style'); s.id = 'tk-css'; s.textContent = css; document.head.appendChild(s); }
    const w = document.createElement('div'); w.className = 'tk'; w.dir = 'rtl';
    w.innerHTML =
      '<div class="tk-c" data-k="timer"><div class="tk-h"><b>⏱ المؤقّت</b><small>Timer</small><button class="tk-fold" title="صغّر">▾</button></div><div class="tk-b">' +
        '<div class="tk-ring"><svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="52" fill="none" stroke="#e9f5ef" stroke-width="10"/><circle id="tkArc" cx="60" cy="60" r="52" fill="none" stroke="#177a5b" stroke-width="10" stroke-linecap="round" stroke-dasharray="326.7" stroke-dashoffset="0"/></svg>' +
        '<div class="t"><b id="tkTime">01:00</b><span id="tkLbl">جاهز · Ready</span></div></div>' +
        '<div class="tk-chips" id="tkLen">' + [[30, '30ث'], [60, '1د'], [90, '1.5د'], [120, '2د'], [180, '3د'], [300, '5د']].map(x => '<button data-s="' + x[0] + '"' + (x[0] === 60 ? ' class="on"' : '') + '>' + x[1] + '</button>').join('') +
        '<button data-s="up" title="ساعة إيقاف: بتعدّ لفوق">⏲ عدّاد</button></div>' +
        '<div class="tk-row"><button class="tk-btn" id="tkGo">▶ ابدأ</button><button class="tk-btn pale" id="tkReset">↺ من الأول</button></div></div></div>' +
      '<div class="tk-c" data-k="reps"><div class="tk-h"><b>🚀 رحلة للقمر · التكرار</b><small>Repeat</small><button class="tk-fold" title="صغّر">▾</button></div><div class="tk-b">' +
        '<div class="tk-sky" id="tkSky"><div class="tk-path"></div><div class="tk-moon"></div><div class="tk-rocket" id="tkRocket">' + ROCKET + '</div></div>' +
        '<div class="tk-cnt">قرأ <b id="tkN">0</b> من <select class="tk-sel" id="tkTarget">' + [2, 3, 4, 5, 6, 7, 10].map(n => '<option' + (n === 3 ? ' selected' : '') + '>' + n + '</option>').join('') + '</select> مرات</div>' +
        '<div class="tk-row three"><button class="tk-btn pale" id="tkRepUndo" title="تراجع">−</button><button class="tk-btn gold" id="tkRepAdd">✓ قرأها كمان مرة</button><button class="tk-btn pale" id="tkRepReset" title="من الأول">↺</button></div></div></div>' +
      '<div class="tk-c" data-k="stars"><div class="tk-h"><b>⭐ النجوم</b><small>Stars</small><button class="tk-fold" title="صغّر">▾</button></div><div class="tk-b">' +
        '<div class="tk-stars" id="tkStars">' + [1, 2, 3, 4, 5].map(i => '<button data-i="' + i + '" title="' + i + '">' + STAR + '</button>').join('') + '</div>' +
        '<div class="tk-cnt"><b id="tkSN">0</b> / 5 نجوم</div>' +
        '<div class="tk-row"><button class="tk-btn pale" id="tkSUndo">− تراجع</button><button class="tk-btn gold" id="tkSAdd">+ نجمة</button></div></div></div>';
    host.appendChild(w);
    const $ = id => w.querySelector('#' + id);
    w.querySelectorAll('.tk-fold').forEach(b => b.onclick = () => { const c = b.closest('.tk-c'); c.classList.toggle('off'); b.textContent = c.classList.contains('off') ? '▸' : '▾';
      try{ localStorage.setItem('tk-off-' + c.dataset.k, c.classList.contains('off') ? '1' : ''); }catch(_){} });
    w.querySelectorAll('.tk-c').forEach(c => { try{ if(localStorage.getItem('tk-off-' + c.dataset.k)){ c.classList.add('off'); c.querySelector('.tk-fold').textContent = '▸'; } }catch(_){} });

    /* timer */
    let len = 60, left = 60, up = false, run = null, last = 0;
    const fmt = s => { s = Math.max(0, Math.ceil(s)); return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); };
    const paint = () => { $('tkTime').textContent = fmt(up ? left : left); $('tkArc').style.strokeDashoffset = up ? 0 : (326.7 * (1 - left / len)).toFixed(1);
      $('tkArc').style.stroke = up ? '#c99a3f' : left <= 10 ? '#b42318' : '#177a5b'; };
    const stop = () => { if(run){ cancelAnimationFrame(run); run = null; } $('tkGo').textContent = '▶ ' + (left !== (up ? 0 : len) ? 'كمّل' : 'ابدأ'); };
    const tick = t => { const d = (t - last) / 1000; last = t;
      if(up) left += d; else { left -= d; if(left <= 0){ left = 0; paint(); stop(); $('tkGo').textContent = '▶ ابدأ'; w.querySelector('.tk-ring').classList.add('end'); $('tkLbl').textContent = 'خلص الوقت · Time is up'; chime(); return; } }
      paint(); run = requestAnimationFrame(tick); };
    $('tkGo').onclick = () => { if(run){ stop(); $('tkLbl').textContent = 'واقف · Paused'; return; }
      if(!up && left <= 0) left = len; w.querySelector('.tk-ring').classList.remove('end');
      last = performance.now(); run = requestAnimationFrame(tick); $('tkGo').textContent = '⏸ وقّف'; $('tkLbl').textContent = up ? 'بيعدّ · Counting' : 'شغّال · Go!'; fx('tap'); };
    $('tkReset').onclick = () => { stop(); left = up ? 0 : len; w.querySelector('.tk-ring').classList.remove('end'); $('tkLbl').textContent = 'جاهز · Ready'; paint(); stop(); };
    $('tkLen').onclick = e => { const b = e.target.closest('button'); if(!b) return; $('tkLen').querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b));
      up = b.dataset.s === 'up'; if(!up) len = +b.dataset.s; $('tkReset').onclick(); };
    paint();

    /* repetitions: the rocket hops one dot per reading and lands on the moon at the target */
    let n = 0;
    const drawReps = won => { const T = +$('tkTarget').value, sky = $('tkSky');
      sky.querySelectorAll('.tk-dot').forEach(d => d.remove());
      for(let i = 1; i < T; i++){ const d = document.createElement('span'); d.className = 'tk-dot' + (i <= n ? ' on' : ''); d.style.left = 'calc(34px + (100% - 78px) * ' + (i / T) + ')'; sky.appendChild(d); }
      $('tkRocket').style.left = 'calc(34px + (100% - 78px) * ' + Math.min(1, n / T) + ')';
      $('tkN').textContent = n; sky.classList.toggle('won', !!won); };
    $('tkSky').insertAdjacentHTML('afterbegin', Array.from({length: 14}, () => '<i style="left:' + (Math.random() * 100).toFixed(1) + '%;top:' + (Math.random() * 100).toFixed(1) + '%"></i>').join(''));
    $('tkRepAdd').onclick = () => { const T = +$('tkTarget').value; if(n >= T) return; n++; const won = n === T; drawReps(won); if(won) fx('win'); else fx('ok', $('tkRocket')); };
    $('tkRepUndo').onclick = () => { if(n > 0){ n--; drawReps(); fx('tap'); } };
    $('tkRepReset').onclick = () => { n = 0; drawReps(); fx('whoosh'); };
    $('tkTarget').onchange = () => { n = Math.min(n, +$('tkTarget').value); drawReps(); };
    drawReps();

    /* stars */
    let s = 0;
    const drawStars = pop => { w.querySelectorAll('#tkStars button').forEach(b => { const i = +b.dataset.i; b.classList.toggle('on', i <= s); b.classList.toggle('pop', i === pop); }); $('tkSN').textContent = s; };
    const setS = v => { const old = s; s = Math.max(0, Math.min(5, v)); drawStars(s > old ? s : 0); if(s > old) (s === 5 ? fx('win') : fx('ok', $('tkStars'))); };
    $('tkStars').onclick = e => { const b = e.target.closest('button'); if(b) setS(+b.dataset.i === s ? s - 1 : +b.dataset.i); };
    $('tkSAdd').onclick = () => setS(s + 1); $('tkSUndo').onclick = () => setS(s - 1);
    drawStars();
  }
  /* a floating panel (bottom-right) that folds to a small gold button */
  function float(){
    if(document.getElementById('tkFloat')) return;
    const f = document.createElement('div'); f.id = 'tkFloat'; f.className = 'tk-float'; f.dir = 'rtl';
    f.innerHTML = '<div class="tk-fh" title="صغّر / كبّر"><span>🧰 أدوات الحلقة</span><b id="tkMin">—</b></div>';
    document.body.appendChild(f); mount(f);
    const set = m => { f.classList.toggle('min', m); f.querySelector('#tkMin').textContent = m ? '▢' : '—'; try{ localStorage.setItem('tk-min', m ? '1' : ''); }catch(_){} };
    f.querySelector('.tk-fh').onclick = () => set(!f.classList.contains('min'));
    try{ if(localStorage.getItem('tk-min')) set(true); }catch(_){}
  }
  window.TQKit = {mount, float};
})();
