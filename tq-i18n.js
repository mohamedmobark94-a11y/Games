/* Shared bilingual helpers (see tq-i18n.css).
   TQI.U(ar,en,blk)  → <span class="ui-ar">ar</span><span class="ui-en">en</span>   (use inside template strings)
   TQI.tr(en)        → English translation line shown under an Arabic quotation (English mode only)
   TQI.ref('الفاتحة: ٤') → Arabic as written, or "Al-Fatihah 1:4" in English mode (both emitted by TQI.R)
   Elements with data-ar / data-en (also <option>) are relabelled automatically when the language changes. */
(function(){
  var U=function(a,e,blk){return '<span class="ui-ar">'+a+'</span><span class="ui-en'+(blk?' blk':'')+'">'+e+'</span>'};
  var AR_DIG='٠١٢٣٤٥٦٧٨٩';
  var SURAHS='الفاتحة|Al-Fatihah;البقرة|Al-Baqarah;آل عمران|Ali \'Imran;النساء|An-Nisa;المائدة|Al-Ma\'idah;الأنعام|Al-An\'am;الأعراف|Al-A\'raf;الأنفال|Al-Anfal;التوبة|At-Tawbah;يونس|Yunus;هود|Hud;يوسف|Yusuf;الرعد|Ar-Ra\'d;إبراهيم|Ibrahim;الحجر|Al-Hijr;النحل|An-Nahl;الإسراء|Al-Isra;الكهف|Al-Kahf;مريم|Maryam;طه|Ta-Ha;الأنبياء|Al-Anbiya;الحج|Al-Hajj;المؤمنون|Al-Mu\'minun;النور|An-Nur;الفرقان|Al-Furqan;الشعراء|Ash-Shu\'ara;النمل|An-Naml;القصص|Al-Qasas;العنكبوت|Al-\'Ankabut;الروم|Ar-Rum;لقمان|Luqman;السجدة|As-Sajdah;الأحزاب|Al-Ahzab;سبأ|Saba;فاطر|Fatir;يس|Ya-Sin;الصافات|As-Saffat;ص|Sad;الزمر|Az-Zumar;غافر|Ghafir;فصلت|Fussilat;الشورى|Ash-Shura;الزخرف|Az-Zukhruf;الدخان|Ad-Dukhan;الجاثية|Al-Jathiyah;الأحقاف|Al-Ahqaf;محمد|Muhammad;الفتح|Al-Fath;الحجرات|Al-Hujurat;ق|Qaf;الذاريات|Adh-Dhariyat;الطور|At-Tur;النجم|An-Najm;القمر|Al-Qamar;الرحمن|Ar-Rahman;الواقعة|Al-Waqi\'ah;الحديد|Al-Hadid;المجادلة|Al-Mujadilah;الحشر|Al-Hashr;الممتحنة|Al-Mumtahanah;الصف|As-Saff;الجمعة|Al-Jumu\'ah;المنافقون|Al-Munafiqun;التغابن|At-Taghabun;الطلاق|At-Talaq;التحريم|At-Tahrim;الملك|Al-Mulk;القلم|Al-Qalam;الحاقة|Al-Haqqah;المعارج|Al-Ma\'arij;نوح|Nuh;الجن|Al-Jinn;المزمل|Al-Muzzammil;المدثر|Al-Muddaththir;القيامة|Al-Qiyamah;الإنسان|Al-Insan;المرسلات|Al-Mursalat;النبأ|An-Naba;النازعات|An-Nazi\'at;عبس|\'Abasa;التكوير|At-Takwir;الانفطار|Al-Infitar;المطففين|Al-Mutaffifin;الانشقاق|Al-Inshiqaq;البروج|Al-Buruj;الطارق|At-Tariq;الأعلى|Al-A\'la;الغاشية|Al-Ghashiyah;الفجر|Al-Fajr;البلد|Al-Balad;الشمس|Ash-Shams;الليل|Al-Layl;الضحى|Ad-Duha;الشرح|Ash-Sharh;التين|At-Tin;العلق|Al-\'Alaq;القدر|Al-Qadr;البينة|Al-Bayyinah;الزلزلة|Az-Zalzalah;العاديات|Al-\'Adiyat;القارعة|Al-Qari\'ah;التكاثر|At-Takathur;العصر|Al-\'Asr;الهمزة|Al-Humazah;الفيل|Al-Fil;قريش|Quraysh;الماعون|Al-Ma\'un;الكوثر|Al-Kawthar;الكافرون|Al-Kafirun;النصر|An-Nasr;المسد|Al-Masad;الإخلاص|Al-Ikhlas;الفلق|Al-Falaq;الناس|An-Nas';
  var norm=function(s){return String(s).replace(/[ً-ٰٟـ]/g,'').replace(/[أإآٱ]/g,'ا').replace(/ى/g,'ي').replace(/\s+/g,' ').trim()};
  var MAP={},LIST=SURAHS.split(';');
  LIST.forEach(function(p,i){var a=p.split('|');MAP[norm(a[0])]={n:i+1,en:a[1]}});
  var west=function(s){return String(s).replace(/[٠-٩]/g,function(d){return AR_DIG.indexOf(d)})};
  /* 'الفاتحة: ٤' · 'آل عمران: ١–٢' · 'يوسف: ١٦'  →  "Al-Fatihah 1:4" */
  function ref(s){
    var m=String(s).match(/^\s*([^:：]+?)\s*[:：]\s*([٠-٩0-9]+(?:\s*[–\-]\s*[٠-٩0-9]+)?)\s*$/);
    if(!m)return s;var k=MAP[norm(m[1])];if(!k)return s;
    return k.en+' '+k.n+':'+west(m[2]).replace(/\s*[–\-]\s*/,'–');
  }
  var R=function(s){var e=ref(s);return e===s?s:U(s,e)};
  var tr=function(e){return '<span class="tr">'+e+'</span>'};
  window.TQI={U:U,R:R,ref:ref,tr:tr,surahs:MAP};

  /* data-ar / data-en relabelling (works on <option>, <label>, <button>, plain text) */
  function relabel(){
    var en=document.body.classList.contains('show-en');
    document.querySelectorAll('[data-en]').forEach(function(el){
      if(!el.hasAttribute('data-ar'))el.setAttribute('data-ar',el.textContent);
      el.textContent=el.getAttribute(en?'data-en':'data-ar');
    });
    document.querySelectorAll('[data-en-title]').forEach(function(el){
      if(!el.hasAttribute('data-ar-title'))el.setAttribute('data-ar-title',el.getAttribute('title')||'');
      el.setAttribute('title',el.getAttribute(en?'data-en-title':'data-ar-title'));
    });
  }
  window.TQI.relabel=relabel;

  /* Exact-string dictionary for UI text that repeats across pages (pen tools, whiteboard…). Matches whole text nodes and
     title / aria-label attributes; the original is remembered so switching back to Arabic restores it. */
  var DICT={'✏️ قلم / سبورة':'✏️ Pen / whiteboard','أدوات الكتابة (D)':'Writing tools (D)','أدوات الكتابة':'Writing tools',
    'تحكم في الدرس (V / Esc)':'Back to the lesson (V / Esc)','تحكم في الدرس':'Lesson control','قلم (P)':'Pen (P)','قلم':'Pen',
    'هايلايتر لتظليل الكلمات (H)':'Highlighter (H)','هايلايتر':'Highlighter','ممحاة (E)':'Eraser (E)','ممحاة':'Eraser',
    'مؤشر ليزر (L)':'Laser pointer (L)','مؤشر ليزر':'Laser pointer','لون':'Colour','سُمك':'Thickness','تراجع (Ctrl+Z)':'Undo (Ctrl+Z)','تراجع':'Undo',
    'امسح كتابة هذه المحطة':'Clear the writing on this station','مسح':'Clear','سبورة بيضاء (W)':'Whiteboard (W)','سبورة بيضاء':'Whiteboard',
    'إغلاق أدوات الكتابة (D)':'Close writing tools (D)','إغلاق':'Close','سبورة بيضاء · Whiteboard':'Whiteboard'};
  var PATS=[[/^لون (#[0-9a-f]+)$/i,'Colour $1'],[/^سمك (\d+)$/,'Thickness $1']];
  var ATTRS=['title','aria-label'];
  function tr1(v){var k=String(v).trim();if(DICT.hasOwnProperty(k))return DICT[k];for(var i=0;i<PATS.length;i++)if(PATS[i][0].test(k))return k.replace(PATS[i][0],PATS[i][1]);return null}
  /* a dictionary value starting with "§" keeps the Arabic (a verse, a hadith) and adds the English translation underneath */
  function txNode(n,en){
    var raw=n.__tqo!==undefined?n.__tqo:n.nodeValue,m=raw.match(/^(\s*)([\s\S]*?)(\s*)$/),t=en?tr1(m[2]):null;
    if(t!==null){
      if(n.__tqo===undefined)n.__tqo=n.nodeValue;
      if(t.charAt(0)==='\u00a7'){
        if(!n.__tqx&&n.parentNode){var sp=document.createElement('span');sp.className='tq-tr';sp.textContent=t.slice(1);n.parentNode.insertBefore(sp,n.nextSibling);n.__tqx=sp}
      }else n.nodeValue=m[1]+t+m[3]
    }else if(n.__tqo!==undefined){
      n.nodeValue=n.__tqo;delete n.__tqo;
      if(n.__tqx){n.__tqx.remove();n.__tqx=null}
    }
  }
  function dictRoot(root,en){
    if(!root||root.nodeType!==1&&root.nodeType!==9)return;
    var els=root.nodeType===1?[root].concat([].slice.call(root.querySelectorAll('*'))):[].slice.call(root.querySelectorAll('*'));
    els.forEach(function(el){
      if(/^(SCRIPT|STYLE)$/.test(el.tagName)||el.classList.contains('tq-tr'))return;
      ATTRS.forEach(function(a){
        var cur=el.getAttribute(a);if(cur===null)return;
        var o=el.__tqa&&el.__tqa[a];
        if(en){var t=tr1(o!==undefined?o:cur);if(t!==null&&t.charAt(0)!=='\u00a7'){(el.__tqa=el.__tqa||{})[a]=o!==undefined?o:cur;el.setAttribute(a,t)}}
        else if(o!==undefined){el.setAttribute(a,o);delete el.__tqa[a]}
      });
      [].slice.call(el.childNodes).forEach(function(n){if(n.nodeType===3)txNode(n,en)});
    });
  }
  /* TQI.t('عربي') → English in English mode, otherwise unchanged (for strings built in code) */
  window.TQI.t=function(s){if(!document.body.classList.contains('show-en'))return s;var t=tr1(String(s).trim());return t===null||t.charAt(0)==='\u00a7'?s:t};
  /* Auto-pairing: where a page already writes  Arabic <span class="en">English</span>, English mode hides the Arabic text node
     and promotes the English span. Learning content (letters, words, verses…) is excluded via a selector. */
  var AR_RE=/[\u0600-\u06FF]/;
  var CONTENT='.phrase,.letter,.word,.glyph,.tile,[lang=ar]:not(html),.ar,.qar,.bq,.poem,.miss,.ref,#tqBar,#tools,#wbBoard,option,select,script,style';
  var autoSel=null;
  function autoRoot(root,en){
    if(!autoSel||!root)return;
    var els=root.nodeType===1?[root].concat([].slice.call(root.querySelectorAll('*'))):[];
    els.forEach(function(el){
      var skip=false;try{skip=!!el.closest(autoSel)}catch(e){}
      if(skip)return;
      var kids=el.childNodes,hasEn=false,i;
      for(i=0;i<kids.length;i++)if(kids[i].nodeType===1&&kids[i].classList.contains('en')){hasEn=true;break}
      for(i=0;i<kids.length;i++){
        var n=kids[i];if(n.nodeType!==3)continue;
        if(en&&hasEn&&AR_RE.test(n.nodeValue)){if(n.__tqa===undefined)n.__tqa=n.nodeValue;n.nodeValue=''}
        else if(!en&&n.__tqa!==undefined){n.nodeValue=n.__tqa;delete n.__tqa}
      }
      if(hasEn)for(i=0;i<kids.length;i++)if(kids[i].nodeType===1&&kids[i].classList.contains('en'))kids[i].classList.toggle('tq-pri',en);
    });
  }
  window.TQI.auto=function(extra){autoSel=CONTENT+(extra?','+extra:'');autoRoot(document.body,document.body.classList.contains('show-en'))};
  window.TQI.dict=function(extra){for(var k in extra)DICT[k]=extra[k];dictRoot(document.body,document.body.classList.contains('show-en'))};
  function boot(){
    var en=function(){return document.body.classList.contains('show-en')};
    relabel();dictRoot(document.body,en());autoRoot(document.body,en());
    new MutationObserver(function(){relabel();dictRoot(document.body,en());autoRoot(document.body,en())}).observe(document.body,{attributes:true,attributeFilter:['class']});
    new MutationObserver(function(ms){if(!en())return;ms.forEach(function(m){m.addedNodes.forEach(function(n){if(n.nodeType===1){dictRoot(n,true);autoRoot(n,true)}else if(n.nodeType===3&&n.parentNode&&n.parentNode.nodeType===1&&!n.parentNode.classList.contains('tq-tr'))txNode(n,true)})})}).observe(document.body,{childList:true,subtree:true});
  }
  if(document.body)boot();else document.addEventListener('DOMContentLoaded',boot);
})();
