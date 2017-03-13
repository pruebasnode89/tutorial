var express= require('express');//ExpressJS Framework
var app=express();//Se inicia express y se aigna a una variable para poder usarla en la aplicación
var port=process.env.PORT || 8080;//Puerto
var morgan=require('morgan');//Morgan package:muestra logs en la consola de node en cada conexión
var mongoose=require('mongoose');
var bodyParser = require('body-parser');//Permite leer el body de las peticiones(req.body.____)
var router=express.Router();//Invoca el express router
var appRoutes=require('./app/routes/api')(router);//Importa el archivo api.js a el que se le pasa la variable router
var path = require('path');//Importa el modulo path
var passport = require('passport');//Libreria utilizada para la autenticacion
var social = require('./app/passport/passport')(app,passport);//Importa el archivo passport.js

app.use(morgan('dev'));//Morgan Middleware
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
app.use(express.static(__dirname+'/public'));//Permite al front end acceder a public
app.use('/api',appRoutes);//añade al inicio de las rutas ded appRoutes "/api". Ej:/users->/api/users

//Conexión a la base de datos
var options = {
    server: { socketOptions: { keepAlive: 300000, connectTimeoutMS: 30000 } },
    replset: { socketOptions: { keepAlive: 300000, connectTimeoutMS: 30000 } }
};

var mongodbUri = 'mongodb://pruebasnode89:aaa111!!!@ds129030.mlab.com:29030/tutorial';
mongoose.connect(mongodbUri, options, function (err) {
    if (err) {
        console.log('Not connected to the database ' + err);
    } else {
        console.log('Successfully connected to MongoDB');
    }
});

//Asignación del layout de la aplicación
app.get('*',function (req,res) {
    res.sendFile(path.join(__dirname+'/public/app/views/index.html'));
});

//Start server
app.listen(port,function(){
    console.log("Running the server on port "+port);
});