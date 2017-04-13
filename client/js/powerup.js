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
      id: this.type,
      type: this.type,
      position: this.gameObject.position,
    };
  }

  static instance(type) {
    const p = Powerup.templates[type];
    return new Powerup(p.type, p.effect, p.reset, p.period);
  }

  instantiate(position) {
    this.scene = scene;
    this.gameObject = new Physijs.BoxMesh(
      new THREE.PlaneGeometry(0.5, 0.5),
      new THREE.MeshBasicMaterial(), 0);
    this.gameObject.name = 'powerup';
    this.gameObject.position = position;
    this.gameObject.logic = this;
    this.scene.addPowerup(this);
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
  size: 1,
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
  }, 2000);

// make bigger
Powerup.templates[Powerup.types.size] =
  new Powerup(Powerup.types.size, (_me, player) => {
    const me = _me;
    me.cache.scale = player.gameObject.scale.clone();
    player.gameObject.scale.set(5, 5, 5);
  }, (me, _player) => {
    const player = _player;
    player.gameObject.scale.set(me.cache.scale.x, me.cache.scale.y, me.cache.scale.z);
  }, 2000);

Object.seal(Powerup.templates);