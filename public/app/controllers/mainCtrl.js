angular.module('mainController', ['authServices','userServices'])

    //mainCtrl: controla el login y las funciones que son necesarias en el index y por tanto en todas las paáginas
    .controller('mainCtrl', function (Auth, $timeout, $location, $rootScope, $window, $interval, $route,User,AuthToken) {
        var app = this;

        app.loadme = false;//Oculta todo el html hasta que todos los datos son obtenido por angular. Asi se evita que aparezca {} si aun no se han cargado los datos

        // Comprueba si la sesión del usuario expiró la primera vez que entra a la página
        if (Auth.isLoggedIn()) {
            //Comprueba el token
            Auth.getUser().then(function (data) {
                //Comprueba si el usuario es undefined->sesión expirada
                if (data.data.username === undefined) {
                    Auth.logout(); //Desloguea al usuario
                    app.isLoggedIn = false; 
                    $location.path('/'); //Pagina principal
                    app.loadme = true;
                }
            });
        }

        
        //Función que comprueba cada x tiempo si la sesion ha expirado, es decir comprueba si el token sigue siendo válido o ha caducado
        app.checkSession = function () {
            if (Auth.isLoggedIn()) {
                app.checkingSession = true;//Comprueba si el intervalo sigue funcionando
                var interval = $interval(function () {
                    var token = $window.localStorage.getItem('token');//Consigue el toquen del local storage
                    if (token === null) {
                        $interval.cancel(interval);
                    } else {
                        //Función que consigue el timeStamp del token
                        self.parseJwt = function (token) {
                            var base64Uri = token.split('.')[1];
                            var base64 = base64Uri.replace('-', '+').replace('_', '/');
                            return JSON.parse($window.atob(base64));
                        };
                        var expireTime = self.parseJwt(token);
                        var timeStamp = Math.floor(Date.now() / 1000);//timeStamp actual
                        var timeCheck = expireTime.exp - timeStamp;//Tiempo que queda para que expire el token
                        if (timeCheck <= 1800) {
                            showModal(1);//Cuando quedan 30 minutos para que la sesión caduque abre un modal que pregunta al usuario si desea renovar la sesión o salir
                            $interval.cancel(interval);
                        }
                    } 
                }, 30000);//30 segundos
            }
        };

        app.checkSession();//Por si el usuario refresca la página, el interval se pone en marcha

        //Función que abre el modal de bootstrap        
        var showModal = function (option) {
            //Se limpian las variables del modal en su inicio
            app.choiceMade = false;
            app.modalHeader = undefined;
            app.modalBody = undefined;
            app.hideButton = false;

            //Opción 1: sesión expirada o a punto de expirar
            if (option === 1) {
                app.modalHeader = 'Timeout Warning';
                app.modalBody = 'Your sesion will expired in 30 minutes. Would you like to renew your sesion?';
                $("#myModal").modal({ backdrop: "static" });
                //Se le da 10 segundos al usuario para que decida. Si no decide se cierra la sesión
                $timeout(function () {
                    if (!app.choiceMade) app.endSession(); 
                }, 10000);
            }

            //Opción 2: Logout            
            else if (option === 2) {
                app.hideButton = true;
                app.modalHeader = 'Logging Out';
                $("#myModal").modal({ backdrop: "static" });
                $timeout(function () {
                    Auth.logout();//Se desloguea al usuario y se le redirige
                    $location.path('/');
                    hideModal();
                    //$route.reload();
                }, 2000);
            }

            /*$timeout(function () {
                if (!app.choiceMade) {
                    hideModal();
                }
            }, 10000);*/

        };

        //Función que permite al usuario renovar su sesión renovando su token
        app.renewSession = function () {
            app.choiceMade = true;//Cancela el intervalo que comprueba si el usuario eligio una opción en el modal 1
            User.renewSesion(app.username).then(function (data) {  
                if (data.data.success) {
                    AuthToken.setToken(data.data.token);//Set del token
                    app.checkSession();//Reinicio de la comprobación de la sesión
                } else {
                    app.modalBody = data.data.message;
                }
            });
            hideModal();
        };

        //Función que termina la sesión al hacer logout o cuando expira el token        
        app.endSession = function () {
            app.choiceMade = true; //Cancela el intervalo que comprueba si el usuario eligio una opción en el modal 1
            hideModal();
            $timeout(function () { 
                showModal(2);//Modal de logout
            }, 1000);
        };

        //Función que oculta el modal;
        var hideModal = function () {
            $("#myModal").modal('hide');
        };

        //Función que se ejecuta cada vez que se cambia de ruta        
        $rootScope.$on('$routeChangeStart', function () {

            if (!app.checkingSession) app.checkSession();//Si no se está comprobando la se sesión se inicia la comprobación

            //Comprueba si el usuario está logueado            
            if (Auth.isLoggedIn()) {
                //Consigue los datos del usuario para usarlos en el index
                Auth.getUser().then(function (data) {
                    //Sesión expirada->logout
                    if (data.data.username === undefined) {
                        app.isLoggedIn = false;
                        Auth.logout();
                        app.isLoggedIn = false;
                        $location.path('/');
                    } else {
                        app.isLoggedIn = true;
                        app.username = data.data.username;
                        app.useremail = data.data.email;

                        User.getPermission().then(function (data) {
                            if (data.data.permission === 'admin' || data.data.permission === 'moderator') {
                                app.authorized = true;
                                app.loadme = true;
                            } else {
                                app.loadme = true;
                            }
                        });              
                    }   
                });
            } else {
                app.isLoggedIn = false;
                app.username = '';
                app.loadme = true;
            }
            if ($location.hash() == '_=_') $location.hash(null);//Limpia la url en el callback de facebook
            app.disabled = false;
            app.errorMsg = false;
        });

        //Función para redirigir a los usuarios a la autencicación con Facebook        
        this.facebook = function () {
            app.disabled = true;
            $window.location = $window.location.protocol + '//' + $window.location.host + '/auth/facebook';
        };

        //Función para redirigir a los usuarios a la autencicación con Twitter
        this.twitter = function () {
            app.disabled = true;
            $window.location = $window.location.protocol + '//' + $window.location.host + '/auth/twitter';
        };

        //Función para redirigir a los usuarios a la autencicación con Google
        this.google = function () {
            app.disabled = true;
            $window.location = $window.location.protocol + '//' + $window.location.host + '/auth/google';
        };

        //Función usada para loguearse        
        this.doLogin = function (loginData) {
            app.loading = true;//Icono de cargando
            app.errorMsg = false;
            app.expired = false;
            app.disabled = true;//Deshabilita el formulario al hacer submit

            //Llamada a la función que loguea al usuario            
            Auth.login(app.loginData).then(function (data) {
                if (data.data.success) {
                    app.loading = false;
                    app.successMsg = data.data.message + '...Redirecting';
                    $timeout(function () {
                        $location.path('/');
                        app.loginData = '';
                        app.successMsg = false;
                        app.checkSession();
                        app.disabled = false;
                    }, 2000);//Después de 2 segundos si el logueo es correcto se redirige al usuario

                } else {
                    if (data.data.expired) {//Se comprueba si la sesión ha expirado
                        app.expired = true;
                        app.loading = false;
                        app.errorMsg = data.data.message;
                    } else {
                        app.loading = false;
                        app.disabled = false;
                        app.errorMsg = data.data.message;
                    }
                }
            });
        };

        //Función para desloguear al usuario        
        app.logout = function () {
            showModal(2);
        };
    });