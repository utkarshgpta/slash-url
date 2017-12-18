var config = {};

config.db = {};
// the URL shortening host - shortened URLs will be this + baseHash ID
// i.e.: http://localhost:3000/3Ys
config.webhost = 'https://slash-url.herokuapp.com/';

// your MongoDB host and database name
config.db.host = 'mongodb://admin:admin123@ds019846.mlab.com';
config.db.port = 19846;
config.db.name = 'heroku_6srjdlq5';
config.db.collections = ['urls', 'counters'];

module.exports = config;
