(function(){

	'use strict';

	var APIRoot = "https://api.cinelist.co.uk";

	var prevent = function(e){e.preventDefault();e.stopImmediatePropagation()};

	var home = document.querySelector('#home');
	var searchForm = document.querySelector('#search');
	var geoTrigger = searchForm.querySelector('#geolocation');
	var dayoffsetContainer = document.querySelector('.dayoffset');
	var dayOffsetButtons = Array.from( dayoffsetContainer.querySelectorAll('*[data-offset]') );
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

	function generateViewFromData(cinemasWithTimes, offset){

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

			cinema.listings.sort( function(a, b){
				if(a.title > b.title){
					return 1
				} else {
					return -1;
				}
			});

			var d = new Date(),
				thisHour = d.getHours(),
				thisMinute = d.getMinutes();

			cinema.listings.forEach(function(listing){

				var listingContainer = document.createElement('div');
				var listingTitle = document.createElement('h3');
				var listingTimesContainer = document.createElement('ol');

				listingContainer.classList.add('listing');
				listingTitle.textContent = listing.title;

				var setNext = false;

				listing.times.forEach(function(time){

					var timeLi = document.createElement('li');
					timeLi.textContent = time;

					if(offset === 0){
						var theTime = time.split(":");
						var canCatch = undefined;

						if(thisHour < parseInt(theTime[0])){
							canCatch = true
						} else if(thisHour == parseInt(theTime[0]) && thisMinute < parseInt(theTime[1])){
							canCatch = true;
						} else {
							canCatch = false;
						}

						if(!setNext && canCatch){
							timeLi.setAttribute('class', 'nextTime')
							setNext = true;
						}

						if(!canCatch){
							timeLi.setAttribute('class','missed');
						}

					} else {

						if(!setNext){
							timeLi.setAttribute('class', 'nextTime')
							setNext = true;
						}

					}


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
				throw err;
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
				throw err;
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
				throw err;
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
				throw err;
			})
		;
	}

	function getCinemasAndTimesFromLocation(location, offset){

		offset = offset || 0;

		window.__cinelist.working.icon('working');
		window.__cinelist.working.update('Searching for ' + location + ' cinemas');
		window.__cinelist.working.show();

		return searchForCinemasByLocation(location)
			.then(function(cinemaData){

				console.log(cinemaData);

				var cinemaIDs = cinemaData.cinemas.map(function(datum, idx){

						if(idx < 30){
							return datum.id;
						} else if(datum.distance < 5){
							return datum.id;
						} else {
							return undefined;
						}
						// return datum.id;
					})
				;	

				window.__cinelist.working.update('Getting times for ' + location + ' cinemas');

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

				window.__cinelist.working.update('Getting times for nearby cinemas');

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

				window.__cinelist.working.update('Getting times for nearby cinemas');

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

			if(this[0].value === ""){
				return;
			}

			this[0].blur();
			this.dataset.firstload = "false";
			home.dataset.visible = "false";

			currentLocation = this[0].value;
			currentLocationIsPostcode = false;

			resetDayOffsetButtons();
			dayOffsetButtons[0].classList.add('activeDay');
			dayoffsetContainer.dataset.active = "false";

			getCinemasAndTimesFromLocation(currentLocation, 0)
				.then(function(cinemasWithTimes){
					console.log(cinemasWithTimes);
					timesContainer.innerHTML = "";
					timesContainer.appendChild(generateViewFromData(cinemasWithTimes, 0));
					window.__cinelist.working.hide();
					dayoffsetContainer.dataset.active = "true";
				})
				.catch(function(err){

					window.__cinelist.working.icon('error');
					window.__cinelist.working.update('Sorry - something went wrong getting your times');

					setTimeout(function(){
						window.__cinelist.working.hide();
					}, 4000);

				})
			;

		}, false);

		geoTrigger.addEventListener('click', function(e){
			prevent(e);
			console.log(e);

			home.dataset.visible = "false";
			searchForm[0].value = "";
			searchForm.dataset.firstload = "false";

			resetDayOffsetButtons();
			dayOffsetButtons[0].classList.add('activeDay');

			window.__cinelist.working.icon('working');
			window.__cinelist.working.update('Figuring out where you are...');
			window.__cinelist.working.show();
			dayoffsetContainer.dataset.active = "false";

			dayoffsetContainer.dataset.active = "false";

			getGeolocation()
				.then(function(data){
					console.log(data);
					window.__cinelist.working.update('Working out which cinemas are near you...');
					getCinemasAndTimesFromGeolocation(data.coords.latitude, data.coords.longitude, 0)
						.then(function(cinemasWithTimes){
							console.log(cinemasWithTimes);
							timesContainer.innerHTML = "";
							timesContainer.appendChild(generateViewFromData(cinemasWithTimes, 0));
							window.__cinelist.working.hide();
							dayoffsetContainer.dataset.active = "true";
						})
					;

				})
				.catch(function(err){
					console.log(err);
					window.__cinelist.working.update('Sorry - CineList couldn\'t find your location');

					setTimeout(function(){
						window.__cinelist.working.hide();
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

			var offset = parseInt(offsetBtn.dataset.offset);
			var dayInt = offset + today;

			if(dayInt >= days.length){
				dayInt = dayInt - 7;
			}

			if(offset === 0){
				offsetBtn.textContent = 'Today';
			} else if(offset === 1){
				offsetBtn.textContent = 'Tomorrow';
			} else {
				offsetBtn.textContent = days[dayInt];
			}

			offsetBtn.addEventListener('click', function(e){
				prevent(e);

				resetDayOffsetButtons();

				offsetBtn.classList.add('activeDay');

				var dateOffset = parseInt(this.dataset.offset);
				console.log(dateOffset);

				var appropriateSearch = currentLocationIsPostcode ? getCinemasAndTimesFromPostcode : getCinemasAndTimesFromLocation;
				
				window.__cinelist.working.icon('working');
				window.__cinelist.working.update('Getting ' + days[dayInt] + ' times for local cinemas');
				window.__cinelist.working.show();

				appropriateSearch(currentLocation, parseInt(this.dataset.offset))
					.then(function(cinemasWithTimes){
						console.log(cinemasWithTimes);
						timesContainer.innerHTML = "";
						timesContainer.appendChild(generateViewFromData(cinemasWithTimes, dateOffset));
						window.__cinelist.working.hide();
						dayoffsetContainer.dataset.active = "true";
					})
					.catch(function(err){

						window.__cinelist.working.icon('error');
						window.__cinelist.working.update('Sorry - something went wrong getting your times');

						setTimeout(function(){
							window.__cinelist.working.hide();
						}, 4000);

					})
				;

			}, false);

		});

	})();


	console.log('Initialised');

}());

