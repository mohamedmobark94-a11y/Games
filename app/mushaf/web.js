/* web version glue: sign-in check, page links, saving corrections to the site's database */
(function(){
  const sb = window.__tqSb;
  window.studentIdOf = function(name){
    const n = String(name || '').trim().toLowerCase(), list = window.__mzStudents || [];
    const s = list.find(x => [x.name_ar, x.name_en, x.slug].concat(x.keys || []).some(v => v && String(v).trim().toLowerCase() === n));
    return s ? ((s.keys && s.keys[0]) || s.slug) : name;
  };
  window.claude.use('db').then(d => { DB = d; }).catch(() => {});
  (async () => {
    try{
      const st = await sb.from('students').select('slug,name_ar,name_en,keys').eq('active', true); window.__mzStudents = st.data || [];
      const dl = document.getElementById('mzStudentList');
      if(!dl){ const l = document.createElement('datalist'); l.id = 'mzStudentList'; l.innerHTML = window.__mzStudents.map(s => '<option value="' + TQ.esc(s.name_en || s.name_ar) + '">' + TQ.esc(s.name_ar) + '</option>').join(''); document.body.appendChild(l); const inp = document.getElementById('mzStudent'); if(inp) inp.setAttribute('list', 'mzStudentList'); }
      const paths = Array.from({length: 640}, (_, i) => 'pages/page-' + String(i + 1).padStart(3, '0') + '.webp');
      const r = await sb.storage.from('mushaf').createSignedUrls(paths, 60 * 60 * 12);
      (r.data || []).forEach((x, i) => { if(x.signedUrl) window.__mzUrls[i + 1] = x.signedUrl; });
    }catch(e){ console.error(e); }
    window.__mzReady = true;
    if(window.__mzGo) window.__mzGo();
  })();
})();
