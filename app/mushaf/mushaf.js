/* ======================================================================
   THE MUSHAF — «الواضح في التجويد», 640 original 300-dpi pages kept in this
   page's own asset store. A board (pen, highlighter, eraser) and a recitation
   corrector in the spirit of ProCorrector: mark the word, choose the kind of
   mistake, record the correction in the teacher's voice, then hand the
   student a light report to listen to and practise.
   ====================================================================== */
(function(){
  const $ = id => document.getElementById(id);
  const stage = $('mzStage'); if(!stage) return;
  const paper = $('mzPaper'), img = $('mzImg'), ink = $('mzInk'), marksEl = $('mzMarks'), rectEl = $('mzRect'), msg = $('mzMsg');
  const ctx = ink.getContext('2d');
  const OFFSET = 6, TOTAL = 640;
  // the page each surah starts on in the Madani layout this Mushaf follows (+6 front pages; checked on the scans)
  const MADANI = [0,1,2,50,77,106,128,151,177,187,208,221,235,249,255,262,267,282,293,305,312,322,332,342,350,359,367,377,385,396,404,411,415,418,428,434,440,446,453,458,467,477,483,489,496,499,502,507,511,515,518,520,523,526,528,531,534,537,542,545,549,551,553,554,556,558,560,562,564,566,568,570,572,574,575,577,578,580,582,583,585,586,587,587,589,590,591,591,592,593,594,595,595,596,596,597,597,598,598,599,599,600,600,601,601,601,602,602,602,603,603,603,604,604,604];
  const SNAME = n => { try{ const x = SURAHS.find(q => q.n === n); return x ? x.ar : ('سورة ' + n); }catch(_){ return 'سورة ' + n; } };
  const SNAME_EN = n => { try{ const x = SURAHS.find(q => q.n === n); return x ? x.en : ('Surah ' + n); }catch(_){ return 'Surah ' + n; } };
  const surahOfPage = fp => { const m = fp - OFFSET; let s = 1; for(let i = 1; i <= 114; i++){ if(MADANI[i] <= m) s = i; } return s; };
  const CATS = {clear:{ar:'جلي',en:'Clear mistake',c:'#e11d48'}, hidden:{ar:'خفي',en:'Hidden mistake',c:'#0ea5e9'}, pron:{ar:'نطق',en:'Pronunciation',c:'#a855f7'}, general:{ar:'عام',en:'General',c:'#f59e0b'}};
  const esc = x => String(x == null ? '' : x).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

  let pagesRead = false, pagesErr = null;
  let ids = {}, page = 7, W = 1923, H = 2789, scale = 1, tx = 0, ty = 0, tool = 'hand', color = '#d62828';
  const ink$ = {};          // page -> strokes
  let marks = [];           // the session's corrections
  let seq = 0;

  /* ---------- surah list ---------- */
  const sel = $('mzSurah');
  sel.innerHTML = '<option value="">— السورة —</option>' + MADANI.slice(1).map((p, i) => '<option value="' + (i + 1) + '">' + (i + 1) + '. ' + esc(SNAME(i + 1)) + '</option>').join('');
  sel.addEventListener('change', () => { const n = +sel.value; if(n) go(MADANI[n] + OFFSET); });

  /* ---------- pages ---------- */
  function srcOf(n){
    if(window.__mzLocal) return window.__mzLocal(n);
    const id = ids[n]; return id ? ('/_blob/' + id) : '';
  }
  function setMsg(t){ msg.hidden = !t; msg.innerHTML = t ? '<div style="max-width:520px">' + t + '</div>' : ''; }
  window.__mzGo = n => go(n == null ? page : n);
  function go(n){
    n = Math.max(1, Math.min(TOTAL, n | 0)); page = n; $('mzPage').value = n;
    const s = surahOfPage(n); if(n > OFFSET && n <= 604 + OFFSET) sel.value = s; else sel.value = '';
    const src = srcOf(n);
    if(!src){ img.removeAttribute('src'); paper.style.visibility = 'hidden';
      if(window.__mzLocalMsg){ setMsg(window.__mzLocalMsg()); return; }
      if(!Object.keys(ids).length && pagesErr){ setMsg('معرفتش أقرا صفحات المصحف (' + esc((pagesErr && (pagesErr.code || pagesErr.message)) || 'error') + '). <button type="button" class="mz-go" id="mzRetry">🔄 جرّب تاني</button>'); return; }
      if(!Object.keys(ids).length && !pagesRead){ setMsg('بيفتح المصحف...'); return; }
      setMsg(Object.keys(ids).length ? 'الصفحة دي لسه ما اترفعتش — كمّل الاستيراد من الجنب.' : 'المصحف لسه ما اترفعش هنا. من الجنب: <b>استيراد المصحف — مرة واحدة</b>.'); return; }
    setMsg(''); paper.style.visibility = 'visible';
    img.onload = () => {
      const fresh = (img.naturalWidth !== W || img.naturalHeight !== H || !img._seen);
      W = img.naturalWidth; H = img.naturalHeight; img._seen = true;
      ink.width = W; ink.height = H; paper.style.width = W + 'px'; paper.style.height = H + 'px';
      if(fresh) keepZoom(); if(wantPos){ placeAt(wantPos); wantPos = null; } drawInk(); drawMarks();
      const nx = srcOf(n + 1); if(nx){ const pre = new Image(); pre.src = nx; }
    };
    img.src = src; drawMarks();
  }
  $('mzPage').addEventListener('change', e => go(+e.target.value));

  /* ---------- zoom + pan ---------- */
  // the zoom is kept as a size relative to "whole page", so every page opens at the same size (and it is remembered)
  let zoomRel = 1; try{ zoomRel = +localStorage.getItem('mzZoomRel') || 1; }catch(_){}
  let zoomTimer = 0;
  function apply(){
    paper.style.transform = 'translate(' + tx + 'px,' + ty + 'px) scale(' + scale + ')';
    const rel = scale / fitScale('p'); $('mzZoom').textContent = Math.round(rel * 100) + '%';
    if(isFinite(rel) && rel > 0 && Math.abs(rel - zoomRel) > 0.001){ zoomRel = rel; clearTimeout(zoomTimer); zoomTimer = setTimeout(() => { try{ localStorage.setItem('mzZoomRel', String(zoomRel)); }catch(_){} }, 300); }
  }
  // a new page at the same size: same zoom, same left-right place, from the top (or the bottom when going back)
  function keepZoom(){
    const r = stage.getBoundingClientRect(), old = scale;
    scale = fitScale('p') * zoomRel;
    const w = W * scale;
    tx = w + 24 <= r.width ? (r.width - w) / 2 : Math.max(r.width - w - 12, Math.min(12, tx * (old ? scale / old : 1)));
    const b = bounds(); ty = b.max; apply();
  }
  function fitScale(k){ const r = stage.getBoundingClientRect(); return k === 'w' ? (r.width - 24) / W : Math.min((r.width - 24) / W, (r.height - 24) / H); }
  function fit(k){ const r = stage.getBoundingClientRect(); scale = fitScale(k); tx = (r.width - W * scale) / 2; ty = k === 'w' ? 12 : (r.height - H * scale) / 2; apply(); }
  function zoomAt(f, cx, cy){
    const r = stage.getBoundingClientRect(); const x = cx - r.left, y = cy - r.top;
    const ns = Math.max(fitScale('p') * 0.5, Math.min(scale * f, 4));
    tx = x - (x - tx) * ns / scale; ty = y - (y - ty) * ns / scale; scale = ns; apply();
  }
  stage.addEventListener('wheel', e => {
    e.preventDefault();
    if(e.ctrlKey || e.metaKey) zoomAt(e.deltaY < 0 ? 1.12 : 1 / 1.12, e.clientX, e.clientY);
    else scrollBy(e.deltaX, e.deltaY);
  }, {passive:false});
  /* scrolling like quran.com: past the bottom of a page the next one comes, past the top the one before */
  let over = 0, overT = 0, flipLock = 0;
  function bounds(){ const r = stage.getBoundingClientRect(), h = H * scale;
    return h + 24 <= r.height ? {min:(r.height - h) / 2, max:(r.height - h) / 2} : {min:r.height - h - 12, max:12}; }
  function scrollBy(dx, dy){
    tx -= dx; const b = bounds(), want = ty - dy;
    if(want < b.min - 1 && dy > 0 && page < TOTAL){ ty = b.min; edge(dy); }
    else if(want > b.max + 1 && dy < 0 && page > 1){ ty = b.max; edge(dy); }
    else { ty = Math.max(b.min, Math.min(b.max, want)); over = 0; }
    apply();
  }
  function edge(dy){
    const now = Date.now(); if(now < flipLock) return;      // one page per push (a trackpad keeps sending scroll after the flip)
    if(now - overT > 600) over = 0; overT = now;
    over += Math.abs(dy);
    if(over < 140) return;                       // a small push at the edge is not a page turn
    over = 0; flipLock = Date.now() + 700; flipTo(dy > 0 ? page + 1 : page - 1, dy > 0 ? 'top' : 'bottom');
  }
  let wantPos = null;
  function placeAt(where){ const b = bounds(); ty = where === 'top' ? b.max : b.min; apply(); }
  function flipTo(n, where){ wantPos = where; go(n); placeAt(where); }
  window.__mzFlip = d => flipTo(page + d, d > 0 ? 'top' : 'bottom');

  /* ---------- pointer: pan, pinch, pen, highlighter, eraser, mark ---------- */
  const pts = new Map(); let stroke = null, panFrom = null, pinch = null, markFrom = null;
  const toImg = (cx, cy) => { const r = paper.getBoundingClientRect(); return {x:(cx - r.left) * W / r.width, y:(cy - r.top) * H / r.height}; };
  stage.addEventListener('pointerdown', e => {
    if(paper.style.visibility === 'hidden') return;
    try{ stage.setPointerCapture(e.pointerId); }catch(_){ } pts.set(e.pointerId, e);
    if(pts.size === 2){ stroke = null; markFrom = null; rectEl.hidden = true;
      const [a, b] = [...pts.values()]; pinch = {d: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY)}; return; }
    const p = toImg(e.clientX, e.clientY);
    if(tool === 'hand' || e.button === 1){ panFrom = {x:e.clientX - tx, y:e.clientY - ty}; stage.style.cursor = 'grabbing'; return; }
    if(tool === 'mark'){ markFrom = p; Object.assign(rectEl.style, {left:p.x + 'px', top:p.y + 'px', width:'0px', height:'0px'}); rectEl.hidden = false; return; }
    // the tablet pen's eraser end / eraser button arrives as button 5 (buttons bit 32)
    if(tool === 'erase' || isPenEraser(e)){ eraseAt(p, null); stroke = {erase:true, last:p}; return; }
    stroke = {tool, color: tool === 'hl' ? '#fde047' : color, w: tool === 'hl' ? 34 : 5, pts:[p]};
    (ink$[page] = ink$[page] || []).push(stroke); drawInk();
  });
  stage.addEventListener('pointermove', e => {
    if(!pts.has(e.pointerId)) return; pts.set(e.pointerId, e);
    if(pinch && pts.size === 2){ const [a, b] = [...pts.values()]; const d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
      zoomAt(d / pinch.d, (a.clientX + b.clientX) / 2, (a.clientY + b.clientY) / 2); pinch.d = d; return; }
    if(panFrom){ tx = e.clientX - panFrom.x; ty = e.clientY - panFrom.y; apply(); return; }
    const p = toImg(e.clientX, e.clientY);
    if(markFrom){ const x = Math.min(p.x, markFrom.x), y = Math.min(p.y, markFrom.y);
      Object.assign(rectEl.style, {left:x + 'px', top:y + 'px', width:Math.abs(p.x - markFrom.x) + 'px', height:Math.abs(p.y - markFrom.y) + 'px'}); return; }
    if(stroke && stroke.erase){ eraseAt(p, stroke.last); stroke.last = p; return; }
    if(stroke && isPenEraser(e)){ stroke = {erase:true, last:p}; eraseAt(p, null); return; }
    if(stroke){ stroke.pts.push(p); drawInk(); }
  });
  const end = e => {
    pts.delete(e.pointerId); if(pts.size < 2) pinch = null;
    if(panFrom){ panFrom = null; stage.style.cursor = ''; }
    if(markFrom){ const p = toImg(e.clientX, e.clientY);
      const r = {x:Math.min(p.x, markFrom.x), y:Math.min(p.y, markFrom.y), w:Math.abs(p.x - markFrom.x), h:Math.abs(p.y - markFrom.y)};
      markFrom = null;
      if(r.w < 12 || r.h < 12){ // a tap: a box the size of a word around it
        r.w = 190; r.h = 120; r.x = p.x - 95; r.y = p.y - 60; }
      Object.assign(rectEl.style, {left:r.x + 'px', top:r.y + 'px', width:r.w + 'px', height:r.h + 'px'});
      openPop(r); }
    stroke = null;
  };
  stage.addEventListener('contextmenu', e => e.preventDefault());
  stage.addEventListener('pointerup', end); stage.addEventListener('pointercancel', end);

  function drawInk(){
    ctx.clearRect(0, 0, ink.width, ink.height);
    (ink$[page] || []).forEach(s => {
      if(!s.pts || s.pts.length < 1) return;
      ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = s.color; ctx.lineWidth = s.w;
      if(s.tool === 'hl'){ ctx.globalAlpha = .38; ctx.globalCompositeOperation = 'multiply'; }
      ctx.beginPath(); ctx.moveTo(s.pts[0].x, s.pts[0].y);
      for(let i = 1; i < s.pts.length; i++) ctx.lineTo(s.pts[i].x, s.pts[i].y);
      if(s.pts.length === 1) ctx.lineTo(s.pts[0].x + .1, s.pts[0].y);
      ctx.stroke(); ctx.restore();
    });
  }
  // XP-Pen / Wacom / Huion: the eraser end or an «Eraser» side button arrives as button 5 (buttons 32),
  // with Windows Ink off the pen acts as a mouse, so a side button mapped to right-click (button 2) erases too
  function isPenEraser(e){ return e.button === 5 || (e.buttons & 32) === 32 || e.button === 2 || ((e.buttons & 2) === 2 && e.pointerType !== 'touch'); }
  function segDist(q, a, b){
    const dx = b.x - a.x, dy = b.y - a.y, L = dx * dx + dy * dy;
    let t = L ? ((q.x - a.x) * dx + (q.y - a.y) * dy) / L : 0; t = Math.max(0, Math.min(1, t));
    return Math.hypot(q.x - a.x - t * dx, q.y - a.y - t * dy);
  }
  function eraseAt(p, from){
    const list = ink$[page] || []; const before = list.length;
    // 14 screen pixels whatever the zoom, turned into page pixels
    const r = paper.getBoundingClientRect(); const R = 14 * W / Math.max(1, r.width);
    const a = from || p;
    ink$[page] = list.filter(s => {
      const P = s.pts || []; const lim = R + (s.w || 0) / 2;
      for(let i = 0; i < P.length; i++){
        if(segDist(P[i], a, p) < lim) return false;
        if(i && (segDist(p, P[i - 1], P[i]) < lim || segDist(a, P[i - 1], P[i]) < lim)) return false;
      }
      return true;
    });
    if(ink$[page].length !== before) drawInk();
  }
  function drawMarks(){
    marksEl.innerHTML = marks.filter(m => m.page === page).map(m =>
      '<div class="mz-box" style="left:' + m.rect.x + 'px;top:' + m.rect.y + 'px;width:' + m.rect.w + 'px;height:' + m.rect.h + 'px;border-color:' + CATS[m.cat].c + '"><b style="background:' + CATS[m.cat].c + '">' + m.n + '</b></div>').join('');
  }

  /* ---------- toolbar ---------- */
  document.querySelector('.mz-bar').addEventListener('click', e => {
    const b = e.target.closest('[data-mz],[data-tool],[data-col]'); if(!b) return;
    if(b.dataset.col){ color = b.dataset.col; document.querySelectorAll('.mz-cols i').forEach(i => i.classList.toggle('on', i === b)); if(tool !== 'pen') setTool('pen'); return; }
    if(b.dataset.tool) return setTool(tool === b.dataset.tool && b.dataset.tool === 'mark' ? 'hand' : b.dataset.tool);
    const a = b.dataset.mz, r = stage.getBoundingClientRect();
    if(a === 'next') go(page + 1); if(a === 'prev') go(page - 1);
    if(a === 'zin') zoomAt(1.25, r.left + r.width / 2, r.top + r.height / 2);
    if(a === 'zout') zoomAt(1 / 1.25, r.left + r.width / 2, r.top + r.height / 2);
    if(a === 'fitw') fit('w'); if(a === 'fitp') fit('p');
    if(a === 'clear'){ ink$[page] = []; drawInk(); }
  });
  function setTool(t){ tool = t; document.querySelectorAll('#page-mushaf [data-tool]').forEach(b => b.classList.toggle('on', b.dataset.tool === t));
    stage.style.cursor = t === 'hand' ? 'grab' : (t === 'mark' ? 'crosshair' : 'crosshair'); }
  setTool('hand');

  /* ---------- keys ---------- */
  document.addEventListener('keydown', e => {
    if(!$('page-mushaf').classList.contains('on')) return;
    if(!$('mzPop').hidden){ if(e.key === 'Escape') closePop(); return; }
    const typing = /INPUT|TEXTAREA|SELECT/.test((document.activeElement || {}).tagName || '');
    if(e.key === 'F8'){ e.preventDefault(); if(e.ctrlKey) undo(); else setTool(tool === 'mark' ? 'hand' : 'mark'); return; }
    if(e.key === 'F9'){ e.preventDefault(); finish(); return; }
    if(typing) return;
    if(e.key === 'ArrowLeft'){ e.preventDefault(); go(page + 1); }
    if(e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' '){ e.preventDefault(); scrollBy(0, e.key === 'ArrowDown' ? 90 : 400); return; }
    if(e.key === 'ArrowUp' || e.key === 'PageUp'){ e.preventDefault(); scrollBy(0, e.key === 'ArrowUp' ? -90 : -400); return; }
    if(e.key === 'ArrowRight'){ e.preventDefault(); go(page - 1); }
    // E = eraser on/off (map an XP-Pen side button or express key to the letter E), P = pen
    if(!e.ctrlKey && !e.metaKey && !e.altKey && (e.key === 'e' || e.key === 'E' || e.key === 'ث')){ e.preventDefault();
      if(tool === 'erase') setTool(window.__mzPrevTool || 'pen'); else { window.__mzPrevTool = tool === 'mark' ? 'pen' : tool; setTool('erase'); } return; }
    if(!e.ctrlKey && !e.metaKey && !e.altKey && (e.key === 'p' || e.key === 'P' || e.key === 'ح')){ e.preventDefault(); setTool('pen'); return; }
    // D: drawing on / off (pen ⇄ hand)
    if(!e.ctrlKey && !e.metaKey && !e.altKey && (e.key === 'd' || e.key === 'D' || e.key === 'ي')){ e.preventDefault(); setTool(tool === 'pen' || tool === 'hl' ? 'hand' : 'pen'); return; }
    if((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z'){ e.preventDefault(); const l = ink$[page] || []; l.pop(); drawInk(); }
  });

  /* ---------- the correction popup ---------- */
  let pending = null, cat = null, rec = null, recBlob = null, recTimer = null, recStart = 0;
  function openPop(r){
    pending = r; cat = null; recBlob = null;
    document.querySelectorAll('.mz-cats button').forEach(b => b.classList.remove('on'));
    $('mzMemo').value = ''; $('mzRecPlay').hidden = true; $('mzRecT').textContent = '';
    $('mzRecBtn').textContent = '🎙️ سجّل التصحيح بصوتك'; $('mzRecBtn').classList.remove('rec');
    $('mzPop').hidden = false;
  }
  function closePop(){ stopRec(true); $('mzPop').hidden = true; rectEl.hidden = true; pending = null; }
  document.querySelector('.mz-cats').addEventListener('click', e => { const b = e.target.closest('[data-cat]'); if(!b) return;
    cat = b.dataset.cat; document.querySelectorAll('.mz-cats button').forEach(x => x.classList.toggle('on', x === b)); });
  $('mzCancel').addEventListener('click', closePop);
  $('mzRecBtn').addEventListener('click', async () => {
    if(rec){ stopRec(); return; }
    try{
      if(!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw new Error('unsupported');
      const st = await navigator.mediaDevices.getUserMedia({audio:true});
      const mime = ['audio/webm;codecs=opus','audio/webm','audio/mp4'].find(m => window.MediaRecorder && MediaRecorder.isTypeSupported(m)) || '';
      const chunks = []; rec = new MediaRecorder(st, mime ? {mimeType:mime} : {});
      rec.ondataavailable = ev => { if(ev.data && ev.data.size) chunks.push(ev.data); };
      rec.onstop = () => { st.getTracks().forEach(t => t.stop());
        if(rec && rec._discard){ rec = null; return; }
        recBlob = new Blob(chunks, {type: rec.mimeType || mime || 'audio/webm'}); rec = null;
        const a = $('mzRecPlay'); a.src = URL.createObjectURL(recBlob); a.hidden = false;
        $('mzRecBtn').textContent = '🔁 سجّل تاني'; $('mzRecBtn').classList.remove('rec'); };
      rec.start(); recStart = Date.now();
      $('mzRecBtn').textContent = '⏹ إيقاف'; $('mzRecBtn').classList.add('rec');
      recTimer = setInterval(() => { $('mzRecT').textContent = Math.round((Date.now() - recStart) / 1000) + ' ث'; }, 300);
    }catch(err){
      $('mzRecBtn').hidden = true; $('mzRecT').textContent = 'التسجيل المباشر مش متاح جوّه claude.ai — سجّل من برنامج التسجيل في الجهاز ودوس «📎 ارفع تسجيل صوتي».';
    }
  });
  // claude.ai pages can't open the microphone, so a voice note can also come from a file:
  // Windows "Voice Recorder" / "Sound Recorder", or the phone's recorder (capture opens it directly)
  const micBlocked = (() => { try{ const fp = document.permissionsPolicy || document.featurePolicy; return !!(fp && fp.allowsFeature && !fp.allowsFeature('microphone')); }catch(_){ return false; } })();
  if(micBlocked){ $('mzRecBtn').hidden = true; }
  $('mzAudioFile').addEventListener('change', e => {
    const f = e.target.files && e.target.files[0]; e.target.value = '';
    if(!f) return;
    if(f.size > 15 * 1024 * 1024){ $('mzRecT').textContent = 'الملف كبير أوي (أكتر من 15 ميجا) — سجّل جزء أقصر.'; return; }
    stopRec(true); recBlob = f;
    const a = $('mzRecPlay'); a.src = URL.createObjectURL(f); a.hidden = false;
    $('mzRecT').textContent = '✅ ' + f.name;
  });
  function stopRec(discard){ clearInterval(recTimer); if(rec){ if(discard) rec._discard = true; try{ rec.stop(); }catch(_){ rec = null; } } }
  $('mzSave').addEventListener('click', () => {
    if(!pending) return;
    if(!cat){ $('mzRecT').textContent = 'اختار نوع الخطأ الأول.'; return; }
    if(rec){ stopRec(); setTimeout(() => $('mzSave').click(), 250); return; }
    const m = {n: ++seq, page, rect: pending, cat, note: $('mzMemo').value.trim(), audio: recBlob, t: new Date(), surah: surahOfPage(page)};
    marks.push(m); $('mzPop').hidden = true; rectEl.hidden = true; pending = null; drawMarks(); renderList();
  });

  function renumber(){ marks.forEach((m, i) => m.n = i + 1); seq = marks.length; }
  function undo(){ if(!marks.length) return; marks.pop(); renumber(); drawMarks(); renderList(); note('اتشال آخر خطأ.'); }
  function note(t){ $('mzNote').textContent = t || ''; }
  function renderList(){
    $('mzCount').textContent = marks.length;
    if(!marks.length){ $('mzList').innerHTML = '<div class="mz-empty">دوس 🎯 تصحيح (أو F8) وحدّد الكلمة اللي غلط فيها على الصفحة.</div>'; return; }
    $('mzList').innerHTML = marks.map((m, i) => '<div class="mz-it" data-i="' + i + '"><span class="n" style="background:' + CATS[m.cat].c + '">' + m.n + '</span>' +
      '<span class="t">' + CATS[m.cat].ar + ' · ' + esc(SNAME(m.surah)) + (m.note ? '<small>' + esc(m.note) + '</small>' : '<small>صفحة ' + m.page + (m.audio ? ' · 🔊' : '') + '</small>') + '</span>' +
      '<span>' + (m.audio ? '<button data-play="' + i + '" title="اسمع">▶️</button>' : '') + '<button data-del="' + i + '" title="امسح">✕</button></span></div>').join('');
  }
  $('mzList').addEventListener('click', e => {
    const pl = e.target.dataset.play, dl = e.target.dataset.del;
    if(pl != null){ e.stopPropagation(); new Audio(URL.createObjectURL(marks[pl].audio)).play(); return; }
    if(dl != null){ e.stopPropagation(); marks.splice(dl, 1); renumber(); drawMarks(); renderList(); return; }
    const it = e.target.closest('.mz-it'); if(it){ const m = marks[it.dataset.i]; if(m.page !== page) go(m.page); }
  });

  /* ---------- the student: from the report form ---------- */
  const stIn = $('mzStudent');
  const who = () => (stIn.value || ($('student') || {}).value || '').trim();
  document.addEventListener('input', e => { if(e.target.id === 'student' && !stIn._typed) stIn.value = e.target.value; });
  stIn.addEventListener('input', () => { stIn._typed = true; });
  setTimeout(() => { if(!stIn.value) stIn.value = ($('student') || {}).value || ''; }, 1200);

  /* ---------- the student's report ---------- */
  const loadImg = src => new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = src; });
  const toData = b => new Promise(ok => { const r = new FileReader(); r.onload = () => ok(r.result); r.readAsDataURL(b); });
  async function cropOf(m){
    const im = await loadImg(srcOf(m.page));
    const IW = im.naturalWidth, IH = im.naturalHeight;
    const padY = Math.max(m.rect.h * 1.8, IH * .05);
    const y0 = Math.max(0, m.rect.y - padY), y1 = Math.min(IH, m.rect.y + m.rect.h + padY);
    const x0 = Math.round(IW * .04), x1 = Math.round(IW * .96);
    const outW = 1100, k = outW / (x1 - x0), outH = Math.round((y1 - y0) * k);
    const c = document.createElement('canvas'); c.width = outW; c.height = outH; const g = c.getContext('2d');
    g.drawImage(im, x0, y0, x1 - x0, y1 - y0, 0, 0, outW, outH);
    const rx = (m.rect.x - x0) * k, ry = (m.rect.y - y0) * k, rw = m.rect.w * k, rh = m.rect.h * k;
    g.fillStyle = 'rgba(253,224,71,.32)'; g.fillRect(rx, ry, rw, rh);
    g.lineWidth = 4; g.strokeStyle = CATS[m.cat].c; g.strokeRect(rx, ry, rw, rh);
    return c.toDataURL('image/jpeg', .86);
  }
  function todayISO(){ const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function reportHTML(name, items){
    const data = JSON.stringify(items).replace(/</g, '\\u003c');
    return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
'<title>Recitation Correction · ' + esc(name) + '</title><style>' +
'body{margin:0;background:#0b1220;color:#e5ecf5;font:16px/1.6 system-ui,-apple-system,"Segoe UI",sans-serif}' +
'.w{max-width:860px;margin:0 auto;padding:20px 14px 60px}.hd{background:#111a2e;border:1px solid #23304d;border-radius:16px;padding:16px;text-align:center}' +
'.hd h1{margin:0;font-size:22px;color:#7dd3fc}.hd p{margin:4px 0 0;color:#94a3b8;font-size:14px}.nav{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin:14px 0}' +
'.nav button{background:#1e293b;color:#cbd5e1;border:1px solid #334155;border-radius:9px;padding:7px 12px;font-weight:600;cursor:pointer}.nav button.on{background:#0284c7;color:#fff;border-color:#0284c7}.nav button.ok{border-color:#16a34a}' +
'.card{background:#111a2e;border:1px solid #23304d;border-radius:16px;padding:14px}.top{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:10px}' +
'.top b{color:#facc15;font-size:18px}.top small{color:#94a3b8}.tag{border-radius:99px;padding:3px 12px;font-weight:700;font-size:13px;color:#fff}' +
'.img{width:100%;border-radius:12px;display:block;background:#fff}.memo{margin:10px 0 0;background:#0f172a;border-radius:10px;padding:8px 12px;color:#e2e8f0;direction:rtl;text-align:right;font-family:"Segoe UI",Tahoma,sans-serif}' +
'.pr{margin-top:12px;background:#0f172a;border:1px solid #23304d;border-radius:12px;padding:12px}.pr h3{margin:0 0 8px;font-size:12px;letter-spacing:.08em;color:#94a3b8}' +
'.row{display:flex;flex-wrap:wrap;gap:8px;align-items:center}.b{border:0;border-radius:10px;padding:10px 14px;font-weight:700;color:#fff;cursor:pointer;font-size:15px}' +
'.b1{background:#0284c7}.b2{background:#dc2626}.b3{background:#16a34a;margin-inline-start:auto}.done{margin-top:10px;background:#14532d;color:#bbf7d0;border-radius:10px;padding:8px 12px;display:none}' +
'audio{height:38px;max-width:100%}.ft{text-align:center;color:#64748b;font-size:13px;margin-top:22px}.prog{color:#86efac;font-weight:700}</style></head><body><div class="w">' +
'<div class="hd"><h1>Recitation Correction &amp; Practice</h1><p>Student: <b>' + esc(name) + '</b> · ' + esc(todayISO()) + ' · Corrections: <b>' + items.length + '</b> · <span class="prog" id="pg"></span></p></div>' +
'<div class="nav" id="nav"></div><div id="v"></div>' +
'<div class="ft">📞 +20 155 157 8000 · 🌱 Jazākum Allāhu khayran.</div></div><scr' + 'ipt>' +
'var D=' + data + ',K="rc-' + Date.now() + '",cur=0,mine={};' +
'function ok(i){try{return localStorage.getItem(K+i)==="1"}catch(e){return false}}' +
'function setok(i){try{localStorage.setItem(K+i,"1")}catch(e){}}' +
'function nav(){var h="<button onclick=\\"show(cur-1)\\">← Previous</button>";for(var i=0;i<D.length;i++)h+="<button class=\\""+(i===cur?"on ":"")+(ok(i)?"ok":"")+"\\" onclick=\\"show("+i+")\\">"+(ok(i)?"✓ ":"")+"Mistake "+(i+1)+"</button>";h+="<button onclick=\\"show(cur+1)\\">Next →</button>";document.getElementById("nav").innerHTML=h;var n=0;for(var j=0;j<D.length;j++)if(ok(j))n++;document.getElementById("pg").textContent=n+" of "+D.length+" mastered"}' +
'function show(i){if(i<0||i>=D.length)return;cur=i;var m=D[i];var h="<div class=card><div class=top><div><b>Correction #"+(i+1)+" of "+D.length+"</b> <small>"+m.where+" · "+m.time+"</small></div><span class=tag style=\\"background:"+m.color+"\\">"+m.cat+" · "+m.catAr+"</span></div><img class=img src=\\""+m.img+"\\" alt=\\"\\">"+(m.note?"<div class=memo>"+m.note+"</div>":"")+"<div class=pr><h3>LISTEN &amp; PRACTISE</h3><div class=row>"+(m.audio?"<button class=\\"b b1\\" onclick=\\"play()\\">▶ Listen to Teacher</button>":"")+"<button class=\\"b b2\\" id=rb onclick=\\"recme()\\">🎤 Record your voice</button><span id=mine></span><button class=\\"b b3\\" onclick=\\"got()\\">⭐ I got it right!</button></div><div class=done id=dn>✅ Outstanding! You have mastered this correction.</div></div></div>";document.getElementById("v").innerHTML=h;if(ok(i))document.getElementById("dn").style.display="block";if(mine[i])showmine();nav()}' +
'var A=null;function play(){if(A){A.pause();A=null;return}A=new Audio(D[cur].audio);A.onended=function(){A=null};A.play()}' +
'var R=null;function recme(){var b=document.getElementById("rb");if(R){R.stop();return}if(!navigator.mediaDevices){alert("Recording is not available in this viewer. Open the file in Chrome.");return}navigator.mediaDevices.getUserMedia({audio:true}).then(function(s){var c=[];R=new MediaRecorder(s);R.ondataavailable=function(e){c.push(e.data)};R.onstop=function(){s.getTracks().forEach(function(t){t.stop()});mine[cur]=URL.createObjectURL(new Blob(c,{type:R.mimeType}));R=null;showmine()};R.start();b.textContent="⏹ Stop"}).catch(function(){alert("Please allow the microphone to record yourself.")})}' +
'function showmine(){var b=document.getElementById("rb");if(b)b.textContent="🎤 Record again";document.getElementById("mine").innerHTML="<audio controls src=\\""+mine[cur]+"\\"></audio>"}' +
'function got(){setok(cur);document.getElementById("dn").style.display="block";nav()}' +
'show(0);<\/script></body></html>';
  }
  async function buildItems(){
    const items = [];
    for(const m of marks){
      items.push({where: SNAME_EN(m.surah) + ' · p. ' + (m.page - OFFSET), time: m.t.toLocaleTimeString('en-GB', {hour:'2-digit', minute:'2-digit'}),
        cat: CATS[m.cat].en, catAr: CATS[m.cat].ar, color: CATS[m.cat].c, note: esc(m.note),
        img: await cropOf(m), audio: m.audio ? await toData(m.audio) : ''});
    }
    return items;
  }
  async function finish(){
    const name = who();
    if(!marks.length){ note('مفيش أخطاء متسجلة لسه.'); return; }
    if(!name){ note('اكتب اسم الطالب الأول.'); stIn.focus(); return; }
    const btn = $('mzFinish'); btn.disabled = true; const old = btn.innerHTML; btn.textContent = '⏳ بيجهّز التقرير...';
    try{
      const items = await buildItems();
      const sid0 = (typeof studentIdOf === 'function') ? studentIdOf(name) : name;
      const data = {student:name, studentId:sid0, date:todayISO(), created:Date.now(),
        items: marks.map(m => ({n:m.n, page:m.page, madaniPage:m.page - OFFSET, surah:m.surah, surahName:SNAME(m.surah), cat:m.cat, note:m.note, voice:!!m.audio}))};
      const html = reportHTML(name, items).replace(/<\/body>(?![\s\S]*<\/body>)/, '<script type="application/json" id="mzData">' + JSON.stringify(data).replace(/</g, '\\u003c') + '<\/script></body>');
      const file = 'Correction_' + name.replace(/[^\w\u0600-\u06FF]+/g, '_') + '_' + todayISO() + '.html';
      // keep the session for the lesson tasks: what went wrong, where
      try{ if(DB){ const sid = (typeof studentIdOf === 'function') ? studentIdOf(name) : name;
        await DB.doc('corrections/' + todayISO() + '-' + sid + '-' + Date.now()).set({student:name, studentId:sid, date:todayISO(), created:Date.now(),
          items: marks.map(m => ({n:m.n, page:m.page, madaniPage:m.page - OFFSET, surah:m.surah, surahName:SNAME(m.surah), cat:m.cat, note:m.note, voice:!!m.audio}))}); } }catch(_){}
      let saved = false;
      try{ const dl = (typeof claude !== 'undefined' && claude.use) ? await claude.use('downloads') : null;
        if(dl){ await dl.save({filename:file, data:new Blob([html], {type:'text/html'})}); saved = true; } }catch(_){}
      if(!saved){ const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([html], {type:'text/html'})); a.download = file; document.body.appendChild(a); a.click(); a.remove(); saved = true; }
      note('✅ التقرير اتحفظ: ' + file + ' — ابعته للطالب على واتساب (زرار واتساب تحت) وارفق الملف.');
    }catch(err){ note('معرفتش أجهّز التقرير: ' + ((err && err.message) || err)); }
    finally{ btn.disabled = false; btn.innerHTML = old; }
  }
  $('mzFinish').addEventListener('click', finish);
  $('mzWa').addEventListener('click', () => {
    const name = who(); const n = marks.length;
    const t = 'السلام عليكم ' + name + ' 🌱\nده تقرير تصحيح التلاوة بتاع النهارده (' + n + ' ' + (n === 1 ? 'تصحيح' : 'تصحيحات') + ').\nافتح الملف المرفق، اسمع صوتي في كل غلطة، سجّل صوتك وقارن، ودوس «I got it right» لما تتقنها.\n\nAssalamu alaykum! Here is today\'s recitation correction report. Open the attached file, listen to each correction, record yourself and compare.';
    window.open('https://wa.me/?text=' + encodeURIComponent(t), '_blank');
  });
  function reportLines(list, ar){
    const bySurah = {}; list.forEach(m => { (bySurah[m.surah] = bySurah[m.surah] || []).push(m); });
    return Object.keys(bySurah).map(s => {
      const ms = bySurah[s], c = {}; ms.forEach(m => c[m.cat] = (c[m.cat] || 0) + 1);
      const parts = Object.keys(c).filter(k => CATS[k]).map(k => c[k] + ' ' + (ar ? CATS[k].ar : CATS[k].en.toLowerCase().replace(' mistake', '')));
      return ar ? ('تصحيح التلاوة في سورة ' + SNAME(+s) + ': ' + ms.length + ' ' + (ms.length === 1 ? 'خطأ' : 'أخطاء') + ' (' + parts.join('، ') + ') — اتبعت للطالب تقرير صوتي يتدرب عليه.')
                : ('Recitation corrections in Surah ' + SNAME_EN(+s) + ': ' + ms.length + ' mistake' + (ms.length === 1 ? '' : 's') + ' (' + parts.join(', ') + ') — a voice report was sent to practise them.');
    });
  }
  $('mzToReport').addEventListener('click', async () => {
    if(!marks.length){ note('مفيش أخطاء تتضاف.'); return; }
    if(window.__mzStandalone){
      // the PC copy has no report form: hand the lines over by copy-paste
      const t = reportLines(marks, false).join('\n');
      try{ await navigator.clipboard.writeText(t); note('✅ اتنسخ — الصقه في جزء القرآن في المولّد. (أو ارفع ملف التقرير في المولّد بـ«📥 هات تصحيح من نسخة الجهاز»)'); }
      catch(_){ note(t); }
      return;
    }
    const ar = (typeof effectiveLang === 'function') && effectiveLang() === 'ar';
    reportLines(marks, ar).forEach(line => addItem('lesson', line)); setToggle('lesson', true);
    render(); saveDraft(); note('✅ اتضاف لتقرير الأهل في جزء القرآن.');
  });

  /* ---------- corrections done in the PC copy (where the mic works) ---------- */
  $('mzPcFile').addEventListener('change', async e => {
    const files = [...(e.target.files || [])]; e.target.value = '';
    let n = 0, lines = 0, who = '';
    for(const f of files){
      try{
        const txt = await f.text();
        const m = txt.match(/<script type="application\/json" id="mzData">([\s\S]*?)<\/script>/);
        if(!m){ note('الملف ' + f.name + ' مش تقرير تصحيح من نسخة الجهاز.'); continue; }
        const d = JSON.parse(m[1]); who = d.student || who;
        const sid = (typeof studentIdOf === 'function') ? studentIdOf(d.student) : d.student;
        if(DB){ try{ await DB.doc('corrections/' + (d.date || todayISO()) + '-' + sid + '-' + (d.created || Date.now())).set(Object.assign({}, d, {studentId:sid, from:'pc'})); }catch(_){ } }
        if(d.student && $('student') && !$('student').value) $('student').value = d.student;
        const ar = (typeof effectiveLang === 'function') && effectiveLang() === 'ar';
        reportLines(d.items || [], ar).forEach(line => { addItem('lesson', line); lines++; });
        n++;
      }catch(err){ note('معرفتش أقرا ' + f.name + ': ' + ((err && err.message) || err)); }
    }
    if(n){ setToggle('lesson', true); render(); saveDraft();
      note('✅ ' + n + ' ' + (n === 1 ? 'تقرير' : 'تقارير') + (who ? ' (' + who + ')' : '') + ' — اتضاف ' + lines + ' سطر لجزء القرآن واتسجّل للتحضير الجاي.'); }
  });

  /* ---------- one-time import ---------- */
  let importing = false;
  $('mzFiles').addEventListener('change', async e => {
    if(importing) return;
    const files = [...e.target.files].map(f => { const m = f.name.match(/(\d{1,3})(?=\D*$)/); return {f, n: m ? +m[1] : 0}; })
      .filter(x => x.n >= 1 && x.n <= TOTAL && !ids[x.n]).sort((a, b) => a.n - b.n);
    if(!files.length){ $('mzImpNote').textContent = 'كل الصفحات دي مرفوعة قبل كده.'; return; }
    if(!ASSETS || !DB){ $('mzImpNote').textContent = 'الرفع بيشتغل من اللينك المنشور بس.'; return; }
    importing = true; document.querySelector('.mz-prog').hidden = false;
    let done = 0, fail = 0, since = 0;
    const flush = async () => { try{ await DB.doc('mushaf/pages').set({ids, count:Object.keys(ids).length, updated:Date.now()}); }catch(_){ } };
    const one = async x => {
      for(let t = 0; t < 3; t++){
        try{ const r = await ASSETS.upload(x.f, {type: x.f.type || 'image/jpeg'}); ids[x.n] = r.id; return true; }
        catch(err){ if(err && err.code === 'quota_or_state') throw err; await new Promise(z => setTimeout(z, 1500 * (t + 1))); }
      }
      return false;
    };
    const q = files.slice();
    const worker = async () => { while(q.length){ const x = q.shift();
      const ok = await one(x).catch(() => false); if(ok) done++; else fail++;
      $('mzBar').style.width = Math.round((done + fail) * 100 / files.length) + '%';
      $('mzImpNote').textContent = 'اترفع ' + done + ' من ' + files.length + (fail ? ' · فشل ' + fail : '');
      if(++since >= 10){ since = 0; await flush(); }
      if(x.n === page) go(page); } };
    await Promise.all([worker(), worker(), worker()]);
    await flush(); importing = false;
    $('mzImpNote').textContent = '✅ خلص: ' + Object.keys(ids).length + ' من ' + TOTAL + ' صفحة' + (fail ? ' — ' + fail + ' ما اترفعتش، اختارهم تاني.' : '.');
    $('mzImport').hidden = Object.keys(ids).length >= TOTAL; go(page);
  });

  /* ---------- start ---------- */
  let started = false;
  function applyPages(d){
    const fresh = d && d.ids ? d.ids : {};
    const had = Object.keys(ids).length; if(!importing) ids = Object.assign({}, fresh, ids);
    $('mzImport').hidden = Object.keys(ids).length >= TOTAL;
    if(!had || !img.src) go(page);
  }
  async function start(){
    if(started) return; started = true;
    if(window.__mzLocal){ $('mzImport').hidden = true; go(page); return; }
    setMsg('بيفتح المصحف...');
    // the page's data connection can arrive a moment after the tab is opened
    for(let i = 0; i < 100 && !DB; i++) await new Promise(r => setTimeout(r, 250));
    if(!DB){
      started = false;
      const noClaude = (typeof claude === 'undefined' || !claude || !claude.use);
      setMsg((noClaude
        ? 'الصفحة دي مفتوحة كملف على الجهاز، مش من claude.ai — المصحف بيظهر في لينك المولّد على claude.ai. (للتسجيل بالميك افتح <b>mushaf-corrector.html</b>.)'
        : 'claude.ai ما وصّلش قاعدة البيانات للصفحة دي — اعمل ريفرش للصفحة وجرّب تاني.') + '<br><span class="mz-small">' + esc(location.href.slice(0, 80)) + '</span><br><button type="button" class="mz-go" id="mzRetry">🔄 جرّب تاني</button>');
      return;
    }
    try{ const s0 = await DB.doc('mushaf/pages').get(); pagesRead = true; applyPages(s0 && s0.exists ? s0.data() : null); }
    catch(err){ pagesErr = err; }
    try{
      DB.doc('mushaf/pages').onSnapshot(snap => {
        pagesRead = true;
        const d = snap && snap.exists ? snap.data() : null;
        if(!d && Object.keys(ids).length) return;      // an empty first delivery never hides pages already read
        applyPages(d);
      }, err => { pagesErr = err; pagesRead = true; $('mzImport').hidden = false; go(page); });
    }catch(err){ pagesErr = err; pagesRead = true; go(page); }
    if(!pagesRead) go(page);
  }
  window.__mzPagesState = () => ({read: pagesRead, err: pagesErr && (pagesErr.code || pagesErr.message || String(pagesErr)), count: Object.keys(ids).length});
  document.addEventListener('click', e => { if(e.target && e.target.id === 'mzRetry'){ started = false; pagesErr = null; start(); } });
  // start once the tab is first opened (no 600 KB of images on the report tab)
  const tabBtn = document.querySelector('button.tabb[data-page="mushaf"]');
  if(tabBtn) tabBtn.addEventListener('click', () => setTimeout(() => { start(); if(img.src) fit('p'); }, 60));
  window.__mzStart = start;
})();
