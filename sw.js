// Service Worker for ConvertLab
const CACHE_NAME = 'convertlab-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/batch-convert.html',
    '/resize.html',
    '/compress.html',
    '/about.html',
    '/styles.css',
    '/script.js',
    '/batch-script.js',
    '/resize-script.js',
    '/compress-script.js'
];

// Install event
self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(function(cache) {
                return cache.addAll(urlsToCache);
            })
    );
});

// Fetch event
self.addEventListener('fetch', function(event) {
    event.respondWith(
        caches.match(event.request)
            .then(function(response) {
                // Return cached version or fetch from network
                return response || fetch(event.request);
            })
    );
});

// Activate event
self.addEventListener('activate', function(event) {
    event.waitUntil(
        caches.keys().then(function(cacheNames) {
            return Promise.all(
                cacheNames.map(function(cacheName) {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});
