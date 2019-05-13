// Import necessary libs
const path = require('path');
const http = require('http');
const express = require('express');
const socketIO = require('socket.io');
const hbs = require('hbs')
const session = require('express-session');
const FileStore = require('session-file-store')(session);
const uuid = require('uuid');
const bodyParser = require('body-parser');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

// Import our things
const config = require('./../config');
const { Log } = require('./utils/logger');
const User = require('./utils/user');
const router = require('./router');
const { GetConnection } = require('./database');
const { registerHelpers } = require('./utils/hbs_helpers');
const activeTest = require('./activeTest');

// Check setting
const publicPath = path.join(__dirname, '..', '/public');
const httpPort = process.env.PORT || config.HTTP_PORT;

// Run the website with HTTP, Express and Socket.IO
var app = express();
var server = http.createServer(app);
var io = socketIO(server);

// Configure Authendication
passport.use(new LocalStrategy(
    (username, password, done) => {
        GetConnection((error, con) => {
            if(error) return done(error)

            if(!User.IsValidUsername(username) || !User.IsValidPassword(password))
            {
                con.release();
                return done(null, false, { message: "Username or password is invalid..."});
            }

            con.query(
                "SELECT UserID, Username, FirstName, RoleType, AvatarFile FROM Users WHERE Username = ? AND Password = ?", 
                [username, password], // Auto escape string
                function(error, results, fields) {
                    con.release();

                    if(error) return done(error);
                    if(results.length <= 0) return done(null, false, { message: "Username or password is incorrect..."});
                    else return done(null, results[0]);
                }
            );
        });
    }
));

passport.serializeUser((user, done) => {
    done(null, user.UserID);
});

passport.deserializeUser((UserID, done) => {
    GetConnection((error, con) => {
        if(error) return done(error)
        con.query(
            "SELECT UserID, Username, FirstName, RoleType, AvatarFile FROM Users WHERE UserID = ?", 
            [UserID], // Auto escape string
            function(error, results, fields) {
                con.release();

                if(error) return done(error);
                if(results.length <= 0) return done(null, false, { message: "Username or password is incorrect..."});
                else return done(null, results[0]);
            }
        );
    });
  });

// Serve the static files
app.use(express.static(publicPath));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(session({
    genid: (req) => uuid(),
    key: config.SESSION_NAME,
    secret: config.SESSION_SECRET,
    store: new FileStore(),
    resave: false,
    saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(function(error, req, res, next) { // Handling passport deserelizerUser errors
    if(error) req.logout()
    next()
});

// Define paths for Express config
const publicDirectoryPath = path.join(__dirname, '../public')
const viewsPath = path.join(__dirname, '../templates/views')
const partialsPath = path.join(__dirname, '../templates/partials')

// Setup handlebars engine and views location
app.set('view engine', 'hbs')
app.set('views', viewsPath)
hbs.registerPartials(partialsPath)
registerHelpers(hbs);

// Router
router.register(app);

// Open connection now
GetConnection((error, con) => {
    if(error) {
        Log("Unable to connect to database, therefore unable to start HTTP server.");
        process.exit(1);
        return null;
    }
    con.release();

    server.listen(httpPort, () => {
        Log("HTTP Server has started on port " + httpPort);
        activeTest.CheckStartup();
        activeTest.ActivateSocket(io);
    });
});