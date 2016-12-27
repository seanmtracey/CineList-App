var __cinelist = (function(){

	'use strict';

	var initialised = false,
		locationInput = undefined,
		geotrigger = undefined,
		filterInput = undefined,
		selectedPlace = undefined,
		showTimesResults = undefined;

	var APIRoot = "https://api.cinelist.co.uk";

	var startTime = undefined,
		endTime = undefined;

	function isWindows(cb){

		if (navigator.appVersion.indexOf("Win") != -1){
			cb();
		}

	}

	var loading = (function(){

		var el = document.getElementById('loading');

		function displayLoading(){
			el.setAttribute('class', 'spin');
			el.setAttribute('data-is-loading', 'true');
		}

		function hideLoading(){
			el.setAttribute('class', '');
			el.setAttribute('data-is-loading', 'false');
		}

		return{
			display : displayLoading,
			hide : hideLoading
		};

	})();

	var dialog = (function(){

		var el = document.getElementById('dialog');

		function displayDialog(message, isError){

			el.textContent = message;

			if(isError){
				el.setAttribute('class', 'error');
			} else {
				el.setAttribute('class', '');
			}

		}

		function hideDialog(time){
			
			setTimeout(function(){
				el.setAttribute('class', 'inactive');
				el.textContent = "";
			}, time);
			

		}

		function handleError(message){
			displayDialog(message, true);
			hideDialog(3000);
		}

		return{
			display : displayDialog,
			hide : hideDialog,
			error : handleError
		};

	})();

	function displayListings(listings){

		console.log(listings);


		var listings = listings;

		listings.sort(function(a,b){

			var disA = parseFloat(a.cinema.distance),
				disB = parseFloat(b.cinema.distance);

			if(disA < disB){
				return -1;
			} else {
				return 1;
			}

		});

		console.log(listings);

		document.getElementById('results').innerHTML = "";

		var cineFrag = document.createDocumentFragment();

		var d = new Date(),
			thisHour = d.getHours(),
			thisMinute = d.getMinutes();

		for(var x = 0; x < listings.length; x += 1){

			var thisCinemaData = listings[x];

			var cinemaName = document.createElement('h1'),
				cinemaDistance = document.createElement('span'),
				results = document.createElement('ul');

				cinemaName.textContent = thisCinemaData.cinema.name.trim().replace(/,+$/, "").replace(/ , /g, ', ');
				cinemaDistance.textContent = "(" + thisCinemaData.cinema.distance + " miles)"

				// Location Map
				// https://www.google.co.uk/maps/place/Cineworld Luton,The Galaxy,Bridge Street,Luton,Luton,LU1 2NB

				if(thisCinemaData.times.length === 0){
					continue;
				}
				cinemaName.appendChild(cinemaDistance);
				cineFrag.appendChild(cinemaName);

			for(var g = 0; g < thisCinemaData.times.length; g += 1){

				/*thisCinemaData.times.sort(function(a,b){

					var titleA = a.title[0].toLowerCase(),
						titleB = b.title[0].toLowerCase();

					if(titleA < titleB){
						return -1;
					} else {
						return 1;
					}

					return 0;

				});*/

				var	movieHolder = document.createElement('li'),
					movieTitle = document.createElement('h3'),
					timesHolder = document.createElement('div');

				if(thisCinemaData.times[g].title.length > 30){
					var shortened = thisCinemaData.times[g].title.slice(0, 29);
					movieTitle.setAttribute('class','shortened');
					movieTitle.textContent = shortened + "...";
				} else {
					movieTitle.textContent = thisCinemaData.times[g].title;	
				}

				movieHolder.setAttribute('data-movie-title', thisCinemaData.times[g].title);
				
				timesHolder.setAttribute('class', 'times');

				var setNext = false;

				for(var j = 0; j < thisCinemaData.times[g].times.length; j += 1){

					var aTime = document.createElement('a'),
						theTime = thisCinemaData.times[g].times[j].split(":"),
						canCatch = undefined;

					aTime.textContent = theTime.join(":");

					if(thisHour < parseInt(theTime[0])){
						canCatch = true
					} else if(thisHour == parseInt(theTime[0]) && thisMinute < parseInt(theTime[1])){
						canCatch = true;
					} else {
						canCatch = false;
					}

					if(!setNext && canCatch){
						aTime.setAttribute('class', 'next')
						setNext = true;
					}

					if(!canCatch){
						aTime.setAttribute('class','missed');
					}

					if(j === thisCinemaData.times[g].times.length - 1 && !setNext){
						movieHolder.setAttribute('data-all-missed', 'true');
					}

					timesHolder.appendChild(aTime);

				}

				movieHolder.appendChild(movieTitle);
				movieHolder.appendChild(timesHolder);

				results.appendChild(movieHolder);
				cineFrag.appendChild(results);

				document.getElementById('results').appendChild(cineFrag);

				//document.body.appendChild(cineFrag);

			}

			filterResults.setAttribute('class', '');
			filterResults.reset();

			setTimeout(function(){
				document.getElementById('goArrow').setAttribute('class', 'inactive');
			}, 10);

		}

	}

	function getShowtimes(cinemaID, callback){
		//http://162.243.202.96:9191/echo/cinematimes/7174

		console.log(cinemaID);

		// var getListingsURL = "http://cinelist.co.uk/echo/cinematimes/" + cinemaID;

		var getListingsURL = APIRoot + "/get/times/cinema/" + cinemaID;

		jQuery.ajax({
			type : "GET",
			url : getListingsURL,
			success : callback,
			error : function(err){
				console.log(err);
				callback(false);
				//loading.hide();
				//dialog.error("Sorry, something went wrong");
			},
			dataType : "json",
			crossDomain : true,
			cache : false
		});

	}	

	function searchCinemas(postcode, callback){

		// var earl = "http://cinelist.co.uk/echo/searchcinema/" + encodeURIComponent(postcode)

		var earl = APIRoot + "/search/cinemas/postcode/" + postcode;

		console.log(earl);

		jQuery.ajax({
			type : "GET",
			url : earl,
			success : callback,
			error : function(err){
				console.log(err);
				loading.hide();
				dialog.error("Sorry, Something went wrong");
			},
			dataType : "json",
			crossDomain : true,
			cache : false
		});

	}

	function searchPostCode(lat, lon, callback){

		console.log(lat, lon);
	
		lat = parseFloat(lat).toFixed(3);
		lon = parseFloat(lon).toFixed(3);

		var postCodeQuery = "https://api.postcodes.io/postcodes?lon=" + lon + "&lat=" + lat;

		console.log(postCodeQuery);

		jQuery.ajax({
			type : "GET",
			url : postCodeQuery,
			success : callback,
			error : function(err){
				console.log(err);
				loading.hide();
				dialog.error("Sorry, Something went wrong");
			}
		});

	}

	function searchTowns(town, callback){

		console.log(town);

		var reqQuery = "https://nominatim.openstreetmap.org/search?q=" + town + "&countrycodes=gb&format=json&limit=10";

		console.log(reqQuery);

		jQuery.ajax({
			type : "GET",
			url : reqQuery,
			success : callback,
			cache: false,
			error : function(err){
				console.error(err);
				loading.hide();
				dialog.error("Sorry, Something went wrong");
			}
		});

	}

	var lastPress = 0,
		filterInterval = undefined,
		lastSearch = undefined;

	function filterExistingResults(){

		clearTimeout(filterInterval);

			var filterables = document.querySelectorAll('[data-movie-title]'),
				filterTerm = filterResults[0].value.toLowerCase();

			if(filterTerm !== lastSearch){
				for(var i = 0; i < filterables.length; i += 1){
					filterables[i].setAttribute('class', '');
				}	
			}

			lastSearch = filterTerm

			filterInterval = setTimeout(function(){

				//Do the filter thing

				console.log(filterables);

				for(var h = 0; h < filterables.length; h += 1){

					if(filterables[h].getAttribute('data-movie-title').toLowerCase().indexOf(filterTerm) == -1){
						filterables[h].setAttribute('class', 'dim');
					} else if(filterTerm.length > 0){
						filterables[h].setAttribute('class', 'highlight');
					}

				}

			}, 300);

	}

	function handleSubmission(searchQuery){

		locationInput[0].blur();

		loading.display();
		dialog.hide(0);
		document.getElementById('results').innerHTML = "";

		document.getElementById('helper').setAttribute('class', 'inactive');

		var postCodeAcquired = function(res){

			console.log(res);

			if(res.result === null){
				console.error("This place doesn't have a UK postcode.");
				loading.hide();
				dialog.error("Could not find a UK postcode for this place...");
				locationInput[0].focus();
				return false;
			}

			if(res.result.length > 0){

				var postcode = res.result[0].postcode;

				selectedPlace = postcode;

				console.log(postcode);

				searchCinemas(postcode, function(res){

					console.log(res);

					var cinemas = res.cinemas;

					if(cinemas.length > 10){
						cinemas.length = 10;
					} else if(cinemas.length === 0){
						loading.hide();
						dialog.error("Sorry, Couldn't find any cinemas");
					}

					var listings = [],
						complete = 0;

					for(var c = 0; c < cinemas.length; c += 1){
						(function(cinema){

							var times = getShowtimes(cinema.id, function(res){
								console.log(res);
								if(res !== false){
									listings.push({
										cinema : cinema,
										times : res.listings
									});
								}

								complete += 1;

								if(complete == cinemas.length - 1){
									console.log(listings);
									displayListings(listings);
									loading.hide();
								}

							});

						})(cinemas[c]);
					}

				});

			}

		};

		if(searchQuery.latitude === undefined){
			// Not a position object, it's a string

			searchTowns(searchQuery, function(res){

				console.log(res);

				if(res.length === 0){
					console.error("Not a valid place name");
					loading.hide();
					dialog.error("Sorry, couldn't find that place");
					return false;
				}

				var selectedTown = res[0];

				window.history.pushState({}, "CineList | " + searchQuery, "/?place=" + searchQuery);

				searchPostCode(selectedTown.lat, selectedTown.lon, postCodeAcquired);

			});

		} else {
			window.history.pushState({}, "CineList | Results", "/?latitude=" + searchQuery.latitude + "&longitude=" + searchQuery.longitude);
			searchPostCode(searchQuery.latitude, searchQuery.longitude, postCodeAcquired);
		}

	}

	function checkForRef(){

		//console.log(window)

		var location = window.location.href,
			query = location.split('?')[1],
			params = undefined,
			parObj = {};

		if(query !== undefined){

			params = query.split('&');

		} else {

			return false;

		}

		for(var g = 0; g < params.length; g += 1){

			var thisParam = params[g].split('=');

			parObj[thisParam[0]] = thisParam[1]

		}

		console.log(parObj);

		if(parObj.place !== undefined){
			locationInput[0].value = decodeURIComponent(parObj.place);
			handleSubmission(parObj.place);
		} else if(parObj.latitude !== undefined && parObj.longitude !== undefined){
			handleSubmission({
				latitude : parObj.latitude,
				longitude : parObj.longitude
			});
		}

		console.log(locationInput[0]);

	}

	function addEvents(){

		locationInput.addEventListener('submit', function(e){
			e.preventDefault();

			var searchQuery = this[0].value;

			handleSubmission(searchQuery);

		}, true);

		locationInput.addEventListener('focus', function(){
			document.getElementById('goArrow').setAttribute('class', '');
		}, true);

		if("geolocation" in navigator){

			geotrigger.addEventListener('click', function(){
				loading.display();
				navigator.geolocation.getCurrentPosition(function(position) {
					handleSubmission({
						latitude : position.coords.latitude,
						longitude : position.coords.longitude
					});
				}, function(err){
					console.log(err);
					loading.hide();
					dialog.error("Sorry, unable to get your position");
				});

			}, false);
				
			geotrigger.setAttribute('class', 'active');

		}

		filterResults.addEventListener('submit', function(e){
			e.preventDefault();
			filterResults[0].blur();
			filterExistingResults();
		});

		filterResults.addEventListener('keyup', function(){

			filterExistingResults();

		}, false);


	}

	function init(){

		if(initialised){
			console.error("Cinelist has already been initialised");
			return false;
		}

		console.log("Initialised");

		isWindows(function(){
			document.body.setAttribute('class', 'windows');
		});

		locationInput = document.getElementById('locationSearch');
		geotrigger = document.getElementById('geotrigger');
		filterInput = document.getElementById('filterResults');

		addEvents();
		checkForRef();

		initialised = true;

	}

	return{
		init : init
	};

})();

(function(){
	__cinelist.init();
})();

