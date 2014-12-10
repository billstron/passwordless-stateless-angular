(function(){
	
	var apiConfig = {
		refresh: 60, 
		host: "http://localhost:3000"
	};
	
	var mod = angular.module("psa-app", ["ngRoute"]);
	
	mod.service("AuthIntercepter", ["$rootScope", "$q", "$window", "$interval", 
		function($rootScope, $q, $window, $interval) {
		
			this.request = function (config) {
				config.url = config.url;
				config.headers = config.headers || {};
				if ($window.sessionStorage.token) {
					config.headers.Authorization = 'Bearer ' + $window.sessionStorage.token;
				}
				return config;
			};
		
			this.response = function (response) {
				if (response.status === 401) {
					// handle the case where the user is not authenticated
				}
				return response || $q.when(response);
			};
		}
	]);
	
	mod.service("Api", ["$http", "$window",
		function($http, $window, $interval){
			
			this.getOpen = function(){
				return $http.get(apiConfig.host + "/api/open");
			};
			
			this.getRestricted = function(){
				return $http.get(apiConfig.host + "/api/restricted");
			};
			
		}
	]);
		
	mod.service("Logon", ["$http", "$window", "$interval", "$rootScope",
		function($http, $window, $interval, $rootScope){
			var self = this;
			
			this.authorized = false;
			
			function setAuth(auth){
				self.authorized = auth;
				$rootScope.$broadcast("logon.authorized", self.authorized);
			}
			
			var checkInterval = apiConfig.refresh * 1000;

			function checkStatus(){
				if ($window.sessionStorage.token) {
					$http.post(apiConfig.host + "/api/refresh-token", {token: $window.sessionStorage.token})
						.success(function(data){
							console.log("success with refresh:", data.token);
							$window.sessionStorage.token = data.token;
							setAuth(true);
						})
						.error(function(err){
							console.log("error on refresh:", err);
							delete $window.sessionStorage.token;
							setAuth(false);
						});
				}else{
					
				}
			}

			$interval(checkStatus, checkInterval);
			checkStatus();
			
			this.passwordless = function(email){
				return $http.post(apiConfig.host + "/api/passwordless", {user: email})
					.success(function (data, status, headers, config) {
						return "okay";
					})
					.error(function (data, status, headers, config) {
						return "bad";
					});
			};
			
			this.login = function(uid, token){
				return $http.post(apiConfig.host + "/api/login", {uid: uid, token: token})
					.success(function (data, status, headers, config) {
			
						$window.sessionStorage.token = data.token;
						setAuth(true);
						return "welcome";
					})
					.error(function (data, status, headers, config) {
						// Erase the token if the user fails to log in
						delete $window.sessionStorage.token;
						setAuth(false);

						// Handle login errors here
						return 'Error: Invalid user or password';
					});
			};

			this.logout = function(){
				return $http.post(apiConfig.host + "/api/logout")
					.success(function(data){
						delete $window.sessionStorage.token;
						setAuth(false);
						return true;
					})
					.error(function(data){
						return false;
					});
			};
		}
	]);

	mod.config(["$httpProvider", "$routeProvider", 
		function($httpProvider, $routeProvider) {
	
			$httpProvider.interceptors.push('AuthIntercepter');

			$routeProvider
				.when('/', {
					templateUrl: '/partials/dash.html',
				})
				.when("/authenticate", {
					templateUrl: "/partials/authenticate.html"
				})
				.otherwise({
					redirectTo: "/"
				});
		}
	]);
	
	mod.controller("Main", ["$rootScope", "Api", "Logon",
		function($rootScope, api, logon){
			var self = this;
			
			this.authorized = logon.authorized;
			$rootScope.$on("logon.authorized", function(event, value){
				self.authorized = value;
			});
			
			this.logout = function(){
				logon.logout()
					.then(function(okay){
						console.log("logged out:", okay);
					});
			};
		}
	]);
	
	mod.controller("Dash", ["Logon", "AuthIntercepter", "Api",
		function(logon, auth, api){
			var self = this;
			
			this.login = function(email){
				logon.passwordless(email)
					.then(function(res){
						self.status = "success: " + res.data;
					})
					.catch(function(res){
						self.status = "failed: " + res.data;
					});
			};
			
			this.getOpen = function(){
				api.getOpen()
					.success(function(data){
						self.openValue = data;
					})
					.error(function(data){
						self.openValue = data;
					});
			};
			
			this.getRestricted = function(){
				api.getRestricted()
					.success(function(data){
						self.restrictedValue = data;
					})
					.error(function(data){
						self.restrictedValue = data;
					});
			}
		}
	]);
	
	mod.controller("Auth", ["$location", "$window", "Logon", "AuthIntercepter",
		function($location, $window, logon, auth){
			var self = this;
			
			this.login = function(uid, token){
				logon.login(uid, token)
					.then(function(message){
						console.log(message);
						$window.location.href = "/";
					})
					.catch(function(message){
						
					});
			};
			
			var params = $location.search();
			if(params.uid && params.token){
				self.uid = params.uid;
				self.token = params.token;
				self.login(self.uid, self.token);
			}
		}
	]);
	
	
	
})();