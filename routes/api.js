var express = require('express');
var passwordless = require('passwordless');

var User = {
	find: function(obj, callback){
		if(obj.email == "billstron@gmail.com"){
			callback(null, {email: "billstron@gmail.com", id: 213, address: "1803 Harvard Dr"});
		}else{
			callback(null);
		}
	},
};


var app = express();

app.post('/auth', passwordless.acceptToken({ allowPost: true }),
    function(req, res) {
		if(req.user){
			
		}
		console.log("success user:", req.user);
		res.send("good job, now clear the tokens from your browser bar.");
});

app.post('/sendtoken', 
	passwordless.requestToken(
		// Simply accept every user
		function(user, delivery, callback) {
			User.find({email: user}, function(err, ret) {
				if(ret)
					callback(null, ret.id)
				else
					callback(null, null)
			});
		}),
	function(req, res, next){
		res.send("okay");
	}
);

module.exports = app;