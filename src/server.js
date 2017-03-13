const http = require('http');
const path = require('path');
const socketio = require('socket.io');
const express = require('express');
const game = require('./game.js');

const port = process.env.PORT || process.env.NODE_PORT || 3000;

const root = `${__dirname}/../client/`;

const getOptions = () => ({ root, headers: { 'x-timestamp': Date.now(), 'x-sent': true } });

const app = express();
const httpServer = http.createServer(app).listen(port);

app.use('/media', express.static(path.join(root, 'media')));
app.use('/css', express.static(path.join(root, 'css')));
app.use('/js', express.static(path.join(root, 'js')));

app.get('/', (req, res) => res.sendFile('index.html', getOptions()));

console.log(`Listening on 127.0.0.1: ${port}`);

const io = socketio(httpServer);

const pushUpdates = () => {
  while (game.losers.length > 0) {
    const name = game.losers.pop().name;
    console.log(`${name} lost`);
    io.sockets.in('room1').emit('lose', name);
  }

  if (game.gameOver) {
    if (game.winner) {
      io.sockets.in('room1').emit('win', game.winner);
    }
    Object.keys(game.players).forEach(player => game.players[player].destroy());
    io.sockets.in('room1').emit('gameOver', null);
    game.gameOver = false;
  }

  const updatePacket = [];
  Object.keys(game.players).forEach(player => updatePacket.push(game.players[player].packet));
  io.sockets.in('room1').emit('update', { players: updatePacket, time: new Date().getTime() });
};

setInterval(pushUpdates, 1000 / 60);

const onJoin = (sock) => {
  const socket = sock;
  socket.on('join', (data) => {
    if (game.players[data.name]) {
      socket.emit('connectFail', 'That username is already in use, try another');
      return;
    }
    socket.name = data.name;
    console.log(data.name);
    game.playerCount++;
    const player = new game.Player(socket.name, data.color, data.position);

    Object.keys(game.players).forEach((otherPlayerName) => {
      const otherPlayer = game.players[otherPlayerName];
      socket.emit('add', { player: otherPlayer.packet, color: otherPlayer.color, time: new Date().getTime() });
    });
    player.instantiate();

    socket.emit('connectSuccess', null);
    socket.broadcast.to('room1').emit('add', { player: player.packet, color: data.color, time: new Date().getTime() });
  });
};

const onInput = (sock) => {
  const socket = sock;
  socket.on('input', (data) => {
    const player = game.players[data.name];
    if (player) {
      player.updateDirection(data.input);
    }
  });
};

const onDisconnect = (sock) => {
  const socket = sock;
  socket.on('disconnect', () => {
    // check that the user successfully joined before deleting
    const player = game.players[socket.name];
    if (player) {
      player.destroy();
      io.sockets.in('room1').emit('lose', socket.name);
      game.playerCount--;
    }
  });
};

io.sockets.on('connection', (socket) => {
  console.log('started');
  socket.join('room1');
  onJoin(socket);
  onInput(socket);
  onDisconnect(socket);
});

console.log('Websocket server started');
