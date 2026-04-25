const CACHE = 'qride-owner-v1';
const OFFLINE = '/qride/offline.html';
const PRE = ['/qride/', '/qride/index.html', '/qride/manifest.json', '/qride/offline.html'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(PRE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || !e.request.url.startsWith(self.location.origin)) return;
  e.respondWith(fetch(e.request).then(r => { if(r.ok){const c=r.clone();caches.open(CACHE).then(ca=>ca.put(e.request,c))} return r; }).catch(() => caches.match(e.request).then(r => r || caches.match(OFFLINE))));
});
self.addEventListener('push', e => {
  const d = e.data?.json() || {};
  e.waitUntil(self.registration.showNotification(d.title || 'QRide', {
    body: d.body || 'Новое сообщение об автомобиле',
    icon: '/qride/icons/icon-192.png', badge: '/qride/icons/icon-192.png',
    vibrate: [100,50,100], data: { url: d.url || '/qride/' },
    actions: [{action:'open',title:'Открыть'},{action:'dismiss',title:'Закрыть'}]
  }));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  if (e.action === 'dismiss') return;
  e.waitUntil(clients.matchAll({type:'window'}).then(cs => { for(const c of cs){if('focus' in c) return c.focus();} if(clients.openWindow) return clients.openWindow(e.notification.data?.url||'/qride/'); }));
});
