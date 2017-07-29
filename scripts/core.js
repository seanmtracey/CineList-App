(function(){

	'use strict';

	var APIRoot = "https://api.cinelist.co.uk";

	var prevent = function(e){e.preventDefault();e.stopImmediatePropagation()};

	var searchForm = document.querySelector('#search');
	var geoTrigger = searchForm.querySelector('#geolocation');
	var dayoffsetContainer = document.querySelector('.dayoffset');
	var dayOffsetButtons = dayoffsetContainer.querySelectorAll('*[data-offset]');
	var timesContainer = document.querySelector('#timesContainer');

	var currentLocation = '';
	var currentLocationIsPostcode = false;

	function getGeolocation(){

		return new Promise(function( resolve, reject){

			if(navigator.geolocation){
				navigator.geolocation.getCurrentPosition(
					function(position){
						resolve(position)
					},
					function(err){
						reject(err);
					},
					{
						enableHighAccuracy: false,
						timeout: 15000,
						maximumAge: 0
					}
				);
			} else {
				reject('Geolocation is not available in this browser');
			}

		});

	}

	function wasResponseGood(response){
		
		return new Promise( function(resolve, reject){

			if(response.ok){
				response.json()
					.then(function(json){
						resolve(json);
					})
					.catch(function(err){
						console.log('An error occurred with request', err);
						reject(err);
					})
				;
			} else {
				reject(response);
			}

		});

	}

	function joinListOfCinemasWithListings(cinemas, times){

		return cinemas.map(function(cinema){

				for(var x = 0; x < times.length; x += 1){
					if(times[x] === null){
						return null;
					}
					if(times[x].cinema === cinema.id){
						cinema.listings = times[x].listings;
						times.splice(x, 1);
						return cinema;
					}
				}

			})
			.filter(function(item){
				return item !== null;
			})
		;

	}

	function resetDayOffsetButtons(){
		dayOffsetButtons.forEach(function(button){
			button.classList.remove('activeDay');
		});
	}

	function generateViewFromData(cinemasWithTimes, shouldSort){

		shouldSort = shouldSort || false;

		var timesDocumentFragment = document.createDocumentFragment();

		cinemasWithTimes.forEach(function(cinema){
			
			var cinemaContainer = document.createElement('div');
			var cinemaTitle = document.createElement('h2');
			var cinemaDistance = document.createElement('span');

			cinemaContainer.classList.add('cinema');

			cinemaTitle.textContent = cinema.name;
			cinemaDistance.textContent = '(' + cinema.distance + ' miles)';

			cinemaTitle.appendChild(cinemaDistance);

			cinemaContainer.appendChild(cinemaTitle);

			cinema.listings.forEach(function(listing){

				var listingContainer = document.createElement('div');
				var listingTitle = document.createElement('h3');
				var listingTimesContainer = document.createElement('ol');

				listingContainer.classList.add('listing');
				listingTitle.textContent = listing.title;
				
				listing.times.forEach(function(time){

					var timeLi = document.createElement('li');
					timeLi.textContent = time;
					listingTimesContainer.appendChild(timeLi);

				});

				listingContainer.appendChild(listingTitle);
				listingContainer.appendChild(listingTimesContainer);
				cinemaContainer.appendChild(listingContainer);
			});

			timesDocumentFragment.appendChild(cinemaContainer);

		});

		return timesDocumentFragment;
	}

	function searchForCinemasByGeolocation(latitude, longitude, offset){
		
		console.log(latitude, longitude);
		return fetch(APIRoot + '/search/cinemas/coordinates/' + latitude + '/' + longitude)
			.then(function(response){
				return wasResponseGood(response);
			})
			.catch(function(err){
				console.log('Could not fetch searchForCinemasByLocation', err);
			})
		;

	}

	function searchForCinemasByLocation(location){
		
		console.log(location);
		return fetch(APIRoot + '/search/cinemas/location/' + location)
			.then(function(response){
				return wasResponseGood(response);
			})
			.catch(function(err){
				console.log('Could not fetch searchForCinemasByLocation', err);
			})
		;
	
	}

	function searchForCinemasByPostcode(postcode){
		
		console.log(postcode);
		return fetch(APIRoot + '/search/cinemas/postcode/' + postcode)
			.then(function(response){
				return wasResponseGood(response);
			})
			.catch(function(err){
				console.log('Could not fetch searchForCinemasByPostcode', err);
			})
		;
	
	}

	function getManyCinemaTimesById(listOfCinemaIDs, offset){

		offset = offset || 0;

		return fetch(APIRoot + '/get/times/many/' + listOfCinemaIDs.join(',') + '?day=' + offset)
			.then(function(response){
				return wasResponseGood(response);
			})
			.catch(function(err){
				console.log('Could not fetch searchForCinemasByLocation', err);
			})
		;
	}

	function getCinemasAndTimesFromLocation(location, offset){

		offset = offset || 0;

		window.__cinelist.loading.update('Searching for ' + location + ' cinemas');
		window.__cinelist.loading.show();

		return searchForCinemasByLocation(location)
			.then(function(cinemaData){

				console.log(cinemaData);

				var cinemaIDs = cinemaData.cinemas.map(function(datum){
					return datum.id;
				});

				window.__cinelist.loading.update('Getting times for ' + location + ' cinemas');
				
				return getManyCinemaTimesById(cinemaIDs, offset)
					.then(function(listingsData){
						return joinListOfCinemasWithListings(cinemaData.cinemas, listingsData.results);
					})
				;

			})
		;

	}

	function getCinemasAndTimesFromGeolocation(latitude, longitude, offset){

		return searchForCinemasByGeolocation(latitude, longitude, offset)
			.then(function(cinemaData){

				console.log(cinemaData);
				currentLocation = cinemaData.postcode;
				currentLocationIsPostcode = true;

				var cinemaIDs = cinemaData.cinemas.map(function(datum){
					return datum.id;
				});

				window.__cinelist.loading.update('Getting times for nearby cinemas');
				
				return getManyCinemaTimesById(cinemaIDs, offset)
					.then(function(listingsData){
						return joinListOfCinemasWithListings(cinemaData.cinemas, listingsData.results);
					})
				;

			})
		;

	}

	function getCinemasAndTimesFromPostcode(postcode, offset){

		return searchForCinemasByPostcode(postcode, offset)
			.then(function(cinemaData){

				console.log(cinemaData);
				currentLocation = cinemaData.postcode;
				currentLocationIsPostcode = true;

				var cinemaIDs = cinemaData.cinemas.map(function(datum){
					return datum.id;
				});

				window.__cinelist.loading.update('Getting times for nearby cinemas');
				
				return getManyCinemaTimesById(cinemaIDs, offset)
					.then(function(listingsData){
						return joinListOfCinemasWithListings(cinemaData.cinemas, listingsData.results);
					})
				;

			})
		;

	}

	function bindEvents(){

		searchForm.addEventListener('submit', function(e){
			prevent(e);
			
			this[0].blur();

			currentLocation = this[0].value;
			currentLocationIsPostcode = false;

			resetDayOffsetButtons();
			dayOffsetButtons[0].classList.add('activeDay');
			dayoffsetContainer.dataset.active = "false";			

			getCinemasAndTimesFromLocation(currentLocation, 0)
				.then(function(cinemasWithTimes){
					console.log(cinemasWithTimes);
					timesContainer.innerHTML = "";
					timesContainer.appendChild(generateViewFromData(cinemasWithTimes));
					window.__cinelist.loading.hide();
					dayoffsetContainer.dataset.active = "true";
					
				})
			;

		}, false);

		geoTrigger.addEventListener('click', function(e){
			prevent(e);
			console.log(e);

			resetDayOffsetButtons();
			dayOffsetButtons[0].classList.add('activeDay');

			window.__cinelist.loading.update('Figuring out where you are...');
			window.__cinelist.loading.show();
			dayoffsetContainer.dataset.active = "false";
			

			dayoffsetContainer.dataset.active = "false";

			getGeolocation()
				.then(function(data){
					console.log(data);
					window.__cinelist.loading.update('Working out which cinemas are near you...');
					getCinemasAndTimesFromGeolocation(data.coords.latitude, data.coords.longitude, 0)
						.then(function(cinemasWithTimes){
							console.log(cinemasWithTimes);
							timesContainer.innerHTML = "";
							timesContainer.appendChild(generateViewFromData(cinemasWithTimes));
							window.__cinelist.loading.hide();
							dayoffsetContainer.dataset.active = "true";
						})
					;

				})
				.catch(function(err){
					console.log(err);
					window.__cinelist.loading.update('Sorry - CineList couldn\'t find your location');

					setTimeout(function(){
						window.__cinelist.loading.hide();
					}, 4000);

				})
			;

		}, false);

	}

	bindEvents();

	(function(){
		var days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
		var today = new Date().getDay();

		dayOffsetButtons.forEach(function(offsetBtn){

			var dayInt = parseInt(offsetBtn.dataset.offset) + today;
			
			if(dayInt >= days.length){
				dayInt = dayInt - 7;
			}
			
			offsetBtn.textContent = days[dayInt];

			offsetBtn.addEventListener('click', function(e){
				prevent(e);

				resetDayOffsetButtons();

				offsetBtn.classList.add('activeDay');
				
				console.log(parseInt(this.dataset.offset));

				var appropriateSearch = currentLocationIsPostcode ? getCinemasAndTimesFromPostcode : getCinemasAndTimesFromLocation;
				
				window.__cinelist.loading.update('Getting ' + days[dayInt] + ' times for local cinemas');
				window.__cinelist.loading.show();

				appropriateSearch(currentLocation, parseInt(this.dataset.offset))
					.then(function(cinemasWithTimes){
						console.log(cinemasWithTimes);
						timesContainer.innerHTML = "";
						timesContainer.appendChild(generateViewFromData(cinemasWithTimes));
						window.__cinelist.loading.hide();
						dayoffsetContainer.dataset.active = "true";						
					})
				;

			}, false);

		});

	})();


	console.log('Initialised');
	
}());

