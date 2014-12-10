var express = require('express');
var passwordless = require('passwordless');
var expressJwt = require('express-jwt');
var jwt = require('jsonwebtoken');

var secret = "some-long-secret";

var User = {
	tokens: [],
	find: function(obj, callback){
		if(obj.email == "foo@bar.com" || obj.id == 213){
			callback(null, {email: "foo@bar.com", id: 213, address: "1803 Calculingua Dr"});
		}else{
			callback(null);
		}
	},
	storeToken: function(token, email, callback){
		User.tokens[token] = {email : email};
		callback(null);
	},
	checkToken: function(token, callback){
		var out = User.tokens[token];
		callback(null, out);
	},
	removeToken: function(token, callback){
		delete User.tokens[token];
		callback(null);
	},
	removeAllUserTokens: function(email, callback){
		try{
			for(var key in User.tokens){
				if(User.tokens[key].email == email){
					delete User.tokens[key];
				}
			}
		}catch(ex){
			return callback(ex);
		}
		callback(null);
	}
};

function createToken(obj, callback){
	
	User.find(obj, function(err, profile){
		if(err){
			return callback(err);
		}
		
		var token = jwt.sign(profile, secret, { expiresInMinutes: 1 });
		User.storeToken(token, profile.email, function(err){
			if(err){
				return callback(err);
			}
				
			callback(null, token, profile);
		});
	});
}

function verifyToken(token, callback){
	jwt.verify(token, secret, callback);
}


var app = express();

app.post('/login', passwordless.acceptToken({ allowPost: true }),
    function(req, res) {
		if(req.user){
			createToken({id: req.user}, function(err, token, decoded){
				if(err){
					return res.status(401).send(err);
				}
				decoded.token = token;
				res.json(decoded);
			});
		}else{
			res.status(401).send("not good");
		}
	});

app.post('/passwordless', 
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

app.post("/logout", function(req, res){
		
	var token = req.header("Authorization");
	token = token.split(" ")[1];
	
	verifyToken(token, function(err, decoded) {
		if(err){
			return res.status(401, err);
		}
		
		User.removeAllUserTokens(decoded.email, function(err){
			if(err){
				return res.status(500, err);
			}
			return res.status(200).send("all tokens removed");
		});
	});
});


app.post('/refresh-token', function(req, res){

	var token = req.body.token;

	verifyToken(token, function(err, decoded){
		if (err) {
			if(err.name == "TokenExpiredError"){
				
				User.checkToken(token, function(err, opts){
					if(err){
						return res.status(401).send(err);
					}
						
					if(opts){
						User.removeToken(token, function(err){
							if(err){
								return res.status(500).send(err);
							}
				
							createToken({email: opts.email}, function(err, token, decoded){
								if(err){
									return res.status(401).send(err);
								}
								decoded.token = token;
								res.json(decoded);
							});
						});
					}else{
						res.status(401).send("not found");
					}
				});
				
			}else{
				res.status(401).send(err.message);
			}
		}else{
			
			User.removeToken(token, function(err){
				if(err){
					return res.status(500).send(err);
				}
				
				createToken({email: decoded.email}, function(err, token, decoded){
					if(err){
						return res.status(401).send(err);
					}
					decoded.token = token;
					res.json(decoded);
				});
			});
		}
	});
});

app.get("/open", function(req, res){
	res.send("no problem here");
});

app.get("/restricted", expressJwt({secret: secret}), function(req, res){
	res.send("YOU are okay");
});
	
module.exports = app;