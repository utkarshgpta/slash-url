$(document).ready(function(){
    $('[data-toggle="tooltip"]').tooltip();   
});

$('#clipboardTooltip').tooltip({placement: 'bottom',trigger: 'manual'});

$('#short').submit(function(event){
	var urlText = $('#urlField').val();
	var config = {
	  headers: {'url': urlText}
	};

	axios.get(location.protocol + '//' + location.host+'/api/shorten', config)
    .then(function (response) {
    	var shortUrl = response.data;
    	$('#shortUrl').text(shortUrl);
      $('#clipboardTooltip').tooltip('hide')
      .attr('data-original-title', 'Copy to Clipboard')
      .tooltip('show');
    })
    .catch(function (error) {
    	console.log(error);
    });
});

function clipboardCopy() {
  var copyText = document.getElementById("shortUrl").innerText; 
  var $temp = $("<input>");
  $("body").append($temp);
  $temp.val(copyText).select();
  document.execCommand("copy");
  $temp.remove();
  $('#clipboardTooltip').tooltip('hide')
      .attr('data-original-title', 'Link Copied!')
      .tooltip('show');
}
