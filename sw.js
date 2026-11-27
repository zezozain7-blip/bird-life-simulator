// Bird Life Simulator service worker: cache the app shell on first load, then work offline.
var CACHE='bls-shell-v52';
var SHELL=['./','./index.html','./manifest.webmanifest','./icons/icon-192.png','./icons/icon-512.png'];
self.addEventListener('install',function(e){ e.waitUntil(caches.open(CACHE).then(function(c){ return c.addAll(SHELL); })); });
self.addEventListener('message',function(e){ if(e.data==='skip') self.skipWaiting(); });
self.addEventListener('activate',function(e){ e.waitUntil(caches.keys().then(function(ks){ return Promise.all(ks.filter(function(k){ return k!==CACHE; }).map(function(k){ return caches.delete(k); })); }).then(function(){ return self.clients.claim(); })); });
self.addEventListener('fetch',function(e){
  var r=e.request; if(r.method!=='GET'||new URL(r.url).origin!==location.origin) return;
  e.respondWith(caches.match(r).then(function(hit){
    var net=fetch(r).then(function(res){ if(res&&res.ok){ var cp=res.clone(); caches.open(CACHE).then(function(c){ c.put(r,cp); }); } return res; }).catch(function(){ return hit||caches.match('./index.html'); });
    return hit||net;
  }));
});
