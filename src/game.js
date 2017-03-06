const NodePhysijs = require('nodejs-physijs');

const THREE = NodePhysijs.THREE;
const Ammo = NodePhysijs.Ammo;
const Physijs = NodePhysijs.Physijs(THREE, Ammo);

let winner;
let gameOver;
const losers = [];

const players = {};

const scene = new Physijs.Scene();
scene.setGravity(new THREE.Vector3( 0, -9.8, 0 ));
scene.add(new Physijs.BoxMesh(new THREE.CubeGeometry(20, 20, 1), new THREE.MeshBasicMaterial(), 0));
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

  if (playersLeft.length < 2) {
    gameOver = true;
    if (playersLeft.length === 1) { winner = playersLeft[0]; }
  }
});

setInterval(scene.simulate.bind(scene), 1000 / 60); // set simulation to 60 fps

class Player {
  constructor(name, color, position) {
    this.name = name;
    this.color = color;
    this.gameObject = new Physijs.SphereMesh(new THREE.SphereGeometry(1), new THREE.MeshBasicMaterial());
    this.gameObject.position.set(position);
    // this.gameObject.addEventListener('collision', this.onCollision.bind(this));
    this.direction = new THREE.Vector3(0, 0, 0);
    this.lastUpdate = new Date().getTime();
  }

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
      rotation: this.gameObject.rotation,
      linearVelocity: this.gameObject.getLinearVelocity(),
      angularVelocity: this.gameObject.getLinearVelocity() };
  }

  update() {
    this.gameObject.applyCentralForce(this.direction);
    this.direction.multiplyScalar(0.8);
  }

  // onCollision(other, relVel, relRot, contactNormal) {
    // check if other object is a player
  // }

  updateDirection(input) {
    this.direction = new THREE.Vector3(input.direction.x, input.direction.y, input.direction.z);
  }
}

module.exports.winner = winner;
module.exports.gameOver = gameOver;
module.exports.losers = losers;

module.exports.players = players;
module.exports.Player = Player;
