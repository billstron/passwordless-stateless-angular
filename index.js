var express = require('express');
var path = require("path");
var bodyParser = require('body-parser');
var passwordless = require('passwordless');
var MemStore = require('passwordless-memorystore');

var app = express();

var host = 'http://localhost:3000/#/authenticate';

// Setup of Passwordless
passwordless.init(new MemStore());
passwordless.addDelivery(function(tokenToSend, uidToSend, recipient, callback) {
	console.log("\n\nYou can now access your account here: " 
		+ host + "?token=" + tokenToSend + "&uid=" + encodeURIComponent(uidToSend));
	callback(null);
});

// Standard express setup
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());

app.use(express.static(path.join(__dirname, "www")));
app.use('/api', require("./routes/api"));

app.use(function(req, res, next) {
    res.status(404).end();
});

app.set('port', 3000);

var server = app.listen(app.get('port'), function() {
  console.log('Express server listening on port ' + server.address().port);
});