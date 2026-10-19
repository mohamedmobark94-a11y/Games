"""Adds a small 🏠 «كل الألعاب» button to every game in games/ (safe to run again)."""
import pathlib,sys
SNIP='''<!--tq-home--><a href="../" id="tqHome" title="كل الألعاب" aria-label="كل الألعاب" style="position:fixed;right:calc(10px + env(safe-area-inset-right,0px));bottom:calc(10px + env(safe-area-inset-bottom,0px));z-index:75;width:44px;height:44px;border-radius:50%;display:grid;place-items:center;background:#0B1E2D;border:2px solid #E2B85C;font-size:20px;text-decoration:none;opacity:.75;box-shadow:0 4px 12px rgba(0,0,0,.3)">🏠</a>
'''
root=pathlib.Path(sys.argv[1] if len(sys.argv)>1 else 'games')
for f in sorted(root.glob('*.html')):
    s=f.read_text(encoding='utf-8')
    if '<!--tq-home-->' in s: continue
    i=s.lower().rfind('</body>')
    s=s[:i]+SNIP+s[i:] if i>=0 else s+SNIP
    f.write_text(s,encoding='utf-8'); print('added',f.name)
