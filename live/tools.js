/* Live-class tools shared by the corrector (app/mushaf) and live/index.html:
   sticker reactions (with the site's voice/sound bank), class timer, traffic light, stars.
   Needs tq-fx.js loaded first (sounds). Usage:  TQLive.toggle('stickers' | 'timer' | 'light' | 'stars')
   Optional  window.TQLiveLeft = 370  (px) keeps the widgets clear of a floating panel on the start side. */
(function(){
  if(window.TQLive) return;
  const css = `
.lv{--card:#163A57;--card2:#12304A;--ink:#F4EBD6;--muted:#B4C5D3;--line:#2A5675;--gold:#E2B85C;--btn-ink:#10263A;--bad:#F1948A;font-family:"Baloo Bhaijaan 2","Segoe UI",Tahoma,sans-serif;color:var(--ink);line-height:1.4}
html[data-lang=en] .lv .ar{display:none!important}
html:not([data-lang=en]) .lv .en{display:none!important}
#lvWid{position:fixed;bottom:calc(92px + env(safe-area-inset-bottom,0px));left:var(--lv-left,10px);z-index:2147482000;display:flex;flex-wrap:wrap;gap:10px;align-items:flex-end;max-width:calc(100vw - var(--lv-left,10px) - 10px)}
.lv .wg{background:#163A57f2;border:2px solid var(--line);border-radius:20px;padding:10px 12px;display:flex;flex-direction:column;gap:8px;align-items:center;box-shadow:0 10px 30px rgba(0,0,0,.35)}
.lv .wg[hidden],.lv[hidden]{display:none}
.lv .x{align-self:flex-end;border:0;background:none;cursor:pointer;color:var(--muted);font-size:1rem;line-height:1;padding:0}
.lv .row{display:flex;flex-wrap:wrap;gap:8px;align-items:center;justify-content:center}
.lv .btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;min-height:42px;padding:0 16px;border-radius:999px;border:2px solid var(--line);background:var(--card2);color:var(--ink);font:800 1rem "Baloo Bhaijaan 2","Segoe UI",sans-serif;cursor:pointer}
.lv .btn:hover{border-color:var(--gold)}.lv .btn.gold{background:var(--gold);border-color:var(--gold);color:var(--btn-ink)}
.lv .hint{color:var(--muted);font-size:.85rem}
#lvT{font:800 2.4rem/1 "Baloo Bhaijaan 2",sans-serif;font-variant-numeric:tabular-nums}
#lvT.end{color:var(--bad);animation:lvbl .6s infinite}
@keyframes lvbl{50%{opacity:.35}}
.lv .tl{display:flex;gap:8px;background:#0a0f14;border-radius:22px;padding:10px}
.lv .tl button{width:50px;height:50px;border-radius:50%;border:0;background:#2a323a;cursor:pointer;opacity:.35;transition:.2s}
.lv .tl button.on{opacity:1;box-shadow:0 0 22px var(--c)}
.lv .tl .r{background:#E5484D;--c:#E5484D}.lv .tl .y{background:#F5C542;--c:#F5C542}.lv .tl .g{background:#30A46C;--c:#30A46C}
#lvTlc{font-weight:800;min-height:1.4em}
#lvSN{font:800 2.6rem/1 "Baloo Bhaijaan 2",sans-serif;color:var(--gold)}
#lvTray{position:fixed;bottom:calc(92px + env(safe-area-inset-bottom,0px));left:var(--lv-left,0);right:0;z-index:2147482100;margin:0 auto;width:min(980px,calc(100vw - var(--lv-left,0px) - 20px));background:#163A57f5;border:2px solid var(--line);border-radius:22px;padding:12px;box-shadow:0 10px 30px rgba(0,0,0,.4)}
#lvTray .grid{display:flex;flex-wrap:wrap;gap:10px;justify-content:center;max-height:38vh;overflow:auto}
.lv .st{border:0;background:#fff;border-radius:16px;padding:6px 14px;cursor:pointer;min-height:56px;display:flex;flex-direction:column;align-items:center;justify-content:center;line-height:1.1;transition:transform .15s}
.lv .st:hover{transform:scale(1.07) rotate(-2deg)}
.lv .st b{font:800 1.5rem "Baloo Bhaijaan 2",sans-serif;color:var(--c1)}.lv .st i{font:700 1.05rem "Baloo Bhaijaan 2",sans-serif;font-style:normal;color:var(--c2)}
.lv .st.em{font-size:2rem;background:none;padding:0 6px}
.placed.lv{position:fixed;z-index:2147482050;touch-action:none;cursor:grab;user-select:none;background:#fff;border-radius:26px;padding:10px 26px;text-align:center;line-height:1.1;box-shadow:0 14px 34px rgba(0,0,0,.4);animation:lvpop .45s cubic-bezier(.2,1.5,.4,1);--r:-3deg;transform:rotate(var(--r))}
@keyframes lvpop{from{transform:scale(.2) rotate(-14deg);opacity:0}to{transform:scale(1) rotate(var(--r));opacity:1}}
.placed.lv b{display:block;font:800 clamp(2rem,6vw,4rem) "Baloo Bhaijaan 2",sans-serif;color:var(--c1)}
.placed.lv i{display:block;font:700 clamp(1.2rem,3vw,2rem) "Baloo Bhaijaan 2",sans-serif;font-style:normal;color:var(--c2)}
.placed.lv.big-em{background:none;box-shadow:none;font-size:clamp(4rem,10vw,7rem);padding:0}
.lv .st.im{background:none;padding:2px}.lv .st.im img{height:88px;width:auto;max-width:160px;object-fit:contain;filter:drop-shadow(0 3px 5px rgba(0,0,0,.35))}
.lv .sep{width:100%;text-align:center;color:var(--muted);font-size:.8rem}
.placed.lv.img{background:none;box-shadow:none;padding:0}.placed.lv.img img{display:block;width:clamp(150px,22vw,300px);height:auto;pointer-events:none;filter:drop-shadow(0 10px 14px rgba(0,0,0,.4))}
.placed.lv .nm{display:block;margin-top:6px;font:800 1.1rem "Baloo Bhaijaan 2",sans-serif;background:#fff;color:#10263A;border-radius:999px;padding:0 14px;font-style:normal}
.placed.lv .rm{position:absolute;top:-10px;inset-inline-end:-10px;width:30px;height:30px;border-radius:50%;border:0;background:var(--bad);color:#fff;font-weight:800;cursor:pointer;display:none}
.placed.lv:hover .rm{display:block}
@media (prefers-reduced-motion:reduce){.lv *,.placed.lv{animation:none!important;transition:none!important}}`;
  const sty = document.createElement('style'); sty.textContent = css; document.head.appendChild(sty);
  if(!document.querySelector('link[href*="Baloo"]')){ const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = 'https://fonts.googleapis.com/css2?family=Baloo+Bhaijaan+2:wght@500;700;800&display=swap'; document.head.appendChild(l); }
  if(window.TQLiveLeft) document.documentElement.style.setProperty('--lv-left', window.TQLiveLeft + 'px');

  const ME = document.currentScript && document.currentScript.src, ROOT = ME ? ME.replace(/live\/tools\.js.*$/, '') : '../';
  const who = () => { try{ return String((window.TQLiveName && window.TQLiveName()) || '').trim(); }catch(_){ return ''; } };
  const escH = x => String(x == null ? '' : x).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const $ = s => document.querySelector(s);
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const sfx = (n, el) => { try{ if(window.TQFX && TQFX[n]) TQFX[n](el); }catch(_){} };
  const voice = k => { try{ if(window.TQFX) TQFX.play(TQFX.url(k)); }catch(_){} };
  const lsGet = k => { try{ return localStorage.getItem(k); }catch(_){ return null; } };
  const lsSet = (k, v) => { try{ localStorage.setItem(k, v); }catch(_){} };

  const wid = document.createElement('div'); wid.id = 'lvWid'; wid.className = 'lv';
  wid.innerHTML =
   '<div class="wg" id="lvwTimer" hidden><button class="x" data-x="timer" aria-label="close">✕</button><output id="lvT">05:00</output>' +
     '<div class="row"><button class="btn" data-m="1">1</button><button class="btn" data-m="3">3</button><button class="btn" data-m="5">5</button><button class="btn" data-m="10">10</button></div>' +
     '<div class="row"><button class="btn gold" id="lvGo"><span class="ar">ابدأ</span><span class="en">Start</span></button><button class="btn" id="lvRs"><span class="ar">إعادة</span><span class="en">Reset</span></button></div></div>' +
   '<div class="wg" id="lvwLight" hidden><button class="x" data-x="light" aria-label="close">✕</button><div class="tl"><button class="r" data-l="r" aria-label="red"></button><button class="y" data-l="y" aria-label="yellow"></button><button class="g" data-l="g" aria-label="green"></button></div><div id="lvTlc"></div></div>' +
   '<div class="wg" id="lvwStars" hidden><button class="x" data-x="stars" aria-label="close">✕</button><div id="lvSN">0</div>' +
     '<div class="row"><button class="btn gold" id="lvSA">⭐ +1</button><button class="btn" id="lvSR"><span class="ar">من جديد</span><span class="en">New</span></button></div>' +
     '<div class="hint"><span class="ar">خمس نجوم = احتفال</span><span class="en">Five stars = a celebration</span></div></div>';
  const tray = document.createElement('div'); tray.id = 'lvTray'; tray.className = 'lv'; tray.hidden = true;
  const STK = [
   ['أحسنت!','Well done!','#E8590C','#0E7C66','ok'],['ما شاء الله!','MashaAllah!','#0E7C66','#E8590C','ok'],
   ['قراءة جميلة!','Beautiful recitation!','#7B3FC0','#C2185B','ok'],['أنت تتحسن!','You’re improving!','#1971C2','#0E7C66','ok'],
   ['محاولة رائعة!','Great effort!','#C2185B','#1971C2','ok'],['واصل!','Keep it up!','#5F3DC4','#E8590C','ok'],
   ['نجم الحلقة','You are a star!','#B8860B','#1B4566','win'],['بارك الله فيك','May Allah bless you','#0E7C66','#7B3FC0','win'],
   ['حاول مرة أخرى','Try again. You can do it!','#D9480F','#1971C2','bad'],['خذ وقتك','Take your time.','#1971C2','#0E7C66','tap'],
   ['استمع أولًا','Listen first','#0E7C66','#C2185B','listen_carefully'],['كرر بعدي','Repeat after me','#C2185B','#1971C2','repeat_after_me'],
   ['اقرأ بنفسك','Now read alone','#7B3FC0','#E8590C','read_alone']];
  const EMO = [['👏','ok'],['🌟','win'],['💛','ok'],['🎉','win'],['🌈','ok'],['😊','tap']];
  const OKV = ['great_job','excellent','thats_right','well_done','masha_allah','perfect','brilliant'];
  tray.innerHTML = '<div class="grid">' + STK.map((s, i) => '<button class="st" style="--c1:' + s[2] + ';--c2:' + s[3] + '" data-i="' + i + '"><b class="ar">' + s[0] + '</b><b class="en">' + s[1] + '</b><i class="ar">' + s[1] + '</i><i class="en">' + s[0] + '</i></button>').join('') +
    EMO.map((e, i) => '<button class="st em" data-e="' + i + '" aria-label="' + e[0] + '">' + e[0] + '</button>').join('') + '</div>' +
    '<div class="row" style="margin-top:8px"><button class="btn" id="lvClr"><span class="ar">🧹 امسح الستيكرز من الشاشة</span><span class="en">🧹 Clear stickers</span></button></div>';
  document.body.appendChild(wid); document.body.appendChild(tray);

  /* professional stickers: PNGs dropped in assets/stickers/ and listed in stickers.json  [{file, ar, en, sound}] */
  const IMG = []; const grid = tray.querySelector('.grid');
  try{ fetch(ROOT + 'assets/stickers/stickers.json', {cache: 'no-cache'}).then(r => r.ok ? r.json() : []).then(list => {
    (Array.isArray(list) ? list : []).filter(x => x && x.file).forEach(x => IMG.push(x));
    if(!IMG.length) return;
    const first = grid.firstChild;
    IMG.forEach((x, i) => { const b = document.createElement('button'); b.className = 'st im'; b.dataset.im = i; b.setAttribute('aria-label', x.ar || x.en || x.file); b.innerHTML = '<img alt="" src="' + ROOT + 'assets/stickers/' + escH(x.file) + '">'; grid.insertBefore(b, first); });
    const sp = document.createElement('div'); sp.className = 'sep'; sp.textContent = '— — —'; grid.insertBefore(sp, first);
  }).catch(() => {}); }catch(_){}
  function sound(kind, el){
    if(kind === 'ok'){ sfx('ok', el); voice(pick(OKV)); }
    else if(kind === 'win'){ sfx('win'); voice(pick(['you_did_it','amazing_work'])); }
    else if(kind === 'bad'){ sfx('tap'); voice(pick(['almost','look_again'])); }
    else if(kind === 'tap'){ sfx('tap'); }
    else voice(kind);
  }
  let zi = 0, place = 0;
  function drop(html, cls, kind){
    const d = document.createElement('div'); d.className = 'placed lv ' + (cls || ''); const nm = who(); d.innerHTML = html + (nm && !cls ? '<i class="nm">⭐ ' + escH(nm) + ' ⭐</i>' : '') + (nm && cls === 'img' ? '<i class="nm">' + escH(nm) + '</i>' : '') + '<button class="rm" aria-label="remove">✕</button>';
    const W = innerWidth, H = innerHeight, L = window.TQLiveLeft || 0;
    d.style.left = Math.max(10, Math.min(W - 260, L + (W - L) * (.12 + .15 * (place % 4)) + Math.random() * 30)) + 'px';
    d.style.top = Math.max(70, H * (.2 + .1 * (place % 3)) + Math.random() * 30) + 'px';
    d.style.setProperty('--r', (Math.random() * 8 - 4) + 'deg'); d.style.zIndex = 2147482050 + (++zi); place++;
    document.body.appendChild(d); sound(kind, d); return d;
  }
  tray.addEventListener('click', e => {
    if(e.target.closest('#lvClr')){ document.querySelectorAll('.placed.lv').forEach(x => x.remove()); return; }
    const b = e.target.closest('.st'); if(!b) return;
    if(b.dataset.im != null){ const x = IMG[+b.dataset.im]; API.toggle('stickers', false); drop('<img alt="" src="' + ROOT + 'assets/stickers/' + escH(x.file) + '">', 'img', x.sound || 'ok'); return; }
    if(b.dataset.e != null){ const m = EMO[+b.dataset.e]; drop(m[0], 'big-em', m[1]); API.toggle('stickers', false); return; }
    const s = STK[+b.dataset.i];
    API.toggle('stickers', false);
    drop('<b class="ar" style="--c1:' + s[2] + '">' + s[0] + '</b><b class="en" style="--c1:' + s[2] + '">' + s[1] + '</b><i class="ar" style="--c2:' + s[3] + '">' + s[1] + '</i><i class="en" style="--c2:' + s[3] + '">' + s[0] + '</i>', '', s[4]);
  });
  let dr = null;
  document.addEventListener('pointerdown', e => {
    const rm = e.target.closest && e.target.closest('.placed.lv .rm'); if(rm){ rm.parentNode.remove(); return; }
    const p = e.target.closest && e.target.closest('.placed.lv'); if(!p) return;
    const r = p.getBoundingClientRect(); dr = {p, dx: e.clientX - r.left, dy: e.clientY - r.top}; p.style.zIndex = 2147482050 + (++zi);
    try{ p.setPointerCapture(e.pointerId); }catch(_){}
  });
  document.addEventListener('pointermove', e => { if(!dr) return; dr.p.style.left = (e.clientX - dr.dx) + 'px'; dr.p.style.top = (e.clientY - dr.dy) + 'px'; });
  document.addEventListener('pointerup', () => { dr = null; });

  /* timer */
  const TM = {left: 300, set: 300, iv: 0, run: false, end: 0}, T = $('#lvT'), go = $('#lvGo');
  const tDraw = () => { const l = Math.max(0, TM.left); T.textContent = String(Math.floor(l / 60)).padStart(2, '0') + ':' + String(l % 60).padStart(2, '0'); go.firstElementChild.textContent = TM.run ? 'إيقاف' : 'ابدأ'; go.lastElementChild.textContent = TM.run ? 'Pause' : 'Start'; };
  const tTick = () => { TM.left = Math.max(0, Math.round((TM.end - Date.now()) / 1000)); if(TM.left <= 0){ clearInterval(TM.iv); TM.run = false; T.classList.add('end'); sfx('win'); voice('you_did_it'); } tDraw(); };
  go.onclick = () => { if(TM.run){ clearInterval(TM.iv); TM.run = false; TM.left = Math.max(0, Math.round((TM.end - Date.now()) / 1000)); } else { if(TM.left <= 0) TM.left = TM.set; T.classList.remove('end'); TM.run = true; TM.end = Date.now() + TM.left * 1000; TM.iv = setInterval(tTick, 250); } tDraw(); };
  $('#lvRs').onclick = () => { clearInterval(TM.iv); TM.run = false; TM.left = TM.set; T.classList.remove('end'); tDraw(); };
  $('#lvwTimer').addEventListener('click', e => { const b = e.target.closest('[data-m]'); if(b){ clearInterval(TM.iv); TM.run = false; TM.set = TM.left = +b.dataset.m * 60; T.classList.remove('end'); tDraw(); } });
  tDraw();
  /* traffic light */
  let tl = null; const TLC = {r:['اهدأوا واستمعوا','Quiet. Listen.'], y:['استعدوا','Get ready'], g:['تفضّل، اقرأ','Go ahead and read']};
  const en = () => document.documentElement.dataset.lang === 'en';
  $('#lvwLight .tl').addEventListener('click', e => { const b = e.target.closest('button'); if(!b) return; tl = tl === b.dataset.l ? null : b.dataset.l;
    wid.querySelectorAll('.tl button').forEach(x => x.classList.toggle('on', x.dataset.l === tl)); $('#lvTlc').textContent = tl ? TLC[tl][en() ? 1 : 0] : ''; sfx('tap'); });
  /* stars */
  let stars = +(lsGet('tq-live-stars') || 0); const sDraw = () => { $('#lvSN').textContent = stars; lsSet('tq-live-stars', stars); };
  $('#lvSA').onclick = () => { stars++; sDraw(); if(stars % 5 === 0){ sfx('win'); voice('you_did_it'); } else sfx('ok', $('#lvSN')); };
  $('#lvSR').onclick = () => { stars = 0; sDraw(); }; sDraw();

  const ELS = {stickers: tray, timer: $('#lvwTimer'), light: $('#lvwLight'), stars: $('#lvwStars')};
  const hooks = [];
  wid.addEventListener('click', e => { const x = e.target.closest('[data-x]'); if(x) API.toggle(x.dataset.x, false); });
  const API = window.TQLive = {
    isOpen: n => !ELS[n].hidden,
    toggle(n, force){ const el = ELS[n]; if(!el) return false; el.hidden = force == null ? !el.hidden : !force; hooks.forEach(f => f(n, !el.hidden)); return !el.hidden; },
    onToggle: f => hooks.push(f),
    clearStickers: () => document.querySelectorAll('.placed.lv').forEach(x => x.remove())
  };
})();
