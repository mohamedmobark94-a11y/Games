"""Adds the shared navigation bar (tq-nav.js: Home · Back · Next · Language) to every page in games/ or lessons/.
Also removes the old floating 🏠 button. Safe to run again."""
import pathlib,re,sys
TAG='<!--tq-nav--><script src="../tq-nav.js"></script>\n'
OLD=re.compile(r'<!--tq-home-->.*?</a>\n?',re.S)
root=pathlib.Path(sys.argv[1] if len(sys.argv)>1 else 'games')
for f in sorted(root.glob('*.html')):
    s=f.read_text(encoding='utf-8'); o=s
    s=OLD.sub('',s)
    if '<!--tq-nav-->' not in s:
        i=s.lower().rfind('</body>')
        s=s[:i]+TAG+s[i:] if i>=0 else s+TAG
    if s!=o: f.write_text(s,encoding='utf-8'); print('updated',f.name)
