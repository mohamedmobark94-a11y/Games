/* Tarteel platform — shared settings.
   The key below is Supabase's PUBLISHABLE key: it is meant to be in the page. What anyone can read or write
   is decided by the database's row-level security, not by hiding this key. */
window.TQ = {
  url: 'https://auikygaqugjdlnwyxzmf.supabase.co',
  key: 'sb_publishable_SrvUHRVY7x03hWHUey-Pxg_v1ThSXC4',
  site: 'https://mohamedmobark94-a11y.github.io/Games/'
};
window.TQ.esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
