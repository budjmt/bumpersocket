const Ammo = require('ammo-node');
const THREE = require('three');
const Physijs = require('./lib/physi.js')(THREE, Ammo);

class Scene {
  constructor() {
    this.scene = new Physijs.Scene();
    this.scene.setGravity(new THREE.Vector3(0, -9.8, 0));

    const ground = new Physijs.BoxMesh(
      new THREE.BoxGeometry(20, 20, 1),
      Physijs.createMaterial(new THREE.MeshBasicMaterial(), 0.8, 0.7), 0);
    ground.rotation.set(Math.PI / 2, 0, 0);
    this.scene.add(ground);

    this.scene.addEventListener('update', () => {
      const playersLeft = [];
      Object.keys(this.players).forEach((playerName) => {
        const player = this.players[playerName];
        player.update();

        // if the player fell off the stage
        if (player.gameObject.position.y < -5) {
          this.losers.push(player);
          if (player.lastTouch) { player.lastTouch.player.score++; }
          player.destroy(this);
        } else { playersLeft.push(player); }
      });

      if (playersLeft.length < 2 && this.playerCount > 1) {
        this.gameOver = true;
        if (playersLeft.length === 1) { this.winner = playersLeft[0]; }
      }
    });

    this.simInterval = setInterval(this.scene.simulate.bind(this.scene), 1000 / 60);

    this.winner = null;
    this.gameOver = false;
    this.losers = [];

    this.players = {};
    this.playerCount = 0;
    this.lastDisconnect = new Date().getTime();
  }

  destroy() {
    clearInterval(this.simInterval);
    this.reset();
  }

  reset() {
    Object.keys(this.players).forEach(player => this.players[player].destroy(this));
    this.gameOver = false;
  }

  addPlayer(player) {
    this.scene.add(player.gameObject);
    this.players[player.name] = player;
  }

  removePlayer(player) {
    this.scene.remove(player.gameObject);
    delete this.players[player.name];
  }
}

class Player {
  constructor(name, color, position) {
    this.name = name;
    this.color = color;
    this.gameObject = new Physijs.SphereMesh(
        new THREE.SphereGeometry(1)
      , Physijs.createMaterial(new THREE.MeshBasicMaterial(), 0.8, 0.7));
    this.gameObject.name = 'car';
    this.gameObject.player = this;
    this.gameObject.position.set(position.x, position.y, position.z);
    this.gameObject.addEventListener('collision', this.onCollision.bind(this));
    this.direction = new THREE.Vector3(0, 0, 0);
    this.lastUpdate = new Date().getTime();
    this.lastTouch = null;
    this.score = 0;
  }

  get linearVel() { return this.gameObject.getLinearVelocity(); }
  set linearVel(val) { this.gameObject.setLinearVelocity(val); }

  get angularVel() { return this.gameObject.getAngularVelocity(); }
  set angularVel(val) { this.gameObject.setAngularVelocity(val); }

  instantiate(scene) {
    if (this.added) return;
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
    if (av.length() < 0.001) av.set(0, 0, 0);
    this.angularVel = av;
  }

  update() {
    this.gameObject.applyCentralForce(this.direction);
    if (this.direction.length() === 0) this.applyFriction();
    this.direction.set(0, 0, 0);

    if (this.lastTouch && new Date().getTime() - this.lastTouch.time > 2000) {
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
