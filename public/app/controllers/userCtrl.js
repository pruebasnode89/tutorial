angular.module('userControllers', ['userServices'])

    //regCtrl: controlador usado para registrar un nuevo usuario    
    .controller('regCtrl', function ($location, $timeout, User) {

        var app = this;

        //Función que registra al usuario en la base de datos        
        this.regUser = function (regData, valid) {
            app.disabled = true;//Desactiva el formulario en el submit
            app.loading = true;//Muestra icono de cargando
            app.errorMsg = false;//Reinicia mensaje de error

            if (valid) {//Si el formulario es válido llama a la función que crea el usuario
                User.create(app.regData).then(function (data) {
                    if (data.data.success) {
                        app.loading = false;
                        app.successMsg = data.data.message + '...Redirecting';//Mensaje de éxito
                        $timeout(function () {
                            $location.path('/');
                        }, 2000);//Se redirige a la página de inicio después de 2 segundos

                    } else {//Si no se ha podido crear el usuario se vuelve a habilitar el formulario y se muestra el mensje de error
                        app.disabled = true;
                        app.loading = false;
                        app.errorMsg = data.data.message;
                    }
                });
            } else {//Formulario no válido
                app.disabled = true;
                app.loading = false;
                app.errorMsg = "Please ensure form is filled properly";
            }
        };

        //Comprueba si el username intorducido por el usuario está disponible        
        this.checkUsername = function (regData) {
            app.checkingUsername = true;
            app.usernameMsg = false;
            app.usernameInvalid = false;

            User.checkUsername(regData).then(function (data) {
                if (data.data.success) {
                    app.checkingUsername = false;
                    app.usernameInvalid = false;
                    app.usernameMsg = data.data.message;
                } else {
                    app.checkingUsername = false;
                    app.usernameInvalid = true;
                    app.usernameMsg = data.data.message;
                }
            });
        };

        //Comprueba que el email ontroducido por el usuario está disponible        
        this.checkEmail = function (regData) {
            app.checkingEmail = true;
            app.emailMsg = false;
            app.emailInvalid = false;

            User.checkEmail(regData).then(function (data) {
                if (data.data.success) {
                    app.checkingEmail = false;
                    app.emailInvalid = false;
                    app.emailMsg = data.data.message;
                } else {
                    app.checkingEmail = false;
                    app.emailInvalid = true;
                    app.emailMsg = data.data.message;
                }
            });
        };
    })

    //Directiva que comprueba si las contraseñas coinciden    
    .directive('match', function () {
        return {
            restrict: 'A',//Restricción a atributos HTML
            controller: function ($scope) {

                $scope.confirmed = false;

                //Función que comprueba si los dos inputs de las contraseñas tienen el mismo valor
                $scope.doConfirm = function (values) {
                    //Se utiliza un bucle para hacer la comprobacion por cada valor cada vez que se pulsa una tecla
                    values.forEach(function (ele) {
                        if ($scope.confirm == ele) {
                            $scope.confirmed = true;//Los inputs coinciden
                        } else {
                            $scope.confirmed = false;
                        }
                    });
                };
            },
            link: function (scope, element, attrs) {

                attrs.$observe('match', function () {
                    scope.matches = JSON.parse(attrs.match);
                    scope.doConfirm(scope.matches);
                });

                scope.$watch('confirm', function () {
                    scope.matches = JSON.parse(attrs.match);
                    scope.doConfirm(scope.matches);
                });
            }
        };
    })

    //facebookCtrl:Comprueba el callback de Facebook    
    .controller('facebookCtrl', function ($routeParams, Auth, $location, $window) {

        var app = this;
        app.errorMsg = false;
        app.expired = false;
        app.disabled = true;

        //Comprueba si el callback es válido        
        if ($window.location.pathname == '/facebookerror') {//Error
            app.errorMsg = 'Facebook email not found in database.';
        } else if ($window.location.pathname == '/facebook/inactive/error') {//Cuenta inactiva
            app.errorMsg = 'Account is not yet activated. Please check your email for activation link.';
            app.expired = true;
        } else {//Cuenta válida->redicción a home
            Auth.facebook($routeParams.token);
            $location.path('/');
        }
    })

    //twitterCtrl:Comprueba el callback de Twitter.Funciona igual que el de Facebook
    .controller('twitterCtrl', function ($routeParams, Auth, $location, $window) {

        var app = this;
        app.errorMsg = false;
        app.expired = false;
        app.disabled = true;

        if ($window.location.pathname == '/twittererror') {
            app.errorMsg = 'Twitter email not found in database';
        } else if ($window.location.pathname == '/twitter/inactive/error') {
            app.errorMsg = 'Account is not yet activated. Please check your email for activation link.';
            app.expired = true;
        } else {
            Auth.facebook($routeParams.token);
            $location.path('/');
        }
    })

    //googleCtrl:Comprueba el callback de Twitter.Funciona igual que el de Google
    .controller('googleCtrl', function ($routeParams, Auth, $location, $window) {

        var app = this;
        app.errorMsg = false;
        app.expired = false;
        app.disabled = true;

        if ($window.location.pathname == '/googleerror') {
            app.errorMsg = 'Google email not found in database';
        } else if ($window.location.pathname == '/google/inactive/error') {
            app.errorMsg = 'Account is not yet activated. Please check your email for activation link.';
            app.expired = true;
        } else {
            Auth.facebook($routeParams.token);
            $location.path('/');
        }
    });