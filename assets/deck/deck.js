/* Tarteel lesson deck engine. A lesson page sets window.DECK, then loads tq-fx.js, gsap and this file.
   DECK = {title, sub, theme:'th-night', lang:'en'|'ar' (the student's main language), voice:'lessons/<name>/s',
           mascot:'owl_3d.png', slides:[{kick, title, guide, note, say, min, art:[{src,x,y,w,float}], blocks:[…]}]}
   Text fields are a string or {ar, en}. Language modes: ع / ع+EN / EN (follows the site's language button too).
   Blocks: ayah · mcq · cards · flip · count · tree · sort · hold · quiz · result · text
   Bar: prev/next, count, progress, stars, clock, language, pen (D), teacher notes (N), sound (M), full screen (F). */
(function(){
  const D = window.DECK, S = D.slides, FX = () => window.TQFX;
  const IMG = '../assets/img/fluent/';
  const $ = (s, r) => (r || document).querySelector(s), $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  let mode = 'both', cur = 0, stars = new Set(), t0 = Date.now();
  try{ mode = localStorage.getItem('tq-deck-mode') || (localStorage.getItem('tq-lang') === 'ar' ? 'ar' : (D.lang === 'ar' ? 'ar' : 'both')); }catch(_){}
  const AR = () => mode === 'ar';
  const digits = n => AR() ? String(n).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]) : String(n);
  /* text in the current mode; in ع+EN the student's main language comes first, the other one smaller under it */
  function T(x, plain){
    if(x == null) return ''; if(typeof x === 'string') return x;
    if(mode === 'ar') return x.ar || x.en || ''; if(mode === 'en') return x.en || x.ar || '';
    const main = D.lang === 'ar' ? x.ar : x.en, oth = D.lang === 'ar' ? x.en : x.ar;
    if(!main) return oth || ''; if(!oth || plain) return main;
    return main + '<span class="both2' + (D.lang === 'ar' ? '' : ' ar') + '">' + oth + '</span>';
  }
  const L = (ar, en) => AR() ? ar : en;

  /* ---------- page skeleton ---------- */
  document.body.classList.add('tqd');
  const root = document.createElement('div'); root.id = 'dk';
  root.innerHTML = '<div id="dkView"><div id="dkStage" class="' + (D.theme || 'th-night') + '"><div id="dkBoard"></div><canvas id="dkPen" width="1600" height="900"></canvas>' +
    '<div id="dkPenbar" hidden><button data-p="pen" data-c="#E2B85C" class="sel" style="background:#E2B85C"></button><button data-p="pen" data-c="#FF6B6B" style="background:#FF6B6B"></button><button data-p="pen" data-c="#FFFFFF" style="background:#fff"></button><button data-p="pen" data-c="#2DBE6C" style="background:#2DBE6C"></button><button data-p="hl" data-c="#FFE14D" title="highlighter" style="background:#FFE14D">▮</button><button data-p="laser" title="laser">🔴</button><button data-p="board" title="whiteboard (W)">⬜</button><button data-p="undo" title="undo">↶</button><button data-p="clear" title="clear">🗑</button><button data-p="close" title="close (D)">✕</button></div></div>' +
    '<div id="dkNotes" hidden></div></div>' +
    '<div id="dkBar"><button class="nav" id="dkPrev"></button><button class="nav" id="dkNext"></button><span id="dkCount"></span><div id="dkProg"><i></i></div><span id="dkStars">★ 0</span><span id="dkClock" class="hide-s">00:00</span>' +
    '<div class="lang3"><button data-m="ar">ع</button><button data-m="both">ع+EN</button><button data-m="en">EN</button></div>' +
    '<button id="dkPenB">✏️</button><button id="dkNotesB"></button><button data-tq-sound></button><button id="dkFsB" class="hide-s">⛶</button></div>';
  document.body.appendChild(root);
  const stage = $('#dkStage'), view = $('#dkView');
  function fit(){ const r = view.getBoundingClientRect(), s = Math.min(r.width / 1600, r.height / 900) * .98; stage.style.transform = 'translate(-50%,-50%) scale(' + s + ')'; stage.dataset.s = s; }
  addEventListener('resize', fit); new ResizeObserver(fit).observe(view);

  /* ---------- blocks ---------- */
  const B = {
    ayah: b => '<div class="glass ayah"><div><div class="ar">' + b.text + '</div><div class="ref">' + T(b.ref, true) + '</div></div>' + (b.s ? '<button class="rbtn" data-ayah="' + b.s + ':' + b.a + '" title="Husary">🔊</button>' : '') + '</div>',
    text: b => '<div class="glass" style="font:500 24px/1.5 var(--b)">' + T(b.html) + '</div>',
    mcq: b => '<div class="glass" data-mcq="' + b.key + '" data-a="' + b.a + '"><div class="q">' + T(b.q) + '</div><div class="opts">' +
      b.opts.map(o => '<button class="opt">' + T(o) + '</button>').join('') + '</div><div class="why" hidden>' + T(b.why) + '</div></div>',
    cards: b => '<div class="cards" style="--n:' + (b.n || b.items.length) + '">' + b.items.map(c => '<div class="ic" style="--c:' + (c.c || 'var(--acc)') + '">' + (c.h ? '<h4>' + T(c.h) + '</h4>' : '') +
      (c.ar ? '<div class="ar">' + c.ar + (c.s ? ' <button class="rbtn sm" data-ayah="' + c.s + ':' + c.a + '">🔊</button>' : '') + '</div>' : '') + (c.p ? '<p>' + T(c.p) + '</p>' : '') + '</div>').join('') + '</div>',
    flip: b => '<div class="cards" style="--n:' + b.items.length + '">' + b.items.map(c => '<button class="flip"><span class="fr">' + T(c.f) + '</span><span class="bk">' + T(c.b) + '</span></button>').join('') + '</div>',
    count: b => '<div class="glass"><div class="q" style="font-size:24px">' + T(b.label) + '</div><div class="beats" style="margin-top:10px"><button class="gbtn" data-count="' + b.n + '">' + L('ابدأ العدّ', 'Count') + '</button>' +
      Array.from({length: b.n}, (_, i) => '<i>' + digits(i + 1) + '</i>').join('') + '</div></div>',
    tree: () => '<div class="glass" style="padding:8px 18px">' + treeSvg() + '</div>',
    sort: b => '<div class="glass" data-sort="' + b.key + '"><div class="bins" style="--n:' + b.bins.length + '">' + b.bins.map(x => '<div class="bin" data-bin="' + x.id + '" style="--c:' + x.c + '"><h4>' + T(x.label, true) + '</h4><div class="got"></div></div>').join('') +
      '</div><div class="pool">' + b.items.map(x => '<button class="chip" data-bin="' + x.bin + '">' + x.w + '</button>').join('') + '</div></div>',
    hold: b => '<div class="glass hold" data-hold="' + b.key + '" data-lo="' + b.lo + '" data-hi="' + b.hi + '"><div class="q" style="font-size:24px;text-align:center">' + T(b.label) + '</div><div class="w">' + b.word + '</div>' +
      '<div class="beats">' + Array.from({length: 7}, (_, i) => '<i>' + digits(i + 1) + '</i>').join('') + '</div><button class="holdb">' + L('اضغط باستمرار', 'Hold') + '</button><div class="hres"></div></div>',
    quiz: b => '<div class="glass" data-quiz="' + b.key + '"><div class="qprog">' + b.qs.map(() => '<i></i>').join('') + '</div><div class="qbox" style="margin-top:14px"></div></div>',
    result: b => '<div class="res"><div class="glass" style="text-align:center;min-width:260px"><div style="font:700 24px var(--h);color:var(--muted)">' + L('نجومك', 'Your stars') + '</div><div class="score" data-score></div><img src="' + IMG + 'trophy_3d.png" style="width:150px"></div>' +
      '<div class="glass" style="flex:1"><table class="sum">' + b.rows.map(r => '<tr><td style="color:' + r.c + ';font-weight:800">' + T(r.t, true) + '</td><td>' + T(r.when, true) + '</td><td class="ar">' + r.ex + '</td></tr>').join('') + '</table>' +
      '<h4 style="margin:16px 0 6px;font:700 26px var(--h);color:var(--acc)">' + L('الواجب', 'Homework') + '</h4><ul class="hw">' + b.hw.map(h => '<li>' + T(h, true) + '</li>').join('') + '</ul>' +
      (b.next ? '<p style="font:600 20px var(--b);color:var(--muted);margin:10px 0 0">' + T(b.next, true) + '</p>' : '') + '</div></div>'
  };
  function treeSvg(){
    const t = k => ({h: L('همزة', 'Hamza'), s: L('سكون', 'Sukoon'), o: L('أصلي ٢', 'Original · 2'), r: L('الجذر: حرف المد', 'root: the Madd letter')})[k];
    return '<svg class="mtree" viewBox="0 0 640 330"><path class="g grd" d="M40 300 H600"/><path class="g trunk" d="M320 300 V160"/><path class="g rt" d="M320 300 C300 315 270 320 240 322 M320 300 C340 315 370 320 400 322"/>' +
      '<path class="g b1" d="M320 200 C280 170 230 140 170 110"/><path class="g b2" d="M320 180 C360 150 410 120 470 90"/>' +
      '<circle class="lf l1" cx="160" cy="100" r="48" fill="#E8485F"/><circle class="lf l2" cx="480" cy="82" r="48" fill="#A63A8C"/><circle class="lf l0" cx="320" cy="140" r="58" fill="#3D8FD1"/>' +
      '<text class="lt l1" x="160" y="108" text-anchor="middle">' + t('h') + '</text><text class="lt l2" x="480" y="90" text-anchor="middle">' + t('s') + '</text><text class="lt l0" x="320" y="147" text-anchor="middle" style="font-size:19px">' + t('o') + '</text>' +
      '<text class="lt l3" x="336" y="288" text-anchor="start" direction="ltr" style="fill:#AFC2D2;font-size:19px">' + t('r') + '</text></svg>';
  }

  /* ---------- slides ---------- */
  const total = S.reduce((a, s) => a + (s.min || 0), 0);
  function render(){
    stage.classList.toggle('dk-rtl', AR());
    $$('.slide', stage).forEach(n => n.remove());
    S.forEach((s, i) => {
      const n = document.createElement('section'); n.className = 'slide'; n.dataset.i = i;
      const art = (s.art || []).map(a => '<img class="art' + (a.float ? ' fl' : '') + '" src="' + IMG + a.src + '" style="left:' + a.x + 'px;top:' + a.y + 'px;width:' + a.w + 'px">').join('');
      n.innerHTML = '<div class="dots"></div><div class="glow"></div>' +
        '<div class="sh"><span class="pill">' + L('المحطة ', 'Station ') + digits(i + 1) + ' / ' + digits(S.length) + '</span>' + (s.min ? '<span class="pill">⏱ ' + digits(s.min) + L(' د', ' min') + '</span>' : '') + '<span class="sp"></span><span class="pill g" data-st>★ 0</span></div>' +
        '<div class="main">' + (s.kick ? '<div class="kick">' + T(s.kick, true) + '</div>' : '') + '<h2 class="ttl">' + T(s.title, true) + '</h2>' + (s.sub ? '<div class="sub2">' + T(s.sub, true) + '</div>' : '') +
        (s.blocks || []).map(b => B[b.t](b)).join('') + '</div>' +
        '<div class="side">' + art + (s.guide ? '<div class="bub">' + (D.voice && !AR() ? '<button class="rbtn sm vb" data-voice="' + (i + 1) + '" title="Listen">🔊</button>' : '') + T(s.guide) + '</div>' : '') +
        '<img class="mascot" src="' + IMG + (s.mascot || D.mascot || 'owl_3d.png') + '"></div>';
      stage.insertBefore(n, $('#dkBoard'));
    });
    bind(); go(cur, true);
    $('#dkPrev').textContent = L('→ السابق', '← Back'); $('#dkNext').textContent = L('التالي ←', 'Next →'); $('#dkNotesB').textContent = L('📝 ملاحظات', '📝 Notes');
    $$('.lang3 button').forEach(b => b.classList.toggle('on', b.dataset.m === mode));
  }

  function star(key){ if(!key || stars.has(key)) return; stars.add(key); paintStars(); }
  function paintStars(){ $('#dkStars').textContent = '★ ' + stars.size; $$('[data-st]').forEach(x => x.textContent = '★ ' + digits(stars.size)); }

  function bind(){
    const fx = FX();
    $$('[data-ayah]', stage).forEach(b => b.onclick = () => { const [s, a] = b.dataset.ayah.split(':'); const au = fx && fx.ayah(+s, +a); b.classList.add('on'); if(au){ au.onended = au.onpause = () => b.classList.remove('on'); } else b.classList.remove('on'); });
    $$('[data-voice]', stage).forEach(b => b.onclick = () => fx && fx.play(fx.url(D.voice + b.dataset.voice)));
    $$('[data-mcq]', stage).forEach(w => mcq(w, w.dataset.mcq));
    $$('.flip', stage).forEach(c => c.onclick = () => { c.classList.toggle('open'); fx && fx.tap(); });
    $$('[data-count]', stage).forEach(btn => { let tm = []; btn.onclick = () => { const dots = $$('i', btn.parentNode); tm.forEach(clearTimeout); tm = []; dots.forEach(d => d.classList.remove('lit'));
      dots.forEach((d, i) => tm.push(setTimeout(() => { d.classList.add('lit'); fx && fx.tap(); if(i === dots.length - 1 && fx) setTimeout(() => fx.ok(btn, true), 250); }, 650 * (i + 1)))); }; });
    $$('[data-sort]', stage).forEach(sortGame);
    $$('[data-hold]', stage).forEach(holdGame);
    $$('[data-quiz]', stage).forEach(quiz);
  }
  function mcq(w, key, after){
    const a = +w.dataset.a, btns = $$('.opt', w); let tries = 0;
    btns.forEach((b, i) => b.onclick = () => {
      if(w.classList.contains('done')) return; tries++;
      if(i === a){ b.classList.add('right'); w.classList.add('done'); btns.forEach(x => x.disabled = true); if(tries === 1) star(key); FX() && FX().ok(b); const y = $('.why', w); if(y) y.hidden = false; after && after(tries === 1); }
      else { b.classList.add('wrong'); b.disabled = true; FX() && FX().bad(b); if(tries >= 2){ btns[a].classList.add('right'); w.classList.add('done'); btns.forEach(x => x.disabled = true); const y = $('.why', w); if(y) y.hidden = false; after && after(false); } }
    });
  }
  function sortGame(w){
    const pool = $('.pool', w), chips = $$('.chip', pool); let sel = null;
    chips.sort(() => Math.random() - .5).forEach(c => pool.appendChild(c));
    chips.forEach(c => c.onclick = () => { chips.forEach(x => x.classList.remove('sel')); sel = c; c.classList.add('sel'); $$('.bin', w).forEach(b => b.classList.add('armed')); FX() && FX().tap(); });
    $$('.bin', w).forEach(bin => bin.onclick = () => {
      if(!sel) return;
      if(sel.dataset.bin === bin.dataset.bin){ const p = document.createElement('span'); p.className = 'chip placed'; p.textContent = sel.textContent; $('.got', bin).appendChild(p); sel.remove(); sel = null;
        $$('.bin', w).forEach(b => b.classList.remove('armed')); FX() && FX().ok(p, Math.random() < .55);
        if(!$$('.chip', pool).length){ star(w.dataset.sort); setTimeout(() => FX() && FX().win(), 400); } }
      else { FX() && FX().bad(sel); }
    });
  }
  function holdGame(w){
    const btn = $('.holdb', w), dots = $$('i', w), res = $('.hres', w), lo = +w.dataset.lo, hi = +w.dataset.hi; let n = 0, tm = null, tries = 0;
    const start = e => { e.preventDefault(); if(tm) return; n = 0; dots.forEach(d => d.classList.remove('lit')); res.textContent = ''; res.className = 'hres'; btn.classList.add('down');
      tm = setInterval(() => { if(n < dots.length){ dots[n].classList.add('lit'); FX() && FX().tap(); } n++; }, 600); };
    const stop = () => { if(!tm) return; clearInterval(tm); tm = null; btn.classList.remove('down'); tries++;
      if(n >= lo && n <= hi){ res.textContent = L('ممتاز! ' + digits(n) + ' حركات ✓', 'Great! ' + n + ' counts ✓'); res.className = 'hres ok'; if(tries === 1) star(w.dataset.hold); FX() && FX().ok(btn); }
      else { res.textContent = n < lo ? L('قصير! مُدّ أكثر', 'Too short! Stretch more') : L('طويل! أقل شوية', 'Too long! A bit less'); res.className = 'hres no'; FX() && FX().bad(btn); } };
    btn.addEventListener('pointerdown', start); btn.addEventListener('pointerup', stop); btn.addEventListener('pointerleave', stop); btn.addEventListener('pointercancel', stop);
  }
  function quiz(w){
    const b = S.flatMap(s => s.blocks || []).find(x => x.t === 'quiz' && x.key === w.dataset.quiz), box = $('.qbox', w), bars = $$('.qprog i', w); let i = 0;
    const show = () => {
      if(i >= b.qs.length){ box.innerHTML = '<div class="q" style="text-align:center">' + L('خلّصت الاختبار! 🎉', 'Quiz finished! 🎉') + '</div>'; FX() && FX().win(); return; }
      const q = b.qs[i]; box.innerHTML = B.mcq({key: b.key + i, q: q.q, opts: q.opts, a: q.a, why: q.why}).replace('class="glass"', 'class=""');
      const m = $('[data-mcq]', box); mcq(m, b.key + i, () => { bars[i].classList.add('d'); i++; setTimeout(show, 1500); });
    };
    show();
  }

  /* ---------- navigation ---------- */
  function go(i, quiet){
    i = Math.max(0, Math.min(S.length - 1, i)); const changed = i !== cur; cur = i;
    $$('.slide', stage).forEach(n => n.classList.toggle('on', +n.dataset.i === i));
    $('#dkCount').textContent = (i + 1) + ' / ' + S.length; $('#dkProg i').style.width = ((i + 1) / S.length * 100) + '%';
    $('#dkPrev').disabled = i === 0; $('#dkNext').disabled = i === S.length - 1; paintStars();
    const s = S[i]; $('#dkNotes').innerHTML = (s.note ? T(s.note) : '') + (s.say ? '<div class="say">' + s.say + '</div>' : '') + (s.min ? '<div style="opacity:.7">⏱ ' + s.min + ' د · ' + spent(i) + '–' + (spent(i) + s.min) + ' / ' + total + '</div>' : '');
    const n = $('.slide.on', stage), sc = n && $('[data-score]', n);
    if(sc){ const all = S.flatMap(x => x.blocks || []).reduce((a, b) => a + (b.t === 'quiz' ? b.qs.length : ['mcq', 'sort', 'hold'].includes(b.t) ? 1 : 0), 0);
      sc.textContent = digits(stars.size) + ' / ' + digits(all); if(!quiet && FX()) setTimeout(() => FX().win(), 300); }
    if(!quiet && changed && FX()){ FX().stop(); FX().whoosh(); }
    if(window.gsap && n){ gsap.fromTo($$('.main > *', n), {y: 30, opacity: 0}, {y: 0, opacity: 1, stagger: .08, duration: .55, ease: 'power3.out'});
      gsap.fromTo($$('.side img.art', n), {scale: .5, opacity: 0}, {scale: 1, opacity: 1, duration: .9, stagger: .12, ease: 'elastic.out(1,.6)'});
      gsap.fromTo($$('.bub, .mascot', n), {x: AR() ? -60 : 60, opacity: 0}, {x: 0, opacity: 1, duration: .6, delay: .35, stagger: .1, ease: 'power3.out'});
      $$('.side img.fl', n).forEach((im, k) => gsap.to(im, {y: -14, duration: 2.2 + k * .3, repeat: -1, yoyo: true, ease: 'sine.inOut'})); }
    document.dispatchEvent(new CustomEvent('deck:slide', {detail: i}));
  }
  const spent = i => S.slice(0, i).reduce((a, s) => a + (s.min || 0), 0);
  $('#dkPrev').onclick = () => go(cur - 1); $('#dkNext').onclick = () => go(cur + 1);
  $$('.lang3 button').forEach(b => b.onclick = () => { mode = b.dataset.m; try{ localStorage.setItem('tq-deck-mode', mode); }catch(_){} render(); });
  addEventListener('tq-lang', () => { let l = 'en'; try{ l = localStorage.getItem('tq-lang'); }catch(_){} mode = l === 'ar' ? 'ar' : (mode === 'ar' ? 'both' : mode); render(); });
  $('#dkNotesB').onclick = () => { $('#dkNotes').hidden = !$('#dkNotes').hidden; $('#dkNotesB').classList.toggle('on', !$('#dkNotes').hidden); };
  function fs(){ const d = document, e = d.documentElement; if(d.fullscreenElement || d.webkitFullscreenElement){ (d.exitFullscreen || d.webkitExitFullscreen).call(d); } else { (e.requestFullscreen || e.webkitRequestFullscreen || (() => {})).call(e); } }
  $('#dkFsB').onclick = fs;
  setInterval(() => { const s = Math.floor((Date.now() - t0) / 1000); $('#dkClock').textContent = String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); }, 1000);
  addEventListener('keydown', e => { if(/INPUT|TEXTAREA/.test(e.target.tagName)) return; const k = e.key.toLowerCase(), f = AR() ? -1 : 1;
    if(e.key === 'ArrowRight') go(cur + f); else if(e.key === 'ArrowLeft') go(cur - f); else if(k === 'n') $('#dkNotesB').click(); else if(k === 'd') penOpen(penbar.hidden);
    else if(k === 'f') fs(); else if(k === 'm' && FX()) FX().setMuted(!FX().muted); else if(k === 'w') toggleBoard(); });

  /* ---------- pen / highlighter / laser / whiteboard ---------- */
  const cv = $('#dkPen'), cx = cv.getContext('2d'), penbar = $('#dkPenbar'), board = $('#dkBoard');
  let tool = 'pen', color = '#E2B85C', strokes = {}, drawing = null, lastPen = 0, laser = [];
  const key = () => cur + (board.classList.contains('on') ? 'b' : '');
  const list = () => strokes[key()] || (strokes[key()] = []);
  const pt = e => { const r = cv.getBoundingClientRect(), s = r.width / 1600; return [(e.clientX - r.left) / s, (e.clientY - r.top) / s, e.pointerType === 'pen' ? (e.pressure || .5) : .5]; };
  function redraw(){ cx.clearRect(0, 0, 1600, 900); list().forEach(st => drawSt(st)); laser.forEach((p, i) => { cx.fillStyle = 'rgba(255,40,40,' + (i / laser.length) + ')'; cx.beginPath(); cx.arc(p[0], p[1], 9, 0, 7); cx.fill(); }); }
  function drawSt(st){ cx.save(); cx.lineCap = cx.lineJoin = 'round'; cx.strokeStyle = st.c; cx.globalAlpha = st.hl ? .35 : 1;
    for(let i = 1; i < st.p.length; i++){ const a = st.p[i - 1], b = st.p[i]; cx.lineWidth = st.hl ? 26 : 2 + 7 * b[2]; cx.beginPath(); cx.moveTo(a[0], a[1]); cx.lineTo(b[0], b[1]); cx.stroke(); } cx.restore(); }
  cv.addEventListener('pointerdown', e => {
    if(e.pointerType === 'pen') lastPen = Date.now(); else if(e.pointerType === 'touch' && Date.now() - lastPen < 2000) return;   /* palm rejection */
    e.preventDefault(); cv.setPointerCapture(e.pointerId);
    if(tool === 'laser'){ drawing = 'laser'; return; }
    drawing = {c: color, hl: tool === 'hl', p: [pt(e)]}; list().push(drawing);
  });
  cv.addEventListener('pointermove', e => { if(!drawing) return; if(drawing === 'laser'){ laser.push(pt(e)); if(laser.length > 18) laser.shift(); redraw(); return; } drawing.p.push(pt(e)); redraw(); });
  const up = () => { if(drawing === 'laser'){ laser = []; redraw(); } drawing = null; };
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
  function penOpen(on){ penbar.hidden = !on; cv.classList.toggle('on', on); $('#dkPenB').classList.toggle('on', on); if(!on && board.classList.contains('on')) toggleBoard(); }
  function toggleBoard(){ board.classList.toggle('on'); if(board.classList.contains('on') && penbar.hidden) penOpen(true); redraw(); }
  $('#dkPenB').onclick = () => penOpen(penbar.hidden);
  penbar.onclick = e => { const b = e.target.closest('button'); if(!b) return; const p = b.dataset.p;
    if(p === 'pen' || p === 'hl'){ tool = p; color = b.dataset.c; } else if(p === 'laser'){ tool = 'laser'; } else if(p === 'board'){ toggleBoard(); return; }
    else if(p === 'undo'){ list().pop(); redraw(); return; } else if(p === 'clear'){ strokes[key()] = []; redraw(); return; } else if(p === 'close'){ penOpen(false); return; }
    $$('button', penbar).forEach(x => x.classList.toggle('sel', x === b)); };
  document.addEventListener('deck:slide', () => redraw());
  /* iPad: no double-tap zoom, no long-press menu */
  document.addEventListener('dblclick', e => e.preventDefault(), {passive: false});
  document.addEventListener('contextmenu', e => { if(e.target.closest('#dk')) e.preventDefault(); });

  render(); fit();
})();
