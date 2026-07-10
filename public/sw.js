// dongbaoOS Service Worker — minimal cache for PWA offline shell
const CACHE_NAME = "dongbaoos-v2";
const STATIC_ASSETS = ["/", "/manifest.json"];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) { return cache.addAll(STATIC_ASSETS); }).catch(function () {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (names) {
      return Promise.all(names.filter(function (n) { return n !== CACHE_NAME; }).map(function (n) { return caches.delete(n); }));
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", function (event) {
  if (event.request.method !== "GET") return;
  var url = new URL(event.request.url);
  if (url.pathname.startsWith("/api/")) return;

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then(function (res) {
          var clone = res.clone();
          caches.open(CACHE_NAME).then(function (c) { c.put(event.request, clone); });
          return res;
        })
        .catch(function () { return caches.match(event.request).then(function (r) { return r || caches.match("/"); }); })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(function (cached) {
      if (cached) return cached;
      return fetch(event.request).then(function (res) {
        if (res.status === 200 && url.origin === self.location.origin) {
          var clone = res.clone();
          caches.open(CACHE_NAME).then(function (c) { c.put(event.request, clone); });
        }
        return res;
      });
    })
  );
});
