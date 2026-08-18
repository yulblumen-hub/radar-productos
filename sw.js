/* Cache-first para el caparazón, con actualización en segundo plano.
   Subí VERSION en cada deploy para invalidar el cache viejo. */
const VERSION = "radar-v1";
const ASSETS = ["./","./index.html","./styles.css","./app.js","./data.js",
                "./manifest.json","./icon-192.png","./icon-512.png","./icon-maskable-512.png"];

self.addEventListener("install", e=>{
  e.waitUntil(caches.open(VERSION).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()));
});

self.addEventListener("activate", e=>{
  e.waitUntil(
    caches.keys()
      .then(ks=>Promise.all(ks.filter(k=>k!==VERSION).map(k=>caches.delete(k))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener("fetch", e=>{
  if(e.request.method !== "GET") return;
  e.respondWith(
    caches.match(e.request).then(hit=>{
      const red = fetch(e.request).then(res=>{
        if(res && res.ok){
          const copia = res.clone();
          caches.open(VERSION).then(c=>c.put(e.request, copia));
        }
        return res;
      }).catch(()=> hit);
      return hit || red;
    })
  );
});
