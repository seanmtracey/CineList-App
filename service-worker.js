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
			'/scripts/core.js',
			'/scripts/libraries/jquery.min.js',
			'/assets/images/loading.png',
			'/assets/images/error.png',
			'/service-worker.js',
			'/assets/images/search.png',
			'/assets/images/geo.png',
			'/assets/images/logo_small_opaque.jpg',
			'https://cdn.polyfill.io/v2/polyfill.min.js'
		]);
	}));
});

self.addEventListener('fetch', function(event) {
  event.respondWith(
	caches.open(CacheName).then(function(cache) {
	  return cache.match(event.request).then(function(cachedResponse) {
		var fetchPromise = fetch(event.request).then(function(networkResponse) {
		  cache.put(event.request, networkResponse.clone());
		  return networkResponse;
		});
		
		console.log(cachedResponse);
		// If it's a request to the API
		// try to get it from the network
		// if that fails, send the cached version
		// if there is one. 	
		if(event.request.url.indexOf('api.cinelist.co.uk') > -1){

			return fetchPromise
				.catch(function(err){
					if(cachedResponse !== undefined){
						return cachedResponse;
					} else {
						throw err;
					}
				})
			;
		}

		return cachedResponse || fetchPromise;

	  })
	})
  );
});