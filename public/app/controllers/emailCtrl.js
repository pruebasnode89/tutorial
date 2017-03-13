angular.module('emailController', ['userServices'])

    //enmailCtrl se usa para activar la cuenta del usuario
    .controller('emailCtrl', function ($routeParams, User, $timeout, $location) {

        var app = this;

        //Al cargar la página llama a la función que activa la cuenta pasando como parámetro el token que tiene la url enviada al email para activar la cuenta        
        User.activateAccount($routeParams.token).then(function (data) {

            app.successMsg = false;
            app.errorMsg = false;

            if (data.data.success) {//Activación correcta
                app.successMsg = data.data.message + ' ...Redirecting';
                $timeout(function () {
                    $location.path('/login');//Redirección a login pasados 2 segundos
                }, 2000);
            } else {
                app.errorMsg = data.data.message + ' ...Redirecting';
                $timeout(function () {
                    $location.path('/login');
                }, 2000);
            }

        });
    })

    //resendCtrk se usa para reenviar el link de activación de la cuenta al usuario
    .controller('resendCtrl', function (User) {

        var app = this;

        //Comprueba las credenciales introducidas por el usuario con la base de datos        
        app.checkCredentials = function (loginData) {
            User.checkCredentials(app.loginData).then(function (data) {
                app.disabled = true;//Deshabilita el formulario en el submit
                app.errorMsg = false;
                app.successMsg = false;

                if (data.data.success) {
                    //Si las credenciales son correctas reenvia el link de activación
                    User.resendLink(app.loginData).then(function (data) {
                        if (data.data.success) {
                            app.successMsg = data.data.message;
                        }
                    });
                } else {
                    app.disabled = false;//Habilita el formulario
                    app.errorMsg = data.data.message;
                }
            });
        };
    })

    //usernameCtrl: se usa para enviar al email del usuario su username
    .controller('usernameCtrl', function (User) {

        var app = this;

        //Función que envia el nombre de usuario al email del usuario
        app.resendUsername = function (userData, valid) {
            app.errorMsg = false;
            app.successMsg = false;
            app.loading = true;
            app.disabled = true;//Se desactiva el formulario en el submit

            if (valid) {//Si el formulario es válido se llama a la función que envia el nombre de usuario
                User.resendUsername(app.userData.email).then(function (data) {
                    app.loading = false;
                    if (data.data.success) {
                        app.successMsg = data.data.message;
                    } else {
                        app.errorMsg = data.data.message;
                        app.disabled = false;
                    }
                });
            } else {
                app.loading = false;
                app.disabled = false;
                app.errorMsg = 'Please enter a valid email';
            }


        };

    })

    //passwordCtrl: se usa para enviar al usuario el link para reiniciar la contraseña    
    .controller('passwordCtrl', function (User) {
        var app = this;

        //Función que envia el link para cambiar la contraseña        
        app.sendPassword = function (resetData, valid) {
            app.errorMsg = false;
            app.successMsg = false;
            app.loading = true;
            app.disabled = true;

            if (valid) {//Si el formulario es válido se llama a la función de la factoria para enviar el link de cambio de contraseña
                User.sendPassword(app.resetData).then(function (data) {
                    app.loading = false;
                    if (data.data.success) {
                        app.successMsg = data.data.message;
                    } else {
                        app.errorMsg = data.data.message;
                        app.disabled = false;
                    }
                });
            } else {
                app.loading = false;
                app.disabled = false;
                app.errorMsg = 'Please enter a valid username.';
            }
        };
    })

    //resetCtrl: se usa para guardar la nueva contraseña del usuario    
    .controller('resetCtrl', function ($routeParams, User, $scope, $timeout, $location) {

        var app = this;
        app.hide = true;//Oculta el formulario
        app.errorMsg = false;


        //Al cargar la página recoge el token de la url que se envió al email del usuario para cambiar la contraseña y comprueba si el token es válido
        User.resetUser($routeParams.token).then(function (data) {
            if (data.data.success) {//Si el token es válido se muestra el formulario, si no lo es se muestra un mensaje de error
                app.hide = false;
                app.successMsg = 'Please enter a new password';
                $scope.username = data.data.user.username;
            } else {
                app.errorMsg = data.data.message;
            }
        });

        //Función que guarda la nueva contraseña del usuario en la base de datos        
        app.savePassword = function (regData, valid, confirmed) {
            app.errorMsg = false;
            app.disabled = true;
            app.loading = true;
            
            if (valid && confirmed) {
                app.regData.username = $scope.username;
                User.savePassword(app.regData).then(function (data) {
                    app.loading = false;
                    if (data.data.success) {
                        app.successMsg = data.data.message+'...Redirecting';
                        $timeout(function () { 
                            $location.path('/login');
                        },2000);
                    } else {
                        app.disabled = false;
                        app.errorMsg = data.data.message;
                    }
                });
            } else {
                app.loading = false;
                app.disabled = false;
                app.errorMsg = 'Please ensure form is filled out properly';
            }
        };
    });