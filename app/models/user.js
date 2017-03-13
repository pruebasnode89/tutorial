var mongoose = require('mongoose');//Importa Mongoose Package
var Schema = mongoose.Schema;
var bcrypt = require('bcrypt-nodejs');//Importa Bcrypt->Encripta password
//Plugins para mongoose
var titlize = require('mongoose-title-case');//Pone la primera letra de cada palabra en mayúsculas
var validate = require('mongoose-validator');//Validación

//Validadot del nombre
var nameValidator = [
    validate({
        validator: 'matches',
        arguments: /^(([a-zA-Z]{3,20})+[ ]+([a-zA-Z]{3,20})+)+$/,
        message: 'Name must be at least 3 characters, max 20, no special characters or numbers, must have space between name.'
    }),
    validate({
        validator: 'isLength',
        arguments: [3, 20],
        message: 'Name should be between {ARGS[0]} and {ARGS[1]} characters'
    })
];

//Validador para el email
var emailValidator = [
    validate({
        validator: 'isEmail',
        message: 'Is not a valid email.'
    }),
    validate({
        validator: 'isLength',
        arguments: [3, 25],
        message: 'Email should be between {ARGS[0]} and {ARGS[1]} characters'
    })
];

//Validador para el nombre de usuario
var usernameValidator = [
    validate({
        validator: 'isLength',
        arguments: [3, 25],
        message: 'Username should be between {ARGS[0]} and {ARGS[1]} characters'
    }),
    validate({
        validator: 'isAlphanumeric',
        message: 'Username must contain letters and numbers only'
    })
];

//Validador de contraseña
var passwordValidator = [
    validate({
        validator: 'matches',
        arguments: /^(?=.*?[a-z])(?=.*?[A-Z])(?=.*?[\d])(?=.*?[\W]).{8,35}$/,
        message: 'Password needs to have at least one lower case, one uppercase, one number, one special character, and must be at least 8 characters but no more then 35.'
    }),
    validate({
        validator: 'isLength',
        arguments: [8, 35],
        message: 'Password should be between {ARGS[0]} and {ARGS[1]} characters'
    })
];


//User Schema
var UserSchema = new Schema({
    name: { type: String, required: true, validate: nameValidator },
    username: { type: String, lowercase: true, required: true, unique: true, validate: usernameValidator },
    password: { type: String, required: true, validate: passwordValidator, select: false },
    email: { type: String, required: true, lowercase: true, unique: true, validate: emailValidator },
    active: { type: Boolean, required: true, default: false },
    temporarytoken: { type: String, required: true },
    resettoken: { type: String, required: false },
    permission: { type: String, required: true, default: 'user' }
});

//Middleware que encripta la password antes de guardarla en la base de datos
UserSchema.pre('save', function (next) {
    var user = this;

    if (!user.isModified('password')) return next();//Si la contraseña no ha cambiado ignora el Middleware

    bcrypt.hash(user.password, null, null, function (err, hash) {
        if (err) return next(err);
        user.password = hash;
        next();
    });
});

//Plugin de Mongoose que pone la primera letra de cada plablra en mayusculas
UserSchema.plugin(titlize, {
    paths: ['name']
});

//Método que se llama desde la API para comprobar que la contraseña es o no correcta
UserSchema.methods.comparePassword = function (password) {
    return bcrypt.compareSync(password, this.password);
};

module.exports = mongoose.model('User', UserSchema);//Se exporta el modelo para poder usarlo en la API


