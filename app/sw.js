/* Makes the teacher page installable as an app (desktop icon, its own window).
   No caching: every request goes to the network as usual, so updates show at once. */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => {});
