var FacebookStrategy = require('passport-facebook').Strategy;//Pauqete para autenticación con Facebook
var TwitterStrategy = require('passport-twitter').Strategy;//Pauqete para autenticación con Twitter
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;//Pauqete para autenticación con Google
var User = require('../models/user');//Importar modelo User
var session = require('express-session');//Importar EXpress Session Package     
var jwt = require('jsonwebtoken');//Importa JWT Package->crear tokens
var secret = 'harrypotter';//Palabra utilizada para cifrar los tokens

module.exports = function (app, passport) {
    //Configuración de Passport
    app.use(passport.initialize());
    app.use(passport.session());
    app.use(session({
        secret: 'keyboard cat',
        resave: false,
        saveUninitialized: true,
        cookie: { secure: false }
    }));

    //Serializa usuario una vez loguados    
    passport.serializeUser(function (user, done) {

        if (user.active) {
            token = jwt.sign({
                username: user.username,
                email: user.email
            }, secret, { expiresIn: '24h' });
        } else {
            token = 'inactive/error';
        }
        
        done(null, user.id);
    });

    //Desserializa usuario para hacer el logout    
    passport.deserializeUser(function (id, done) {
        User.findById(id, function (err, user) {
            done(err, user);
        });
    });

    //Facebook Strategy    
    passport.use(new FacebookStrategy({
        clientID: '1052582444886084',
        clientSecret: '487b05bfa674a106ad85eb33c852ff20',
        callbackURL: "https://shielded-savannah-64507.herokuapp.com/auth/facebook/callback",
        profileFields: ['id', 'displayName', 'photos', 'email']
    },
        function (accessToken, refreshToken, profile, done) {
            User.findOne({ email: profile._json.email }).select('username password email active').exec(function (err, user) {
                if (err) done(err);

                if (user && user !== null) {
                    done(null, user);
                } else {
                    done(err);
                }

            });
        }
    ));

    //Twitter Strategy
    passport.use(new TwitterStrategy({
        consumerKey: 'CgVnn2A0Kc02UiquxZyS26bru',
        consumerSecret: 'ysRYTPFVy5uJ1nZyUEzrGBEs5ObKy4673qNvFTdNlX094zByGy',
        callbackURL: "https://shielded-savannah-64507.herokuapp.com/auth/twitter/callback",
        userProfileURL: "https://api.twitter.com/1.1/account/verify_credentials.json?include_email=true"
    },
        function (token, tokenSecret, profile, done) {
            User.findOne({ email: profile.emails[0].value }).select('username password email active').exec(function (err, user) {
                if (err) done(err);

                if (user && user !== null) {
                    done(null, user);
                } else {
                    done(err);
                }

            });
        }
    ));

    //Google Strategy
    passport.use(new GoogleStrategy({
        clientID: '219521179590-8mubv48lod2265b66k8ekcvbg853t9s2.apps.googleusercontent.com',
        clientSecret: 'B-BazYaW5SGUHmqIT3yIKQeM',
        callbackURL: "https://shielded-savannah-64507.herokuapp.com/auth/google/callback"
    },
        function (accessToken, refreshToken, profile, done) {
            User.findOne({ email: profile.emails[0].value }).select('username password email active').exec(function (err, user) {
                if (err) done(err);

                if (user && user !== null) {
                    done(null, user);
                } else {
                    done(err);
                }

            });
        }
    ));

    //Google Routes    
    app.get('/auth/google', passport.authenticate('google', { scope: ['https://www.googleapis.com/auth/plus.login', 'profile', 'email'] }));

    app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/googleerror' }), function (req, res) {
        res.redirect('/google/' + token);//Redirige al usuario con el nuevo token
    });

    //Twitter Routes
    app.get('/auth/twitter', passport.authenticate('twitter'));

    app.get('/auth/twitter/callback', passport.authenticate('twitter', { failureRedirect: '/twittererror' }), function (req, res) {
        res.redirect('/twitter/' + token);//Redirige al usuario con el nuevo token
    });

    //Facebook Routes
    app.get('/auth/facebook', passport.authenticate('facebook', { scope: 'email' }));

    app.get('/auth/facebook/callback', passport.authenticate('facebook', { failureRedirect: '/facebookerror' }), function (req, res) {
        res.redirect('/facebook/' + token);//Redirige al usuario con el nuevo token
    });

    return passport;
}; 