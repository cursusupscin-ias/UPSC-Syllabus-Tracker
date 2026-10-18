/* Retires the old service worker: clears its caches and unregisters, so devices stop serving the old cached page. */
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil((async()=>{
  try{for(const k of await caches.keys())await caches.delete(k)}catch(_){}
  try{await self.registration.unregister()}catch(_){}
  try{const cs=await self.clients.matchAll({type:'window'});cs.forEach(c=>{try{c.navigate(c.url)}catch(_){}})}catch(_){}
})()));
