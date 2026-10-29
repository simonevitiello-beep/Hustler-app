const CACHE = "hustler-tracker-v35";
const ASSETS = ["./", "./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png", "./icon-192-maskable.png", "./icon-512-maskable.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

// v23: in cache finiscono solo le risposte buone (status 200 o opache dei font).
// Prima un 404 o un errore temporaneo di GitHub Pages restava in cache per sempre.
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    caches.match(e.request).then((cached) => {
      if (cached) return cached;
      return fetch(e.request)
        .then((resp) => {
          if (resp && (resp.ok || resp.type === "opaque")) {
            const copy = resp.clone();
            caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
          }
          return resp;
        })
        .catch(() => cached);
    })
  );
});

// v32 - la pagina puo' chiedere al worker in attesa di attivarsi subito.
// Serve perche' il bottone "Aggiorna ora" faceva solo location.reload(): il worker
// vecchio restava al comando e continuava a servire la versione vecchia dalla cache.
self.addEventListener("message", (e) => {
  if (e.data && e.data.type === "SKIP_WAITING") self.skipWaiting();
});
