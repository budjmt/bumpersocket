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
const rooms = {};

const pushUpdates = (scene, room) => {
  while (scene.losers.length > 0) {
    const name = scene.losers.pop().name;
    console.log(`${name} lost`);
  }

  if (scene.gameOver) {
    if (scene.winner) {
      // io.sockets.in(room).emit('win', scene.winner);
    }
    // scene.reset();
    // io.sockets.in(room).emit('gameOver');
  }

  const updatePacket = Object.keys(scene.players).map(player => scene.players[player].packet);
  io.sockets.in(room).emit('update', { players: updatePacket, time: new Date().getTime() });

  const expireTime = 2 * 60 * 1000; // 2 minutes
  if (scene.playerCount < 1 && new Date().getTime() - scene.lastDisconnect > expireTime) {
    clearInterval(scene.pushInterval);
    scene.destroy();
    delete rooms[room];
  }
};

const onJoin = (sock) => {
  const socket = sock;
  socket.on('join', (data) => {
    const scene = rooms[data.room];
    if (!scene) {
      socket.emit('roomList', Object.keys(rooms));
      return;
    }
    if (scene.players[data.name]) {
      socket.emit('connectFail', 'That username is already in use, try another');
      return;
    }
    socket.name = data.name;
    socket.room = data.room;
    socket.join(socket.room);
    console.log(data.name);
    // console.dir(io);

    const player = new game.Player(socket.name, data.color, data.position);
    player.instantiate(scene);
    scene.playerCount++;

    // the upside of not sending a specific add event is easier portability to UDP
    // the downside is that it requires sending color with every player packet (4 bytes)
    // best of both worlds might be having add/lose require confirmation from the client
    // or making them specifically TCP
    // probably premature optimization
    socket.emit('connectSuccess');
  });
};

const onInput = (sock) => {
  const socket = sock;
  socket.on('input', (data) => {
    const player = rooms[socket.room].players[data.name];
    if (player) {
      player.updateDirection(data.input);
    }
  });
};

const onDisconnect = (sock) => {
  const socket = sock;
  socket.on('disconnect', () => {
    // check that the user successfully joined before deleting
    if (!socket.room) return;
    const scene = rooms[socket.room];
    const player = scene.players[socket.name];
    if (player) {
      player.destroy(scene);
      scene.lastDisconnect = new Date().getTime();
      scene.playerCount--;
    }
  });
};

const onRoom = (sock) => {
  const socket = sock;
  socket.on('getRooms', () => {
    socket.emit('roomList', Object.keys(rooms));
  });

  socket.on('createRoom', (roomName) => {
    if (Object.keys(rooms).find(room => room === roomName)
     || Object.keys(io.sockets.adapter.rooms).find(room => room === roomName)) {
      socket.emit('roomCreateFailure');
      return;
    }
    const scene = new game.Scene();
    rooms[roomName] = scene;
    scene.pushInterval = setInterval(() => pushUpdates(scene, roomName), 1000 / 60);
    socket.emit('roomCreateSuccess', roomName);
  });
};

io.sockets.on('connection', (socket) => {
  console.log('started');
  onRoom(socket);
  onJoin(socket);
  onInput(socket);
  onDisconnect(socket);
});

console.log('Websocket server started');
