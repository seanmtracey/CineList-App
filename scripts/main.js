const __cinelist = (function(){
	
	'use strict';
	
	const prevent = function(e) {
		e.preventDefault();
		e.stopImmediatePropagation();
	}

	const apiRoot = "https://cinelist-api.herokuapp.com";
	
	const locationForm = document.querySelector('#locationSearch');
	const filterForm = document.querySelector('#filterResults');
	const resultsSection = document.querySelector('#results');
	
	const getCinemas = (function(){
		
		function getCinemasByPostCode(postcode){
			
			return fetch(`${apiRoot}/search/cinemas/postcode/${postcode}`)
				.then(res => res.json())
				.then(data => {
					return data;
				})
			;
			
		}
		
		return{
			postcode : getCinemasByPostCode	
		};
		
	}());
	
	function searchForCinemas(query){
		
		const postcodeCheck = `${apiRoot}/check/isPostcode/${query}`;
		
		return fetch(postcodeCheck)
			.then(res => res.json())
			.then(data => {
				if(data.validPostcode){
					return getCinemas.postcode(query);
				}
			})
		;
		
	}
	
	locationForm.addEventListener('submit', function(e){
		prevent(e);
		const searchTerm = this[0].value;
		searchForCinemas(searchTerm)
			.then(cinemaData => {
				
				console.log(cinemaData);
				
				cinemaData.cinemas.forEach(cinema => {
					
					const cineFrag = document.createDocumentFragment();
					const markup = document.createRange().createContextualFragment(`
						<div class="cinema-holder" data-cinema-id=${cinema.id}>
						<h1>${cinema.name}</h1>
						<ul></ul>
						</div>
					`);
					
					cineFrag.appendChild(markup);
					resultsSection.querySelector('ul').appendChild(cineFrag);
					
				});
				
			})
		;
	}, true);
	
	filterResults.addEventListener('submit', function(){
		prevent(e);
	}, false);
	
	filterResults.addEventListener('keyup', function(e){
		const filterValue = this[0].value;
		console.log(filterValue);
	}, false);
	
}());