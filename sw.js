/* UPSC Tracker service worker.
   - Same-origin pages: network-first (so new deployments reach users), cached copy when offline.
   - Same-origin assets: stale-while-revalidate.
   - Versioned third-party libraries (Firebase SDK, fonts, CDN libs): cache-first so the app can start offline.
   - EVERYTHING ELSE (Firestore, Firebase Auth, Google sign-in, any POST) is left alone: never cached, never intercepted. */
const CACHE = 'upsc-tracker-v2';
const APP_SHELL = [
  './', './index.html', './manifest.webmanifest', './firebase-config.js',
  './logo.png', './icon-192.png', './icon-512.png', './icon-maskable-512.png', './icon-monochrome.png', './apple-touch-icon.png'
];
const LIB_HOSTS = [
  ['www.gstatic.com', '/firebasejs/'],
  ['cdnjs.cloudflare.com', '/ajax/libs/'],
  ['fonts.googleapis.com', '/'],
  ['fonts.gstatic.com', '/']
];
const isLib = u => LIB_HOSTS.some(([h, p]) => u.hostname === h && u.pathname.startsWith(p));

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => Promise.all(APP_SHELL.map(u => c.add(u).catch(err => console.warn('SW precache miss', u, err)))))
      .then(() => self.skipWaiting())
  );
});
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
const keep = (req, res) => {
  if (res && (res.ok || res.type === 'opaque')) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {}); }
  return res;
};
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;
  if (!sameOrigin && !isLib(url)) return;                    // Firestore / Auth / Google: hands off

  if (sameOrigin && req.mode === 'navigate') {                // network-first for the page itself
    e.respondWith(fetch(req).then(res => keep(req, res)).catch(() =>
      caches.match(req).then(c => c || caches.match('./index.html'))));
    return;
  }
  if (sameOrigin) {                                           // stale-while-revalidate for own assets
    e.respondWith(caches.match(req).then(c => {
      const net = fetch(req).then(res => keep(req, res)).catch(() => c);
      return c || net;
    }));
    return;
  }
  e.respondWith(caches.match(req).then(c => c || fetch(req).then(res => keep(req, res))));   // libs: cache-first
});
