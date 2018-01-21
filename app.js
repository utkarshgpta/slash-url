var express = require('express');
var app = express();
var MongoClient = require('mongodb').MongoClient;
var url = require("url");
var path = require('path');
var redis = require('redis');
var config = require('./config.js');
var baseHash = require('./baseHash.js');

app.use(express.static(path.join(__dirname, 'public')));
app.set('port', (process.env.PORT || 5000));

var db_url;

if (process.env.MONGODB_URI) db_url = process.env.MONGODB_URI;
else db_url = config.db.localhost + ':' + config.db.port;

console.log(db_url);

var rClient = redis.createClient(process.env.REDIS_URL);

rClient.on('connect', function() {
    console.log('Redis Connected');
});

MongoClient.connect(db_url, function(err, client) {
	if (err) throw err;
	console.log("DB connected");
	var db = client.db(config.db.name);
	var query_arr = {_id: 'url_count'};
	db.collection('counters').findOne(query_arr, function(err, res) {
		if (err) {
			client.close();
			throw err;
		}

		if (!res){
			var insert_arr = {_id: 'url_count', val: 1};
			db.collection('counters').insertOne(insert_arr, function(err, res){
				if (err) {
					client.close();
					throw err;
				}
				console.log("Counters Collection Inserted");
				client.close();
			});
		}
		else {
			console.log("Counters exists!");
			client.close();
		}
	});
});

app.get('/', function(req, res) {
	res.sendFile(path.join(__dirname, 'views/index.html'));
});

app.get('/api/shorten', function(req, res) {
  var longUrl = req.headers.url;
  var result = url.parse(longUrl);
	if(!result.protocol || longUrl.substring(0,4)=='www.') longUrl = 'https://' + longUrl;
	result = url.parse(longUrl);
	if(!result.host) {
		res.send("Not a valid URL");
		return;
	}

	rClient.exists(longUrl, function(err, reply) {
    if (err) throw err;
    if (reply === 1) {
    	console.log('URL already exists');
      rClient.get(longUrl, function(err, reply) {
      	if (err) throw err;
      	res.send(reply);
      	return;
			});
    } else {
    	console.log('URL doesn\'t exist');
    	var shortUrl = '';

		  MongoClient.connect(db_url, function(err, client) {
			  if (err) throw err;

			  var db = client.db(config.db.name);
			  var urlCollection = db.collection('urls');

			  urlCollection.findOne({'long_url': longUrl}, function(err, doc) {
			  	if (err) throw err;

			  	if (doc) {
			  		shortUrl = config.webhost + baseHash.encode(doc._id);
			  		rClient.set(longUrl, shortUrl);
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
			  				rClient.set(longUrl, shortUrl);
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
    }
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

var server = app.listen(app.get('port'), function(){
  console.log('Server listening on port ' + app.get('port'));
});
