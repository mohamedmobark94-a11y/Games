/* the side panel, dressed like the Quran.com corrector: a floating card over the page */
(function(){
  const $ = id => document.getElementById(id);
  const side = document.querySelector('.mz-side'); if(!side) return;
  const key = (k, ctrl) => document.dispatchEvent(new KeyboardEvent('keydown', {key: k, ctrlKey: !!ctrl, bubbles: true}));

  // header with collapse
  const hd = document.createElement('div'); hd.className = 'qp-hd';
  hd.innerHTML = '<b>📖 مصحح محمد مبارك</b><span class="qp-sub">الواضح في التجويد</span><button type="button" id="qpMin" title="صغّر">—</button>';
  side.prepend(hd);
  $('qpMin').onclick = () => { side.classList.toggle('min'); $('qpMin').textContent = side.classList.contains('min') ? '▢' : '—'; };

  // student box: no label, Enter leaves the box so D / F8 work again
  const st = $('mzStudent');
  try{ const v = localStorage.getItem('mzStudent'); if(v && !st.value) st.value = v; }catch(_){}
  st.addEventListener('input', () => { try{ localStorage.setItem('mzStudent', st.value); }catch(_){} });
  st.addEventListener('keydown', e => { if(e.key === 'Enter'){ e.preventDefault(); st.blur(); } });
  st.placeholder = 'اسم الطالب';

  // the big actions, like Quran.com
  const acts = document.createElement('div'); acts.className = 'qp-acts';
  acts.innerHTML =
    '<button type="button" class="qp-b red" id="qpMark">🔴 سجّل غلطة <kbd>F8</kbd></button>' +
    '<button type="button" class="qp-b" id="qpDraw">✏️ رسم / هايلايت <kbd>D</kbd></button>';
  const errCard = $('mzCount').closest('.mz-card');
  errCard.parentNode.insertBefore(acts, errCard);
  $('qpMark').onclick = () => { st.blur(); key('F8'); };
  $('qpDraw').onclick = () => { st.blur(); key('d'); };

  // the bottom buttons: report (gold) + copy to the generator
  const fin = $('mzFinish'); fin.innerHTML = '📤 تقرير الطالب <kbd>F9</kbd>';
  const toR = $('mzToReport'); toR.innerHTML = '📋 انسخ للمولّد';
  const row = document.createElement('div'); row.className = 'qp-row';
  fin.parentNode.insertBefore(row, fin); row.appendChild(fin); row.appendChild(toR);
  const wa = $('mzWa'); wa.innerHTML = '🟢 واتساب'; wa.parentNode.classList.add('qp-one');

  // the red button and the D button show when they are on
  const tools = document.querySelectorAll('#page-mushaf [data-tool]');
  const sync = () => {
    const t = document.querySelector('#page-mushaf [data-tool].on'); const v = t ? t.dataset.tool : 'hand';
    $('qpMark').classList.toggle('on', v === 'mark'); $('qpDraw').classList.toggle('on', v === 'pen' || v === 'hl');
  };
  new MutationObserver(sync).observe(document.getElementById('mzTools'), {subtree: true, attributes: true, attributeFilter: ['class']});
  sync();

  // 7-أ: side / bottom bar / mini — the panel docks and the page makes room (assets/panel-dock.js)
  if(window.TQDock){
    $('qpMin').insertAdjacentHTML('beforebegin', '<button type="button" id="qpMode" title="شكل اللوحة: جانبية ← شريط تحت ← صغيرة">▮</button><button type="button" id="qpFlip" title="انقل اللوحة للناحية التانية">⇆</button><button type="button" id="qpFade" title="شفافة لما الماوس يبعد عنها">👻</button><button type="button" id="qpReset" title="↺ رجّع المكان والمقاس">↺</button>');
    $('qpMin').title = 'اخفي (F2)';
    const mini = document.createElement('div'); mini.className = 'qp-mini'; mini.title = 'اسحبها لأي مكان';
    mini.innerHTML = '<b id="qpMiniN">0</b><button type="button" id="qpMiniRec">🔴 سجّل غلطة <kbd>F8</kbd></button><button type="button" class="pl" id="qpMiniOpen" title="كبّر اللوحة">▢</button>';
    side.appendChild(mini);
    const cnt = $('mzCount'); const syncN = () => { $('qpMiniN').textContent = cnt.textContent; };
    new MutationObserver(syncN).observe(cnt, {childList: true, characterData: true, subtree: true}); syncN();
    const ls = {get: (k, d) => { try{ const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; }catch(_){ return d; } }, set: (k, v) => { try{ localStorage.setItem(k, JSON.stringify(v)); }catch(_){} }};
    let hidden = false;
    const ICON = {side: '▮', bottom: '▬', mini: '•'};
    const dock = TQDock.attach({panel: side, handles: [hd, mini], store: ls, key: 'mz-dock',
      isShown: () => !hidden && !side.classList.contains('min'),
      toggle: () => { hidden = !hidden; side.style.display = hidden ? 'none' : ''; },
      onChange: s => { $('qpMode').textContent = ICON[s.mode]; $('qpFlip').style.display = s.mode === 'side' ? '' : 'none'; $('qpFade').style.opacity = s.fade ? '1' : '.55'; }});
    $('qpMode').onclick = () => dock.mode(); $('qpFlip').onclick = () => dock.flip(); $('qpFade').onclick = () => dock.fade(); $('qpReset').onclick = () => dock.reset();
    $('qpMiniRec').onclick = () => { st.blur(); key('F8'); }; $('qpMiniOpen').onclick = () => dock.mode('side');
    $('qpMin').addEventListener('click', () => dock.refresh());
    // the bottom bar: drag the mistakes list sideways
    const L = $('mzList'); let lx = null;
    L.addEventListener('pointerdown', e => { if(!side.classList.contains('dock-bottom') || e.target.closest('button')) return; lx = {x: e.clientX, s: L.scrollLeft}; });
    L.addEventListener('pointermove', e => { if(lx) L.scrollLeft = lx.s - (e.clientX - lx.x); });
    addEventListener('pointerup', () => { lx = null; });
  }

  if(window.__mzStart) window.__mzStart();
})();
