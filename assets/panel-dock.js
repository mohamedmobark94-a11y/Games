/* TQDock: the corrector's panel stops covering the mushaf.
   Used by the Edge add-on on Quran.com (content.js, panel inside a shadow root) and by the Al-Wadih corrector
   (app/mushaf on the site + mushaf.html in the add-on).
     TQDock.attach({panel, handles:[el…], store:{get(k,d), set(k,v)} (may be async), key, isShown(), onChange(state)})
   Three modes (the panel's mode button cycles them, the choice is remembered):
     side    docked to the left or right edge; the page is pushed aside (padding on <html>) by the panel's width
     bottom  a bar across the bottom; the page gets the same space at its end (and scroll-padding), nothing hides under it
     mini    a small capsule (the panel draws it: mistakes count + «سجّل غلطة»), dragged anywhere
   Drag from the header (side: snaps to the nearest edge), resize from the inner edge / top edge, «↺» resets,
   «fade» makes it see-through (.35) while the mouse is away. F2 (or the ` key) hides / shows it at once.
   CSS hooks on the panel: .dock-side .dock-bottom .dock-mini .dock-right .dock-fade; on <html>: --dock-l --dock-r --dock-b. */
(function(){
  if(window.TQDock) return;
  const DEF = {mode: 'side', side: 'left', w: 340, h: 156, y: 14, mx: null, my: null, fade: false};
  const css = id => { let s = document.getElementById(id); if(!s){ s = document.createElement('style'); s.id = id; (document.head || document.documentElement).appendChild(s); } return s; };
  function attach(o){
    const P = o.panel, st = Object.assign({}, DEF), KEY = o.key || 'dock';
    const shown = () => { try{ return o.isShown ? o.isShown() !== false : true; }catch(_){ return true; } };
    let ready = false;
    const save = () => { try{ o.store && o.store.set(KEY, Object.assign({}, st)); }catch(_){} };
    const grip = document.createElement('div'); grip.className = 'dock-grip';
    grip.style.cssText = 'position:absolute;z-index:5;touch-action:none;background:transparent';
    P.appendChild(grip);
    function apply(){
      const m = st.mode;
      P.classList.toggle('dock-side', m === 'side'); P.classList.toggle('dock-bottom', m === 'bottom'); P.classList.toggle('dock-mini', m === 'mini');
      P.classList.toggle('dock-right', st.side === 'right'); P.classList.toggle('dock-fade', !!st.fade);
      const s = P.style; s.top = s.left = s.right = s.bottom = 'auto'; s.width = s.height = s.maxHeight = ''; s.transform = '';
      if(m === 'side'){ s[st.side] = '14px'; s.width = st.w + 'px'; s.bottom = Math.max(0, st.y) + 'px'; s.maxHeight = 'calc(100vh - ' + (Math.max(0, st.y) + 14) + 'px)';
        Object.assign(grip.style, {display: '', top: '0', bottom: '0', width: '8px', height: '', cursor: 'ew-resize', left: st.side === 'left' ? 'auto' : '0', right: st.side === 'left' ? '0' : 'auto'}); }
      else if(m === 'bottom'){ s.left = '0'; s.right = '0'; s.bottom = '0'; s.width = 'auto'; s.height = st.h + 'px'; s.maxHeight = 'none';
        Object.assign(grip.style, {display: '', top: '0', left: '0', right: '0', bottom: '', width: '', height: '7px', cursor: 'ns-resize'}); }
      else { const x = st.mx == null ? 14 : st.mx, y = st.my == null ? null : st.my;
        s.left = Math.max(0, Math.min(innerWidth - 60, x)) + 'px'; if(y == null) s.bottom = '14px'; else s.top = Math.max(0, Math.min(innerHeight - 40, y)) + 'px';
        s.width = 'auto'; grip.style.display = 'none'; }
      push();
      try{ o.onChange && o.onChange(Object.assign({}, st)); }catch(_){}
    }
    function push(){
      const on = shown();
      let l = 0, r = 0, b = 0;
      if(on && st.mode === 'side'){ if(st.side === 'left') l = st.w + 28; else r = st.w + 28; }
      if(on && st.mode === 'bottom') b = st.h + 10;
      if(on && st.mode === 'mini' && st.my == null) b = (P.offsetHeight || 44) + 22;   // the capsule in its own corner gets its own strip
      css('tq-dock-push').textContent = 'html{--dock-l:' + l + 'px;--dock-r:' + r + 'px;--dock-b:' + b + 'px;' +
        (l ? 'padding-left:' + l + 'px!important;' : '') + (r ? 'padding-right:' + r + 'px!important;' : '') +
        (b ? 'padding-bottom:' + b + 'px!important;scroll-padding-bottom:' + b + 'px;' : '') + '}';
      clearTimeout(push.t); push.t = setTimeout(() => dispatchEvent(new Event('resize')), 60);   // layouts that measure the window refit
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
      if(st.mode === 'side'){ const dx = e.clientX - z.x; st.w = Math.round(Math.max(260, Math.min(Math.min(620, innerWidth * .5), z.w + (st.side === 'left' ? dx : -dx)))); }
      else st.h = Math.round(Math.max(96, Math.min(innerHeight * .5, z.h - (e.clientY - z.y))));
      apply(); });
    grip.addEventListener('pointerup', () => { if(z){ z = null; save(); } });
    /* F2 or ` : hide / show at once (never while typing) */
    document.addEventListener('keydown', e => {
      if(!(e.key === 'F2' || e.code === 'Backquote') || e.ctrlKey || e.metaKey || e.altKey) return;
      const typing = (e.composedPath ? e.composedPath() : [e.target]).some(n => n && (n.tagName === 'INPUT' || n.tagName === 'TEXTAREA' || n.isContentEditable));
      if(typing && e.key !== 'F2') return;
      e.preventDefault(); e.stopPropagation(); if(o.toggle) o.toggle(); setTimeout(push, 0);
    }, true);
    addEventListener('resize', () => { if(st.mode === 'mini' && ready) apply(); });
    const api = {
      get state(){ return Object.assign({}, st); },
      mode(m){ st.mode = m || ({side: 'bottom', bottom: 'mini', mini: 'side'})[st.mode]; apply(); save(); return st.mode; },
      flip(){ st.side = st.side === 'left' ? 'right' : 'left'; apply(); save(); },
      fade(v){ st.fade = v == null ? !st.fade : !!v; apply(); save(); return st.fade; },
      reset(){ const keep = st.mode; Object.assign(st, DEF, {mode: keep, fade: st.fade}); apply(); save(); },
      refresh: push, apply
    };
    Promise.resolve(o.store ? o.store.get(KEY, null) : null).then(v => { if(v && typeof v === 'object') Object.assign(st, v);
      else if(o.legacyRight) return Promise.resolve(o.legacyRight()).then(r => { if(r) st.side = 'right'; }); })
      .catch(() => {}).then(() => { ready = true; apply(); });
    apply();
    return api;
  }
  window.TQDock = {attach};
})();
