angular.module('authServices', [])

    //La factoria Auth controla todas las funciones login/logout
    .factory('Auth', function ($http, AuthToken) {
        authFactory = {};

        //Función que loguea al usuario
        //Auth.login(loginData);
        authFactory.login = function (loginData) {
            return $http.post('/api/authenticate', loginData).then(function (data) {
                AuthToken.setToken(data.data.token);
                return data;
            });
        };

        //Función que comprueba que el usuario está logueado
        //Auth.isLoggedIn()   
        authFactory.isLoggedIn = function () {
            if (AuthToken.getToken()) {
                return true;
            } else {
                return false;
            }
        };
        
        //Función que establece el token al loguearse con todas las redes sociales
        //Auth.facebook(token)
        authFactory.facebook = function (token) { 
            AuthToken.setToken(token);//Establece el token dado por Passport en el local storage
        };

        //Función que devuelve los datos del usuario logueado actualmente        
        //Auth.getUser()  
        authFactory.getUser = function () {
            if (AuthToken.getToken()) {//Primero se comprueba que el usuario tiene un token
                return $http.post('/api/me');
            } else {
                $q.reject({ message: 'User has no token' });
            }
        };

        //Función que hace el logout del usuario
        //Auth.logout();        
        authFactory.logout = function () {
            AuthToken.setToken();//Limpia el token del local storage
        };

        return authFactory;
    })

    //La factoria AuthToken controla todas las funciones asociadas a los token
    .factory('AuthToken', function ($window) {
        var authTokenFactory = {};

        //Función que establece o limpia el token del local storage        
        //AuthToken.setToken(token);
        authTokenFactory.setToken = function (token) {
            if (token) {
                $window.localStorage.setItem('token', token);
            } else {
                $window.localStorage.removeItem('token');
            }
            
        };

        //Función que recupera el token almacenado en el local storage
        //AuthToken.getToken();
        authTokenFactory.getToken = function () {
            return $window.localStorage.getItem('token');
        };

        return authTokenFactory;
    })

    //FActoria utilizada para configurar los headers con el token(los headers se configuran en app.js)
    .factory('AuthInterceptors', function (AuthToken) { 
        var authInterceptorsFactory = {};

        //Función que comprueba si existe token y si es así lo incluye en el header        
        authInterceptorsFactory.request = function (config) { 
            
            var token = AuthToken.getToken();

            if (token) config.headers['x-access-token'] = token;

            return config;
        };

        return authInterceptorsFactory;
    });