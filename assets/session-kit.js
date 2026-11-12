/* Session kit «🧰 إدارة الحصة»: classroom tools for live reading sessions (Quran, Noor Al-Bayan).
     <script src="…/tq-fx.js"></script>            (optional: chimes + confetti)
     <script src="…/assets/session-kit.js"></script>
     TQKit.float()     a floating panel, bottom-right, that folds to a small gold bar
     TQKit.mount(el)   the same cards inside el
   ⏱ Timer · 🚀 Repetitions (rocket to the moon) · ⭐ Stars · 💬 Encouragement (big message on screen +
   recorded voice) · 🎁 Surprise box. Language button: ع / EN (remembered on this device, 'tk-lang').
   The recorded voice is English only (Kokoro bm_george, assets/voice/george); in Arabic only a chime plays. */
(function(){
  const VOICE = 'https://mohamedmobark94-a11y.github.io/Games/assets/voice/george/';
  let LANG = 'ar'; try{ LANG = localStorage.getItem('tk-lang') || 'ar'; }catch(_){}
  const T = (ar, en) => LANG === 'en' ? en : ar;
  const css = `
.tk{font-family:'Cairo','Plus Jakarta Sans',system-ui,sans-serif;display:flex;flex-direction:column;gap:10px;color:#16241e;text-align:start}
.tk *{box-sizing:border-box}
.tk-c{background:#fff;border:1px solid #e3ece7;border-radius:14px;padding:11px 13px;box-shadow:0 1px 3px rgba(16,40,30,.06)}
.tk-h{display:flex;align-items:center;justify-content:space-between;gap:6px;margin-bottom:6px;cursor:pointer}
.tk-h b{font-size:15px;color:#0e4d3c}
.tk-fold{border:0;background:none;cursor:pointer;font-size:12px;color:#6b7d74;padding:0 4px}
.tk-c.off .tk-b{display:none}.tk-c.off .tk-h{margin:0}
.tk-ring{position:relative;width:132px;height:132px;margin:2px auto 6px}
.tk-ring svg{width:100%;height:100%;transform:rotate(-90deg)}
.tk-ring .t{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center}
.tk-ring .t b{font:800 30px 'Plus Jakarta Sans',sans-serif;color:#0e4d3c;direction:ltr}
.tk-ring .t span{font-size:11px;color:#6b7d74;font-weight:700}
.tk-ring.end .t b{color:#b42318}
.tk-chips{display:flex;flex-wrap:wrap;gap:5px;justify-content:center;margin-bottom:7px}
.tk-chips button{min-width:40px;min-height:30px;border:1.5px solid #e3ece7;border-radius:99px;background:#fff;font:700 12.5px 'Cairo',sans-serif;color:#16241e;cursor:pointer;padding:0 8px}
.tk-chips button.on{background:#177a5b;border-color:#177a5b;color:#fff}
.tk-row{display:grid;grid-template-columns:1fr 1fr;gap:7px}
.tk-row.three{grid-template-columns:auto 1fr auto}
.tk-btn{min-height:40px;border:0;border-radius:11px;background:#177a5b;color:#fff;font:800 14px 'Cairo',sans-serif;cursor:pointer;padding:0 10px}
.tk-btn.gold{background:#c99a3f}.tk-btn.pale{background:#fff;color:#0e4d3c;border:1.5px solid #e3ece7}
.tk-btn:active,.tk-cheer button:active{transform:scale(.96)}
.tk-sky{position:relative;height:74px;border-radius:12px;background:linear-gradient(180deg,#14213d,#2b3a67);overflow:hidden;margin:4px 0 6px;direction:ltr}
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
.tk-stars{display:flex;justify-content:center;gap:4px;margin:4px 0 6px;direction:ltr}
.tk-stars button{border:0;background:none;cursor:pointer;padding:0;width:36px;height:36px}
.tk-stars svg{width:100%;height:100%}
.tk-stars .on path{fill:#f5b301;stroke:#d48c00}
.tk-stars path{fill:#e6ece9;stroke:#cfd8d3;stroke-width:1.5;transition:fill .2s}
.tk-stars .pop{animation:tkpop .45s}
@keyframes tkpop{40%{transform:scale(1.35) rotate(-8deg)}}
.tk-sel{height:30px;border:1.5px solid #e3ece7;border-radius:8px;font:700 13px 'Cairo',sans-serif;color:#16241e;background:#fff}
.tk-tabs{display:flex;gap:4px;margin-bottom:7px}
.tk-tabs button{flex:1;min-height:30px;border:0;border-radius:9px;background:#eef6f1;color:#0e4d3c;font:800 12.5px 'Cairo',sans-serif;cursor:pointer}
.tk-tabs button.on{background:#0e4d3c;color:#fff}
.tk-cheer{display:grid;grid-template-columns:1fr 1fr;gap:6px}
.tk-cheer button{min-height:44px;border:1.5px solid #f1e2bf;border-radius:11px;background:#fffaf0;color:#5c4409;font:700 13px/1.25 'Cairo',sans-serif;cursor:pointer;padding:4px 6px}
.tk-cheer button:hover{border-color:#c99a3f}
.tk-cheer button i{font-style:normal;display:block;font-size:18px}
.tk-opt{display:flex;align-items:center;gap:6px;justify-content:center;margin-top:8px;font-size:12px;color:#6b7d74;font-weight:700}
.tk-opt input{width:16px;height:16px;accent-color:#177a5b}
.tk-box{display:block;margin:2px auto 8px;width:96px;height:96px;border:0;background:none;cursor:pointer;padding:0}
.tk-box svg{width:100%;height:100%}
.tk-box.shake{animation:tkshake .6s}
@keyframes tkshake{20%,60%{transform:rotate(-9deg)}40%,80%{transform:rotate(9deg)}}
.tk-prize{text-align:center;font:800 15px 'Cairo',sans-serif;color:#7c2d92;min-height:22px}
.tk-float{position:fixed;right:14px;bottom:14px;width:268px;max-height:calc(100vh - 28px);overflow:auto;z-index:2147482500;background:#f5f3ec;border:1px solid #cfe3d8;border-radius:16px;box-shadow:0 12px 40px rgba(0,0,0,.18);padding:0 8px 8px}
.tk-fh{position:sticky;top:0;z-index:2;display:flex;align-items:center;gap:8px;margin:0 -8px 8px;padding:7px 10px;background:#c99a3f;color:#fff;border-radius:16px 16px 0 0;font:800 14px 'Cairo',sans-serif}
.tk-fh span{flex:1;cursor:pointer}
.tk-fh button{border:0;border-radius:8px;background:rgba(255,255,255,.2);color:#fff;font:800 12.5px 'Cairo',sans-serif;cursor:pointer;padding:3px 9px}
.tk-float.min{width:auto;padding:0}.tk-float.min .tk-fh{margin:0;border-radius:16px}.tk-float.min .tk{display:none}
.tk-show{position:fixed;inset:0;z-index:2147483600;display:flex;align-items:center;justify-content:center;pointer-events:none}
.tk-show div{max-width:min(860px,90vw);padding:26px 44px;border-radius:30px;background:linear-gradient(135deg,#fff7e0,#ffe7f1);border:4px solid #f3c969;box-shadow:0 20px 60px rgba(0,0,0,.28);text-align:center;font:800 clamp(30px,6vw,68px)/1.25 'Cairo','Plus Jakarta Sans',sans-serif;color:#7a3d00;animation:tkin 2.6s ease forwards}
.tk-show i{display:block;font-style:normal;font-size:.9em;margin-bottom:6px}
@keyframes tkin{0%{transform:scale(.4);opacity:0}12%{transform:scale(1.08);opacity:1}20%{transform:scale(1)}82%{opacity:1}100%{opacity:0;transform:scale(.96)}}
`;
  const fx = (k, el) => { try{ if(window.TQFX && TQFX[k]) TQFX[k](el); }catch(_){} };
  let ac = null;
  function bells(fr){ try{ ac = ac || new (window.AudioContext || window.webkitAudioContext)(); if(ac.state === 'suspended') ac.resume();
      (fr || [880, 988, 1318]).forEach((f, i) => { const t = i * .35, o = ac.createOscillator(), g = ac.createGain(); o.frequency.value = f;
        g.gain.setValueAtTime(.0001, ac.currentTime + t); g.gain.exponentialRampToValueAtTime(.22, ac.currentTime + t + .02);
        g.gain.exponentialRampToValueAtTime(.0001, ac.currentTime + t + .9); o.connect(g).connect(ac.destination); o.start(ac.currentTime + t); o.stop(ac.currentTime + t + 1); });
    }catch(_){} }
  let voiceOn = true; try{ voiceOn = localStorage.getItem('tk-voice') !== 'off'; }catch(_){}
  let cur = null;
  function speak(key){ // English recorded voice; a chime when it is off, in Arabic, or the file cannot play
    if(!voiceOn || LANG !== 'en'){ bells([784, 1046]); return; }
    try{ if(cur) cur.pause(); cur = new Audio(VOICE + key + '.mp3'); cur.play().catch(() => bells([784, 1046])); }catch(_){ bells([784, 1046]); }
  }
  function show(icon, text){ // the big message the student sees on the shared screen
    const old = document.querySelector('.tk-show'); if(old) old.remove();
    const d = document.createElement('div'); d.className = 'tk-show'; d.dir = LANG === 'en' ? 'ltr' : 'rtl';
    d.innerHTML = '<div><i>' + icon + '</i>' + text + '</div>'; document.body.appendChild(d);
    setTimeout(() => d.remove(), 2700);
  }

  /* encouragement lines: [icon, arabic, english, voice file] */
  const CHEER = {
    praise: [['🌟', 'قراءة جميلة!', 'Beautiful reading!', 'beautiful_reading'], ['💛', 'ما شاء الله!', 'Masha Allah!', 'masha_allah'],
             ['⭐', 'أنت نجم!', 'You are a superstar!', 'superstar'], ['🤍', 'أنا فخور بيك', 'I am so proud of you', 'proud_of_you'],
             ['📈', 'تحسّن كبير!', 'Much better!', 'big_improvement'], ['🤲', 'بارك الله فيك', 'Barakallahu feek!', 'barakallah'],
             ['🏆', 'ممتاز!', 'Excellent!', 'excellent'], ['✅', 'صح كده!', "That's right!", 'thats_right']],
    push:   [['💪', 'كمّل، أنت ماشي حلو', 'Keep going!', 'keep_going'], ['🚀', 'تقدر تعملها!', 'You can do it!', 'you_can_do_it'],
             ['🎯', 'قرّبت! مرة كمان', 'Almost there! One more time', 'almost_there'], ['🙂', 'محاولة حلوة! نعيدها سوا', "Nice try! Let's do it again", 'nice_try'],
             ['🔁', 'تقريبًا! جرّب تاني', 'Almost! Try once more', 'almost'], ['👀', 'بُصّ تاني كويس', 'Look again', 'look_again']],
    focus:  [['▶️', 'جاهز؟ يلا نبدأ', "Ready? Let's start", 'ready_start'], ['👁️', 'عينك على الصفحة', 'Eyes on the page', 'eyes_on_page'],
             ['🐢', 'بالراحة وبتركيز', 'Slowly and carefully', 'slowly'], ['🌬️', 'خد نفس عميق', 'Take a deep breath', 'deep_breath'],
             ['👂', 'ركّز واسمع', 'Focus and listen', 'focus_listen'], ['🎧', 'اسمع كويس', 'Listen carefully', 'listen_carefully'],
             ['🗣️', 'ردّد ورايا', 'Repeat after me', 'repeat_after_me'], ['📖', 'اقرا لوحدك', 'Now read alone', 'read_alone']]
  };
  const PRIZES = [['⭐', 'نجمة ذهبية!', 'A golden star!'], ['🎨', 'تختار لون القلم', 'You pick the pen colour'], ['🎵', 'تختار القارئ اللي نسمعه', 'You pick the reciter'],
    ['👑', 'أنت المعلم دقيقة!', 'You are the teacher for one minute!'], ['🏅', 'وسام القارئ المتميز', 'Star reader badge'], ['🎮', 'لعبة في آخر الحصة', 'A game at the end of class'],
    ['📣', 'رسالة حلوة لماما وبابا', 'A happy note to your parents'], ['🖍️', 'ترسم رسمة على السبورة', 'Draw on the board']];

  const STAR = '<svg viewBox="0 0 24 24"><path d="M12 2.6l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.4l-5.8 3.1 1.1-6.5L2.6 9.4l6.5-.9z"/></svg>';
  const ROCKET = '<svg viewBox="0 0 64 64"><g transform="rotate(90 32 32)"><path d="M32 4c10 8 14 20 12 34H20C18 24 22 12 32 4z" fill="#f1f5f9" stroke="#94a3b8" stroke-width="2"/><circle cx="32" cy="24" r="6" fill="#38bdf8" stroke="#0369a1" stroke-width="2"/><path d="M20 38l-8 10 10-2zM44 38l8 10-10-2z" fill="#ef4444"/><path d="M26 40h12l-6 16z" fill="#f59e0b"/><path d="M29 42h6l-3 8z" fill="#fde047"/></g></svg>';
  const BOX = '<svg viewBox="0 0 100 100"><rect x="14" y="44" width="72" height="46" rx="7" fill="#a855f7"/><rect x="44" y="44" width="12" height="46" fill="#fde047"/><rect x="8" y="30" width="84" height="18" rx="6" fill="#c084fc"/><rect x="44" y="30" width="12" height="18" fill="#facc15"/><path d="M50 30c-10-16-26-14-22-4 3 6 22 4 22 4zM50 30c10-16 26-14 22-4-3 6-22 4-22 4z" fill="#facc15" stroke="#ca8a04" stroke-width="2"/></svg>';

  const state = {len: 60, left: 60, up: false, n: 0, target: 3, s: 0, tab: 'praise', prize: ''};
  let run = null, last = 0, W = null;

  function html(){
    const fold = k => { let o = false; try{ o = !!localStorage.getItem('tk-off-' + k); }catch(_){} return o; };
    const card = (k, title, body) => '<div class="tk-c' + (fold(k) ? ' off' : '') + '" data-k="' + k + '"><div class="tk-h"><b>' + title + '</b><button class="tk-fold">' + (fold(k) ? '▸' : '▾') + '</button></div><div class="tk-b">' + body + '</div></div>';
    const lens = [[30, T('30ث', '30s')], [60, T('1د', '1m')], [90, T('1.5د', '1.5m')], [120, T('2د', '2m')], [180, T('3د', '3m')], [300, T('5د', '5m')]];
    return card('cheer', T('💬 التشجيع', '💬 Encourage'),
        '<div class="tk-tabs">' + [['praise', T('مدح', 'Praise')], ['push', T('تحفيز', 'Push')], ['focus', T('تركيز', 'Focus')]].map(x => '<button data-tab="' + x[0] + '"' + (state.tab === x[0] ? ' class="on"' : '') + '>' + x[1] + '</button>').join('') + '</div>' +
        '<div class="tk-cheer">' + CHEER[state.tab].map((c, i) => '<button data-ch="' + i + '"><i>' + c[0] + '</i>' + T(c[1], c[2]) + '</button>').join('') + '</div>' +
        '<label class="tk-opt"><input type="checkbox" id="tkVoice"' + (voiceOn ? ' checked' : '') + '> ' + T('صوت إنجليزي (في وضع EN)', 'English voice') + '</label>') +
      card('timer', T('⏱ المؤقّت', '⏱ Timer'),
        '<div class="tk-ring"><svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="52" fill="none" stroke="#e9f5ef" stroke-width="10"/><circle id="tkArc" cx="60" cy="60" r="52" fill="none" stroke="#177a5b" stroke-width="10" stroke-linecap="round" stroke-dasharray="326.7" stroke-dashoffset="0"/></svg>' +
        '<div class="t"><b id="tkTime">01:00</b><span id="tkLbl">' + T('جاهز', 'Ready') + '</span></div></div>' +
        '<div class="tk-chips" id="tkLen">' + lens.map(x => '<button data-s="' + x[0] + '"' + (!state.up && x[0] === state.len ? ' class="on"' : '') + '>' + x[1] + '</button>').join('') +
        '<button data-s="up"' + (state.up ? ' class="on"' : '') + '>⏲ ' + T('عدّاد', 'Stopwatch') + '</button></div>' +
        '<div class="tk-row"><button class="tk-btn" id="tkGo">▶ ' + T('ابدأ', 'Start') + '</button><button class="tk-btn pale" id="tkReset">↺ ' + T('من الأول', 'Reset') + '</button></div>') +
      card('reps', T('🚀 رحلة للقمر · التكرار', '🚀 Journey to the moon'),
        '<div class="tk-sky" id="tkSky"><div class="tk-path"></div><div class="tk-moon"></div><div class="tk-rocket" id="tkRocket">' + ROCKET + '</div></div>' +
        '<div class="tk-cnt">' + T('قرأ', 'Read') + ' <b id="tkN">0</b> ' + T('من', 'of') + ' <select class="tk-sel" id="tkTarget">' + [2, 3, 4, 5, 6, 7, 10].map(n => '<option' + (n === state.target ? ' selected' : '') + '>' + n + '</option>').join('') + '</select> ' + T('مرات', 'times') + '</div>' +
        '<div class="tk-row three"><button class="tk-btn pale" id="tkRepUndo">−</button><button class="tk-btn gold" id="tkRepAdd">✓ ' + T('قرأها كمان مرة', 'One more time') + '</button><button class="tk-btn pale" id="tkRepReset">↺</button></div>') +
      card('stars', T('⭐ النجوم', '⭐ Stars'),
        '<div class="tk-stars" id="tkStars">' + [1, 2, 3, 4, 5].map(i => '<button data-i="' + i + '">' + STAR + '</button>').join('') + '</div>' +
        '<div class="tk-cnt"><b id="tkSN">0</b> / 5 ' + T('نجوم', 'stars') + '</div>' +
        '<div class="tk-row"><button class="tk-btn pale" id="tkSUndo">− ' + T('تراجع', 'Undo') + '</button><button class="tk-btn gold" id="tkSAdd">+ ' + T('نجمة', 'Star') + '</button></div>') +
      card('box', T('🎁 صندوق المفاجأة', '🎁 Surprise box'),
        '<button class="tk-box" id="tkBox" title="' + T('افتح', 'Open') + '">' + BOX + '</button><div class="tk-prize" id="tkPrize">' + (state.prize || T('دوس على الصندوق', 'Tap the box')) + '</div>');
  }

  function wire(w){
    const $ = id => w.querySelector('#' + id);
    w.querySelectorAll('.tk-h').forEach(h => h.onclick = () => { const c = h.closest('.tk-c'); c.classList.toggle('off'); h.querySelector('.tk-fold').textContent = c.classList.contains('off') ? '▸' : '▾';
      try{ localStorage.setItem('tk-off-' + c.dataset.k, c.classList.contains('off') ? '1' : ''); }catch(_){} });
    /* encouragement */
    w.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => { state.tab = b.dataset.tab; render(); });
    w.querySelectorAll('[data-ch]').forEach(b => b.onclick = () => { const c = CHEER[state.tab][+b.dataset.ch]; show(c[0], T(c[1], c[2])); speak(c[3]); if(state.tab === 'praise') fx('win'); });
    $('tkVoice').onchange = e => { voiceOn = e.target.checked; try{ localStorage.setItem('tk-voice', voiceOn ? '' : 'off'); }catch(_){} };
    /* timer */
    const fmt = s => { s = Math.max(0, Math.floor(state.up ? s : Math.ceil(s))); return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); };
    const paint = () => { $('tkTime').textContent = fmt(state.left); $('tkArc').style.strokeDashoffset = state.up ? 0 : (326.7 * (1 - state.left / state.len)).toFixed(1);
      $('tkArc').style.stroke = state.up ? '#c99a3f' : state.left <= 10 ? '#b42318' : '#177a5b'; };
    const stop = () => { if(run){ cancelAnimationFrame(run); run = null; } $('tkGo').textContent = '▶ ' + T('ابدأ', 'Start'); };
    const tick = t => { const d = (t - last) / 1000; last = t;
      if(state.up) state.left += d; else { state.left -= d; if(state.left <= 0){ state.left = 0; paint(); stop(); w.querySelector('.tk-ring').classList.add('end'); $('tkLbl').textContent = T('خلص الوقت', 'Time is up'); bells(); show('⏰', T('خلص الوقت!', 'Time is up!')); return; } }
      paint(); run = requestAnimationFrame(tick); };
    const go = () => { if(!state.up && state.left <= 0) state.left = state.len; w.querySelector('.tk-ring').classList.remove('end');
      last = performance.now(); run = requestAnimationFrame(tick); $('tkGo').textContent = '⏸ ' + T('وقّف', 'Pause'); $('tkLbl').textContent = state.up ? T('بيعدّ', 'Counting') : T('شغّال', 'Go!'); };
    $('tkGo').onclick = () => { if(run){ stop(); $('tkGo').textContent = '▶ ' + T('كمّل', 'Resume'); $('tkLbl').textContent = T('واقف', 'Paused'); return; } go(); fx('tap'); };
    $('tkReset').onclick = () => { stop(); state.left = state.up ? 0 : state.len; w.querySelector('.tk-ring').classList.remove('end'); $('tkLbl').textContent = T('جاهز', 'Ready'); paint(); };
    $('tkLen').onclick = e => { const b = e.target.closest('button'); if(!b) return; $('tkLen').querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b));
      state.up = b.dataset.s === 'up'; if(!state.up) state.len = +b.dataset.s; $('tkReset').onclick(); };
    if(run){ cancelAnimationFrame(run); run = null; go(); } else paint();
    /* repetitions: the rocket hops one dot per reading and lands on the moon at the target */
    const sky = $('tkSky');
    sky.insertAdjacentHTML('afterbegin', Array.from({length: 14}, (_, i) => '<i style="left:' + ((i * 37) % 100) + '%;top:' + ((i * 53) % 100) + '%"></i>').join(''));
    const drawReps = won => { const T0 = state.target;
      sky.querySelectorAll('.tk-dot').forEach(d => d.remove());
      for(let i = 1; i < T0; i++){ const d = document.createElement('span'); d.className = 'tk-dot' + (i <= state.n ? ' on' : ''); d.style.left = 'calc(34px + (100% - 78px) * ' + (i / T0) + ')'; sky.appendChild(d); }
      $('tkRocket').style.left = 'calc(34px + (100% - 78px) * ' + Math.min(1, state.n / T0) + ')';
      $('tkN').textContent = state.n; sky.classList.toggle('won', !!won); };
    $('tkRepAdd').onclick = () => { if(state.n >= state.target) return; state.n++; const won = state.n === state.target; drawReps(won);
      if(won){ fx('win'); show('🌙', T('وصلت القمر!', 'You reached the moon!')); speak('you_did_it'); } else fx('ok', $('tkRocket')); };
    $('tkRepUndo').onclick = () => { if(state.n > 0){ state.n--; drawReps(); fx('tap'); } };
    $('tkRepReset').onclick = () => { state.n = 0; drawReps(); fx('whoosh'); };
    $('tkTarget').onchange = e => { state.target = +e.target.value; state.n = Math.min(state.n, state.target); drawReps(); };
    drawReps();
    /* stars */
    const drawStars = pop => { w.querySelectorAll('#tkStars button').forEach(b => { const i = +b.dataset.i; b.classList.toggle('on', i <= state.s); b.classList.toggle('pop', i === pop); }); $('tkSN').textContent = state.s; };
    const setS = v => { const old = state.s; state.s = Math.max(0, Math.min(5, v)); drawStars(state.s > old ? state.s : 0);
      if(state.s > old){ if(state.s === 5){ fx('win'); show('⭐⭐⭐⭐⭐', T('خمس نجوم!', 'Five stars!')); speak('amazing_work'); } else fx('ok', $('tkStars')); } };
    $('tkStars').onclick = e => { const b = e.target.closest('button'); if(b) setS(+b.dataset.i === state.s ? state.s - 1 : +b.dataset.i); };
    $('tkSAdd').onclick = () => setS(state.s + 1); $('tkSUndo').onclick = () => setS(state.s - 1);
    drawStars();
    /* surprise box */
    $('tkBox').onclick = () => { const b = $('tkBox'); b.classList.remove('shake'); void b.offsetWidth; b.classList.add('shake'); fx('tap');
      setTimeout(() => { const p = PRIZES[Math.floor(Math.random() * PRIZES.length)]; state.prize = p[0] + ' ' + T(p[1], p[2]); $('tkPrize').textContent = state.prize;
        fx('win'); show(p[0], T(p[1], p[2])); speak('reward_time'); }, 650); };
  }

  function render(){ if(!W) return; const keep = W.scrollTop; W.innerHTML = html(); W.dir = LANG === 'en' ? 'ltr' : 'rtl'; wire(W); W.scrollTop = keep;
    const lb = document.getElementById('tkLangB'); if(lb) lb.textContent = LANG === 'en' ? 'ع' : 'EN';
    const tt = document.getElementById('tkTitle'); if(tt) tt.textContent = '🧰 ' + T('إدارة الحصة', 'Class tools'); }
  function setLang(l){ LANG = l === 'en' ? 'en' : 'ar'; try{ localStorage.setItem('tk-lang', LANG); }catch(_){} render(); }

  function mount(host){
    if(!host || host.querySelector('.tk')) return;
    if(!document.getElementById('tk-css')){ const s = document.createElement('style'); s.id = 'tk-css'; s.textContent = css; document.head.appendChild(s); }
    W = document.createElement('div'); W.className = 'tk'; host.appendChild(W); render();
  }
  /* a floating panel (bottom-right): title folds it, ع/EN switches the language */
  function float(){
    if(document.getElementById('tkFloat')) return;
    const f = document.createElement('div'); f.id = 'tkFloat'; f.className = 'tk-float'; f.dir = 'rtl';
    f.innerHTML = '<div class="tk-fh"><span id="tkTitle" title="صغّر / كبّر · Fold"></span><button id="tkTlB" title="إشارة المرور (G / Y / R) · Traffic light">🚦</button><button id="tkLangB" title="اللغة · Language"></button><button id="tkMin" title="صغّر · Fold">—</button></div>';
    document.body.appendChild(f); mount(f);
    const set = m => { f.classList.toggle('min', m); f.querySelector('#tkMin').textContent = m ? '▢' : '—'; try{ localStorage.setItem('tk-min', m ? '1' : ''); }catch(_){} };
    f.querySelector('#tkTitle').onclick = f.querySelector('#tkMin').onclick = () => set(!f.classList.contains('min'));
    f.querySelector('#tkLangB').onclick = () => setLang(LANG === 'en' ? 'ar' : 'en');
    f.querySelector('#tkTlB').onclick = toggleLight;
    try{ if(localStorage.getItem('tk-min')) set(true); }catch(_){}
    render();
    let off = false; try{ off = !!localStorage.getItem('tk-tl-off'); }catch(_){}
    if(!off) light(); syncTlBtn();
  }
  /* ---------- 🚦 traffic light: a signal the student sees on the shared screen ----------
     TQKit.light()                  shows it (float() does this too); draggable, its place is remembered
     TQKit.signal('green'|'yellow'|'red'|'off', {hold, count})
                                    hold: stays on until signal('off') (the corrector's «سجّل غلطة» / F8)
     TQKit.unsignal('red')          takes one back (a cancelled mistake)
     TQKit.student(name, key)       a new student (or a new day) starts the counter from zero
     TQKit.signals()                {green, yellow, red} this session → the report's data.signals
     TQKit.onSignals(fn)            fn({green, yellow, red, name, key, date}) after every change
     Keys G / Y / R (also ل / غ / ق on an Arabic keyboard), never while typing in a box. */
  const tlCss = `
.tk-tl{position:fixed;z-index:2147482600;display:flex;flex-direction:column;align-items:center;gap:6px;padding:9px 8px 7px;border-radius:26px;background:#1d2724;border:3px solid #3a4a44;box-shadow:0 10px 30px rgba(0,0,0,.3);cursor:grab;user-select:none;touch-action:none;font-family:'Cairo','Plus Jakarta Sans',system-ui,sans-serif;direction:ltr}
.tk-tl.drag{cursor:grabbing}
.tk-tl i{display:block;width:70px;height:70px;border-radius:50%;background:#4b5753;box-shadow:inset 0 -6px 12px rgba(0,0,0,.35);transition:background .15s,box-shadow .15s,transform .15s;cursor:pointer}
.tk-tl i.g.on{background:radial-gradient(circle at 38% 35%,#b9ffc9,#22c55e 55%,#13803d);box-shadow:0 0 34px 8px rgba(34,197,94,.75)}
.tk-tl i.y.on{background:radial-gradient(circle at 38% 35%,#fff3b0,#facc15 55%,#c79200);box-shadow:0 0 34px 8px rgba(250,204,21,.7);animation:tkpulse .6s ease-in-out infinite alternate}
.tk-tl i.r.on{background:radial-gradient(circle at 38% 35%,#ffc4c4,#ef4444 55%,#a31414);box-shadow:0 0 34px 8px rgba(239,68,68,.75)}
.tk-tl i.on{transform:scale(1.06)}
@keyframes tkpulse{to{transform:scale(.94);filter:brightness(1.15)}}
.tk-tl.shake{animation:tkjolt .45s}
@keyframes tkjolt{20%{transform:translateX(-6px)}40%{transform:translateX(6px)}60%{transform:translateX(-4px)}80%{transform:translateX(3px)}}
.tk-tl b{display:flex;gap:7px;font:800 12px/1 'Plus Jakarta Sans',sans-serif;color:#e8efe9;padding:2px 2px 0}
.tk-tl b span{display:flex;align-items:center;gap:2px}
.tk-tl b em{font-style:normal;width:8px;height:8px;border-radius:50%;display:inline-block}
.tk-tl .x{position:absolute;top:-9px;right:-9px;width:22px;height:22px;border-radius:50%;border:0;background:#fff;color:#1d2724;font:800 12px/22px sans-serif;cursor:pointer;box-shadow:0 2px 6px rgba(0,0,0,.3);display:none;padding:0}
.tk-tl:hover .x{display:block}
.tk-flash{position:fixed;inset:0;pointer-events:none;z-index:2147482590;animation:tkflash .7s ease-out forwards}
@keyframes tkflash{0%{opacity:0}15%{opacity:1}100%{opacity:0}}
`;
  const SIG_COL = {green: ['g', '#22c55e', 'rgba(34,197,94,.55)'], yellow: ['y', '#facc15', 'rgba(250,204,21,.5)'], red: ['r', '#ef4444', 'rgba(239,68,68,.55)']};
  const day = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  let sig = {date: day(), name: '', key: '', green: 0, yellow: 0, red: 0};
  try{ const s = JSON.parse(localStorage.getItem('tk-sig') || 'null'); if(s && s.date === day()) sig = Object.assign(sig, s); }catch(_){}
  let TL = null, tlTimer = null, held = false, greenRun = 0;
  const sigFns = [];
  const quiet = () => { try{ return !!(window.TQFX && TQFX.muted); }catch(_){ return false; } };
  function tones(list, type){ if(quiet()) return; try{ ac = ac || new (window.AudioContext || window.webkitAudioContext)(); if(ac.state === 'suspended') ac.resume();
      list.forEach(([f, t, d, v, to]) => { const o = ac.createOscillator(), g = ac.createGain(), at = ac.currentTime + t; o.type = type || 'sine'; o.frequency.setValueAtTime(f, at);
        if(to) o.frequency.exponentialRampToValueAtTime(to, at + d); g.gain.setValueAtTime(.0001, at); g.gain.exponentialRampToValueAtTime(v || .18, at + .02);
        g.gain.exponentialRampToValueAtTime(.0001, at + d); o.connect(g).connect(ac.destination); o.start(at); o.stop(at + d + .05); });
    }catch(_){} }
  const SIG_SND = {
    green: () => tones([[659, 0, .16, .16], [880, .1, .16, .16], [1175, .2, .32, .14]], 'triangle'),        // short rising chime
    yellow: () => tones([[587, 0, .22, .13], [587, .28, .3, .11]], 'sine'),                                   // neutral double tone
    red: () => tones([[494, 0, .3, .12, 440], [392, .26, .45, .11, 370]], 'sine')                              // calm low alert, not a buzzer
  };
  const saveSig = () => { try{ localStorage.setItem('tk-sig', JSON.stringify(sig)); }catch(_){} paintCount(); const o = signals(); o.name = sig.name; o.key = sig.key; o.date = sig.date; sigFns.forEach(f => { try{ f(o); }catch(_){} }); };
  const signals = () => ({green: sig.green, yellow: sig.yellow, red: sig.red});
  function paintCount(){ if(!TL) return; const b = TL.querySelector('b'); if(b) b.innerHTML = ['green', 'yellow', 'red'].map(k => '<span><em style="background:' + SIG_COL[k][1] + '"></em>' + sig[k] + '</span>').join(''); }
  function setOn(c){ if(!TL) return; TL.querySelectorAll('i').forEach(i => i.classList.toggle('on', !!c && i.classList.contains(SIG_COL[c][0]))); }
  function signal(c, o){
    o = o || {}; light();
    if(sig.date !== day()){ sig = {date: day(), name: sig.name, key: sig.key, green: 0, yellow: 0, red: 0}; }
    clearTimeout(tlTimer);
    if(!SIG_COL[c]){ held = false; setOn(null); return; }
    held = !!o.hold; setOn(c);
    if(o.count !== false){ sig[c]++; saveSig(); }
    greenRun = c === 'green' ? greenRun + 1 : 0;
    if(SIG_SND[c]) SIG_SND[c]();
    if(!matchMedia('(prefers-reduced-motion: reduce)').matches){
      const f = document.createElement('div'); f.className = 'tk-flash'; f.style.boxShadow = 'inset 0 0 0 14px ' + SIG_COL[c][2] + ',inset 0 0 90px 30px ' + SIG_COL[c][2]; document.body.appendChild(f); setTimeout(() => f.remove(), 800);
      if(c === 'red'){ TL.classList.remove('shake'); void TL.offsetWidth; TL.classList.add('shake'); }
    }
    if(c === 'green' && greenRun === 5){ greenRun = 0; document.dispatchEvent(new CustomEvent('tk-streak', {detail: {name: sig.name, key: sig.key}})); }
    if(!held){ let sec = 2.5; try{ sec = +localStorage.getItem('tk-tl-sec') || 2.5; }catch(_){} tlTimer = setTimeout(() => setOn(null), sec * 1000); }
  }
  function unsignal(c){ if(SIG_COL[c] && sig[c] > 0){ sig[c]--; saveSig(); } if(held){ held = false; setOn(null); } }
  function student(name, key){ name = String(name || '').trim(); key = String(key || '').trim();
    if(name === sig.name && sig.date === day()){ if(key && key !== sig.key){ sig.key = key; saveSig(); } return; }
    sig = {date: day(), name, key, green: 0, yellow: 0, red: 0}; greenRun = 0; saveSig(); }
  function light(show){
    if(TL){ if(show === false){ TL.remove(); TL = null; } return TL; }
    if(show === false) return null;
    if(!document.getElementById('tk-tl-css')){ const s = document.createElement('style'); s.id = 'tk-tl-css'; s.textContent = tlCss; (document.head || document.documentElement).appendChild(s); }
    TL = document.createElement('div'); TL.className = 'tk-tl'; TL.id = 'tkLight'; TL.title = 'G أخضر · Y أصفر · R أحمر — اسحبها لأي مكان';
    TL.innerHTML = '<button class="x" title="اخفي الإشارة (ترجع من زر 🚦)">✕</button><i class="r" data-c="red"></i><i class="y" data-c="yellow"></i><i class="g" data-c="green"></i><b></b>';
    let pos = null; try{ pos = JSON.parse(localStorage.getItem('tk-tl-pos') || 'null'); }catch(_){}
    const place = p => { const w = TL.offsetWidth || 92, h = TL.offsetHeight || 260; TL.style.left = Math.max(0, Math.min(innerWidth - w, p.x)) + 'px'; TL.style.top = Math.max(0, Math.min(innerHeight - h, p.y)) + 'px'; };
    document.body.appendChild(TL); place(pos || {x: 16, y: 90}); paintCount();
    addEventListener('resize', () => { if(TL) place({x: TL.offsetLeft, y: TL.offsetTop}); });
    let d = null;
    TL.addEventListener('pointerdown', e => { if(e.target.closest('.x')) return; d = {x: e.clientX, y: e.clientY, l: TL.offsetLeft, t: TL.offsetTop, moved: false, el: e.target}; TL.setPointerCapture(e.pointerId); });
    TL.addEventListener('pointermove', e => { if(!d) return; const dx = e.clientX - d.x, dy = e.clientY - d.y; if(!d.moved && Math.abs(dx) + Math.abs(dy) < 5) return; d.moved = true; TL.classList.add('drag'); place({x: d.l + dx, y: d.t + dy}); });
    TL.addEventListener('pointerup', () => { if(!d) return; const g = d; d = null; TL.classList.remove('drag');
      if(g.moved){ try{ localStorage.setItem('tk-tl-pos', JSON.stringify({x: TL.offsetLeft, y: TL.offsetTop})); }catch(_){} return; }
      const c = g.el.closest && g.el.closest('[data-c]'); if(c) signal(c.dataset.c); });
    TL.querySelector('.x').onclick = () => { try{ localStorage.setItem('tk-tl-off', '1'); }catch(_){} light(false); syncTlBtn(); };
    return TL;
  }
  function syncTlBtn(){ const b = document.getElementById('tkTlB'); if(b) b.style.opacity = TL ? '1' : '.55'; }
  function toggleLight(){ const on = !TL; try{ localStorage.setItem('tk-tl-off', on ? '' : '1'); }catch(_){} light(on); syncTlBtn(); }
  const SIG_KEYS = {g: 'green', 'ل': 'green', y: 'yellow', 'غ': 'yellow', r: 'red', 'ق': 'red'};
  document.addEventListener('keydown', e => {
    if(e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
    const c = SIG_KEYS[String(e.key).toLowerCase()]; if(!c) return;
    const typing = (e.composedPath ? e.composedPath() : [e.target]).some(n => n && (n.tagName === 'INPUT' || n.tagName === 'TEXTAREA' || n.tagName === 'SELECT' || n.isContentEditable));
    if(typing) return;
    e.preventDefault(); e.stopPropagation(); signal(c);
  }, true);

  window.TQKit = {mount, float, setLang, light, toggleLight, signal, unsignal, student, signals, onSignals: fn => { sigFns.push(fn); }, bells};
})();
