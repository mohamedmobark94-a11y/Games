/* ======================================================================
   🙈 «اخفِ كلمات» on the Mushaf page (for Qur'an tests): the same trick as the
   lessons' verse slides, on the scanned page. The page picture is read once:
   the text lines are found from the ink, each line is cut where the white gaps
   between words are, and some of those pieces get a soft frosted sticker.
   The student recites from memory; a tap on a sticker peeks at that piece.
   Levels (button or key H): بعض الكلمات → أكتر → السطور كلها → off.
   ====================================================================== */
(function(){
  const $ = id => document.getElementById(id);
  const img = $('mzImg'), paper = $('mzPaper'); if(!img || !paper) return;

  const st = document.createElement('style');
  st.textContent =
    '#mzHide{position:absolute;inset:0;z-index:5;pointer-events:none}' +
    '#mzHide i{position:absolute;pointer-events:auto;cursor:pointer;border-radius:14px;backdrop-filter:blur(9px) saturate(1.2);-webkit-backdrop-filter:blur(9px) saturate(1.2);' +
      'box-shadow:0 2px 10px rgba(0,0,0,.08),inset 0 0 0 2px rgba(255,255,255,.55);transition:opacity .35s,transform .35s}' +
    '#mzHide i::after{content:attr(data-e);position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:var(--es,28px);font-style:normal;opacity:.55;filter:saturate(1.3)}' +
    '#mzHide i.peek{opacity:0;transform:scale(.92)}' +
    '#mzHide i.pop{animation:mzPop .45s}@keyframes mzPop{0%{transform:scale(1)}40%{transform:scale(1.08)}100%{transform:scale(1)}}' +
    '.mz-t.hide{padding:0 10px;color:#6b21a8;border-color:#d8b4fe;background:#faf5ff}.mz-t.hide.on{background:#7c3aed;color:#fff;border-color:#7c3aed}' +
    '#mzHideMore[hidden]{display:none}';
  document.head.appendChild(st);

  /* the buttons go next to 🎯 تصحيح */
  const mark = document.querySelector('[data-tool="mark"]'), grp = mark ? mark.parentNode : document.querySelector('.mz-bar');
  const grp2 = document.createElement('div'); grp2.className = 'mz-grp';
  grp2.innerHTML = '<button type="button" class="mz-t hide" id="mzHideBtn" title="اخفِ كلمات للتسميع (H)">🙈 اخفِ كلمات <kbd>H</kbd></button>' +
    '<span id="mzHideMore" hidden><button type="button" class="mz-b" id="mzHideShuffle" title="اخفِ كلمات تانية">🎲</button>' +
    '<button type="button" class="mz-b" id="mzHideAll" title="اكشف الكل / غطّي الكل">👀</button></span>';
  grp.parentNode.insertBefore(grp2, grp.nextSibling);
  const btn = $('mzHideBtn'), more = $('mzHideMore');

  const layer = document.createElement('div'); layer.id = 'mzHide'; paper.appendChild(layer);
  const LEVELS = [null, {p: .35, t: 'بعض الكلمات'}, {p: .65, t: 'كلمات أكتر'}, {p: 1, t: 'السطور كلها', lines: true}];
  const TINTS = ['rgba(255,214,231,.55)', 'rgba(214,234,255,.55)', 'rgba(220,252,231,.55)', 'rgba(254,243,199,.6)', 'rgba(237,233,254,.6)'];
  const EMO = ['⭐', '🌸', '✨', '🌙', '💫', '🌟', '🍀', '🦋'];
  let level = 0, map = null, mapFor = '';
  try{ level = +localStorage.getItem('mzHideLevel') || 0; }catch(_){}

  /* ---------- read the page: lines, then word pieces ---------- */
  function analyse(){
    const SW = 600, SH = Math.round(SW * img.naturalHeight / img.naturalWidth);
    const c = document.createElement('canvas'); c.width = SW; c.height = SH;
    const x = c.getContext('2d', {willReadFrequently: true}); x.drawImage(img, 0, 0, SW, SH);
    let d; try{ d = x.getImageData(0, 0, SW, SH).data; }catch(_){ return null; }
    const ink = new Uint8Array(SW * SH);
    for(let i = 0, j = 0; i < d.length; i += 4, j++){ const l = .3 * d[i] + .59 * d[i + 1] + .11 * d[i + 2]; ink[j] = l < 150 ? 1 : 0; }
    // the frame: tall solid columns near the sides
    const colAll = new Array(SW).fill(0), y0 = Math.round(SH * .2), y1 = Math.round(SH * .8);
    for(let xx = 0; xx < SW; xx++){ let n = 0; for(let y = y0; y < y1; y++) n += ink[y * SW + xx]; colAll[xx] = n / (y1 - y0); }
    let L = Math.round(SW * .04), R = Math.round(SW * .96);
    for(let xx = Math.round(SW * .45); xx > 0; xx--) if(colAll[xx] > .75){ L = xx + 3; break; }
    for(let xx = Math.round(SW * .55); xx < SW; xx++) if(colAll[xx] > .75){ R = xx - 3; break; }
    const tw = R - L; if(tw < SW * .4) return null;
    // rows inside the frame
    const row = new Array(SH).fill(0);
    for(let y = 0; y < SH; y++){ let n = 0; for(let xx = L; xx < R; xx++) n += ink[y * SW + xx]; row[y] = n; }
    const on = row.map(n => n > tw * .015);
    const bands = []; let s = -1, gap = 0;
    for(let y = 0; y <= SH; y++){
      if(y < SH && on[y]){ if(s < 0) s = y; gap = 0; }
      else if(s >= 0){ if(++gap > 2 || y === SH){ bands.push([s, y - gap]); s = -1; gap = 0; } }
    }
    const lineH = SH * .022;
    const tall = bands.filter(([a, b]) => b - a + 1 >= lineH).map(([a, b]) => b - a + 1).sort((p, q) => p - q);
    const med = tall.length ? tall[tall.length >> 1] : lineH * 2;
    const lines = bands.filter(([a, b]) => {
      const h = b - a + 1; if(h < Math.max(lineH, med * .55) || h > med * 1.45) return false;   // too small, or a surah-title box
      if(b < SH * .07 || a > SH * .93) return false;                                              // page header / footer
      let sum = 0, full = 0; for(let y = a; y <= b; y++){ sum += row[y]; if(row[y] > tw * .8) full++; }
      const dens = sum / (h * tw);
      return dens < .42 && full < h * .2;          // skip surah-title boxes and ruled borders
    });
    // pieces: cut each line at the white gaps between words
    const out = [];
    lines.forEach(([a, b]) => {
      const col = []; for(let xx = L; xx < R; xx++){ let n = 0; for(let y = a; y <= b; y++) n += ink[y * SW + xx]; col.push(n); }
      const minGap = Math.max(3, Math.round(SW * .007));
      const segs = []; let cs = -1, g = 0;
      for(let k = 0; k <= col.length; k++){
        if(k < col.length && col[k] > 0){ if(cs < 0) cs = k; g = 0; }
        else if(cs >= 0){ if(++g >= minGap || k === col.length){ segs.push([cs, k - g]); cs = -1; g = 0; } }
      }
      const ws = segs.filter(([p, q]) => q - p >= 3);
      const pad = (b - a) * .12;
      out.push({y: (a - pad) / SH, h: (b - a + 2 * pad) / SH, x: L / SW, w: tw / SW,
        words: ws.map(([p, q]) => ({x: (L + p - 2) / SW, w: (q - p + 5) / SW}))});
    });
    return out.length >= 3 ? out : null;
  }

  function seeded(n){ let s = n * 9301 + 49297; return () => (s = (s * 9301 + 49297) % 233280) / 233280; }
  let shuffleN = 0;
  function draw(){
    layer.innerHTML = '';
    const lv = LEVELS[level]; btn.classList.toggle('on', !!lv); more.hidden = !lv;
    btn.innerHTML = lv ? '🙈 ' + lv.t + ' <kbd>H</kbd>' : '🙈 اخفِ كلمات <kbd>H</kbd>';
    if(!lv || !img.naturalWidth) return;
    const key = img.src.split('?')[0];
    if(mapFor !== key){ map = analyse(); mapFor = key; }
    if(!map){ btn.title = 'الصفحة دي معرفتش أقسّم سطورها'; return; }
    const rnd = seeded(shuffleN + key.length + (+(key.match(/(\d+)\.\w+$/) || [0, 0])[1]));
    const W = paper.offsetWidth || img.naturalWidth, es = Math.max(14, Math.round(W * .02)) + 'px';
    let k = 0;
    const add = (x, y, w, h) => {
      const i = document.createElement('i');
      i.style.cssText = 'left:' + (x * 100) + '%;top:' + (y * 100) + '%;width:' + (w * 100) + '%;height:' + (h * 100) + '%;background:' + TINTS[k % TINTS.length] + ';--es:' + es;
      i.dataset.e = EMO[k % EMO.length]; k++;
      layer.appendChild(i);
    };
    map.forEach(line => {
      if(lv.lines){ add(line.x, line.y, line.w, line.h); return; }
      const ws = line.words; if(!ws.length) return;
      // hide about p of the pieces on every line, never all of them, and not always the same ones
      const want = Math.max(1, Math.min(ws.length - 1, Math.round(ws.length * lv.p)));
      const order = ws.map((w, i) => [rnd(), i]).sort((a, b) => a[0] - b[0]).slice(0, want).map(z => z[1]);
      order.forEach(i => add(ws[i].x, line.y, ws[i].w, line.h));
    });
  }
  layer.addEventListener('click', e => {
    const t = e.target.closest('i'); if(!t) return; e.stopPropagation();
    t.classList.toggle('peek'); if(!t.classList.contains('peek')){ t.classList.remove('pop'); void t.offsetWidth; t.classList.add('pop'); }
  });
  ['pointerdown', 'mousedown', 'touchstart'].forEach(ev => layer.addEventListener(ev, e => { if(e.target.closest('i')) e.stopPropagation(); }));

  const setLevel = v => { level = v; try{ localStorage.setItem('mzHideLevel', String(level)); }catch(_){} draw(); };
  btn.onclick = () => setLevel((level + 1) % LEVELS.length);
  $('mzHideShuffle').onclick = () => { shuffleN++; draw(); };
  $('mzHideAll').onclick = () => { const all = [...layer.children], open = all.some(i => !i.classList.contains('peek')); all.forEach(i => i.classList.toggle('peek', open)); };
  document.addEventListener('keydown', e => {
    if(/INPUT|TEXTAREA|SELECT/.test((document.activeElement || {}).tagName || '')) return;
    if((e.key === 'h' || e.key === 'H') && !e.ctrlKey && !e.metaKey){ e.preventDefault(); setLevel((level + 1) % LEVELS.length); }
  });
  img.addEventListener('load', () => { shuffleN = 0; draw(); });
  if(img.complete && img.naturalWidth) draw(); else draw();
})();
