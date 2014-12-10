Passwordless Stateless Angular
==========================

An [Angular.js](https://angularjs.org/) example application for utilizing [Passwordless](https://passwordless.net/) 
login with a stateless API server using JWT. 

## Installation
Dependencies: `node.js`, `bower`.
```
git clone https://github.com/billstron/passwordless-stateless-angular.git
cd ./passwordless-stateless-angular
npm install
bower install
```

## Usage
1. Start the server
	```
	node ./index.js
	```
2. Browse to [http://localhost:3000](http://localhost:3000).  
3. Try the API access.  There is an open one and a restricted one.   
4. Submit your email for authentication: foo@bar.com  
5. Check the server logs for the correct link to follow. Copy and paste that link into your browser window. 
You will be redirected back with an authorized session.
6. Check the restricted resource.   

## License
[BSD 2-Clause](http://opensource.org/licenses/BSD-2-Clause)
