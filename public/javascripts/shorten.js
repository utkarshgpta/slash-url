$('#short').submit(function(event){
	var urlText = $('#urlField').val();
	var config = {
	  headers: {'url': urlText}
	};

	axios.get(location.protocol + '//' + location.host+'/api/shorten', config)
    .then(function (response) {
    	var shortUrl = response.data;
    	$('#shortUrl').text(shortUrl);
    })
    .catch(function (error) {
    	console.log(error);
    });
});
