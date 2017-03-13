var app = angular.module('appRoutes', ['ngRoute'])
    //Configuración de las rutas. 'authenticated'=true significa que el usario tiene que estar logueado para acceder a esa ruta
    .config(function ($routeProvider, $locationProvider) {

        //$locationProvider.hashPrefix('');//solve the %2f problems in routes

        //Ruta: Home
        $routeProvider.when('/', {
            templateUrl: 'app/views/pages/home.html'
        })
            //Ruta: About Us
            .when('/about', {//abou
                templateUrl: 'app/views/pages/about.html'
            })
            
            ////Ruta: Registro
            .when('/register', {
                templateUrl: 'app/views/pages/users/register.html',
                controller: 'regCtrl',
                controllerAs: 'register',
                authenticated: false
            })

            //Ruta: Login
            .when('/login', {
                templateUrl: 'app/views/pages/users/login.html',
                authenticated: false
            })

            //Ruta: Logout
            .when('/logout', {
                templateUrl: 'app/views/pages/users/logout.html',
                authenticated: true
            })

            ////Ruta: Perfil de usuario
            .when('/profile', {
                templateUrl: 'app/views/pages/users/profile.html',
                authenticated: true
            })

            //Ruta: Facebook callback
            .when('/facebook/:token', {
                templateUrl: 'app/views/pages/users/social/social.html',
                controller: 'facebookCtrl',
                controllerAs: 'facebook',
                authenticated: false
            })

            //Ruta: Twitter callback
            .when('/twitter/:token', {
                templateUrl: 'app/views/pages/users/social/social.html',
                controller: 'twitterCtrl',
                controllerAs: 'twitter',
                authenticated: false
            })

            //Ruta: Google callback
            .when('/google/:token', {
                templateUrl: 'app/views/pages/users/social/social.html',
                controller: 'googleCtrl',
                controllerAs: 'google',
                authenticated: false
            })

            //Ruta: Facebook error
            .when('/facebookerror', {
                templateUrl: 'app/views/pages/users/login.html',
                controller: 'facebookCtrl',
                controllerAs: 'facebook',
                authenticated: false
            })

            //Ruta: Twitter error
            .when('/twittererror', {
                templateUrl: 'app/views/pages/users/login.html',
                controller: 'twitterCtrl',
                controllerAs: 'twitter',
                authenticated: false
            })

            //Ruta: Google error
            .when('/googleerror', {
                templateUrl: 'app/views/pages/users/login.html',
                controller: 'googleCtrl',
                controllerAs: 'google',
                authenticated: false
            })

            //Ruta: Facebook error cuenta inactiva
            .when('/facebook/inactive/error', {
                templateUrl: 'app/views/pages/users/login.html',
                controller: 'facebookCtrl',
                controllerAs: 'facebook',
                authenticated: false
            })

            //Ruta: Twitter error cuenta inactiva
            .when('/twitter/inactive/error', {
                templateUrl: 'app/views/pages/users/login.html',
                controller: 'twitterCtrl',
                controllerAs: 'twitter',
                authenticated: false
            })

            //Ruta: Google error cuenta inactiva
            .when('/google/inactive/error', {
                templateUrl: 'app/views/pages/users/login.html',
                controller: 'googleCtrl',
                controllerAs: 'google',
                authenticated: false
            })

            //Ruta: Pedir nueva email de activacion
            .when('/resend', {
                templateUrl: 'app/views/pages/users/activation/resend.html',
                controller: 'resendCtrl',
                controllerAs: 'resend',
                authenticated: false
            })

            //Ruta: Activacion de la cuenta desde el email
            .when('/activate/:token', {
                templateUrl: 'app/views/pages/users/activation/activate.html',
                controller: 'emailCtrl',
                controllerAs: 'email',
                authenticated: false
            })

            //Ruta: Manda el username al email
            .when('/resetusername', {
                templateUrl: 'app/views/pages/users/reset/username.html',
                controller: 'usernameCtrl',
                controllerAs: 'username',
                authenticated: false
            })

            //Ruta: Envia un link para reiniciar la contraseña al email del usuario
            .when('/resetpassword', {
                templateUrl: 'app/views/pages/users/reset/password.html',
                controller: 'passwordCtrl',
                controllerAs: 'password',
                authenticated: false
            })

            //Ruta: Link de reseteo de password enviado al usuario
            .when('/reset/:token', {
                templateUrl: 'app/views/pages/users/reset/newpassword.html',
                controller: 'resetCtrl',
                controllerAs: 'reset',
                authenticated: false
            })

            //Ruta: Administracion de usuarios
            .when('/management', {
                templateUrl: 'app/views/pages/managements/management.html',
                controller: 'managementCtrl',
                controllerAs: 'management',
                authenticated: true,
                permission:['admin','moderator']
            })

            //Ruta: Editar un usuario
            .when('/edit/:id', {
                templateUrl: 'app/views/pages/managements/edit.html',
                controller: 'editCtrl',
                controllerAs: 'edit',
                authenticated: true,
                permission: ['admin', 'moderator']
            })

            //Ruta: Buscar usuarios en la base de datos
            .when('/search', {
                templateUrl: 'app/views/pages/managements/search.html',
                controller: 'managementCtrl',
                controllerAs: 'management',
                authenticated: true,
                permission: ['admin', 'moderator']
            })

            .otherwise({ redirectTo: '/' });//Si el usuario intenta acceder a otra ruta es redirigido a home

        $locationProvider.html5Mode({
            //Remueve el hash de AngularJS de la url. Es necesario el no base en el index.html
            enabled: true,
            requireBase: false
        });
    });

//En cada ruta si el usuario está o no autenticado asi como si tiene permisos para acceder a esa ruta
app.run(['$rootScope', 'Auth', '$location', 'User', function ($rootScope, Auth, $location, User) {
    $rootScope.$on('$routeChangeStart', function (event, next, current) {
        if (next.$$route !== undefined) {
            if (next.$$route.authenticated === true) {
                //Si la ruta requiere estar autenticado comprueba que lo está, si no lo está redirige a home
                if (!Auth.isLoggedIn()) {
                    event.preventDefault();
                    $location.path('/');
                } else if (next.$$route.permission) {//Comprueba permisos
                    User.getPermission().then(function (data) { 
                        if (next.$$route.permission[0] !== data.data.permission) {
                            if (next.$$route.permission[1] !== data.data.permission) {
                                event.preventDefault();
                                $location.path('/');
                            }
                        }
                    });
                }
            } else if (next.$$route.authenticated === false) {
                //La ruta requiere no estar autenticado. Si lo esta redirige al perfil del usuario
                if (Auth.isLoggedIn()) {
                    event.preventDefault();
                    $location.path('/profile');
                }
            }
        }
    });
}]);
