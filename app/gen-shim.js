/* Runs the report generator (built for claude.ai) on the Tarteel site.
   The generator asks claude.use('db') for a small document store and window.storage for its settings;
   here both are served by the site's Supabase database, for the signed-in teacher only.
   AI, downloads, uploads and Claude's scheduled tasks are not available on the site: those features
   fall back to what the generator already does without them. */
(function(){
  const sb = supabase.createClient(TQ.url, TQ.key);
  window.__tqSb = sb;

  const ready = (async () => {
    const s = await sb.auth.getSession();
    if(!s.data.session){ try{ (window.top || window).location.href = TQ.site + 'app/'; }catch(_){ location.href = TQ.site + 'app/'; } throw new Error('not signed in'); }
    return s.data.session;
  })();

  const split = path => { const i = String(path).indexOf('/'); return [path.slice(0, i), path.slice(i + 1)]; };
  const snapDoc = (id, row) => ({id, exists: !!row, data: () => row ? row.data : undefined});

  function docRef(path){
    const [col, id] = split(path);
    return {
      id,
      async get(){ await ready; const r = await sb.from('docs').select('data').eq('collection', col).eq('id', id).maybeSingle(); if(r.error) throw r.error; return snapDoc(id, r.data); },
      async set(data){ await ready; const r = await sb.from('docs').upsert({collection: col, id, data}); if(r.error) throw r.error; },
      async update(patch){
        await ready;
        const cur = await sb.from('docs').select('data').eq('collection', col).eq('id', id).maybeSingle();
        if(cur.error) throw cur.error;
        if(!cur.data) throw new Error('No document to update: ' + path);
        const r = await sb.from('docs').update({data: Object.assign({}, cur.data.data, patch)}).eq('collection', col).eq('id', id);
        if(r.error) throw r.error;
      },
      async delete(){ await ready; const r = await sb.from('docs').delete().eq('collection', col).eq('id', id); if(r.error) throw r.error; },
      onSnapshot(cb, err){
        let off = false, ch = null;
        const pull = () => this.get().then(s => { if(!off) cb(s); }, e => { if(err) err(e); });
        ready.then(() => {
          pull();
          ch = sb.channel('doc-' + col + '-' + id + '-' + Math.random().toString(36).slice(2))
            .on('postgres_changes', {event: '*', schema: 'public', table: 'docs', filter: 'collection=eq.' + col}, p => {
              const row = p.new && p.new.id ? p.new : p.old; if(row && row.id === id) pull();
            }).subscribe();
        }, e => { if(err) err(e); });
        return () => { off = true; if(ch) sb.removeChannel(ch); };
      }
    };
  }

  function colRef(col, opts){
    opts = opts || {};
    const q = {
      orderBy(field, dir){ return colRef(col, Object.assign({}, opts, {order: [field, dir || 'asc']})); },
      limit(n){ return colRef(col, Object.assign({}, opts, {limit: n})); },
      doc(id){ return docRef(col + '/' + id); },
      async get(){
        await ready;
        let r = await sb.from('docs').select('id,data').eq('collection', col).limit(5000);
        if(r.error) throw r.error;
        let rows = r.data || [];
        if(opts.order){ const [f, d] = opts.order, key = x => (x.data && x.data[f] != null) ? x.data[f] : x.id;
          rows.sort((a, b) => { const A = key(a), B = key(b); return (A > B ? 1 : A < B ? -1 : 0) * (d === 'desc' ? -1 : 1); }); }
        if(opts.limit) rows = rows.slice(0, opts.limit);
        const docs = rows.map(x => ({id: x.id, exists: true, data: () => x.data}));
        return {docs, size: docs.length, empty: !docs.length, forEach: f => docs.forEach(f)};
      },
      onSnapshot(cb, err){
        let off = false, ch = null, t = 0;
        const pull = () => q.get().then(s => { if(!off) cb(s); }, e => { if(err) err(e); });
        ready.then(() => {
          pull();
          ch = sb.channel('col-' + col + '-' + Math.random().toString(36).slice(2))
            .on('postgres_changes', {event: '*', schema: 'public', table: 'docs', filter: 'collection=eq.' + col}, () => { clearTimeout(t); t = setTimeout(pull, 250); })
            .subscribe();
        }, e => { if(err) err(e); });
        return () => { off = true; if(ch) sb.removeChannel(ch); };
      }
    };
    return q;
  }

  const DBshim = {doc: docRef, collection: c => colRef(c)};

  window.claude = {
    use(name){
      if(name === 'db') return ready.then(() => DBshim);
      return Promise.resolve(null);      // AI, downloads, uploads and scheduled tasks: not on the site (yet)
    }
  };

  // the generator's settings (last report per student, signature, …) follow the teacher to any device
  window.storage = {
    async get(key){ await ready; const r = await sb.from('kv').select('value').eq('key', key).maybeSingle(); return r.data ? {value: r.data.value} : null; },
    async set(key, value){ await ready; await sb.from('kv').upsert({key, value: String(value)}); return true; }
  };
})();
