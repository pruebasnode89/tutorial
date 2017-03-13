angular.module('userServices', [])

.factory('User', function ($http) {  
    userFactory = {};

    //Registra un usario en la base de datos.
    //User.create(regData);    
    userFactory.create = function (regData) { 
        return $http.post('/api/users', regData);
    };
    
    //Comprueba si el nombre de usuario está disponible durante el registro
    //User.checkUsername(regData);
    userFactory.checkUsername = function (regData) {
        return $http.post('/api/checkusername', regData);
    };

    //Comprueba si el email está disponible durante el registro
    //User.checkEmail(regData);
    userFactory.checkEmail = function (regData) {
        return $http.post('/api/checkemail', regData);
    };

    //Activa la cuenta de usuario a partir del link enviado al email    
    //User.activateAccount(token);    
    userFactory.activateAccount = function (token) { 
        return $http.put('/api/activate/' + token);
    };

    //Comprueba las credenciales ante de enviar un nuevo link de activación    
    //User.checkCredentials(loginData);
    userFactory.checkCredentials = function (loginData) { 
        return $http.post('/api/resend', loginData);
    };

    //Envia un nuevo link de activación al usuario    
    //User.resendLink(username);    
    userFactory.resendLink = function (username) { 
        return $http.put('/api/resend', username);
    };

    //Envia el nombre de usuario al email
    //User.resendUsername(userData);    
    userFactory.resendUsername = function (userData) { 
        return $http.get('/api/resetusername/' + userData);
    };

    //Envia el link para reiniciar el password al email del usuario    
    //User.sendPassword(resetData);    
    userFactory.sendPassword = function (resetData) { 
        return $http.put('/api/resetpassword', resetData);
    };

    //Consigue la información del usuario a partir del link enviado al usuario para reiniciar la contraseña    
    //User.resetUser(token);  
    userFactory.resetUser = function (token) { 
        return $http.get('/api/resetpassword/' + token);
    };    
    
    //Guarda la nueva contraseña del usuario
    //User.savePassword(regData);
    userFactory.savePassword = function (regData) { 
        return $http.put('/api/savepassword', regData);
    };

    //Da un nuevo token al usuario para renovar la sesión
    //User.renewSesion(username);
    userFactory.renewSesion = function (username) { 
        return $http.get('/api/renewToken/' + username);
    };

    //Consigue los permisos del usuario logueado    
    //User.getPermission();
    userFactory.getPermission = function () { 
        return $http.get('/api/permission/');
    };    

    //Consigue una lista de todos los usuarios    
    //User.getUsers();    
    userFactory.getUsers = function () { 
        return $http.get('/api/management/');
    };

    //Consigue los datos del usuario que se quiere editar    
    //User.getUser(id);    
    userFactory.getUser = function (id) { 
        return $http.get('/api/edit/' + id);
    };

    //Borra un usuario    
    //User.deleteUser(username);    
    userFactory.deleteUser = function (username) { 
        return $http.delete('/api/management/' + username);
    };

    //Edita el usuario    
    //User.editUser(username);
    userFactory.editUser = function (id) { 
        var a = $http.put('/api/edit', id);
        return a;
    };

    return userFactory;
});