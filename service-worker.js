const CACHE_NAME = "piano-pwa-v1";
const urlsToCache = [
  "/",
  "/index.html",
  "/style.css",
  "/script.js",
  "/manifest.json",
  "/audio/piano/C3.wav",
  "/audio/piano/Db3.wav",
  "/audio/piano/D3.wav",
  "/audio/piano/Eb3.wav",
  "/audio/piano/E3.wav",
  "/audio/piano/F3.wav",
  "/audio/piano/Gb3.wav",
  "/audio/piano/G3.wav",
  "/audio/piano/Ab3.wav",
  "/audio/piano/A3.wav",
  "/audio/piano/Hb3.wav",
  "/audio/piano/H3.wav",
  "/audio/piano/C4.wav",
  "/audio/piano/Db4.wav",
  "/audio/piano/D4.wav",
  "/audio/piano/Eb4.wav",
  "/audio/piano/E4.wav",
  "/audio/piano/F4.wav",
  "/audio/piano/Gb4.wav",
  "/audio/piano/G4.wav",
  "/audio/piano/Ab4.wav",
  "/audio/piano/A4.wav",
  "/audio/piano/Hb4.wav",
  "/audio/piano/H4.wav",
  "/audio/piano/C5.wav",
  "/audio/piano/Db5.wav",
  "/audio/piano/D5.wav",
  "/audio/piano/Eb5.wav",
  "/audio/piano/E5.wav",
  "/audio/piano/F5.wav",
  "/audio/piano/Gb5.wav",
  "/audio/piano/G5.wav",
  "/audio/piano/Ab5.wav",
  "/audio/piano/A5.wav",
  "/audio/piano/Hb5.wav",
  "/audio/piano/H5.wav",
  "/images/icon-192x192.png",
  "/images/icon-512x512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Opened cache");
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response;
      }
      return fetch(event.request);
    })
  );
});
