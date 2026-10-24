/* Shared top bar for every game and lesson: Home · Back · Next · Language.
   Added to a page with  <script src="../tq-nav.js"></script>  (tools/add-home-button.py does this).
   Language is the same "tq-lang" value the home page uses; the page's own #enB toggle (body.show-en) is kept in sync. */
(function(){
  if(window.__tqNav)return;window.__tqNav=1;
  var store={get:function(k){try{return localStorage.getItem(k)}catch(e){return null}},set:function(k,v){try{localStorage.setItem(k,v)}catch(e){}}};
  var lang=store.get('tq-lang')||((navigator.language||'').toLowerCase().indexOf('ar')===0?'ar':'en');
  var T={home:['الرئيسية','Home'],back:['رجوع','Back'],next:['التالية','Next'],other:['English','عربي'],nav:['التنقل','Site navigation'],book:['احجز','Book'],teacher:['أدوات الحلقة','Class toolkit'],site:['الموقع','Website']};
  var t=function(k){return T[k][lang==='ar'?0:1]};

  var css=document.createElement('style');
  css.textContent='#tqBar{position:sticky;top:0;z-index:60;display:flex;align-items:center;gap:6px;padding:6px max(10px,env(safe-area-inset-right,0px)) 6px max(10px,env(safe-area-inset-left,0px));padding-top:calc(6px + env(safe-area-inset-top,0px));background:rgba(11,30,45,.94);backdrop-filter:blur(8px);border-bottom:2px solid #E2B85C;font:700 15px/1 "Baloo Bhaijaan 2","Segoe UI",system-ui,sans-serif;direction:ltr;box-shadow:0 2px 12px rgba(0,0,0,.25)}'+
  '#tqBar a,#tqBar button{display:inline-flex;align-items:center;gap:6px;min-height:40px;padding:0 14px;border-radius:999px;border:2px solid #2A5675;background:#12304A;color:#F4EBD6;text-decoration:none;font:inherit;cursor:pointer;white-space:nowrap}'+
  '#tqBar a:hover,#tqBar button:hover{border-color:#E2B85C}'+
  '#tqBar .home{background:#E2B85C;border-color:#E2B85C;color:#10263A}'+
  '#tqBar .sp{flex:1}'+
  '#tqBar :focus-visible{outline:3px solid #E2B85C;outline-offset:2px}'+
  '@media (max-width:520px){#tqBar{gap:4px;padding-inline:6px}#tqBar a,#tqBar button{padding:0 10px}#tqBar .lbl{display:none}#tqBar .home .lbl{display:inline}}'+
  '#tqFloat{position:fixed;top:calc(8px + env(safe-area-inset-top,0px));inset-inline-start:8px;z-index:2147483000;display:none;gap:4px;padding:4px;border-radius:999px;background:rgba(11,30,45,.92);border:2px solid #E2B85C;box-shadow:0 2px 12px rgba(0,0,0,.35);font:700 14px/1 "Baloo Bhaijaan 2","Segoe UI",system-ui,sans-serif;direction:ltr}'+
  '#tqFloat a{display:inline-flex;align-items:center;gap:4px;min-height:36px;padding:0 12px;border-radius:999px;color:#F4EBD6;text-decoration:none;white-space:nowrap}'+
  '#tqFloat a:first-child{background:#E2B85C;color:#10263A}#tqFloat a:hover{outline:2px solid #fff}'+
  '@media print{#tqBar,#tqFloat{display:none!important}}';
  document.head.appendChild(css);

  var bar=document.createElement('nav');bar.id='tqBar';bar.setAttribute('aria-label',t('nav'));
  document.body.insertBefore(bar,document.body.firstChild);

  var here=location.pathname.split('/').pop(),dir=location.pathname.split('/').slice(-2,-1)[0];
  var nextHref=null;
  function draw(){
    var home='../'+(dir==='lessons'?'#lessons':'');
    bar.setAttribute('aria-label',t('nav'));
    bar.innerHTML='<a class="home" href="'+home+'"><img src="../assets/brand/emblem.svg" alt="" style="width:26px;height:26px;margin:-4px 0"> <span class="lbl">'+t('home')+'</span></a>'+
      '<button type="button" id="tqBack">← <span class="lbl">'+t('back')+'</span></button>'+
      '<a class="tch" href="../teacher.html" title="'+t('teacher')+'">👩‍🏫 <span class="lbl">'+t('teacher')+'</span></a>'+
      '<span class="sp"></span>'+
      (nextHref?'<a href="'+nextHref+'" id="tqNext"><span class="lbl">'+t('next')+'</span> ▶</a>':'')+
      '<button type="button" id="tqLang" aria-label="Language / اللغة">🌐 '+t('other')+'</button>';
    document.getElementById('tqBack').onclick=function(){
      var same=false;try{same=document.referrer&&new URL(document.referrer).origin===location.origin}catch(e){}
      if(same&&history.length>1)history.back();else location.href=home;};
    document.getElementById('tqLang').onclick=function(){setLang(lang==='ar'?'en':'ar')};
  }

  /* keep the page's own English toggle (body.show-en, #enB) in step with the site language */
  function applyToPage(){
    var on=lang==='en',b=document.body;
    if(on!==b.classList.contains('show-en')){var btn=document.getElementById('enB')||document.getElementById('enT');if(btn)btn.click();else b.classList.toggle('show-en',on)}
    b.dataset.lang=lang;document.documentElement.setAttribute('data-lang',lang);
    window.dispatchEvent(new CustomEvent('tq-lang',{detail:lang}));
  }
  function setLang(l){lang=l;store.set('tq-lang',l);draw();if(window.__tqFloat)window.__tqFloat();applyToPage()}
  new MutationObserver(function(){var on=document.body.classList.contains('show-en');if(on!==(lang==='en')){lang=on?'en':'ar';store.set('tq-lang',lang);draw();if(window.__tqFloat)window.__tqFloat();window.dispatchEvent(new CustomEvent('tq-lang',{detail:lang}))}})
    .observe(document.body,{attributes:true,attributeFilter:['class']});
  window.TQ={get lang(){return lang},t:function(ar,en){return lang==='ar'?ar:en},onLang:function(f){window.addEventListener('tq-lang',function(e){f(e.detail)})}};

  /* a small always-reachable "Website / Teacher" pill that appears whenever the top bar is scrolled away or the page is full screen */
  var fl=document.createElement('div');fl.id='tqFloat';fl.setAttribute('role','navigation');document.body.appendChild(fl);
  function drawFloat(){var home='../'+(dir==='lessons'?'#lessons':'');fl.innerHTML='<a href="'+home+'">🏠 '+t('site')+'</a><a href="../teacher.html" title="'+t('teacher')+'">👩‍🏫</a>'}
  var barSeen=true;function upd(){fl.style.display=(!barSeen||document.fullscreenElement||document.webkitFullscreenElement)?'inline-flex':'none'}
  if('IntersectionObserver' in window)new IntersectionObserver(function(es){barSeen=es[0].isIntersecting;upd()},{threshold:.2}).observe(bar);
  document.addEventListener('fullscreenchange',upd);document.addEventListener('webkitfullscreenchange',upd);
  window.__tqFloat=drawFloat;draw();drawFloat();
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',applyToPage);else applyToPage();

  /* "Next" = the following item in the same list on the home page */
  var s=document.createElement('script');s.src='../games.js';
  s.onload=function(){
    var list=(dir==='lessons'?window.LESSONS:window.GAMES)||[];
    var live=list.filter(function(g){return g.file}).sort(function(a,b){return (b.date||'').localeCompare(a.date||'')});
    var i=live.findIndex(function(g){return g.file===here});
    if(i>=0){var n=live[(i+1)%live.length];if(n&&n.file!==here){nextHref=n.file;draw()}}
  };
  document.head.appendChild(s);
})();
