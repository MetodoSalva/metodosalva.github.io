/* SALVA - service worker
   Red primero: un despliegue nuevo se ve en cuanto hay cobertura.
   Cache de reserva: sin cobertura, la app abre igual con lo ultimo visto.
   Lo de fuera de este dominio (el puente de Google, las fuentes) no se toca. */
const CACHE  = 'salva-v31';
const NUCLEO = ['./', './index.html', './icon-192.png', './icon-512.png'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) {
    return c.addAll(NUCLEO);
  }).then(function () { return self.skipWaiting(); }).catch(function () {}));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== CACHE; })
                         .map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  const req = e.request;
  if (req.method !== 'GET') return;
  if (new URL(req.url).origin !== location.origin) return;   // el puente va siempre a la red

  e.respondWith(
    fetch(req).then(function (res) {
      const copia = res.clone();
      caches.open(CACHE).then(function (c) { c.put(req, copia); }).catch(function () {});
      return res;
    }).catch(function () {
      return caches.match(req, { ignoreSearch: true }).then(function (r) {
        return r || caches.match('./index.html');
      });
    })
  );
});
