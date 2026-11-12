/* TQDock: panels that stop covering the mushaf.
   Used by the Edge add-on on Quran.com (content.js, panel inside a shadow root), by the Al-Wadih corrector
   (app/mushaf on the site + mushaf.html in the add-on) and by the class tools (assets/session-kit.js).
     TQDock.attach({panel, handles:[el…], store:{get(k,d), set(k,v)} (may be async), key, def:{…}, modes:[…],
                    isShown(), toggle(), onChange(state)})
   Modes (the panel's mode button cycles them, the choice is remembered):
     side    docked to the left or right edge; the page is pushed aside (padding on <html>) by the panel's width
     bottom  a bar across the bottom, between the side panels; the page gets the same space at its end
     mini    small (a capsule / a folded bar), in its own corner by default — that corner strip is kept free — or dragged anywhere
   Several panels share the edges: two side panels on the same edge sit next to each other, and the page is pushed by both.
   Drag from the header (side: snaps to the nearest edge), resize from the inner edge / top edge, «↺» resets,
   «fade» makes it see-through (.35) while the mouse is away. F2 (or the ` key) hides / shows all of them at once.
   CSS hooks on the panel: .dock-side .dock-bottom .dock-mini .dock-right .dock-fade; on <html>: --dock-l --dock-r --dock-b. */
(function(){
  if(window.TQDock) return;
  const DEF = {mode: 'side', side: 'left', w: 340, h: 156, y: 14, mx: null, my: null, fade: false};
  const DOCKS = [];
  const css = id => { let s = document.getElementById(id); if(!s){ s = document.createElement('style'); s.id = id; (document.head || document.documentElement).appendChild(s); } return s; };
  /* every panel at once: side columns first (stacked from the edge), then the bottom bars between them, then the page push */
  function layout(){
    const off = {left: 0, right: 0}; let B = 0, M = 0;
    const strip = k => k.st.mode === 'mini' && k.o.strip && k.st.mx == null;
    DOCKS.forEach(k => { const st = k.st, s = k.P.style; if(!k.shown() || !(st.mode === 'side' || strip(k))) return;
      s[st.side] = (14 + off[st.side]) + 'px'; off[st.side] += (k.P.offsetWidth || (strip(k) ? k.o.strip : st.w)) + 14; });   // the real width (padding / border included)
    const L = off.left ? off.left + 14 : 0, R = off.right ? off.right + 14 : 0;
    DOCKS.forEach(k => { const st = k.st, s = k.P.style; if(!k.shown()) return;
      if(st.mode === 'bottom'){ s.left = L + 'px'; s.right = R + 'px'; B = Math.max(B, st.h + 10); }
      if(st.mode === 'mini' && st.mx == null && !strip(k)) M = Math.max(M, (k.P.offsetHeight || 44) + 22); });
    DOCKS.forEach(k => { if(k.shown() && k.st.mode === 'mini' && k.st.mx == null) k.P.style.bottom = (strip(k) ? 14 : B + 14) + 'px'; });   // capsules sit above a bottom bar
    const b = B + M;
    css('tq-dock-push').textContent = 'html{--dock-l:' + L + 'px;--dock-r:' + R + 'px;--dock-b:' + b + 'px;' +
      (L ? 'padding-left:' + L + 'px!important;' : '') + (R ? 'padding-right:' + R + 'px!important;' : '') +
      (b ? 'padding-bottom:' + b + 'px!important;scroll-padding-bottom:' + b + 'px;' : '') + '}';
    clearTimeout(layout.t); layout.t = setTimeout(() => dispatchEvent(new Event('resize')), 60);   // layouts that measure the window refit
  }
  /* F2 or ` : hide / show every panel at once (never while typing; F2 works even then) */
  document.addEventListener('keydown', e => {
    if(!(e.key === 'F2' || e.code === 'Backquote') || e.ctrlKey || e.metaKey || e.altKey || !DOCKS.length) return;
    const typing = (e.composedPath ? e.composedPath() : [e.target]).some(n => n && (n.tagName === 'INPUT' || n.tagName === 'TEXTAREA' || n.isContentEditable));
    if(typing && e.key !== 'F2') return;
    e.preventDefault(); e.stopPropagation();
    const show = !DOCKS.some(k => k.shown());
    DOCKS.forEach(k => { if(k.shown() !== show && k.o.toggle) try{ k.o.toggle(); }catch(_){} });
    setTimeout(layout, 0);
  }, true);
  addEventListener('resize', () => { DOCKS.forEach(k => { if(k.st.mode === 'mini' && k.ready) k.place(); }); });

  function attach(o){
    const P = o.panel, D = Object.assign({}, DEF, o.def || {}), st = Object.assign({}, D), KEY = o.key || 'dock';
    const MODES = o.modes || ['side', 'bottom', 'mini'];
    const shown = () => { try{ return o.isShown ? o.isShown() !== false : true; }catch(_){ return true; } };
    const me = {P, st, o, shown, ready: false, place: () => apply()};
    DOCKS.push(me);
    const save = () => { try{ o.store && o.store.set(KEY, Object.assign({}, st)); }catch(_){} };
    const grip = document.createElement('div'); grip.className = 'dock-grip';
    grip.style.cssText = 'position:absolute;z-index:5;touch-action:none;background:transparent';
    P.appendChild(grip);
    function apply(){
      if(!MODES.includes(st.mode)) st.mode = MODES[0];
      const m = st.mode;
      P.classList.toggle('dock-side', m === 'side'); P.classList.toggle('dock-bottom', m === 'bottom'); P.classList.toggle('dock-mini', m === 'mini');
      P.classList.toggle('dock-right', st.side === 'right'); P.classList.toggle('dock-fade', !!st.fade);
      const s = P.style; s.top = s.left = s.right = s.bottom = 'auto'; s.width = s.height = s.maxHeight = ''; s.transform = '';
      if(m === 'side'){ s[st.side] = '14px'; s.width = st.w + 'px'; s.bottom = Math.max(0, st.y) + 'px'; s.maxHeight = 'calc(100vh - ' + (Math.max(0, st.y) + 14) + 'px)';
        Object.assign(grip.style, {display: '', top: '0', bottom: '0', width: '8px', height: '', cursor: 'ew-resize', left: st.side === 'left' ? 'auto' : '0', right: st.side === 'left' ? '0' : 'auto'}); }
      else if(m === 'bottom'){ s.left = '0'; s.right = '0'; s.bottom = '0'; s.width = 'auto'; s.height = st.h + 'px'; s.maxHeight = 'none';
        Object.assign(grip.style, {display: '', top: '0', left: '0', right: '0', bottom: '', width: '', height: '7px', cursor: 'ns-resize'}); }
      else { s.width = 'auto'; grip.style.display = 'none';
        if(st.mx == null){ s[st.side] = '14px'; s.bottom = '14px'; }
        else { s.left = Math.max(0, Math.min(innerWidth - 60, st.mx)) + 'px'; s.top = Math.max(0, Math.min(innerHeight - 40, st.my == null ? innerHeight - 60 : st.my)) + 'px'; } }
      try{ o.onChange && o.onChange(Object.assign({}, st)); }catch(_){}   // first: the panel may change its own size (the folded bar)
      layout();
    }
    /* drag: side → snaps to the nearest edge (and keeps its height); mini → anywhere */
    let d = null;
    const down = e => { if(e.button !== 0 || (e.target.closest && e.target.closest('button,input,select,textarea,a,label,kbd'))) return;
      if(st.mode === 'bottom') return; const r = P.getBoundingClientRect(); d = {x: e.clientX, y: e.clientY, r, moved: false, h: e.currentTarget};
      try{ e.currentTarget.setPointerCapture(e.pointerId); }catch(_){} };
    const move = e => { if(!d) return; const dx = e.clientX - d.x, dy = e.clientY - d.y; if(!d.moved && Math.abs(dx) + Math.abs(dy) < 6) return;
      d.moved = true; P.style.transform = 'translate(' + dx + 'px,' + dy + 'px)'; P.style.transition = 'none'; };
    const up = e => { if(!d) return; const g = d; d = null; P.style.transform = ''; P.style.transition = ''; if(!g.moved) return; g.h._dragged = true; setTimeout(() => { g.h._dragged = false; }, 300);
      e.preventDefault(); e.stopPropagation();
      const dx = e.clientX - g.x, dy = e.clientY - g.y;
      if(st.mode === 'side'){ const cx = g.r.left + g.r.width / 2 + dx; st.side = cx < innerWidth / 2 ? 'left' : 'right'; st.y = Math.max(0, Math.round(innerHeight - (g.r.bottom + dy))); }
      else { st.mx = Math.round(g.r.left + dx); st.my = Math.round(g.r.top + dy); }
      apply(); save(); };
    (o.handles || []).forEach(h => { if(!h) return; h.addEventListener('pointerdown', down); h.addEventListener('pointermove', move); h.addEventListener('pointerup', up); h.addEventListener('pointercancel', () => { d = null; P.style.transform = ''; });
      h.addEventListener('click', e => { if(h._dragged){ h._dragged = false; e.stopPropagation(); e.preventDefault(); } }, true); });
    /* resize from the grip */
    let z = null;
    grip.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); z = {x: e.clientX, y: e.clientY, w: st.w, h: st.h}; try{ grip.setPointerCapture(e.pointerId); }catch(_){} });
    grip.addEventListener('pointermove', e => { if(!z) return;
      if(st.mode === 'side'){ const dx = e.clientX - z.x; st.w = Math.round(Math.max(o.minW || 240, Math.min(Math.min(620, innerWidth * .5), z.w + (st.side === 'left' ? dx : -dx)))); }
      else st.h = Math.round(Math.max(96, Math.min(innerHeight * .5, z.h - (e.clientY - z.y))));
      apply(); });
    grip.addEventListener('pointerup', () => { if(z){ z = null; save(); } });
    const api = {
      get state(){ return Object.assign({}, st); },
      mode(m){ const i = MODES.indexOf(st.mode); st.mode = m && MODES.includes(m) ? m : MODES[(i + 1) % MODES.length]; apply(); save(); return st.mode; },
      flip(){ st.side = st.side === 'left' ? 'right' : 'left'; st.mx = st.my = null; apply(); save(); },
      fade(v){ st.fade = v == null ? !st.fade : !!v; apply(); save(); return st.fade; },
      reset(){ const keep = st.mode; Object.assign(st, D, {mode: keep, fade: st.fade}); apply(); save(); },
      refresh: layout, apply
    };
    Promise.resolve(o.store ? o.store.get(KEY, null) : null).then(v => { if(v && typeof v === 'object') Object.assign(st, v);
      else if(o.legacyRight) return Promise.resolve(o.legacyRight()).then(r => { if(r) st.side = 'right'; }); })
      .catch(() => {}).then(() => { me.ready = true; apply(); });
    apply();
    return api;
  }
  window.TQDock = {attach, refresh: layout};
})();
