(function(){
	
	var apiConfig = {
		refresh: 60, 
		host: "http://localhost:3000"
	};
	
	var mod = angular.module("psa-app", ["ngRoute"]);
	
	mod.service("AuthIntercepter", ["$rootScope", "$q", "$window", "$interval", 
		function($rootScope, $q, $window, $interval) {

			var checkInterval = apiConfig.refresh * 1000;

			function checkStatus(){
				if ($window.sessionStorage.token) {
					$http.post(apiConfig.host + "/api/refresh-token", {token: $window.sessionStorage.token})
						.success(function(data){
							console.log("success with refresh:", data.token);
							$window.sessionStorage.token = data.token;
						})
						.error(function(err){
							console.log("error on refresh:", err);
							delete $window.sessionStorage.token;
							
						});
				}else{
					
				}
			}

			$interval(checkStatus, checkInterval);
			checkStatus();
		
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
		
	mod.service("Logon", ["$http", "$window", "$rootScope",
		function($http, $window, $rootScope){
			var self = this;
			
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
						self.message = 'Welcome';
					})
					.error(function (data, status, headers, config) {
						// Erase the token if the user fails to log in
						delete $window.sessionStorage.token;

						// Handle login errors here
						self.message = 'Error: Invalid user or password';
					});
			};

			this.logout = function(){
				return $http.post(apiConfig.host + "/api/logout")
					.success(function(data){
						delete $window.sessionStorage.token;
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
				.when("/logon", {
					templateUrl: "/partials/logon.html"
				})
				.otherwise({
					redirectTo: "/"
				});
		}
	]);
	
	mod.controller("Dash", ["Logon", "AuthIntercepter",
		function(logon, auth){
			var self = this;
			
			this.login = function(email){
				logon.passwordless(email)
					.then(function(data){
						self.status = "submitting email: " + data;
					});
			}
		}
	]);
	
})();