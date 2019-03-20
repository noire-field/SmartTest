// Import our things
const config = require('./../config');
const { Log } = require('./utils/logger');

// Import necessary libs
const path = require('path');
const http = require('http');
const express = require('express');
const socketIO = require('socket.io');

// Check setting
const publicPath = path.join(__dirname, '..', '/public');
const httpPort = process.env.PORT || config.HTTP_PORT;

// Run the website with HTTP, Express and Socket.IO
var app = express();
var server = http.createServer(app);
var io = socketIO(server);

// Serve the static files
app.use(express.static(publicPath));

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