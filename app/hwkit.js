/* Tarteel homework kit — for interactive homework pages (games, quizzes, recordings) that the student opens
   from their homework link. The page runs inside hw.html and hands its result back, so it is saved with the
   submission and the teacher sees it in 📥 Submissions.

   In the homework page:
     <script src="../app/hwkit.js"></script>
     TQHW.lang                      'ar' | 'en' (follows the homework page's language button)
     TQHW.name                      the student's name in that language ('' when previewing)
     TQHW.on('lang', fn)            called when the language changes
     TQHW.result({score, max, done, details})
                                    call whenever progress changes; the last call is what gets sent.
                                    details: [{q, a, ok}] — what the teacher reads (question, student's answer, right/wrong)
     TQHW.recording(blob, label)    hand a voice recording to the submission (at most 5 per page)
     TQHW.recordButton(el, label)   ready-made 🎙️ record / ⏹ stop / 🔁 again button + player inside el
   Opened on its own (no homework link) the page still works: results show as a small preview note. */
(function(){
  const embedded = window.parent !== window;
  const qs = new URLSearchParams(location.search);
  let lang = qs.get('lang') || (function(){ try{ return localStorage.getItem('tq-lang'); }catch(_){ return null; } })() || 'ar';
  const subs = {lang: []};
  const send = m => { if(embedded) window.parent.postMessage(Object.assign({tq: 'hw'}, m), '*'); };
  const K = {
    get lang(){ return lang; }, name: qs.get('name') || '', embedded,
    on(ev, fn){ (subs[ev] = subs[ev] || []).push(fn); },
    result(r){
      r = r || {};
      const out = {score: r.score == null ? null : +r.score, max: r.max == null ? null : +r.max, done: !!r.done,
        details: (r.details || []).slice(0, 60).map(d => ({q: String(d.q == null ? '' : d.q).slice(0, 300), a: String(d.a == null ? '' : d.a).slice(0, 300), ok: d.ok == null ? null : !!d.ok}))};
      if(embedded) send({kind: 'result', result: out}); else preview(out);
    },
    recording(blob, label){ if(blob) send({kind: 'rec', blob, type: (blob.type || 'audio/webm').split(';')[0], label: String(label || '').slice(0, 120)}); },
    recordButton(el, label){
      const T = {rec: ['🎙️ سجّل صوتك', '🎙️ Record your voice'], stop: ['⏹ إيقاف', '⏹ Stop'], again: ['🔁 سجّل تاني', '🔁 Record again'],
        nomic: ['المتصفح ما سمحش بالميكروفون. اسمح بالميكروفون وجرّب تاني.', 'The browser did not allow the microphone. Please allow it and try again.']};
      const L = k => T[k][lang === 'en' ? 1 : 0];
      const b = document.createElement('button'), au = document.createElement('audio');
      b.type = 'button'; b.className = 'tqhw-rec'; au.controls = true; au.hidden = true;
      b.style.cssText = 'font:inherit;font-weight:800;border:0;border-radius:14px;padding:8px 18px;min-height:48px;cursor:pointer;background:#E74C3C;color:#fff';
      au.style.cssText = 'display:block;width:100%;margin-top:8px';
      let mr = null, has = false;
      const label_ = () => { b.textContent = mr ? L('stop') : has ? L('again') : L('rec'); };
      b.onclick = async () => {
        if(mr){ mr.stop(); return; }
        let stream; try{ stream = await navigator.mediaDevices.getUserMedia({audio: true}); }catch(_){ alert(L('nomic')); return; }
        const chunks = []; mr = new MediaRecorder(stream);
        mr.ondataavailable = e => { if(e.data.size) chunks.push(e.data); };
        mr.onstop = () => { stream.getTracks().forEach(t => t.stop()); const blob = new Blob(chunks, {type: (mr.mimeType || 'audio/webm').split(';')[0]});
          mr = null; has = true; if(au.src) URL.revokeObjectURL(au.src); au.src = URL.createObjectURL(blob); au.hidden = false; label_(); K.recording(blob, label); };
        mr.start(); label_();
      };
      K.on('lang', label_); label_(); el.appendChild(b); el.appendChild(au); return b;
    }
  };
  function preview(r){
    let n = document.getElementById('tqhwPrev');
    if(!n){ n = document.createElement('div'); n.id = 'tqhwPrev';
      n.style.cssText = 'position:fixed;inset-inline-start:10px;bottom:10px;z-index:99;background:#163A57;color:#F4EBD6;border:1px solid #E2B85C;border-radius:12px;padding:6px 12px;font:600 13px system-ui;max-width:80vw';
      document.body.appendChild(n); }
    n.textContent = 'معاينة · Preview: ' + (r.max ? r.score + ' / ' + r.max : '') + (r.done ? ' ✓' : '');
  }
  window.addEventListener('message', e => {
    const m = e.data; if(e.source !== window.parent || !m || m.tq !== 'hw') return;
    if(m.kind === 'init' || m.kind === 'lang'){ if(m.name != null) K.name = m.name; if(m.lang && m.lang !== lang){ lang = m.lang; (subs.lang || []).forEach(f => f(lang)); } }
  });
  if(embedded){
    /* the content's own height (not the frame's), so the frame can shrink as well as grow */
    const h = () => { const b = document.body; if(!b) return; const cs = getComputedStyle(b);
      send({kind: 'height', h: Math.ceil(b.getBoundingClientRect().height + parseFloat(cs.marginTop) + parseFloat(cs.marginBottom))}); };
    addEventListener('load', () => { h(); if(window.ResizeObserver) new ResizeObserver(h).observe(document.body); });
    send({kind: 'ready'});
  }
  window.TQHW = K;
})();
