const powerups = {};
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

  instantiate(position) {
    this.gameObject = new Physijs.BoxMesh(
      new THREE.BoxGeometry(1.5, 1.5, 0.1),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true }));
    this.gameObject.name = 'powerup';
    this.gameObject.position.set(position.x, position.y, position.z);
    this.gameObject.rotation.set(-Math.PI / 2, 0, 0);
    this.gameObject.logic = this;
    
    this.gameObject.material.map = Powerup.templates[this.type].texture;
    this.gameObject.material.needsUpdate = true;

    scene.scene.add(this.gameObject);
    powerups[this.id] = this;
  }

  destroy() {
      scene.scene.remove(this.gameObject);
      delete powerups[this.id];
  }

  applyTo(player) {
    if (this.scene) { this.effect(this, player); }
    if (this.period) setTimeout(() => this.reset(this, player), this.period);
    this.scene.removePowerup(this);
  }
}

Powerup.types = {
  speed: 0,
  //size: 1,
  heavy: 1
};
Object.seal(Powerup.types);

Powerup.templates = {};

// speed up
Powerup.templates[Powerup.types.speed] =
  new Powerup(Powerup.types.speed, (_me, _player) => {
    const me = _me; const player = _player;
    me.cache.speed = player.speed;
    player.speed = 10;
  }, (me, _player) => {
    const player = _player;
    player.speed = me.cache.speed;
  }, 5000);

// // make bigger
// Powerup.templates[Powerup.types.size] =
//   new Powerup(Powerup.types.size, (_me, player) => {
//     const me = _me;
//     me.cache.scale = player.gameObject.scale.clone();
//     player.gameObject.scale.set(5, 5, 5);
//   }, (me, _player) => {
//     const player = _player;
//     player.gameObject.scale.set(me.cache.scale.x, me.cache.scale.y, me.cache.scale.z);
//   }, 2000);

// weight up
Powerup.templates[Powerup.types.heavy] =
  new Powerup(Powerup.types.heavy, (_me, _player) => {
    const me = Powerup.templates[_me.type]; const player = _player;
    //me.cache.speed = me.cache.speed || player.speed;
    player.gameObject.mass = 10;
  }, (_me, _player) => {
    const me = Powerup.templates[_me.type]; const player = _player;
    //player.speed = me.cache.speed;
    player.gameObject.mass = 1;
    //me.cache.speed = null;
  }, 5000);

Object.seal(Powerup.templates);