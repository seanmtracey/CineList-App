self.addEventListener('install', function(e) {
	e.waitUntil( caches.open('CineList').then(function(cache) {
		return cache.addAll([
			'/',
			'/index.html',
			'/index.html?homescreen=1',
			'/favicon.png',
			'/?homescreen=1',
			'/styles.css',
			'/icon/144.png',
			'/windows.css',
			'/scripts/core.js',
			'/scripts/libraries/jquery.min.js',
			'/assets/images/loading.png'
		]);
	}));
});

/*self.addEventListener('fetch', function(event) {
 console.log(event.request.url);
 event.respondWith(
   caches.match(event.request).then(function(response) {
     return response || fetch(event.request);
   })
 );
});*/

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request).then(function(response) {
      return response || fetch(event.request);
    })
  );
});
