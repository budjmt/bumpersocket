const http = require('http');
const fs = require('fs');
const path = require('path');
const socketio = require('socket.io');
const express = require('express');
const common = require('./common.js');
const game = require('./game.js');

const port = process.env.PORT || process.env.NODE_PORT || 3000;

const root = `${__dirname}/../client/`;

const getOptions = () => { return { root, headers: { 'x-timestamp': Date.now(), 'x-sent': true } }; };

const app = express();
const httpServer = http.createServer(app).listen(port);

app.use('/media', express.static(path.join(root, 'media')));
app.use('/css', express.static(path.join(root, 'css')));
app.use('/js', express.static(path.join(root, 'js')));

app.get('/', (req, res) => res.sendFile('index.html', getOptions()));

console.log(`Listening on 127.0.0.1: ${port}`);

const io = socketio(httpServer);

const pushUpdates = () => {
  players.forEach(player => io.sockets.in('room1').emit('update', player));
};

setInterval(pushUpdates, 200);

const onJoin = (sock) => {
  const socket = sock;
  socket.on('join', data => {
    new Player(data.name, data.position).create();
  });
}

const onInput = (sock) => {
  const socket = sock;
  socket.on('input', data => game.players[data.name].updateDirection(data));
};

io.sockets.on('connection', (socket) => {
  console.log('started');
  socket.join('room1');
  onInput(socket);
});

console.log('Websocket server started');
