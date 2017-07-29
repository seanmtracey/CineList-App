var __cinelist = (function(){

	'use strict';

	var APIRoot = "https://api.cinelist.co.uk";

	var prevent = function(e){e.preventDefault();e.stopImmediatePropagation()};

	var searchForm = document.querySelector('#search');

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

	function generateViewFromData(cinemasWithTimes, shouldSort){

		shouldSort = shouldSort || false;

		var timesDocumentFragment = document.createDocumentFragment();
		var mainCinemaContainer = document.createElement('div');

		cinemasWithTimes.forEach(function(cinema){
			
			var cinemaContainer = document.createElement('div');
			var cinemaTitle = document.createElement('h2');
			var cinemaDistance = document.createElement('span');

			cinemaTitle.textContent = cinema.name;
			cinemaDistance.textContent = cinema.distance;

			cinemaContainer.appendChild(cinemaTitle);
			cinemaContainer.appendChild(cinemaDistance);

			cinema.listings.forEach(function(listing){

				var listingContainer = document.createElement('div');
				var listingTitle = document.createElement('h3');
				var listingTimesContainer = document.createElement('ol');

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

			mainCinemaContainer.appendChild(cinemaContainer);

		});

		timesDocumentFragment.appendChild(mainCinemaContainer);
		document.body.appendChild(timesDocumentFragment);

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

	function getManyCinemaTimesById(listOfCinemaIDs){
		return fetch(APIRoot + '/get/times/many/' + listOfCinemaIDs.join(','))
			.then(function(response){
				return wasResponseGood(response);
			})
			.catch(function(err){
				console.log('Could not fetch searchForLocation', err);
			})
		;
	}

	function bindEvents(){

		searchForm.addEventListener('submit', function(e){
			prevent(e);
			console.time('cinemaTimes');
			searchForLocation(this[0].value)
				.then(function(cinemaData){

					console.log(cinemaData);

					var cinemaIDs = cinemaData.cinemas.map(function(datum){
						return datum.id;
					});

					return getManyCinemaTimesById(cinemaIDs)
						.then(function(listingsData){
							return joinListOfCinemasWithListings(cinemaData.cinemas, listingsData.results);
						})
						.then(function(cinemasWithTimes){
							console.log(cinemasWithTimes);
							generateViewFromData(cinemasWithTimes);
							console.timeEnd('cinemaTimes');
						})
					;

				})
			;
		}, false);

	}

	bindEvents();
	console.log('Initialised');
	
}());

