/* Tarteel lesson effects: sounds, a warm recorded voice, confetti, and Husary recitation.
   Used by lessons/ and hw/ pages:
     <script src="../tq-fx.js"></script>
     TQFX.ok(el)        right answer: one of several chimes + bounce + sparkle (no voice)
     TQFX.bad(el)       wrong answer: one of several soft "oops" sounds + shake (no voice)
     TQFX.win()         finished a game / the lesson: fanfare + sparkles + confetti (no voice)
     TQFX.tap()         small click (cards, chips)        TQFX.whoosh()  page/station change
     TQFX.cue(key)      the class steps as soft bells: 'listen' · 'repeat' · 'alone' (TQFX.say with these keys plays the bell too)
     TQFX.say(key)      play a recorded line: a bank key or a path under assets/voice/<voice>/
     TQFX.ayah(s, a)    Husary (al-Mushaf al-Mu'allim) from everyayah.com
     TQFX.muted / TQFX.setMuted(bool)   remembered per device (localStorage 'tq-sound')
   The voice is pre-recorded (tools/voice.py, Kokoro), never the browser's speech engine. */
(function(){
  const me = document.currentScript && document.currentScript.src;
  const SITE = 'https://mohamedmobark94-a11y.github.io/Games/';
  /* inside the Edge add-on (Quran.com content script / extension pages) the voice bank comes from the site */
  const ROOT = me && /^https?:/.test(me) ? me.replace(/tq-fx\.js.*$/, '') : (me ? SITE : (/^https?:/.test(location.href) && !/quran\.com$/.test(location.hostname) ? '../' : SITE));
  const VOICE = 'george';
  const BANK = {
    ok: ['great_job', 'excellent', 'thats_right', 'well_done', 'masha_allah', 'perfect', 'brilliant'],
    bad: ['oops_try_again', 'not_quite', 'almost', 'look_again'],
    win: ['you_did_it', 'amazing_work'],
    listen: ['listen_carefully'], repeat: ['repeat_after_me'], alone: ['read_alone']
  };
  let muted = false; try{ muted = localStorage.getItem('tq-sound') === 'off'; }catch(_){}
  let ac = null, lastVoice = 0, cur = null;
  const ctx = () => { try{ ac = ac || new (window.AudioContext || window.webkitAudioContext)(); if(ac.state === 'suspended') ac.resume(); }catch(_){ ac = null; } return ac; };
  const pick = a => a[Math.floor(Math.random() * a.length)];

  /* --- synthesized sound effects (no files) --- */
  function note(f, t, d, type, vol, slideTo){
    const c = ctx(); if(!c) return; const o = c.createOscillator(), g = c.createGain();
    o.type = type || 'sine'; o.frequency.setValueAtTime(f, c.currentTime + t);
    if(slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, c.currentTime + t + d);
    g.gain.setValueAtTime(0.0001, c.currentTime + t); g.gain.exponentialRampToValueAtTime(vol || .18, c.currentTime + t + .015);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + t + d);
    o.connect(g).connect(c.destination); o.start(c.currentTime + t); o.stop(c.currentTime + t + d + .05);
  }
  /* playful effects only (Mohamed 2026-10-25: no recorded English praise; interactive sounds instead).
     Each right/wrong answer picks one of a few variants so it never gets boring. */
  const SFX = {
    ok(){ pick([
      () => [[784, 0], [988, .07], [1319, .14]].forEach(([f, t]) => { note(f, t, .28, 'triangle', .16); note(f * 2, t, .18, 'sine', .04); }),
      () => { [[1047, 0], [1319, .06], [1568, .12], [2093, .18]].forEach(([f, t]) => note(f, t, .22, 'sine', .13)); note(2637, .26, .35, 'sine', .05); },
      () => { note(660, 0, .12, 'square', .06); note(880, .09, .12, 'square', .06); note(1320, .18, .4, 'triangle', .15); [0, .05, .1].forEach(t => note(2400 + Math.random() * 900, .3 + t, .08, 'sine', .04)); },
      () => { note(523, 0, .5, 'triangle', .12); note(659, 0, .5, 'triangle', .1); note(784, 0, .5, 'triangle', .1); note(1047, .12, .45, 'sine', .08); }
    ])(); },
    bad(){ pick([
      () => { note(330, 0, .16, 'sine', .16, 300); note(262, .14, .32, 'sine', .16, 196); },
      () => { note(220, 0, .35, 'triangle', .14, 140); note(180, .05, .3, 'sine', .06, 120); },
      () => { note(400, 0, .1, 'sine', .12, 380); note(300, .12, .1, 'sine', .12, 280); note(240, .24, .25, 'sine', .12, 200); }
    ])(); },
    win(){ [[523, 0], [659, .1], [784, .2], [1047, .32], [784, .46], [1047, .56]].forEach(([f, t], i) => note(f, t, i > 4 ? .6 : .2, 'triangle', .15)); [0, .08, .16, .24, .32].forEach(t => note(1800 + Math.random() * 1400, .7 + t, .1, 'sine', .05)); },
    tap(){ note(1200, 0, .05, 'sine', .07); },
    whoosh(){ note(300, 0, .22, 'sine', .05, 900); }
  };
  /* the three class steps are soft bells, not a spoken voice (Mohamed 2026-11-12):
     listen = a calm two-tone "ding-dong" · repeat = two quick notes · alone = three rising notes */
  const bell = (f, t, v) => { note(f, t, 1.1, 'sine', v); note(f * 2, t, .6, 'sine', v * .25); note(f * 3, t, .3, 'sine', v * .08); };
  const CUE = {
    listen(){ bell(880, 0, .14); bell(659, .32, .14); },
    repeat(){ bell(659, 0, .12); bell(880, .16, .12); },
    alone(){ bell(587, 0, .11); bell(740, .14, .11); bell(988, .28, .12); }
  };
  function cue(k){ if(!muted && CUE[k]) CUE[k](); }

  /* --- recorded voice --- */
  function play(url, force){
    if(muted) return null;
    const now = Date.now(); if(!force && now - lastVoice < 1800) return null; lastVoice = now;
    try{ if(cur){ cur.pause(); } cur = new Audio(url); cur.play().catch(() => {}); return cur; }catch(_){ return null; }
  }
  /* Arabic lessons/homework never play the English voice */
  const isAr = () => { try{ return (window.DECK && window.DECK.lang === 'ar') || (window.TQHW && TQHW.lang === 'ar') || document.documentElement.lang === 'ar'; }catch(_){ return false; } };
  const voiceUrl = k => ROOT + 'assets/voice/' + VOICE + '/' + k + '.mp3';
  function say(k, force){ if(CUE[k]){ cue(k); return null; } const b = BANK[k]; if(b && isAr()) return null; return play(voiceUrl(b ? pick(b) : k), force !== false); }

  /* --- confetti / sparkles on a full-screen canvas --- */
  let cv = null, parts = [], raf = 0;
  function canvas(){
    if(cv) return cv; cv = document.createElement('canvas');
    cv.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:2147483000';
    document.body.appendChild(cv); const fit = () => { cv.width = innerWidth * devicePixelRatio; cv.height = innerHeight * devicePixelRatio; }; fit(); addEventListener('resize', fit); return cv;
  }
  const COLS = ['#E2B85C', '#2ECC71', '#3D7FB8', '#FF7A59', '#B07CF7', '#FFD54A'];
  function burst(x, y, n, spread, up){
    if(matchMedia('(prefers-reduced-motion: reduce)').matches) return; canvas();
    const d = devicePixelRatio;
    for(let i = 0; i < n; i++){ const a = Math.random() * Math.PI * 2, v = (2 + Math.random() * spread) * d;
      parts.push({x: x * d, y: y * d, vx: Math.cos(a) * v, vy: Math.sin(a) * v - up * d, r: (3 + Math.random() * 4) * d, c: pick(COLS), life: 60 + Math.random() * 40, rot: Math.random() * 6, star: Math.random() < .35}); }
    if(!raf) raf = requestAnimationFrame(step);
  }
  function step(){
    const x = cv.getContext('2d'); x.clearRect(0, 0, cv.width, cv.height);
    parts = parts.filter(p => p.life > 0);
    parts.forEach(p => { p.life--; p.vy += .18 * devicePixelRatio; p.x += p.vx; p.y += p.vy; p.rot += .15; x.save(); x.globalAlpha = Math.min(1, p.life / 30); x.translate(p.x, p.y); x.rotate(p.rot); x.fillStyle = p.c;
      if(p.star){ x.beginPath(); for(let k = 0; k < 10; k++){ const r = k % 2 ? p.r * .45 : p.r * 1.2, an = k * Math.PI / 5; x.lineTo(Math.cos(an) * r, Math.sin(an) * r); } x.fill(); }
      else x.fillRect(-p.r, -p.r / 2, p.r * 2, p.r); x.restore(); });
    raf = parts.length ? requestAnimationFrame(step) : 0;
  }
  const center = el => { if(!el || !el.getBoundingClientRect) return [innerWidth / 2, innerHeight / 3]; const r = el.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; };
  function anim(el, name){ if(!el || !el.animate) return;
    const K = name === 'shake' ? [{transform: 'translateX(0)'}, {transform: 'translateX(-9px)'}, {transform: 'translateX(9px)'}, {transform: 'translateX(-6px)'}, {transform: 'translateX(0)'}]
      : [{transform: 'scale(1)'}, {transform: 'scale(1.1)'}, {transform: 'scale(.97)'}, {transform: 'scale(1)'}];
    el.animate(K, {duration: name === 'shake' ? 420 : 460, easing: 'ease-out'}); }

  const K = {
    get muted(){ return muted; },
    setMuted(m){ muted = !!m; try{ localStorage.setItem('tq-sound', muted ? 'off' : 'on'); }catch(_){} if(muted && cur) cur.pause(); document.dispatchEvent(new CustomEvent('tq-sound', {detail: !muted})); },
    ok(el, quiet){ if(!muted) SFX.ok(); anim(el, 'pop'); const [x, y] = center(el); burst(x, y, 18, 4, 3); },
    bad(el, quiet){ if(!muted) SFX.bad(); anim(el, 'shake'); },
    win(quiet){ if(!muted) SFX.win(); for(let i = 0; i < 4; i++) setTimeout(() => burst(innerWidth * (.2 + .2 * i), innerHeight * .35, 45, 7, 6), i * 160); },
    tap(){ if(!muted) SFX.tap(); }, whoosh(){ if(!muted) SFX.whoosh(); },
    say, cue, play: url => play(url, true), url: voiceUrl,
    /* for games that already have their own tones: add only the spoken praise / "oops" and the win confetti.
       With a level — TQFX.cheer('small'|'mid'|'big', slug) — it is the encouragement with the student's name (below). */
    cheer(k, slug, o){ if(LEVELS[k]) return cheerName(k, slug, o); if(k === 'win'){ for(let i = 0; i < 4; i++) setTimeout(() => burst(innerWidth * (.2 + .2 * i), innerHeight * .35, 45, 7, 6), i * 160); setTimeout(() => v('win', true), 500); } else v(k, false);
      function v(x, f){ let l = null; try{ l = localStorage.getItem('tq-lang'); }catch(_){} if(l === 'ar' || !BANK[x]) return; play(voiceUrl(pick(BANK[x])), f); } },
    ayah(s, a){ const f = String(s).padStart(3, '0') + String(a).padStart(3, '0') + '.mp3';
      const au = play('https://everyayah.com/data/Husary_Muallim_128kbps/' + f, true);
      if(au) au.onerror = () => play('https://everyayah.com/data/Husary_128kbps/' + f, true);   /* fallback: Husary murattal */
      return au; },
    stop(){ if(cur) cur.pause(); },
    person, people: () => Object.assign({}, PEOPLE)
  };

  /* --- encouragement with the student's name ---
     TQFX.person(slug, {en, ar, lang, url, keys})  who the student is (the corrector registers them; url = the name clip)
     TQFX.cheer('small'|'mid'|'big', slug, {lang})   (lang: used when the student is not in the list)
       small 👍 a short chime + sparkles · mid ⭐ chime, then «phrase» + «name» back to back, the line big on screen
       big 🏆 fanfare + phrase + name + a medal + confetti (end of class)
     The phrase never repeats twice in a row. No name clip → the phrase alone. Arabic students (lang 'ar'):
     the Arabic line on screen («ممتاز يا …!») and the sound effect only, never spoken (Mohamed 2026-11-12). */
  const PHRASES = [['excellent', 'Excellent', 'ممتاز'], ['great_job', 'Great job', 'شغل عظيم'], ['well_done', 'Well done', 'أحسنت'],
    ['masha_allah', 'MashaAllah', 'ما شاء الله'], ['beautiful_recitation', 'Beautiful recitation', 'تلاوة جميلة'], ['keep_going', 'Keep going', 'كمّل كده'], ['you_did_it', 'You did it', 'عملتها']];
  const LEVELS = {small: 1, mid: 1, big: 1};
  const PEOPLE = {};
  function person(slug, p){ if(!slug) return null; if(p === undefined) return PEOPLE[String(slug).toLowerCase()] || null;
    const o = Object.assign({}, PEOPLE[String(slug).toLowerCase()] || {}, p, {slug});
    [slug].concat(p && p.keys || []).forEach(k => { if(k) PEOPLE[String(k).toLowerCase()] = o; }); return o; }
  let lastPhrase = -1, showEl = null;
  function banner(icon, text, rtl, medal){
    try{ if(showEl) showEl.remove(); }catch(_){}
    const d = document.createElement('div'); showEl = d; d.dir = rtl ? 'rtl' : 'ltr';
    d.style.cssText = 'position:fixed;inset:0;z-index:2147483600;display:flex;align-items:center;justify-content:center;pointer-events:none';
    d.innerHTML = '<div style="max-width:min(900px,92vw);padding:24px 46px;border-radius:30px;background:linear-gradient(135deg,#fff7e0,#ffe7f1);border:4px solid #f3c969;box-shadow:0 20px 60px rgba(0,0,0,.28);text-align:center;font:800 clamp(30px,6vw,70px)/1.25 Cairo,\'Plus Jakarta Sans\',system-ui,sans-serif;color:#7a3d00">' +
      '<span style="display:block;font-size:.95em;margin-bottom:4px">' + icon + '</span></div>';
    d.firstChild.appendChild(document.createTextNode(text));
    if(medal){ const m = document.createElement('span'); m.textContent = '🏅'; m.style.cssText = 'display:block;font-size:1.3em;margin-top:6px'; d.firstChild.appendChild(m); }
    (document.body || document.documentElement).appendChild(d);
    if(d.animate) d.firstChild.animate([{transform: 'scale(.4)', opacity: 0}, {transform: 'scale(1.08)', opacity: 1, offset: .14}, {transform: 'scale(1)', offset: .22}, {opacity: 1, offset: .84}, {transform: 'scale(.96)', opacity: 0}], {duration: medal ? 3600 : 2800, easing: 'ease', fill: 'forwards'});
    setTimeout(() => { if(d.isConnected) d.remove(); }, medal ? 3700 : 2900);
  }
  function chain(urls){   // play the clips back to back: the next one starts as the last one ends (no gap)
    if(muted || !urls.length) return;
    const list = urls.map(u => { const a = new Audio(u); a.preload = 'auto'; return a; });
    let i = 0;
    const go = () => { const a = list[i]; if(!a) return; cur = a; lastVoice = Date.now();
      let next = false; const fire = () => { if(next) return; next = true; i++; go(); };
      a.ontimeupdate = () => { if(a.duration && a.currentTime >= a.duration - .08) fire(); };
      a.onended = fire; a.onerror = fire; a.play().catch(fire); };
    try{ if(cur) cur.pause(); }catch(_){}
    go();
  }
  function cheerName(level, slug, o){
    const p = person(slug) || null;
    const ar = p ? p.lang === 'ar' : (o && o.lang ? o.lang === 'ar' : isAr());   // not in the list: the caller's language
    const name = p ? (ar ? (p.ar || p.en) : (p.en || p.ar)) : '';
    if(level === 'small'){ if(!muted) SFX.ok(); burst(innerWidth / 2, innerHeight / 3, 22, 4, 3); return {level, name}; }
    let i; do{ i = Math.floor(Math.random() * PHRASES.length); }while(i === lastPhrase && PHRASES.length > 1); lastPhrase = i;
    const ph = PHRASES[i];
    const text = ar ? ph[2] + (name ? ' يا ' + name : '') + '!' : ph[1] + (name ? ', ' + name : '') + '!';
    banner(level === 'big' ? '🏆' : '⭐', text, ar, level === 'big');
    if(level === 'big'){ if(!muted) SFX.win(); for(let k = 0; k < 4; k++) setTimeout(() => burst(innerWidth * (.2 + .2 * k), innerHeight * .35, 45, 7, 6), k * 160); }
    else { if(!muted) SFX.ok(); burst(innerWidth / 2, innerHeight * .4, 40, 6, 5); }
    if(!ar) setTimeout(() => chain([voiceUrl(ph[0])].concat(p && p.url ? [p.url] : [])), level === 'big' ? 700 : 320);
    return {level, text, name, phrase: ph[0], spoken: !ar, nameClip: !ar && !!(p && p.url)};
  }
  /* small sound on/off button for any page that wants it: <button data-tq-sound></button> */
  function syncBtns(){ document.querySelectorAll('[data-tq-sound]').forEach(b => { b.textContent = muted ? '🔇' : '🔊'; b.title = muted ? 'Sound off · الصوت مقفول' : 'Sound on · الصوت شغال'; }); }
  document.addEventListener('click', e => { const b = e.target.closest && e.target.closest('[data-tq-sound]'); if(b){ K.setMuted(!muted); syncBtns(); } });
  document.addEventListener('DOMContentLoaded', syncBtns); syncBtns();
  window.TQFX = K;
})();
