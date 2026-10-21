/* Homework links. A homework link is any game/lesson URL with  ?hw=<code>  (the teacher dashboard builds it).
   While it is open the student sees a banner; "Finish & send" builds a result (time, taps, and the score if the page
   offers one via window.TQHW_GET → {score,max,detail}) that is sent to the teacher on WhatsApp as text plus a link
   (teacher.html#r=<code>) which opens in the teacher dashboard and is saved there. No server is needed. */
(function(){
  if(window.__tqHw)return;
  var b64=function(o){return btoa(unescape(encodeURIComponent(JSON.stringify(o)))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')};
  var unb=function(s){s=s.replace(/-/g,'+').replace(/_/g,'/');while(s.length%4)s+='=';return JSON.parse(decodeURIComponent(escape(atob(s))))};
  window.TQHWCodec={enc:b64,dec:unb};
  var q=new URLSearchParams(location.search).get('hw');if(!q)return;
  var hw;try{hw=unb(q)}catch(e){return}
  window.__tqHw=1;
  var lang=function(){return document.body.classList.contains('show-en')?'en':'ar'};
  var T=function(a,e){return lang()==='en'?e:a};
  var t0=Date.now(),active=0,last=Date.now(),clicks=0;
  document.addEventListener('pointerdown',function(){clicks++;last=Date.now()},true);
  document.addEventListener('keydown',function(){last=Date.now()},true);
  setInterval(function(){if(!document.hidden&&Date.now()-last<60000)active++},1000);
  var css=document.createElement('style');
  css.textContent='#tqHw{position:fixed;inset-inline:0;bottom:0;z-index:2147482000;display:flex;flex-wrap:wrap;align-items:center;gap:8px 12px;padding:8px 14px calc(8px + env(safe-area-inset-bottom,0px));background:#0B1E2D;border-top:3px solid #25D366;color:#F4EBD6;font:700 15px/1.3 "Baloo Bhaijaan 2","Segoe UI",system-ui,sans-serif}'+
  '#tqHw b{color:#E2B85C}#tqHw .sp{flex:1}#tqHw button{font:inherit;border:0;border-radius:999px;background:#25D366;color:#06331A;min-height:42px;padding:0 18px;cursor:pointer;font-weight:800}'+
  '#tqHwM{position:fixed;inset:0;z-index:2147483100;background:rgba(5,14,22,.8);display:grid;place-items:center;padding:16px}'+
  '#tqHwM .box{background:#163A57;border:3px solid #25D366;border-radius:22px;max-width:520px;width:100%;padding:18px;color:#F4EBD6;font:600 16px/1.6 "Baloo Bhaijaan 2","Segoe UI",system-ui,sans-serif;display:flex;flex-direction:column;gap:10px}'+
  '#tqHwM h3{margin:0;color:#E2B85C;font-size:1.3rem}#tqHwM pre{white-space:pre-wrap;margin:0;background:#0B1E2D;border-radius:12px;padding:10px 12px;font:600 14px/1.6 system-ui;direction:ltr;text-align:left;max-height:34vh;overflow:auto}'+
  '#tqHwM .row{display:flex;flex-wrap:wrap;gap:8px}#tqHwM button,#tqHwM a{font:inherit;font-weight:800;border:2px solid #2A5675;background:#12304A;color:#F4EBD6;border-radius:999px;padding:0 16px;min-height:42px;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center}'+
  '#tqHwM .go{background:#25D366;border-color:#25D366;color:#06331A}body{padding-bottom:70px}@media print{#tqHw,#tqHwM{display:none}}';
  document.head.appendChild(css);
  var bar=document.createElement('div');bar.id='tqHw';document.body.appendChild(bar);
  var fmt=function(s){var m=Math.floor(s/60),x=s%60;return m+':'+(x<10?'0':'')+x};
  function draw(){bar.innerHTML='<span>📚 '+T('واجب','Homework')+(hw.s?' · <b>'+esc(hw.s)+'</b>':'')+(hw.n?' — '+esc(hw.n):'')+'</span><span class="sp"></span><span id="tqHwT">⏱ '+fmt(active)+'</span><button type="button" id="tqHwB">📤 '+T('أنهيت: أرسل النتيجة','Done: send my result')+'</button>';
    document.getElementById('tqHwB').onclick=finish}
  function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
  setInterval(function(){var e=document.getElementById('tqHwT');if(e)e.textContent='⏱ '+fmt(active)},1000);
  window.addEventListener('tq-lang',draw);
  function collect(){
    var r={f:location.pathname.split('/').slice(-2).join('/'),ti:document.title.split('|')[0].trim(),s:hw.s||'',n:hw.n||'',d:new Date().toISOString(),t:active,c:clicks};
    try{var fl=r.f.split('/')[1],all=(window.GAMES||[]).concat(window.LESSONS||[]);for(var i=0;i<all.length;i++)if(all[i].file===fl){r.ti=all[i].ar;r.te=all[i].en;break}}catch(e){}
    try{var g=window.TQHW_GET&&window.TQHW_GET();if(g&&g.max!=null){r.sc=g.score;r.mx=g.max;if(g.detail)r.dt=g.detail}}catch(e){}
    if(r.mx==null){var a=document.getElementById('sc'),m=document.getElementById('st');
      if(a&&m){var x=parseInt(String(a.textContent).replace(/[٠-٩]/g,function(d){return '٠١٢٣٤٥٦٧٨٩'.indexOf(d)}),10),y=parseInt(String(m.textContent).replace(/[٠-٩]/g,function(d){return '٠١٢٣٤٥٦٧٨٩'.indexOf(d)}),10);if(!isNaN(x)&&!isNaN(y)){r.sc=x;r.mx=y}}}
    return r}
  function teacherBase(){var p=location.pathname.replace(/[^\/]*\/[^\/]*$/,'');return location.origin+p+'teacher.html'}
  function summary(r){var L=lang()==='en';
    return (L?'Homework result':'نتيجة واجب')+'\n'+(L?'Student: ':'الطالب: ')+(r.s||'-')+'\n'+(L?'Item: ':'الدرس/اللعبة: ')+(L&&r.te?r.te:r.ti)+(r.n?'\n'+(L?'Note: ':'ملاحظة: ')+r.n:'')+
      '\n'+(r.mx!=null?(L?'Score: ':'الدرجة: ')+r.sc+' / '+r.mx+(r.dt?' ('+r.dt+')':'')+'\n':'')+(L?'Time: ':'الوقت: ')+fmt(r.t)+(L?' · Taps: ':' · نقرات: ')+r.c}
  function finish(){
    var r=collect(),code=b64(r),link=teacherBase()+'#r='+code,sum=summary(r),msg=sum+'\n'+link;
    var num=(window.SITE&&SITE.contact&&SITE.contact.whatsapp)||'';
    var m=document.createElement('div');m.id='tqHwM';
    m.innerHTML='<div class="box" role="dialog" aria-modal="true"><h3>✅ '+T('نتيجتك جاهزة','Your result is ready')+'</h3><pre>'+esc(sum)+'</pre><div class="row"><a class="go" target="_blank" rel="noopener" href="https://wa.me/'+num+'?text='+encodeURIComponent(msg)+'">📲 '+T('أرسلها للمعلم على واتساب','Send to the teacher on WhatsApp')+'</a><button type="button" id="tqHwC">📋 '+T('نسخ','Copy')+'</button><button type="button" id="tqHwX">'+T('رجوع','Back')+'</button></div></div>';
    document.body.appendChild(m);
    m.querySelector('#tqHwX').onclick=function(){m.remove()};
    m.querySelector('#tqHwC').onclick=function(){var b=this;(navigator.clipboard?navigator.clipboard.writeText(msg):Promise.reject()).then(function(){b.textContent='✓'},function(){})};
    try{localStorage.setItem('tq-hw-last',JSON.stringify(r))}catch(e){}
  }
  var go=function(){draw()};if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',go);else go();
})();
