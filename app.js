var express = require('express');
var app = express();
var MongoClient = require('mongodb').MongoClient;
var url = require("url");
var path = require('path');
var config = require('./config.js');
var baseHash = require('./baseHash.js');

app.use(express.static(path.join(__dirname, 'public')));
var db_url = config.db.host + ':' + config.db.port;

MongoClient.connect(db_url, function(err, client) {
	var countersCollection = client.db(config.db.name).collection('counters');
	countersCollection.findOne({_id: 'url_count'}, function(err, docs) {
		if (err) throw err;
		if (!docs)
			countersCollection.insert({_id: 'url_count', val: 1});
	});
});

app.get('/', function(req, res) {
	res.sendFile(path.join(__dirname, 'views/index.html'));
});

app.get('/api/shorten', function(req, res) {
  var longUrl = req.headers.url;
  var result = url.parse(longUrl);
	if(!result.protocol) longUrl = 'https://' + longUrl;
	result = url.parse(longUrl);
	if(!result.host) {
		res.send("Not a valid URL");
		return;
	}
  
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
	  		return;
	  	}
	  	else {
	  		var countersCollection = db.collection('counters');
	  		
	  		countersCollection.findOne({_id: 'url_count'}, function(err, docs) {
	  			if (err) throw err;
	  			
	  			var newId = docs.val;

	  			countersCollection.update({_id: 'url_count'}, {$inc: {val: 1}}, function(err) {
	  				if (err) throw err;
	  				shortUrl = config.webhost + baseHash.encode(newId);
	  				urlCollection.insert({_id: newId, long_url: longUrl}, function(err) {
	  					if (err) throw err;
	  					client.close();
	  					res.send(shortUrl);
	  					return;
	  				});
	  			});
	  		});
	  	}

	  });
	});
});

app.get('/:encoded_id', function(req, res){
	res.statusCode = 302;
	var hashedUrl = req.params.encoded_id;
	var id = baseHash.decode(hashedUrl);

	MongoClient.connect(db_url, function(err, client) {
	  if (err) throw err;

	  var db = client.db(config.db.name);
	  var urlCollection = db.collection('urls');
	  urlCollection.findOne({'_id': id}, function(err, doc) {
	  	if (err) throw err;

	  	if (doc) {
	  		res.redirect(doc.long_url);
	  		client.close();
	  	}
	  	else{
	  		res.redirect(config.webhost);
	  	}
	  });
	});
});

var server = app.listen(3000, function(){
  console.log('Server listening on port 3000');
});
