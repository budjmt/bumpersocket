const Ammo = require('ammo-node');
const THREE = require('three');
const Physijs = require('./lib/physi.js')(THREE, Ammo);

const randRange = (min, max) => (Math.random() * (max - min)) + min;

class Powerup {
  constructor(type, effect, reset, period) {
    this.type = type;
    this.effect = effect;
    this.cache = {};
    this.period = period;
    this.reset = reset;
  }

  get packet() {
    return {
      id: this.id,
      type: this.type,
      position: this.gameObject.position,
    };
  }

  static instance(type) {
    const p = Powerup.templates[type];
    return new Powerup(p.type, p.effect, p.reset, p.period);
  }

  instantiate(scene) {
    this.scene = scene;
    this.gameObject = new Physijs.BoxMesh(
      new THREE.BoxGeometry(1.5, 1.5, 0.1),
      new THREE.MeshBasicMaterial());
    this.gameObject.name = 'powerup';
    this.gameObject.addEventListener('collision', () => {});

    const pos = this.scene.randSpawnPosition();
    this.gameObject.position.set(pos.x, pos.y, pos.z);

    this.gameObject.logic = this;
    this.scene.addPowerup(this);
  }

  applyTo(player) {
    if (this.scene) { this.effect(this, player); }
    if (this.period) setTimeout(() => this.reset(this, player), this.period);
    this.scene.removePowerup(this);
  }
}

Powerup.types = {
  speed: 0,
  // size: 1,
  heavy: 1,
};
Object.seal(Powerup.types);

Powerup.templates = {};

// speed up
Powerup.templates[Powerup.types.speed] =
  new Powerup(Powerup.types.speed, (_me, _player) => {
    // const me = Powerup.templates[_me.type];
    const player = _player;
    // me.cache.speed = me.cache.speed || player.speed;
    player.speed = 3;
  }, (_me, _player) => {
    // const me = Powerup.templates[_me.type];
    const player = _player;
    // player.speed = me.cache.speed;
    player.speed = 1.25;
    // me.cache.speed = null;
  }, 5000);

// can't do with physijs, object scale is static after creation
// make bigger
// Powerup.templates[Powerup.types.size] =
//   new Powerup(Powerup.types.size, (_me, player) => {
//     const me = _me;
//     me.cache.scale = player.gameObject.scale.clone();
//     player.gameObject.scale.set(5, 5, 5);
//   }, (me, _player) => {
//     const player = _player;
//     player.gameObject.scale.set(me.cache.scale.x, me.cache.scale.y, me.cache.scale.z);
//   }, 5000);

// weight up
Powerup.templates[Powerup.types.heavy] =
  new Powerup(Powerup.types.heavy, (_me, _player) => {
    // const me = Powerup.templates[_me.type];
    const player = _player;
    // me.cache.speed = me.cache.speed || player.speed;
    player.gameObject.mass = 6;
  }, (_me, _player) => {
    // const me = Powerup.templates[_me.type];
    const player = _player;
    // player.speed = me.cache.speed;
    player.gameObject.mass = (4 / 3) * Math.PI;
    // me.cache.speed = null;
  }, 5000);

Object.seal(Powerup.templates);

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

        this.trySpawnPowerup();

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
    this.powerups = {};
    this.lastDisconnect = new Date().getTime();
    this.lastPowerupAttempt = this.lastDisconnect;
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

  addPowerup(_powerup) {
    const powerup = _powerup;
    this.scene.add(powerup.gameObject);
    do { powerup.id = Math.random() * 5; } while (this.powerups[powerup.id]);
    this.powerups[powerup.id] = powerup;
  }

  removePowerup(powerup) {
    this.scene.remove(powerup.gameObject);
    delete this.powerups[powerup.id];
  }

  randSpawnPosition() {
    const safe = this.dims / 4;
    return new THREE.Vector3(randRange(-safe, safe), 5, randRange(-safe, safe));
  }

  trySpawnPowerup() {
    const powerupInterval = 10000;
    const maxPowerups = 3;
    if (new Date().getTime() - this.lastPowerupAttempt > powerupInterval) {
      this.lastPowerupAttempt = new Date().getTime();
      if (Object.keys(this.powerups).length < maxPowerups) {
        const index = Math.floor(Math.random() * Object.keys(Powerup.types).length);
        Powerup.instance(index).instantiate(this);
      }
    }
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
    this.speed = 1.25;

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
      mass: this.gameObject.mass,
      position: this.gameObject.position,
      rotation: this.gameObject.quaternion };
  }

  applyFriction() {
    const av = this.angularVel.multiplyScalar(0.8 / this.speed);
    if (av.lengthSq() < 0.00001) av.set(0, 0, 0);
    this.angularVel = av;
  }

  update() {
    this.direction.multiplyScalar(this.speed);
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
    const v = contactNormal;
    switch (other.name) {
      case 'car':
        v.setLength(20);
        other.applyCentralForce(v);
        other.player.touch(this);
        break;
      case 'powerup':
        other.logic.applyTo(this);
        break;
      default:
    }
  }

  updateDirection(input) {
    this.direction.set(input.direction.x, input.direction.y, input.direction.z);
  }
}

module.exports.Scene = Scene;
module.exports.Player = Player;
