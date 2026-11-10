/* Station homework engine (used by hw/play.html when the hwpages row has "stations").
   Built from the model homework hw/when-mata.html so that any prep chat can make the same kind of
   homework as DATA only (docs collection 'hwpages'), without writing a page.

   data = {title:{ar,en}, hi:{ar,en} ("{n}" = student name), theme:'boy'|'girl'|'teen'|'adult',
           stations:[ STATION, … ]}           every text = "string" or {ar,en}; img = URL (absolute or relative to hw/)
   STATION common: {t, title:{ar,en}, icon:'🎧', help:{ar,en}?}
   - learn  : {blocks:[ {help}, {formula:[{w:'مَتَى', m:'when', c:1..4}]}, {pic:'img', clock:7},
                         {audio:['url',…], label:{ar,en}}, {compare:[{w:'أَيْنَ', txt:{ar,en}, c:'#FF8A3D'}]},
                         {grid:[{img?, clock?, w:'…', sub:'…'}]}, {text:{ar,en}} ]}            (not scored)
   - listen : {pool:[{k:'school', img, w:'الْمَدْرَسَة'}], n:4,
               rounds:[{audio:['q.mp3'], a:'school', after:['a.mp3']?, show:'text shown after'}]}
   - pick   : {rounds:[{img?, clock?, q:'text', opts:['…','…'], a:0, audio:['…']?, help?, why?}]}  (opts may be {img,w} → picture choices)
   - build  : {rounds:[{img?, clock?, words:['مَتَى','تَذْهَبُ',…], audio:['…']?, help?}]}   words in the right order; shown shuffled
   - record : {items:[{img?, clock?, label:'…', hint:'answer, hidden until tapped', audio:['example.mp3']?}],
               own:{title, help, qs:[{ar:'مَتَى تَنَامُ؟', en:'When do you sleep?'}], answerHelp}?}   (not scored)
   - reward : {n:15}
   Score = every listen/pick/build round (right on the first try). */
(function(){
  const CSS = `
.stations{display:flex;gap:6px;flex-wrap:wrap;margin:10px 0}
.st{flex:1;min-width:84px;text-align:center;background:var(--card2);border:2px solid var(--line);border-radius:12px;padding:4px 6px;font-size:.82rem;color:var(--muted);cursor:pointer}
.st.on{border-color:var(--gold);color:var(--ink);background:var(--card)}.st.done{border-color:var(--ok);color:var(--ok)}
.card h3{margin:0 0 6px;color:var(--gold);font-size:1.15rem}
.help{background:rgba(0,0,0,.18);border:2px dashed var(--acc);border-radius:14px;padding:8px 12px;margin:8px 0;font-size:.95rem}
.help b{color:var(--gold)}
.ar,.chip,.qq,.opt.arx,.pic span,.hint{font-family:var(--f-ar)}
.formula{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;direction:rtl;margin:10px 0}
.chip{font-weight:700;font-size:1.7rem;line-height:1.4;padding:4px 14px;border-radius:12px;background:#FFFDF7;color:#13303F;border:3px solid transparent;text-align:center}
.chip small{display:block;font:600 .8rem/1.2 var(--f-en);color:#4b6574}
.c1{border-color:#FF8A3D}.c2{border-color:#3D8BFD}.c3{border-color:#2EC4B6}.c4{border-color:#F5B942}
.vs{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin-top:8px}
.vs>div{border-radius:14px;padding:10px;text-align:center;background:var(--card);border:3px solid var(--line)}
.vs .w{font:700 2.2rem/1.3 var(--f-ar)}
.play{font:inherit;font-weight:800;border:0;border-radius:14px;padding:8px 16px;min-height:48px;cursor:pointer;background:var(--acc);color:#06303A}
.btn{font:inherit;font-weight:800;border:0;border-radius:14px;padding:8px 20px;min-height:48px;cursor:pointer;background:var(--gold);color:#3A2600}
.row{display:flex;gap:10px;flex-wrap:wrap;align-items:center;justify-content:center;margin-top:10px}
.pics{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;margin-top:10px}
.pic{border:3px solid var(--line);border-radius:14px;overflow:hidden;background:#fff;cursor:pointer;padding:0;font:inherit;color:#13303F}
.pic img{display:block;width:100%;aspect-ratio:16/10;object-fit:cover}
.pic span{display:block;font-weight:700;font-size:1.25rem;line-height:1.4;padding:2px 4px}
.pic.right{border-color:var(--ok);box-shadow:0 0 0 3px var(--ok)}.pic.wrong{border-color:var(--bad);opacity:.6}
.tile{text-align:center;background:var(--card);border-radius:12px;padding:6px}
.tile img{width:100%;border-radius:8px}
.scene{display:grid;grid-template-columns:minmax(0,400px) auto;gap:16px;align-items:center;justify-content:center;margin:6px 0}
.scene.one{grid-template-columns:minmax(0,420px)}
.scene img{width:100%;border-radius:14px;border:3px solid #fff;display:block}
.qq{font-weight:700;font-size:1.8rem;line-height:1.6;text-align:center;background:#FFFDF7;color:#13303F;border-radius:14px;padding:6px 10px;margin:8px 0;direction:rtl}
.qq.lt{direction:ltr;font-family:var(--f-en);font-size:1.25rem}
.sopts{display:grid;gap:8px;margin-top:8px}
.sopts.pics2{grid-template-columns:repeat(auto-fit,minmax(140px,1fr))}
.opt.arx{font-size:1.5rem;line-height:1.5;direction:rtl}
.pool,.line{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;direction:rtl;min-height:64px;padding:8px;border-radius:14px}
.line{background:rgba(0,0,0,.18);border:2px dashed var(--line)}
.pool .chip{cursor:pointer;font-size:1.6rem}
.recItem{display:grid;grid-template-columns:150px 1fr;gap:12px;align-items:center;background:var(--card);border-radius:14px;padding:10px;margin-top:10px}
.recItem.noimg{grid-template-columns:1fr}
.recItem img{width:100%;border-radius:10px}
.hint{font-weight:700;font-size:1.3rem;line-height:1.5;direction:rtl;opacity:.9}
.hint.hide{filter:blur(6px);cursor:pointer}
.meta{display:flex;justify-content:space-between;color:var(--muted);font-size:.9rem;margin-top:8px}
.fb{text-align:center;font-weight:800;margin-top:8px;min-height:1.6em}
.sky{position:relative;height:300px;border-radius:16px;overflow:hidden;background:linear-gradient(var(--sky1),var(--sky2));touch-action:manipulation}
.star{position:absolute;font-size:38px;cursor:pointer;user-select:none;transition:transform .15s}
audio[hidden]{display:none!important}
@media (max-width:560px){.scene{grid-template-columns:1fr}.recItem{grid-template-columns:1fr}.chip{font-size:1.4rem}}
body.th-boy{--bg:#0A2233;--card:#123C55;--card2:#0F3148;--line:#24607F;--gold:#F5B942;--acc:#2EC4B6;--sky1:#0B2A55;--sky2:#123C55}
body.th-girl{--bg:#2B1736;--card:#46285A;--card2:#3A2149;--line:#7A4C93;--gold:#FFC6E3;--acc:#F7A1D3;--ink:#FFF4FB;--muted:#E5C9EA;--sky1:#4B2766;--sky2:#7A3E8F}
body.th-teen{--bg:#0F1A24;--card:#1B2B3A;--card2:#16232F;--line:#2F4A60;--gold:#E2B85C;--acc:#7FD1C7;--sky1:#102236;--sky2:#1B2B3A}
body.th-adult{--acc:#9FC9B5;--sky1:#0B1E2D;--sky2:#163A57}
body{--acc:#2EC4B6;--sky1:#0B2A55;--sky2:#123C55}`;

  function run(H, opt){
    const T = opt.T, E = opt.E, base = opt.base || '';
    const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    document.body.classList.add('th-' + (H.theme || 'boy'));
    const U = u => !u ? '' : /^(https?:|\/|data:)/.test(u) ? u : base + u;
    const L = (ar, en) => E() ? en : ar;
    const isAr = s => /[؀-ۿ]/.test(String(s || '')) && !/[A-Za-z]{3}/.test(String(s || '').replace(/<[^>]+>/g, ''));
    const shuffle = a => { a = a.slice(); for(let i = a.length - 1; i > 0; i--){ const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
    let audio = null;
    const play = (keys, done) => { keys = [].concat(keys || []).filter(Boolean); if(audio) audio.pause(); const go = i => { if(i >= keys.length){ if(done) done(); return; } audio = new Audio(U(keys[i])); audio.onended = () => setTimeout(() => go(i + 1), 350); audio.onerror = () => go(i + 1); audio.play().catch(() => { if(done && i === keys.length - 1) setTimeout(done, 1200); }); }; go(0); };
    const ok = el => { if(window.TQFX) TQFX.ok(el); }, bad = el => { if(window.TQFX) TQFX.bad(el); };
    const clock = (h, size) => { if(h == null || h === '') return ''; const a = (h % 12) * 30 * Math.PI / 180, s = size || 90;
      return '<svg width="' + s + '" height="' + s + '" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="45" fill="#fff" stroke="#2EC4B6" stroke-width="6"/>' +
        Array.from({length: 12}, (_, i) => { const b = (i + 1) * 30 * Math.PI / 180; return '<circle cx="' + (50 + Math.sin(b) * 37) + '" cy="' + (50 - Math.cos(b) * 37) + '" r="2.4" fill="#0F3148"/>'; }).join('') +
        '<line x1="50" y1="50" x2="50" y2="16" stroke="#F5B942" stroke-width="5" stroke-linecap="round"/><line x1="50" y1="50" x2="' + (50 + Math.sin(a) * 24) + '" y2="' + (50 - Math.cos(a) * 24) + '" stroke="#0F3148" stroke-width="7" stroke-linecap="round"/><circle cx="50" cy="50" r="5" fill="#0F3148"/></svg>'; };
    const scene = (img, h, size) => !img && (h == null) ? '' : '<div class="scene' + (h == null ? ' one' : '') + '">' + (img ? '<img src="' + U(img) + '" alt="">' : '<div></div>') + (h != null ? '<div style="text-align:center">' + clock(h, size || 120) + '</div>' : '') + '</div>';
    const help = x => x ? '<div class="help">' + T(x) + '</div>' : '';
    const txt = s => { const v = T(s); return isAr(v) ? '<span class="ar" dir="rtl">' + v + '</span>' : v; };

    const S = H.stations, state = {cur: 0, done: {}, score: 0, details: []};
    const scored = x => ['listen', 'pick', 'build'].includes(x.t) ? (x.rounds || []).length : 0;
    const max = S.reduce((n, x) => n + scored(x), 0);
    const report = () => TQHW.result({score: max ? state.score : null, max: max || null, done: S.every((x, i) => state.done[i]), details: state.details});
    const mark = (q, a, right) => { state.details.push({q: String(q).replace(/<[^>]+>/g, ''), a: String(a).replace(/<[^>]+>/g, ''), ok: right}); if(right) state.score++; report(); };
    const finish = i => { state.done[i] = true; bar(); report(); };
    const ICON = {learn: '🧭', listen: '🎧', pick: '👆', build: '🧩', record: '🎙️', reward: '🌟'};

    const g = document.getElementById('game');
    const nav = document.createElement('div'); nav.className = 'stations'; g.parentNode.insertBefore(nav, g);
    document.getElementById('recs').style.display = 'none';
    function bar(){
      nav.innerHTML = S.map((x, i) => '<div class="st' + (i === state.cur ? ' on' : '') + (state.done[i] ? ' done' : '') + '" data-s="' + i + '">' + (x.icon || ICON[x.t] || '⭐') + ' ' + T(x.tab || x.title) + (state.done[i] ? ' ✓' : '') + '</div>').join('');
      nav.querySelectorAll('[data-s]').forEach(b => b.onclick = () => go(+b.dataset.s));
      document.getElementById('prog').style.width = (Object.keys(state.done).length / S.length * 100) + '%';
    }
    function go(i){ state.cur = Math.max(0, Math.min(S.length - 1, i)); bar(); const x = S[state.cur]; (V[x.t] || V.learn)(x, state.cur); window.scrollTo({top: 0, behavior: 'smooth'}); }
    const head = x => '<h3>' + (x.icon || ICON[x.t] || '') + ' ' + T(x.title) + '</h3>' + help(x.help);
    const nextBtn = i => i < S.length - 1 ? '<div class="row"><button class="btn" data-next>' + L('المحطة التالية ⬅', 'Next station ➜') + '</button></div>' : '';
    const bindNext = () => { const b = g.querySelector('[data-next]'); if(b) b.onclick = () => go(state.cur + 1); };
    const meta = (i, n, r) => '<div class="meta"><span>' + (i + 1) + ' / ' + n + '</span><span>⭐ ' + r + '</span></div>';
    const endCard = (x, i, right, n) => { finish(i); g.innerHTML = '<div class="card end">' + (x.icon || ICON[x.t] || '🌟') + ' ' + L('أحسنت! ', 'Well done! ') + '<b dir="ltr">' + right + ' / ' + n + '</b>' + nextBtn(i) + '</div>'; bindNext(); if(window.TQFX) TQFX.win(); };
    const rounds = x => x.shuffle === false ? (x.rounds || []).slice() : shuffle(x.rounds || []);

    const V = {
      learn(x, i){
        const B = (x.blocks || []).map((b, j) => {
          if(b.help) return help(b.help);
          if(b.text) return '<div style="margin:6px 0">' + T(b.text) + '</div>';
          if(b.formula) return '<div class="formula">' + b.formula.map(c => '<div class="chip c' + (c.c || '') + '">' + c.w + (c.m ? '<small>' + T(c.m) + '</small>' : '') + '</div>').join('') + '</div>';
          if(b.pic || b.clock != null) return scene(b.pic, b.clock);
          if(b.audio) return '<div class="row"><button class="play" data-au="' + j + '">🔊 ' + T(b.label || {ar: 'اسمع', en: 'Listen'}) + '</button></div>';
          if(b.compare) return '<div class="vs">' + b.compare.map(c => '<div style="border-color:' + (c.c || 'var(--line)') + '"><div class="w">' + c.w + '</div>' + T(c.txt) + '</div>').join('') + '</div>';
          if(b.grid) return (b.title ? '<h3 style="margin-top:12px">' + T(b.title) + '</h3>' : '') + '<div class="pics">' + b.grid.map(c => '<div class="tile">' + (c.img ? '<img src="' + U(c.img) + '" alt="">' : '') + clock(c.clock, 64) + '<div class="ar" style="font-size:1.35rem;font-weight:700">' + (c.w || '') + '</div>' + (c.sub ? '<small style="color:var(--muted)">' + T(c.sub) + '</small>' : '') + '</div>').join('') + '</div>';
          return '';
        }).join('');
        g.innerHTML = '<div class="card">' + head(x) + B + nextBtn(i) + '</div>';
        g.querySelectorAll('[data-au]').forEach(b => b.onclick = () => play(x.blocks[+b.dataset.au].audio));
        bindNext(); finish(i);
      },
      listen(x, i){
        const R = rounds(x); let r = 0, right = 0; const pool = x.pool || [];
        const draw = () => {
          if(r >= R.length) return endCard(x, i, right, R.length);
          const q = R[r], ans = pool.find(p => p.k === q.a), others = shuffle(pool.filter(p => p.k !== q.a)).slice(0, (x.n || 4) - 1);
          const ch = shuffle([ans].concat(others).filter(Boolean));
          g.innerHTML = '<div class="card">' + head(x) + help(q.help) + '<div class="row"><button class="play" data-p>🔊 ' + L('اسمع', 'Listen') + '</button></div>' +
            '<div class="pics">' + ch.map(c => '<button class="pic" data-k="' + c.k + '">' + (c.img ? '<img src="' + U(c.img) + '" alt="">' : '') + '<span>' + (c.w || '') + '</span></button>').join('') + '</div>' +
            '<div class="fb" data-fb></div>' + meta(r, R.length, right) + '</div>';
          let miss = false, done = false;
          g.querySelector('[data-p]').onclick = () => play(q.audio);
          setTimeout(() => play(q.audio), 300);
          g.querySelectorAll('[data-k]').forEach(b => b.onclick = () => {
            if(done) return;
            if(b.dataset.k === q.a){ done = true; b.classList.add('right'); ok(b); if(!miss) right++; mark('🎧 ' + (q.show || q.a), ans ? (ans.w || q.a) : q.a, !miss);
              if(q.show) g.querySelector('[data-fb]').innerHTML = '<span class="ar" style="font-size:1.5rem">' + q.show + '</span>';
              const nx = () => { r++; setTimeout(draw, 500); }; q.after ? play(q.after, nx) : setTimeout(nx, 900);
            } else { miss = true; b.classList.add('wrong'); bad(b); g.querySelector('[data-fb]').textContent = T(q.tip || x.tip || {ar: 'اسمع مرة تانية وحاول.', en: 'Listen again and try.'}); }
          });
        };
        draw();
      },
      pick(x, i){
        const R = rounds(x); let r = 0, right = 0;
        const draw = () => {
          if(r >= R.length) return endCard(x, i, right, R.length);
          const q = R[r], ord = shuffle(q.opts.map((o, j) => j)), picOpts = q.opts.some(o => o && o.img);
          g.innerHTML = '<div class="card">' + head(x) + scene(q.img, q.clock) + (q.q ? '<div class="qq' + (isAr(T(q.q)) ? '' : ' lt') + '">' + T(q.q) + '</div>' : '') + help(q.help) +
            (q.audio ? '<div class="row"><button class="play" data-p>🔊 ' + L('اسمع', 'Listen') + '</button></div>' : '') +
            '<div class="sopts' + (picOpts ? ' pics2' : '') + '">' + ord.map(j => { const o = q.opts[j];
              return picOpts ? '<button class="pic" data-j="' + j + '"><img src="' + U(o.img) + '" alt=""><span>' + (o.w || '') + '</span></button>'
                : '<button class="opt' + (isAr(T(o)) ? ' arx' : '') + '" data-j="' + j + '">' + T(o) + '</button>'; }).join('') + '</div>' +
            '<div class="fb" data-fb></div>' + meta(r, R.length, right) + '</div>';
          const pb = g.querySelector('[data-p]'); if(pb) pb.onclick = () => play(q.audio);
          let miss = false, done = false;
          g.querySelectorAll('[data-j]').forEach(b => b.onclick = () => {
            if(done) return;
            if(+b.dataset.j === q.a){ done = true; b.classList.add('right'); ok(b); if(!miss) right++;
              const o = q.opts[q.a]; mark('👆 ' + T(q.q || ''), o && o.img ? (o.w || '') : T(o), !miss);
              const fb = g.querySelector('[data-fb]'); if(q.why) fb.innerHTML = T(q.why);
              const nx = () => { r++; setTimeout(draw, q.why ? 1200 : 400); }; q.after ? play(q.after, nx) : setTimeout(nx, 700);
            } else { miss = true; b.classList.add('wrong'); bad(b); g.querySelector('[data-fb]').innerHTML = T(q.tip || x.tip || {ar: 'حاول مرة تانية 💪', en: 'Try again 💪'}); }
          });
        };
        draw();
      },
      build(x, i){
        const R = rounds(x); let r = 0, right = 0;
        const draw = () => {
          if(r >= R.length) return endCard(x, i, right, R.length);
          const q = R[r], W = q.words, rtl = isAr(W.join(' '));
          g.innerHTML = '<div class="card">' + head(x) + scene(q.img, q.clock) + help(q.help) +
            '<div class="line" data-line' + (rtl ? '' : ' style="direction:ltr"') + '></div><div class="pool" data-pool' + (rtl ? '' : ' style="direction:ltr"') + '>' +
            shuffle(W.map((w, j) => [w, j])).map(c => '<div class="chip" data-j="' + c[1] + '">' + c[0] + '</div>').join('') + '</div>' +
            '<div class="fb" data-fb></div>' + meta(r, R.length, right) + '</div>';
          let nx = 0, miss = false;
          g.querySelectorAll('[data-j]').forEach(c => c.onclick = () => {
            const j = +c.dataset.j;
            if(W[j] === W[nx]){ g.querySelector('[data-line]').appendChild(c); c.onclick = null; c.style.borderColor = 'var(--ok)'; nx++;
              if(nx === W.length){ ok(c); if(!miss) right++; mark('🧩 ' + W.join(' '), W.join(' '), !miss); const n2 = () => { r++; setTimeout(draw, 500); }; q.audio ? play(q.audio, n2) : setTimeout(n2, 900); }
            } else { miss = true; bad(c); g.querySelector('[data-fb]').textContent = T(q.tip || x.tip || {ar: 'مش دي. أي كلمة بعدها؟', en: 'Not this one. Which word comes next?'}); }
          });
        };
        draw();
      },
      record(x, i){
        const own = x.own;
        g.innerHTML = '<div class="card">' + head(x) +
          (x.items || []).map((it, j) => '<div class="recItem' + (it.img || it.clock != null ? '' : ' noimg') + '">' + (it.img || it.clock != null ? '<div>' + (it.img ? '<img src="' + U(it.img) + '" alt="">' : '') + '<div style="text-align:center;margin-top:4px">' + clock(it.clock, 70) + '</div></div>' : '') + '<div>' +
            (it.say ? '<div style="font-weight:800">' + txt(it.say) + '</div>' : '') +
            (it.hint ? '<div class="hint hide" data-h title="' + L('اضغط لو محتاج مساعدة', 'Tap if you need help') + '">' + T(it.hint) + '</div>' : '') +
            '<div class="row" style="justify-content:flex-start">' + (it.audio ? '<button class="play" data-ex="' + j + '">🔊 ' + L('مثال', 'Example') + '</button>' : '') + '<span data-r="' + j + '"></span></div></div></div>').join('') +
          (own ? '<h3 style="margin-top:14px">' + T(own.title || {ar: '👨‍👩‍👦 سؤالك أنت', en: '👨‍👩‍👦 Your own question'}) + '</h3>' + help(own.help) +
            '<div class="sopts">' + (own.qs || []).map((m, j) => '<button class="opt arx" data-m="' + j + '">' + (m.ar || m) + (E() && m.en ? '<small dir="ltr" style="display:block;font:600 .8rem var(--f-en);opacity:.8">' + m.en + '</small>' : '') + '</button>').join('') + '</div><div data-own style="margin-top:10px"></div>' : '') +
          nextBtn(i) + '</div>';
        g.querySelectorAll('[data-h]').forEach(h => h.onclick = () => h.classList.remove('hide'));
        g.querySelectorAll('[data-ex]').forEach(b => b.onclick = () => play(x.items[+b.dataset.ex].audio));
        let n = 0;
        (x.items || []).forEach((it, j) => { const b = TQHW.recordButton(g.querySelector('[data-r="' + j + '"]'), '🎙️ ' + String(T(it.label || it.hint || it.say || ('#' + (j + 1)))).replace(/<[^>]+>/g, ''));
          b.addEventListener('click', () => { if(!state.done[i] && ++n >= Math.min(2, x.items.length)) finish(i); }); });
        if(!(x.items || []).length) finish(i);
        g.querySelectorAll('[data-m]').forEach(b => b.onclick = () => {
          g.querySelectorAll('[data-m]').forEach(y => y.classList.remove('right')); b.classList.add('right'); ok(b);
          const m = own.qs[+b.dataset.m], box = g.querySelector('[data-own]');
          box.innerHTML = '<div class="qq">' + (m.ar || m) + '</div>' + help(own.answerHelp) + '<div data-or></div>';
          TQHW.recordButton(box.querySelector('[data-or]'), '🎙️ ' + (m.ar || m) + ' (' + L('سؤالي', 'my question') + ')');
        });
        bindNext();
      },
      reward(x, i){
        const N = x.n || 15;
        g.innerHTML = '<div class="card">' + head(Object.assign({title: {ar: 'المكافأة: امسك ' + N + ' نجمة!', en: 'Reward: catch ' + N + ' stars!'}}, x)) + '<div class="sky" data-sky></div><div class="fb" data-fb></div></div>';
        const sky = g.querySelector('[data-sky]'); let got = 0, t;
        const spawn = () => {
          if(got >= N) return;
          const s = document.createElement('div'); s.className = 'star'; s.textContent = (x.items && Math.random() < .25) ? x.items[Math.random() * x.items.length | 0] : '⭐';
          s.style.left = (5 + Math.random() * 85) + '%'; s.style.top = (5 + Math.random() * 75) + '%';
          s.onclick = () => { got++; s.style.transform = 'scale(1.8)'; ok(s); setTimeout(() => s.remove(), 150); g.querySelector('[data-fb]').textContent = '⭐ ' + got + ' / ' + N;
            if(got >= N){ clearInterval(t); sky.innerHTML = ''; finish(i); if(window.TQFX) TQFX.win();
              const nm = TQHW.name;
              g.querySelector('.card').insertAdjacentHTML('beforeend', '<div class="end" style="margin-top:10px">🏆 ' + (x.thanks ? T(x.thanks).replace('{n}', nm || '') : L('شكرًا ' + (nm || 'يا بطل') + '! المعلم هيسمع تسجيلاتك ويرد عليك. 🌟', 'Thank you' + (nm ? ', ' + nm : '') + '! Your teacher will listen to your recordings and reply. 🌟')) +
                (max ? '<div style="margin-top:6px"><b dir="ltr">⭐ ' + state.score + ' / ' + max + '</b></div>' : '') + '</div>'); } };
          sky.appendChild(s); setTimeout(() => s.remove(), 1700);
        };
        t = setInterval(spawn, 550); spawn();
      }
    };
    return {
      draw(){ go(state.cur); },
      start(){ report(); go(0); }
    };
  }
  window.TQST = {run};
})();
