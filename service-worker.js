var CacheName = 'CineList';

self.addEventListener('install', function(e) {
	e.waitUntil( caches.open(CacheName).then(function(cache) {
		return cache.addAll([
			'/',
			'/index.html',
			'/index.html?homescreen=1',
			'/favicon.png',
			'/?homescreen=1',
			'/styles.css',
			'/icon/144.png',
			'/assets/images/logo_small_opaque.jpg',
			'/windows.css',
			'/scripts/core.js',
			'/scripts/libraries/jquery.min.js',
			'/assets/images/loading.png',
			'/service-worker.js',
			'/assets/images/go.png',
			'/assets/images/pointer.png',
			'/assets/images/pointer_up.png',
			'/assets/images/logo_small_opaque.jpg',
			'https://cdn.polyfill.io/v2/polyfill.min.js'
		]);
	}));
});

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.open(CacheName).then(function(cache) {
      return cache.match(event.request).then(function(response) {
        var fetchPromise = fetch(event.request).then(function(networkResponse) {
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        })
        return response || fetchPromise;
      })
    })
  );
});