const Ammo = require('ammo-node');
const THREE = require('three');
const Physijs = require('./lib/physi.js')(THREE, Ammo);

let winner;
let gameOver;
const losers = [];

const players = {};
const playerCount = 0;

const scene = new Physijs.Scene();
scene.setGravity(new THREE.Vector3(0, -9.8, 0));
const ground = new Physijs.BoxMesh(
  new THREE.BoxGeometry(20, 20, 1), Physijs.createMaterial(new THREE.MeshBasicMaterial(), 0.8, 0.7), 0);
ground.rotation.set(Math.PI / 2, 0, 0);
scene.add(ground);
scene.addEventListener('update', () => {
  const playersLeft = [];
  Object.keys(players).forEach((playerName) => {
    const player = players[playerName];
    player.update();
    if (player.gameObject.position.y < -5) {
      losers.push(player);
      player.destroy();
    } else { playersLeft.push(player); }
  });

  if (playersLeft.length < 2 && playerCount > 1) {
    gameOver = true;
    if (playersLeft.length === 1) { winner = playersLeft[0]; }
  }
});

// scene.simulate();
setInterval(scene.simulate.bind(scene), 1000 / 60);

class Player {
  constructor(name, color, position) {
    this.name = name;
    this.color = color;
    this.gameObject = new Physijs.SphereMesh(
        new THREE.SphereGeometry(1)
      , Physijs.createMaterial(new THREE.MeshBasicMaterial(), 0.8, 0.7));
    this.gameObject.name = 'car';
    this.gameObject.position.set(position.x, position.y, position.z);
    this.gameObject.addEventListener('collision', this.onCollision.bind(this));
    this.direction = new THREE.Vector3(0, 0, 0);
    this.lastUpdate = new Date().getTime();
  }

  get linearVel() { return this.gameObject.getLinearVelocity(); }
  set linearVel(val) { this.gameObject.setLinearVelocity(val); }

  get angularVel() { return this.gameObject.getAngularVelocity(); }
  set angularVel(val) { this.gameObject.setAngularVelocity(val); }

  instantiate() {
    if (this.added) return;
    scene.add(this.gameObject);
    players[this.name] = this;
    this.added = true;
  }

  destroy() {
    if (!this.added) return;
    scene.remove(this.gameObject);
    delete players[this.name];
    this.added = false;
  }

  get packet() {
    return {
      name: this.name,
      time: new Date().getTime(),
      position: this.gameObject.position,
      rotation: this.gameObject.quaternion,
      linearVel:  this.gameObject.getLinearVelocity(),
      angularVel: this.gameObject.getAngularVelocity() };
  }

  applyFriction() {
    let av = this.angularVel.multiplyScalar(0.8);
    if(av.length() < 0.001) av.set(0, 0, 0);
    this.angularVel = av;
  }

  update() {
    this.gameObject.applyCentralForce(this.direction);
    if(this.direction.length() === 0) this.applyFriction();
    this.direction.set(0, 0, 0);
  }

  onCollision(other, relVel, relRot, contactNormal) {
    // check if other object is a player
    if(other.name === 'car') {
      let v = contactNormal;
      v.setLength(20);
      other.applyCentralForce(v);
    }
  }

  updateDirection(input) {
    this.direction.set(input.direction.x, input.direction.y, input.direction.z);
  }
}

// module.exports.simulate = () => scene.simulate();

module.exports.winner = winner;
module.exports.gameOver = gameOver;
module.exports.losers = losers;

module.exports.players = players;
module.exports.playerCount = playerCount;
module.exports.Player = Player;
