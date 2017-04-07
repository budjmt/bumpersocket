const Ammo = require('ammo-node');
const THREE = require('three');
const Physijs = require('./lib/physi.js')(THREE, Ammo);

const randRange = (min, max) => (Math.random() * (max - min)) + min;

class Scene {
  constructor() {
    this.scene = new Physijs.Scene();
    this.scene.setGravity(new THREE.Vector3(0, -9.8, 0));

    this.dims = 20;
    const ground = new Physijs.BoxMesh(
      new THREE.BoxGeometry(this.dims, this.dims, 1),
      Physijs.createMaterial(new THREE.MeshBasicMaterial(), 0.8, 0.7), 0);
    ground.rotation.set(Math.PI / 2, 0, 0);
    this.scene.add(ground);

    this.scene.addEventListener('update', () => {
      Object.keys(this.players).forEach((playerName) => {
        const player = this.players[playerName];
        player.update();

        // if the player fell off the stage
        if (player.gameObject.position.y < -8) {
          if (player.lastTouch) player.lastTouch.player.score++;
          if (player.score > 0) --player.score;
          player.spawnMove(this);
        }
      });
    });

    this.simInterval = setInterval(this.scene.simulate.bind(this.scene), 1000 / 60);

    this.players = {};
    this.lastDisconnect = new Date().getTime();
  }

  get playerCount() { return Object.keys(this.players).length; }

  destroy() {
    clearInterval(this.simInterval);
    this.reset();
  }

  reset() {
    Object.keys(this.players).forEach(player => this.players[player].destroy(this));
  }

  addPlayer(player) {
    this.scene.add(player.gameObject);
    this.players[player.name] = player;
  }

  removePlayer(player) {
    this.scene.remove(player.gameObject);
    delete this.players[player.name];
  }

  randSpawnPosition() {
    const safe = this.dims / 4;
    return new THREE.Vector3(randRange(-safe, safe), 5, randRange(-safe, safe));
  }
}

class Player {
  constructor(name, color) {
    this.name = name;
    this.color = color;

    this.gameObject = new Physijs.SphereMesh(
        new THREE.SphereGeometry(1)
      , Physijs.createMaterial(new THREE.MeshBasicMaterial(), 0.8, 0.7));
    this.gameObject.name = 'car';
    this.gameObject.player = this;
    this.gameObject.addEventListener('collision', this.onCollision.bind(this));
    
    this.direction = new THREE.Vector3();
    this.lastUpdate = new Date().getTime();
    this.lastTouch = null;
    this.score = 0;
  }

  get linearVel() { return this.gameObject.getLinearVelocity(); }
  set linearVel(val) { this.gameObject.setLinearVelocity(val); }

  get angularVel() { return this.gameObject.getAngularVelocity(); }
  set angularVel(val) { this.gameObject.setAngularVelocity(val); }

  spawnMove(scene) {
    const pos = scene.randSpawnPosition();
    this.gameObject.position.set(pos.x, pos.y, pos.z);
    this.gameObject.__dirtyPosition = true;
    const zero = new THREE.Vector3();
    this.linearVel = zero;
    this.angularVel = zero;
  }

  instantiate(scene) {
    if (this.added) return;
    this.spawnMove(scene);
    scene.addPlayer(this);
    this.added = true;
  }

  destroy(scene) {
    if (!this.added) return;
    scene.removePlayer(this);
    this.added = false;
  }

  get packet() {
    return {
      name: this.name,
      color: this.color,
      score: this.score,
      position: this.gameObject.position,
      rotation: this.gameObject.quaternion };
  }

  applyFriction() {
    const av = this.angularVel.multiplyScalar(0.8);
    if (av.lengthSq() < 0.00001) av.set(0, 0, 0);
    this.angularVel = av;
  }

  update() {
    this.gameObject.applyCentralForce(this.direction);
    
     // faster length == 0 check
    const fakeLen = this.direction.x + this.direction.y + this.direction.z;
    if (fakeLen === 0) this.applyFriction();
    this.direction.set(0, 0, 0);

    if (this.lastTouch && new Date().getTime() - this.lastTouch.time > 10000) {
      this.lastTouch = null;
    }
  }

  touch(player) {
    this.lastTouch = { time: new Date().getTime(), player };
  }

  onCollision(other, relVel, relRot, contactNormal) {
    // check if other object is a player
    if (other.name === 'car') {
      const v = contactNormal;
      v.setLength(20);
      other.applyCentralForce(v);
      other.player.touch(this);
    }
  }

  updateDirection(input) {
    this.direction.set(input.direction.x, input.direction.y, input.direction.z);
  }
}

module.exports.Scene = Scene;
module.exports.Player = Player;
