var User = require('../models/user');//Importa el modelo User
var jwt = require('jsonwebtoken');//Importa JWT Package utilizado para crear y leer tokens
var secret = 'harrypotter';//Palabra utilizada para cifrar los tokens
var nodemailer = require('nodemailer');//Importa Nodemailer Package usado para enviar emails
var sgTransport = require('nodemailer-sendgrid-transport');//Importa Nodemailer Sengrid Transport Package

module.exports = function (router) {

    //Opciones de nodemailer
    var options = {
        auth: {
            api_user: 'pruebasnode89',
            api_key: 'aaa111!!!'
        }
    };

    //Usar esta si se utiliza Sengrid    
    var client = nodemailer.createTransport(sgTransport(options));


    //Ruta para registrar usuarios
    //http://localhost:8080//api/users
    router.post('/users', function (req, res) {
        var user = new User();//Se crea nuevo objeto user
        //Se asignan las propiedades al objeto creado a partir de los datos recibidos en la petición
        user.username = req.body.username;
        user.password = req.body.password;
        user.email = req.body.email;
        user.name = req.body.name;
        //Token creado para activar la cuenta. Caduca en 24 horas
        user.temporarytoken = jwt.sign({
            username: user.username,
            email: user.email
        }, secret, { expiresIn: '24h' });
        //Comprobación de que los datos eviados en la petición no son nulos o están vacíos
        if (req.body.username === null || req.body.username === "" || req.body.password === null || req.body.password === "" || req.body.email === null || req.body.email === "" || req.body.name === null || req.body.name === "") {
            res.json({ success: false, message: 'Ensure username, name, email and password were provided' });
        } else {
            //Si los datos son válido se guarda el usuario
            user.save(function (err) {
                if (err) {
                    if (err.errors !== null) {
                        //Si ha habido errores se envia un mensaje con el campo erroneo según la validación que se hace en el modelo User
                        if (err.errors.name) {
                            res.json({ success: false, message: err.errors.name.message });
                        } else if (err.errors.email) {
                            res.json({ success: false, message: err.errors.email.message });
                        } else if (err.errors.username) {
                            res.json({ success: false, message: err.errors.username.message });
                        } else if (err.errors.password) {
                            res.json({ success: false, message: err.errors.password.message });
                        } else {
                            res.json({ success: false, message: err });
                        }
                    } else if (err) {
                        if (err.code == 11000) {//Código de error de duplicados
                            //res.json({ success: false, message: err });
                            if (err.errmsg[61] == "u") {//first letter position of 'username' word in error message
                                res.json({ success: false, message: 'That username is already taken' });
                            } else if (err.errmsg[61] == "e") {//first letter position of 'email' word in error message
                                res.json({ success: false, message: 'That email is already taken' });
                            } else {
                                res.json({ success: false, message: 'Username or email already taken.' });
                            }
                        } else {
                            res.json({ success: false, message: err });
                        }
                    }

                } else {
                    //Si no hay errores se crea el email de confirmación que se envia al usuario
                    var email = {
                        from: 'localhost Staff, staff@localhost.com',
                        to: user.email,
                        subject: 'Localhost activation link',
                        text: 'Hello ' + user.name + ',Thank you for registering at localhost.com. Please click on the following link to complete your activation: https://shielded-savannah-64507.herokuapp.com/activate/' + user.temporarytoken,
                        html: 'Hello <strong>' + user.name + '</strong>,<br><br>Thank you for registering at localhost.com. Please click on the link below to complete your activation: <br><br><a href="https://shielded-savannah-64507.herokuapp.com/activate/' + user.temporarytoken + '">https://shielded-savannah-64507.herokuapp.com/activate</a>'
                    };
                    //Función que envia el email
                    client.sendMail(email, function (err, info) {
                        if (err) {
                            console.log(error);
                        }
                        else {
                            console.log('Message sent: ' + info.response);
                        }
                    });
                    res.json({ success: true, message: 'Account register! Please check your e-mail for activation link.' });
                }
            });
        }
    });

    //Ruta que comprueba que el nombre de usuario introducido en la pagina de registro está disponible
    //http://localhost:8080/api/checkusername
    router.post('/checkusername', function (req, res) {
        User.findOne({ username: req.body.username }).select('username').exec(function (err, user) {
            if (err) {
                throw err;
            }
            if (user) {
                res.json({ success: false, message: 'That username is already taken' });
            } else {
                res.json({ success: true, message: 'Valid username' });
            }
        });
    });

     //Ruta que comprueba que el email introducido en la pagina de registro está disponible
    //http://localhost:8080/api/checkmail
    router.post('/checkemail', function (req, res) {
        User.findOne({ email: req.body.email }).select('email').exec(function (err, user) {
            if (err) {
                throw err;
            }

            if (user) {
                res.json({ success: false, message: 'That email is already taken' });
            } else {
                res.json({ success: true, message: 'Valid email' });
            }
        });
    });

    //Ruta para el login de los usuarios
    //http://localhost:8080/api/authenticate
    router.post('/authenticate', function (req, res) {
        //Se comprueba que el usuario existe
        User.findOne({ username: req.body.username }).select('email username password active').exec(function (err, user) {
            if (err) {
                throw err;
            } else {
                if (!user) {
                    res.json({ success: false, message: 'Could not authenticate user' });
                } else if (user) {//Se comprueba que la contraseña coincide
                    if (req.body.password) {
                        var validPassword = user.comparePassword(req.body.password);
                        if (!validPassword) {
                            res.json({ success: false, message: 'Could not authenticate password' });
                        } else if (!user.active) {//La cuenta aún no está activa
                            res.json({ success: false, message: 'Account is not yet activated. Please check your email for activation link.', expired: true });
                        }
                        else {//Logeo correcto se le aigna un token al usuario que es enviado al client en el JSON
                            var token = jwt.sign({
                                username: user.username,
                                email: user.email
                            }, secret, { expiresIn: '24h' });
                            res.json({ success: true, message: 'User authenticate', token: token });
                        }
                    } else {
                        res.json({ success: false, message: 'No password provided' });
                    }
                }
            }
        });
    });

    //Ruta para activar la cuenta de un usuario
    //http://localhost:8080/api/ativate/+token
    router.put('/activate/:token', function (req, res) {
        User.findOne({ temporarytoken: req.params.token }, function (err, user) {
            if (err) throw err;
            var token = req.params.token;//Token de verificación de la url

            //Función que verifica el token
            jwt.verify(token, secret, function (err, decoded) {
                if (err) {
                    res.json({ success: false, message: 'Activation link has expired.' });//Token expirado
                } else if (!user) {
                    res.json({ success: false, message: 'Activation link has expired.' });//Token que no coincide con el usuario
                } else {//Token valido->Activar usuario
                    user.temporarytoken = false;//Se elimina el token temporal
                    user.active = true;//Se activa el usuario
                    res.json({ success: true, message: 'Account activated!' });
                    user.save(function (err) {//Se actualiza el usuario en la base de datos
                        if (err) {
                            console.log(err);
                        } else {
                            //Se envia un email al usuario para confirmar la activación
                            var email = {
                                from: 'localhost Staff, staff@localhost.com',
                                to: user.email,
                                subject: 'Localhost Account Activated',
                                text: 'Hello ' + user.name + ',your account has been successfully activated!',
                                html: 'Hello <strong>' + user.name + '</strong>,<br><br> your account has been successfully activated!'
                            };

                            client.sendMail(email, function (err, info) {
                                if (err) {
                                    console.log(error);
                                }
                                else {
                                    console.log('Message sent: ' + info.response);
                                }
                            });
                        }
                    });
                }
            });
        });
    });

    //Ruta que verifica las credenciales del usuario antes de enviar un nuevo link de activación
    //http://localhost:8080/api/resend
    router.post('/resend', function (req, res) {
        User.findOne({ username: req.body.username }).select('username password active').exec(function (err, user) {
            if (err) {
                throw err;
            } else {
                if (!user) {//No existe el usuario
                    res.json({ success: false, message: 'Could not authenticate user' });
                } else if (user) {
                    if (req.body.password) {
                        var validPassword = user.comparePassword(req.body.password);
                        if (!validPassword) {//No coincide la contraseña
                            res.json({ success: false, message: 'Could not authenticate password' });
                        } else if (user.active) {//La cuenta aun no está activa
                            res.json({ success: false, message: 'Account is already activated.' });
                        }
                        else {
                            res.json({ success: true, user: user });
                        }
                    } else {//No se envió password en la peticion
                        res.json({ success: false, message: 'No password provided' });
                    }
                }
            }
        });
    });

    //Ruta para enviar al usuario un nuevo link de activación cuando sus credenciales són válidas
    router.put('/resend', function (req, res) {
        User.findOne({ username: req.body.username }).select('username name email temporarytoken').exec(function (err, user) {
            if (err) throw err;

            else {
                //Se crea un nuevo token que se aigna al usuario
                user.temporarytoken = jwt.sign({
                    username: user.username,
                    email: user.email
                }, secret, { expiresIn: '24h' });
                user.save(function (err) {//Se guardan los cambios en la base de datos
                    if (err) {
                        console.log(err);
                    } else {
                        var email = {//Se envia el email al usuario con el nuevo link de activación
                            from: 'localhost Staff, staff@localhost.com',
                            to: user.email,
                            subject: 'Localhost Activation Link Request',
                            text: 'Hello ' + user.name + ', you recently requested a new account activation link. Please click on the following link to complete your activation: https://shielded-savannah-64507.herokuapp.com/activate/' + user.temporarytoken,
                            html: 'Hello <strong>' + user.name + '</strong>,<br><br>you recently requested a new account activation link. Please click on the link below to complete your activation: <br><br><a href="https://shielded-savannah-64507.herokuapp.com/activate/' + user.temporarytoken + '">https://shielded-savannah-64507.herokuapp.com/activate</a>'
                        };

                        client.sendMail(email, function (err, info) {
                            if (err) {
                                console.log(error);
                            }
                            else {
                                console.log('Message sent: ' + info.response);
                            }
                        });

                        res.json({ success: true, message: 'Activation link has been sent to ' + user.email + '!' });
                    }
                });
            }

        });
    });

    //Ruta para enviar al usuario su username al email
    //http://localhost:8080/api/resetusername
    router.get('/resetusername/:email', function (req, res) {
        User.findOne({ email: req.params.email }).select('email name username').exec(function (err, user) {
            if (err) {
                res.json({ success: false, message: err });
            } else {
                if (!req.params.email) {//No se envia el email en la petición
                    res.json({ success: false, message: 'No email was provided' });
                } else {
                    if (!user) {//El email enviado no coincide con la base de datos
                        res.json({ success: false, message: 'Email was not found' });
                    } else {
                        //Se envia un email al usuario con su username
                        var email = {
                            from: 'localhost Staff, staff@localhost.com',
                            to: user.email,
                            subject: 'Localhost Username Request',
                            text: 'Hello ' + user.name + ', you recently requested your username. Please save it in your files: ' + user.username,
                            html: 'Hello <strong>' + user.name + '</strong>,<br><br> you recently requested your username. Please save it in your files: ' + user.username
                        };

                        client.sendMail(email, function (err, info) {
                            if (err) {
                                console.log(error);
                            }
                            else {
                                console.log('Message sent: ' + info.response);
                            }
                        });

                        res.json({ success: true, message: 'Username has been sent to email!' });
                    }
                }
            }
        });
    });

    //Ruta para enviar un email con el link para resetear su contraseña
    //http://localhost:8080/resetpassword
    router.put('/resetpassword', function (req, res) {
        User.findOne({ username: req.body.username }).select('username active email resettoken name').exec(function (err, user) {
            if (err) throw err;
            if (!user) {//No exite el usuario
                res.json({ success: false, message: 'Username was not found' });
            } else if (!user.active) {//El usuario no está activo
                res.json({ success: false, message: 'Account has not yet been activated' });
            } else {
                //Usuario válido->Se crea el token para reiniciar la contraseña
                user.resettoken = jwt.sign({
                    username: user.username,
                    email: user.email
                }, secret, { expiresIn: '24h' });
                user.save(function (err) {//Se guarda el token en la base de datos
                    if (err) {
                        res.json({ success: false, message: err });
                    } else {
                        var email = {//Se envia un email al usuario con el link para resetear su contraseña
                            from: 'localhost Staff, staff@localhost.com',
                            to: user.email,
                            subject: 'Localhost Reset Password Request',
                            text: 'Hello ' + user.name + ', you recently requested a password reset link. Please click on the link below to reset your password: https://shielded-savannah-64507.herokuapp.com/reset/' + user.resettoken,
                            html: 'Hello <strong>' + user.name + '</strong>,<br><br> you recently requested a password reset link. Please click on the link below to reset your password:<br><br><a href="https://shielded-savannah-64507.herokuapp.com/reset/' + user.resettoken + '">https://shielded-savannah-64507.herokuapp.com/reset</a>'
                        };

                        client.sendMail(email, function (err, info) {
                            if (err) {
                                console.log(error);
                            }
                            else {
                                console.log('Message sent: ' + info.response);
                            }
                        });


                        res.json({ success: true, message: 'Please check your email for password reset link' });
                    }
                });
            }
        });
    });

    //Ruta que verifica que el link de reseteo de contraseña es válido, es decir comprueba que el token es válido e igual al almacenado en la base de datos
    //http://localhost:8080/api/resetpassword
    router.get('/resetpassword/:token', function (req, res) {
        User.findOne({ resettoken: req.params.token }).select().exec(function (err, user) {
            if (err) throw err;
            var token = req.params.token;
            //Se verifica el token
            jwt.verify(token, secret, function (err, decoded) {
                if (err) {//Token expirado
                    res.json({ success: false, message: 'Password link expired' });
                } else {
                    if (!user) {//No se encuentra un usuario con ese token en la base de datos
                        res.json({ success: false, message: 'Password link expired' });
                    } else {
                        res.json({ success: true, user: user });//Token válido
                    }
                }
            });
        });
    });

    //Ruta para guardar la nueva contraseña del usuario
    //http://localhost:8080/api/savepassword
    router.put('/savepassword', function (req, res) {
        User.findOne({ username: req.body.username }).select('username email name password resettoken').exec(function (err, user) {
            if (err) throw err;
            if (req.body.password === null || req.body.password === '') {
                res.json({ success: false, message: 'Password not provided' });//La password enviada es nula
            } else {
                user.password = req.body.password;//Se adigna la nueva contraseña
                user.resettoken = false;//Se limpia el rettoken
                user.save(function (err) {//Se guardan los datos en la base de datos
                    if (err) {
                        res.json({ success: false, message: err });
                    } else {
                        //Se envia un email al usuario confirmando que ha cambiado la contraseña
                        var email = {
                            from: 'localhost Staff, staff@localhost.com',
                            to: user.email,
                            subject: 'Localhost Reset Password',
                            text: 'Hello ' + user.name + ', this email is to notify you that your password was recently reset at localhost.com.',
                            html: 'Hello <strong>' + user.name + '</strong>, this email is to notify you that your password was recently reset at localhost.com.'
                        };

                        client.sendMail(email, function (err, info) {
                            if (err) {
                                console.log(error);
                            }
                            else {
                                console.log('Message sent: ' + info.response);
                            }
                        });
                        res.json({ success: true, message: 'Password has been reset!' });
                    }
                });
            }
        });
    });

    //Middleware que comprueba el token almacenado en el cliente
    //Poner debajo todas las rutas que requieran estar logueado
    router.use(function (req, res, next) {
        var token = req.body.token || req.body.query || req.headers['x-access-token'];//Busca el token en el body, la url o en los headers
        if (token) {
            //Verifica que el token es válido y no ha expirado
            jwt.verify(token, secret, function (err, decoded) {
                if (err) {
                    res.json({ success: false, message: 'Token invalid' });//Token expirado o no válido
                } else {
                    req.decoded = decoded;//req.___ será la variable que se podrá utilizar en next() para acceder a los datos del usuario ya decodificados
                    next();
                }
            });
        } else {
            res.json({ success: false, message: 'No token provided' });
        }
    });

    //Ruta que envia los datos del usuario actualmente logueado
    //http://localhost:8080/api/me
    router.post('/me', function (req, res) {
        res.send(req.decoded);
    });

    //Ruta usada para dar un nuevo token a un usuario que renueva la sesión
    //http://localhost/api/renewToken
    router.get('/renewToken/:username', function (req, res) {
        User.findOne({ username: req.params.username }).select().exec(function (err, user) {
            if (err) throw err;
            if (!user) {
                res.json({ success: false, message: 'No user was found.' });//Usuario no encontrado
            } else {//Usuario en contrado->Se crea un nuevo token que se envia al cliente
                var newtoken = jwt.sign({
                    username: user.username,
                    email: user.email
                }, secret, { expiresIn: '24h' });
                res.json({ success: true, token: newtoken });
            }
        });
    });

    //Ruta usada para conseguir los permisos que tiene el usuario
    //http://localhost:8080/api/permission
    router.get('/permission', function (req, res) {
        User.findOne({ username: req.decoded.username }, function (err, user) {
            if (err) throw err;
            if (!user) {
                res.json({ success: false, message: 'No user was found' });//Usuario no encontrado
            } else {
                res.json({ success: true, permission: user.permission });//Usuario encontrado->Se envian los permisos
            }
        });
    });

    //Ruta para enviar una lista de todos los usuarios al apartado management de la página
    //http:localhost:8080/management
    router.get('/management', function (req, res) {
        User.find({}, function (err, users) {
            if (err) throw err;
            User.findOne({ username: req.decoded.username }, function (err, mainUser) {//Se comprueba que el usario logueado está en la base de datos y si sus permisos son suficientes para ver estos datos, es decir, se comprueba que es un admin o un moderator
                if (err) throw err;
                if (!mainUser) {
                    res.json({ success: false, message: 'No user found' });
                } else {
                    if (mainUser.permission === 'admin' || mainUser.permission === 'moderator') {
                        if (!users) {
                            res.json({ success: false, message: 'Users not found' });
                        } else {
                            res.json({ success: true, users: users, permission: mainUser.permission });
                        }
                    } else {
                        res.json({ success: false, message: 'Insufficient Permissions' });//No tiene permisos
                    }
                }
            });
        });
    });

    //Ruta usada para borrar un usuario
    //http://localhost:8080/api/management
    router.delete('/management/:username', function (req, res) {
        var deleteUser = req.params.username;//username del usuario a borrar
        User.findOne({ username: req.decoded.username }, function (err, mainUser) {
            //Se comprueba que el usario logueado existe en la base de datos y tiene los permisos necesarios para borrar a un usuario, es decir, se comprueba que es un admin
            if (err) throw err;
            if (!mainUser) {
                res.json({ success: false, message: 'No user found' });
            } else {
                if (mainUser.permission !== 'admin') {
                    res.json({ success: false, message: 'Insufficient Permissions' });
                } else {
                    User.findOneAndRemove({ username: deleteUser }, function (err, user) {
                        if (err) throw err;
                        res.json({ success: true });
                    });
                }
            }
        });
    });

    //Ruta que envia el usuario que se va a editar
    //http://localhost:8080/api/edit
    router.get('/edit/:id', function (req, res) {
        var editUser = req.params.id;//id del usuario a editar
        User.findOne({ username: req.decoded.username }, function (err, mainUser) {
            //Se comprueba que el usario logueado existe en la base de datos y tiene los permisos necesarios para editar a un usuario
            if (err) throw err;
            if (!mainUser) {
                res.json({ success: false, message: 'No user found' });
            } else {   
                if (mainUser.permission === 'admin' || mainUser.permission === 'moderator') {
                    User.findOne({ _id: editUser }, function (err, user) {
                        if (err) throw err;
                        if (!user) {
                            res.json({ success: false, message: 'No user found' });
                        } else {
                            res.json({ success: true, user: user });
                        }
                    });
                } else {
                    res.json({ success: false, message: 'Insufficient Permissions' });
                }
            }
        });
    });

    //Ruta usada para editar a un usuario. Se utiliza la misma ruta para todos los campos
    //http://localhost:8080/api/edit
    router.put('/edit', function (req, res) {
        var editUser = req.body._id;//id del usario a editar
        //Se comprueba cual es el campo a editar haciendo las asignaciones
        if (req.body.name) var newName = req.body.name;
        if (req.body.username) var newUsername = req.body.username;
        if (req.body.email) var newEmail = req.body.email;
        if (req.body.permission) var newPermission = req.body.permission;
        User.findOne({ username: req.decoded.username }, function (err, mainUser) {
            //Se comprueba que el usario logueado existe en la base de datos y tiene los permisos necesarios para editar a un usuario
            if (err) throw err;
            if (!mainUser) {
                res.send({ success: false, message: 'No user found' });
            } else {
                if (newName) {//Se va a editar el name
                    if (mainUser.permission === 'admin' || mainUser.permission === 'moderator') {
                        User.findOne({ _id: editUser }, function (err, user) {
                            if (err) throw err;
                            if (!user) {
                                res.json({ success: false, message: 'No user found' });
                            } else {
                                user.name = newName;
                                user.save(function (err) {
                                    if (err) {
                                        console.log(err);
                                    } else {
                                        res.json({ success: true, message: 'Name has been updated!' });
                                    }
                                });
                            }
                        });
                    } else {
                        res.json({ success: false, message: 'Insufficient Permissions' });
                    }
                }
                if (newUsername) {//Se va a editar el username
                    if (mainUser.permission === 'admin' || mainUser.permission === 'moderator') {
                        User.findOne({ _id: editUser }, function (err, user) {
                            if (err) throw err;
                            if (!user) {
                                res.json({ success: false, message: 'No user found' });
                            } else {
                                user.username = newUsername;
                                user.save(function (err) {
                                    if (err) {
                                        console.log(err);
                                    } else {
                                        res.json({ success: true, message: 'Username has been updated!' });
                                    }
                                });
                            }
                        });
                    } else {
                        res.json({ success: false, message: 'Insufficient Permissions' });
                    }
                }
                if (newEmail) {//Se va a editar el email
                    if (mainUser.permission === 'admin' || mainUser.permission === 'moderator') {
                        User.findOne({ _id: editUser }, function (err, user) {
                            if (err) throw err;
                            if (!user) {
                                res.json({ success: false, message: 'No user found' });
                            } else {
                                user.email = newEmail;
                                user.save(function (err) {
                                    if (err) {
                                        console.log(err);
                                    } else {
                                        res.json({ success: true, message: 'Email has been updated!' });
                                    }
                                });
                            }
                        });
                    } else {
                        res.json({ success: false, message: 'Insufficient Permissions' });
                    }
                }
                if (newPermission) {//Se van a editar los permisos
                    if (mainUser.permission === 'admin' || mainUser.permission === 'moderator') {
                        User.findOne({ _id: editUser }, function (err, user) {
                            if (err) throw err;
                            if (!user) {
                                res.json({ success: false, message: 'No user found' });
                            } else {
                                //Es necesario comprobar que el rango de permisos de la persona que los está editando es igual o superior a los de la persona que se los está editando, es decir, un moderator no podrá editar los permisos de un admin pero si los de otro moderator y los de un user
                                if (newPermission === 'user') {
                                    if (user.permission === 'admin') {
                                        if (mainUser.permission !== 'admin') {
                                            res.json({ success: false, message: 'Insufficient Permissions. You must be an admin to downgrade another admin' });
                                        } else {
                                            user.permission = newPermission;
                                            user.save(function (err) {
                                                if (err) {
                                                    console.log(err);
                                                } else {
                                                    res.json({ success: true, message: 'Permissions have been updated!' });
                                                }
                                            });
                                        }
                                    } else {
                                        user.permission = newPermission;
                                        user.save(function (err) {
                                            if (err) {
                                                console.log(err);
                                            } else {
                                                res.json({ success: true, message: 'Permissions have been updated!' });
                                            }
                                        });
                                    }
                                } else if (newPermission === 'moderator') {
                                    if (user.permission === 'admin') {
                                        if (mainUser.permission !== 'admin') {
                                            res.json({ success: false, message: 'Insufficient Permissions. You must be an admin to downgrade another admin' });
                                        } else {
                                            user.permission = newPermission;
                                            user.save(function (err) {
                                                if (err) {
                                                    console.log(err);
                                                } else {
                                                    res.json({ success: true, message: 'Permissions have been updated!' });
                                                }
                                            });
                                        }
                                    } else {
                                        user.permission = newPermission;
                                        user.save(function (err) {
                                            if (err) {
                                                console.log(err);
                                            } else {
                                                res.json({ success: true, message: 'Permissions have been updated!' });
                                            }
                                        });
                                    }
                                } else if (newPermission === 'admin') {
                                    if (mainUser.permission !== 'admin') {
                                        res.json({ success: false, message: 'Insufficient Permissions. You must be an admin to upgrade someone to the admin level' });
                                    } else {
                                        user.permission = newPermission;
                                        user.save(function (err) {
                                            if (err) {
                                                console.log(err);
                                            } else {
                                                res.json({ success: true, message: 'Permissions have been updated!' });
                                            }
                                        });
                                    }
                                }
                            }
                        });
                    } else {
                        res.json({ success: false, message: 'Insufficient Permissions' });
                    }
                }

            }
        });
    });

    return router;
};