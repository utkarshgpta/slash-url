var express = require('express');
var app = express();
var MongoClient = require('mongodb').MongoClient;
var config = require('./config.js');
var baseHash = require('./baseHash.js');

var db_url = config.db.host + ':' + config.db.port;

app.get('/', function(req, res) {
	res.send('Hello');
});

app.get('/api/shorten', function(req, res) {
  var longUrl = req.headers.url;
  var shortUrl = '';
  
  MongoClient.connect(db_url, function(err, client) {
	  if (err) throw err;

	  var db = client.db(config.db.name);
	  var urlCollection = db.collection('urls');

	  urlCollection.findOne({'long_url': longUrl}, function(err, doc) {
	  	if (err) throw err;

	  	if (doc) {
	  		shortUrl = config.webhost + baseHash.encode(doc._id);
	  		res.send(shortUrl);
	  		client.close();
	  	}
	  	else {
	  		var countersCollection = db.collection('counters');
	  		
	  		countersCollection.findOne({_id: 'url_count'}, function(err, docs) {
	  			var newId = docs.val;
	  			countersCollection.update({_id: "url_count"}, {$inc: {"val": 1}}, function(err) {
	  				if (err) throw err;
	  				shortUrl = config.webhost + baseHash.encode(newId);
	  				urlCollection.insert({_id: newId, long_url: longUrl}, function(err) {
	  					if (err) throw err;
	  					client.close();
	  					res.send(shortUrl);
	  				});
	  			});
	  		});
	  	}

	  });
	});
});

app.get('/:encoded_id', function(req, res){
  // route to redirect the visitor to their original URL given the short URL
});


var server = app.listen(3000, function(){
  console.log('Server listening on port 3000');
});
