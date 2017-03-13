angular.module('managementController', ['userServices'])

    //managementCtrl: controla la dministración de usuarios
    .controller('managementCtrl', function (User, $scope) {
        var app = this;

        app.loading = true;//Icono de cargando
        app.accessDenied = true;//Oculta la tabla mientras carga
        app.errorMsg = false;//Limpia mensajes de error
        app.editAccess = false;//Limpia el acceso a editar
        app.deleteAccess = false;//Limpia el acceso a borrar
        app.limit = 5;//Número de usuario mostrados en la tabla en el inicio
        app.searchLimit = 0;//Limite de resultados de la búsqueda

        //Obtiene todos los usuarios de la base de datos        
        function getUsers() {
            User.getUsers().then(function (data) {
                if (data.data.success) {
                    //Comprueba los permisos. Si es moderator no muestra el botón de eliminar
                    if (data.data.permission === 'admin' || data.data.permission === 'moderator') {
                        app.users = data.data.users;//Variable usada para mostrar los usuarios en la tabla
                        app.loading = false;//Para el icono de cargando
                        app.accessDenied = false;//Muestra la tabla
                        if (data.data.permission === 'admin') {
                            app.editAccess = true;
                            app.deleteAccess = true;
                        } else if (data.data.permission === 'moderator') {
                            app.editAccess = true;
                        }
                    } else {
                        app.errorMsg = 'Insuficient Permissions';
                        app.loading = false;
                    }
                } else {
                    app.errorMsg = data.data.message;
                    app.loading = false;
                }
            });
        }

        getUsers();//Llamada a la función para la primera vez que se entra en la página

        //Muestra más resultados en la tabla        
        app.showMore = function (number) {
            app.showMoreError = false;
            if (number > 0) {
                app.limit = number;
            } else {
                app.showMoreError = 'Please enter a valid number';
            }
        };

        //Muestra todos los resultados de la tabla        
        app.showAll = function () {
            app.limit = undefined;
            app.showMoreError = false;
        };

        //Elimina a un usuario        
        app.deleteUser = function (username) {
            User.deleteUser(username).then(function (data) {
                if (data.data.success) {
                    getUsers();//Vuelve a mostrar la tabla después de borrar el usuario
                } else {
                    app.errorMsg = data.data.message;
                }
            });
        };

        //Función de búsqueda        
        app.search = function (searchKeyword, number) {
            //Comprueba si se ha introducido una palabra
            if (searchKeyword) {
                if (searchKeyword.length > 0) {
                    app.limit = 0;//Resetea el limite mientras se procesa
                    $scope.searchFilter = searchKeyword;//Se fija el filtro de búsqueda
                    app.limit = number;//Se fija el limite
                } else {
                    $scope.searchFilter = undefined;//Se limpia el filtro
                    app.limit = 0;
                }

            } else {
                $scope.searchFilter = undefined;
                app.limit = 0;
            }
        };

        //Limpia los campos de búsqueda        
        app.clear = function () {
            $scope.number = undefined;
            app.limit = 0;
            $scope.searchKeyword = undefined;
            $scope.searchFilter = undefined;
            app.showMoreError = false;
        };

        //Búsqueda avanzada        
        app.advancedSearch = function (searchByUsername, searchByEmail, searchByName) { 
            //Se comprueba si se ha elegido alguno de los criterio de búsqueda para fijar el filtro
            if (searchByUsername || searchByEmail || searchByName) {
                $scope.advancedSearchFilter = {};//Objeto filtro
                if (searchByUsername) {
                    $scope.advancedSearchFilter.username=searchByUsername;
                }
                if (searchByEmail) {
                    $scope.advancedSearchFilter.email = searchByEmail;
                }
                if (searchByName) {
                    $scope.advancedSearchFilter.name = searchByName;
                }
                app.searchLimit = undefined;
            }
        };

        //Ordena los resultados según el criterio elegido por el usuario        
        app.sortOrder = function (order) { 
            app.sort = order;
        };
    })

    //editCtrl: usado para editar los usuarios    
    .controller('editCtrl', function ($scope, $routeParams, User, $timeout) {
        var app = this;
        $scope.nameTab = 'active';//Pone la pestaña de nombre en activa
        app.phase1 = true;//Muestra el contenido correspondiente a la pestaña de nombre

        //Consigue los datos del usuario que se va a editar        
        User.getUser($routeParams.id).then(function (data) {
            if (data.data.success) {
                $scope.newName = data.data.user.name;
                $scope.newEmail = data.data.user.email;
                $scope.newUsername = data.data.user.username;
                $scope.newPermission = data.data.user.permission;
                app.currentUser = data.data.user._id;
            } else {
                app.errorMsg = data.data.message;
            }
        });

        //Las siguientes funciones controlan que pestaña esta activa y el contenido correspondiente a cada pestaña
        //Pestaña de name
        app.namePhase = function () {
            $scope.nameTab = 'active';
            $scope.usernameTab = 'default';
            $scope.emailTab = 'default';
            $scope.permissionsTab = 'default';
            app.phase1 = true;
            app.phase2 = false;
            app.phase3 = false;
            app.phase4 = false;
            app.errorMsg = false;
        };

        //Pestaña de username        
        app.usernamePhase = function () {
            $scope.nameTab = 'default';
            $scope.usernameTab = 'active';
            $scope.emailTab = 'default';
            $scope.permissionsTab = 'default';
            app.phase1 = false;
            app.phase2 = true;
            app.phase3 = false;
            app.phase4 = false;
            app.errorMsg = false;
        };

        //Pestaña de email        
        app.emailPhase = function () {
            $scope.nameTab = 'default';
            $scope.usernameTab = 'default';
            $scope.emailTab = 'active';
            $scope.permissionsTab = 'default';
            app.phase1 = false;
            app.phase2 = false;
            app.phase3 = true;
            app.phase4 = false;
            app.errorMsg = false;
        };

        //Pestaña de permisos        
        app.permissionsPhase = function () {
            $scope.nameTab = 'default';
            $scope.usernameTab = 'default';
            $scope.emailTab = 'default';
            $scope.permissionsTab = 'active';
            app.phase1 = false;
            app.phase2 = false;
            app.phase3 = false;
            app.phase4 = true;
            app.disableUser = false;
            app.disableModerator = false;
            app.disableAdmin = false;
            app.errorMsg = false;

            if ($scope.newPermission === 'user') {
                app.disableUser = true;
            }
            else if ($scope.newPermission === 'admin') {
                app.disableAdmin = true;
            }
            if ($scope.newPermission === 'moderator') {
                app.disableModerator = true;
            }
        };

        //Actualiza el nombre del usuario        
        app.updateName = function (newName, valid) {
            app.errorMsg = false;
            app.disabled = true;
            var userObject = {};


            if (valid) {
                userObject._id = app.currentUser;
                userObject.name = $scope.newName;
                User.editUser(userObject).then(function (data) {
                    if (data.data.success) {
                        app.successMsg = data.data.message;
                        $timeout(function () {
                            app.nameForm.name.$setPristine();
                            app.nameForm.name.$setUntouched();
                            app.successMsg = false;
                            app.disabled = false;
                        }, 2000);//Después de 2 segundos se habilita el formulario y se resetea
                    } else {
                        app.errorMsg = data.data.message;
                        app.disabled = false;
                    }
                });
            } else {
                app.errorMsg = 'Please ensure form is filled out properly';
                app.disabled = false;
            }
        };

        //Actualiza el email        
        app.updateEmail = function (newEmail, valid) {
            app.errorMsg = false;
            app.disabled = true;
            var userObject = {};


            if (valid) {
                userObject._id = app.currentUser;
                userObject.email = $scope.newEmail;
                User.editUser(userObject).then(function (data) {
                    if (data.data.success) {
                        app.successMsg = data.data.message;
                        $timeout(function () {
                            app.emailForm.email.$setPristine();
                            app.emailForm.email.$setUntouched();
                            app.successMsg = false;
                            app.disabled = false;
                        }, 2000);
                    } else {
                        app.errorMsg = data.data.message;
                        app.disabled = false;
                    }
                });
            } else {
                app.errorMsg = 'Please ensure form is filled out properly';
                app.disabled = false;
            }
        };

        //Actualiza el username        
        app.updateUsername = function (newUsername, valid) {
            app.errorMsg = false;
            app.disabled = true;
            var userObject = {};


            if (valid) {
                userObject._id = app.currentUser;
                userObject.username = $scope.newUsername;
                User.editUser(userObject).then(function (data) {
                    if (data.data.success) {
                        app.successMsg = data.data.message;
                        $timeout(function () {
                            app.usernameForm.username.$setPristine();
                            app.usernameForm.username.$setUntouched();
                            app.successMsg = false;
                            app.disabled = false;
                        }, 2000);
                    } else {
                        app.errorMsg = data.data.message;
                        app.disabled = false;
                    }
                });
            } else {
                app.errorMsg = 'Please ensure form is filled out properly';
                app.disabled = false;
            }
        };

        //Actualiza los permisos        
        app.updatePermissions = function (newPermission) {
            app.errorMsg = false;
            var userObject = {};
            app.disableUser = true;
            app.disableAdmin = true;
            app.disableModerator = true;

            userObject._id = app.currentUser;
            userObject.permission = newPermission;
            User.editUser(userObject).then(function (data) {
                if (data.data.success) {
                    app.successMsg = data.data.message;
                    $timeout(function () {
                        app.successMsg = false;
                        $scope.newPermission = newPermission;
                        if (newPermission === 'user') {
                            app.disableUser = true;
                            app.disableAdmin = false;
                            app.disableModerator = false;
                        }
                        else if (newPermission === 'admin') {
                            app.disableUser = false;
                            app.disableAdmin = true;
                            app.disableModerator = false;
                        }
                        if (newPermission === 'moderator') {
                            app.disableUser = false;
                            app.disableAdmin = false;
                            app.disableModerator = true;
                        }
                    }, 2000);
                } else {
                    app.errorMsg = data.data.message;
                }
            });

        };

        
    });