// Import necessary libs
const path = require('path');
const http = require('http');
const express = require('express');
const socketIO = require('socket.io');
const hbs = require('hbs')
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const uuid = require('uuid');
const bodyParser = require('body-parser');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

// Import our things
const config = require('./../config');
const { Log } = require('./utils/logger');
const router = require('./router');
const db = require('./database');

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
        Log(`LocalStrategy Checking... (${username})(${password})`);
        if(username == 'noirefield' && password == 'noirefield123@') {
            Log("LocalStrategy OK!");
            return done(null, { userId: 111, username: 'noirefield', password: 'noirefield123@' });
        } else {
            return done('ERROR UNKNOWN', { what: true });
        }
    }
));

passport.serializeUser((user, done) => {
    Log('Serializing user...');
    done(null, user.userId);
});

passport.deserializeUser((id, done) => {
    console.log('Inside deserializeUser callback')
    console.log(`The user id passport saved in the session file store is: ${id}`)
    const user = 'noirefield' === id ? { userId: 111, username: 'noirefield', password: 'noirefield123@' } : false; 
    done(null, user);
  });

// Serve the static files
app.use(express.static(publicPath));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(session({
    genid: (req) => uuid(),
    key: config.SESSION_NAME,
    secret: config.SESSION_SECRET,
    store: new MySQLStore({
        host: config.DB_HOST,
        port: config.DB_PORT,
        user: config.DB_USER,
        password: config.DB_PASS,
        database: config.DB_NAME
    }),
    resave: false,
    saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());

// Define paths for Express config
const publicDirectoryPath = path.join(__dirname, '../public')
const viewsPath = path.join(__dirname, '../templates/views')
const partialsPath = path.join(__dirname, '../templates/partials')

// Setup handlebars engine and views location
app.set('view engine', 'hbs')
app.set('views', viewsPath)
hbs.registerPartials(partialsPath)

// Router
router.register(app);

// Open connection now
server.listen(httpPort, () => {
    Log("HTTP Server has started on port " + httpPort);
});

/* SOCKET.IO
io.on('connection', (socket) => {
    console.log("New user connected");

    // Welcome
    socket.emit('newMessage', generateMessage('Admin', 'Welcome to the chat!'));
    socket.broadcast.emit('newMessage', generateMessage('Admin', 'New user joined!'));

    socket.on('createMessage', (message, callback) => {
        console.log('createMessage: ', message);

        io.emit('newMessage', generateMessage(message.from, message.text));
        callback('This is from the server');

        //socket.broadcast.emit('newMessage', {
        //    from: message.from,
        //    text: message.text,
        //    createdAt: new Date().getTime()
        //});
    })

    socket.on('disconnect', () => {
        console.log("User disconnected");
    })
});
*/