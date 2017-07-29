(function(){

	'use strict';

	var APIRoot = "https://api.cinelist.co.uk";

	var prevent = function(e){e.preventDefault();e.stopImmediatePropagation()};

	var searchForm = document.querySelector('#search');
	var dayOffsetButtons = document.querySelectorAll('.dayoffset *[data-offset]');
	var timesContainer = document.querySelector('#timesContainer');

	var currentLocation = '';

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
				if(times[x].cinema === cinema.id){
					cinema.listings = times[x].listings;
					times.splice(x, 1);
					return cinema;
				}
			}

		});

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
			cinemaDistance.textContent = '(' + cinema.distance + 'miles)';

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

		// timesDocumentFragment.appendChild(mainCinemaContainer);
		// timesContainer.appendChild(timesDocumentFragment);
		return timesDocumentFragment;
	}

	function searchForLocation(location){
		
		console.log(location);
		return fetch(APIRoot + '/search/cinemas/location/' + location)
			.then(function(response){
				return wasResponseGood(response);
			})
			.catch(function(err){
				console.log('Could not fetch searchForLocation', err);
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
				console.log('Could not fetch searchForLocation', err);
			})
		;
	}

	function generateViewFromLocation(location, offset){

		offset = offset || 0;

		window.__cinelist.loading.update('Searching for ' + location + ' cinemas');
		window.__cinelist.loading.show();

		return searchForLocation(location)
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

	function bindEvents(){

		searchForm.addEventListener('submit', function(e){
			prevent(e);
			
			currentLocation = this[0].value;
			resetDayOffsetButtons();
			dayOffsetButtons[0].classList.add('activeDay');

			generateViewFromLocation(currentLocation, 0)
				.then(function(cinemasWithTimes){
					console.log(cinemasWithTimes);
					timesContainer.innerHTML = "";
					timesContainer.appendChild(generateViewFromData(cinemasWithTimes));
					window.__cinelist.loading.hide();
					
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

				generateViewFromLocation(currentLocation, parseInt(this.dataset.offset))
					.then(function(cinemasWithTimes){
						console.log(cinemasWithTimes);
						timesContainer.innerHTML = "";
						timesContainer.appendChild(generateViewFromData(cinemasWithTimes));
						window.__cinelist.loading.hide();						
					})
				;

			}, false);

		});

	})();


	console.log('Initialised');
	
}());

