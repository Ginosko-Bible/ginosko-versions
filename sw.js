// Ginosko Bible, version web : fonctionnement hors ligne.
// - Pages : le réseau d'abord (dernière version du site), la copie gardée si l'on est hors ligne.
// - Fichiers de l'application et données (donnees/) : la copie gardée tout de suite, rafraîchie en arrière-plan.
// Seul ce site est mis en cache : jamais Supabase ni un autre domaine (comptes, notes privées).
const CACHE = "ginosko-web-v1";

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(["./", "./manifest.webmanifest", "./icones/ginosko-192.png"])).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith("ginosko-web-") && k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener("fetch", (e) => {
  const r = e.request;
  if (r.method !== "GET") return;
  const u = new URL(r.url);
  if (u.origin !== self.location.origin) return;
  if (r.mode === "navigate") {
    e.respondWith(fetch(r).then((rep) => {
      const copie = rep.clone(); caches.open(CACHE).then((c) => c.put("./", copie)); return rep;
    }).catch(() => caches.match("./")));
    return;
  }
  e.respondWith(caches.open(CACHE).then(async (c) => {
    const garde = await c.match(r);
    const reseau = fetch(r).then((rep) => { if (rep.ok) c.put(r, rep.clone()); return rep; }).catch(() => garde);
    return garde || reseau;
  }));
});
