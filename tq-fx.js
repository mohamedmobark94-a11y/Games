/* Tarteel lesson effects: sounds, a warm recorded voice, confetti, and Husary recitation.
   Used by lessons/ and hw/ pages:
     <script src="../tq-fx.js"></script>
     TQFX.ok(el)        right answer: chime + bounce + sparkle + a short praise ("Great job!")
     TQFX.bad(el)       wrong answer: soft "oops" sound + shake + "Oops! Try again."
     TQFX.win()         finished a game / the lesson: fanfare + confetti + "You did it!"
     TQFX.tap()         small click (cards, chips)        TQFX.whoosh()  page/station change
     TQFX.say(key)      play a recorded line: a bank key ('listen','repeat','alone', …) or a path under assets/voice/<voice>/
     TQFX.ayah(s, a)    Husary (al-Mushaf al-Mu'allim) from everyayah.com
     TQFX.muted / TQFX.setMuted(bool)   remembered per device (localStorage 'tq-sound')
   The voice is pre-recorded (tools/voice.py, Kokoro), never the browser's speech engine. */
(function(){
  const me = document.currentScript && document.currentScript.src;
  const ROOT = me ? me.replace(/tq-fx\.js.*$/, '') : '../';
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
  const SFX = {
    ok(){ [[784, 0], [988, .07], [1319, .14]].forEach(([f, t]) => { note(f, t, .28, 'triangle', .16); note(f * 2, t, .18, 'sine', .04); }); },
    bad(){ note(330, 0, .16, 'sine', .16, 300); note(262, .14, .32, 'sine', .16, 196); },
    win(){ [[523, 0], [659, .1], [784, .2], [1047, .32], [784, .46], [1047, .56]].forEach(([f, t], i) => note(f, t, i > 4 ? .6 : .2, 'triangle', .15)); },
    tap(){ note(1200, 0, .05, 'sine', .07); },
    whoosh(){ note(300, 0, .22, 'sine', .05, 900); }
  };

  /* --- recorded voice --- */
  function play(url, force){
    if(muted) return null;
    const now = Date.now(); if(!force && now - lastVoice < 1800) return null; lastVoice = now;
    try{ if(cur){ cur.pause(); } cur = new Audio(url); cur.play().catch(() => {}); return cur; }catch(_){ return null; }
  }
  const voiceUrl = k => ROOT + 'assets/voice/' + VOICE + '/' + k + '.mp3';
  function say(k, force){ const b = BANK[k]; return play(voiceUrl(b ? pick(b) : k), force !== false); }

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
    ok(el, quiet){ if(!muted) SFX.ok(); anim(el, 'pop'); const [x, y] = center(el); burst(x, y, 18, 4, 3); if(!quiet) setTimeout(() => say('ok', false), 250); },
    bad(el, quiet){ if(!muted) SFX.bad(); anim(el, 'shake'); if(!quiet) setTimeout(() => say('bad', false), 200); },
    win(quiet){ if(!muted) SFX.win(); for(let i = 0; i < 4; i++) setTimeout(() => burst(innerWidth * (.2 + .2 * i), innerHeight * .35, 45, 7, 6), i * 160); if(!quiet) setTimeout(() => say('win', true), 500); },
    tap(){ if(!muted) SFX.tap(); }, whoosh(){ if(!muted) SFX.whoosh(); },
    say, play: url => play(url, true), url: voiceUrl,
    ayah(s, a){ const f = String(s).padStart(3, '0') + String(a).padStart(3, '0') + '.mp3';
      const au = play('https://everyayah.com/data/Husary_Muallim_128kbps/' + f, true);
      if(au) au.onerror = () => play('https://everyayah.com/data/Husary_128kbps/' + f, true);   /* fallback: Husary murattal */
      return au; },
    stop(){ if(cur) cur.pause(); }
  };
  /* small sound on/off button for any page that wants it: <button data-tq-sound></button> */
  function syncBtns(){ document.querySelectorAll('[data-tq-sound]').forEach(b => { b.textContent = muted ? '🔇' : '🔊'; b.title = muted ? 'Sound off · الصوت مقفول' : 'Sound on · الصوت شغال'; }); }
  document.addEventListener('click', e => { const b = e.target.closest && e.target.closest('[data-tq-sound]'); if(b){ K.setMuted(!muted); syncBtns(); } });
  document.addEventListener('DOMContentLoaded', syncBtns); syncBtns();
  window.TQFX = K;
})();
