
const aboutEqual = (a, b) => Math.abs(a - b) < 0.001;
const aboutEqual3 = (a, b) => aboutEqual(a.x, b.x) && aboutEqual(a.y, b.y) && aboutEqual(a.z, b.z);

class Uniform {
  constructor(typeStr) {
    this.type = typeStr;
    switch (this.type) {
      case 'f': this.value = 0; break;
      case 'v2': this.value = new THREE.Vector2(); break;
      case 'v3': this.value = new THREE.Vector3(); break;
      case 'v4': this.value = new THREE.Vector4(); break;
      default:
    }
  }
}

class Scene {
  constructor(scene) {
    this.scene = scene;
    this.update = undefined;
    this.reset = undefined;
	  this.scene.addEventListener('update', this.simulate.bind(this));
  }

  simulate() {
	  this.scene.simulate();
  }

  render() {
    requestAnimationFrame(render);

    dt = clock.getDelta();
    if (this.update) this.update(dt);

    uniforms.time.value += dt;
    renderer.render(this.scene, camera);
  }
}

const inputs = {};

const players = {};
class Player {
  constructor(name, color, position) {
    this.name = name;
    this.color = color;
    this.gameObject = new Physijs.SphereMesh(
      new THREE.SphereGeometry(1),
      Physijs.createMaterial(
        new THREE.MeshPhongMaterial({
          color: color,
          emissive: 0x222222
        }), 0.8, 0.7)
    );
    this.gameObject.name = 'car';
    this.gameObject.position.set(position.x, position.y, position.z);
    this.gameObject.addEventListener('collision', this.onCollision.bind(this));
    this.direction = new THREE.Vector3(0, 0, 0);
    this.lastUpdate = new Date().getTime();
    this.customUpdate = undefined;
    this.nextState = undefined;
    this.score = 0;
  }

  get linearVel() { return this.gameObject.getLinearVelocity(); }
  set linearVel(val) { this.gameObject.setLinearVelocity(val); }

  get angularVel() { return this.gameObject.getAngularVelocity(); }
  set angularVel(val) { this.gameObject.setAngularVelocity(val); }

  instantiate(scoreBoard) {
    if (this.added) return;
    scene.scene.add(this.gameObject);
    players[this.name] = this;
    this.added = true;
    
    this.scoreElement = document.createElement('li');
    this.scoreElement.innerHTML = `<p>${this.name}: <span class="display">${this.score}</span></p>`;
    this.scoreDisplay = this.scoreElement.querySelector('.display');
    scoreBoard = scoreBoard || document.querySelector('#scores');
    scoreBoard.appendChild(this.scoreElement);
  }

  destroy(scoreBoard) {
    if (!this.added) return;
    scene.scene.remove(this.gameObject);
    delete players[this.name];
    this.added = false;

    scoreBoard = scoreBoard || document.querySelector('#scores');
    scoreBoard.removeChild(this.scoreElement);
  }

  get packet() {
    return {
      name: this.name,
      color: this.color,
      score: this.score,
      position: this.gameObject.position,
      rotation: this.gameObject.quaternion
    };
  }

  adjustState() {
    if(!this.nextState) return;
    this.gameObject.position.lerp(this.nextState.position, 0.3);
    this.gameObject.quaternion.slerp(this.nextState.rotation, 0.3);
    this.gameObject.__dirtyPosition = this.gameObject.__dirtyRotation = true;
    if(new Date().getTime() - this.nextState.time > 50)
      this.nextState = null;
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
    this.adjustState();
    if(this.customUpdate) this.customUpdate();
  }

  onCollision(other, relVel, relRot, contactNormal) {
    // check if other object is a player
    if(other.name === 'car') {
      let v = contactNormal;
      v.setLength(20);
      other.applyCentralForce(v);
    }
  }

  updateScore(score) {
    this.score = score;
    this.scoreDisplay.innerHTML = this.score;
  }

  updateDirection(input) {
    this.direction.set(input.direction.x, input.direction.y, input.direction.z);
  }
}

let canvas;
let camera, renderer, raycaster;
let uniforms, clock, dt = 0;

let scene;

const width = () => window.innerWidth * 0.65;
const height = () => window.innerHeight * 0.65;

const render = () => scene.render();

const resize = () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(width(), height(), false);
    // renderer.setViewport(0, 0, window.innerWidth, window.innerHeight);
};

window.addEventListener('load', () => {
  const initWidth = window.innerWidth;
  const initHeight = window.innerHeight;

  Scene.base = (() => {
    const s = new Scene(new Physijs.Scene());
		// defines fall-off fog; exponential and off-white, from 0.5 to 10
		// s.scene.fog = new THREE.FogExp2(0xEEEEEE, 3, 10);
    return s;
  })();

  canvas = document.querySelector('canvas');
	// canvas.width  = initWidth;
	// canvas.height = initHeight;
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(1);
  renderer.setSize(width(), height(), false);
	// renderer.setViewport(0, 0, initWidth, initHeight);
  renderer.setClearColor(0xFFFFFF, 1);
	// renderer.shadowMapEnabled = true;

  uniforms = {
    time: new Uniform('f'),
    mouse: new Uniform('v2'),
    mouseDown: new Uniform('f'),
    resolution: new Uniform('v2'),
  };

  window.addEventListener('mousemove', (event) => {
    uniforms.mouse.x = event.clientX;
    uniforms.mouse.y = event.clientY;
  });
  window.addEventListener('mousedown', (event) => {
    uniforms.mouseDown += dt;
  });
  window.addEventListener('mouseup', (event) => {
    uniforms.mouseDown = 0;
  });

  raycaster = new THREE.Raycaster();
  clock = new THREE.Clock(true);

  scene = Scene.base;
  scene = basicGameScene;

	// fov, aspect, near, far
  camera = new THREE.PerspectiveCamera(75, initWidth / initHeight, 0.1, 1000);
  camera.position.set(0, 15, 0);
  camera.rotation.set(-Math.PI / 2, 0, 0);

  window.addEventListener('resize', resize);

  requestAnimationFrame(render);
  scene.simulate();
});

const mouseWorldCoords = (zDepth) => {
  const mouseVec = new THREE.Vector3(
		 uniforms.mouse.x / window.innerWidth * 2 - 1,
		-uniforms.mouse.y / window.innerHeight * 2 + 1,
		0.5
	);
  mouseVec.unproject(camera);

  const dir = mouseVec.sub(camera.position).normalize();
  const dist = (zDepth - camera.position.z) / dir.z;

  return camera.position.clone().add(dir.multiplyScalar(dist));
};

const mouseCast = (object) => {
  const mouseVec = new THREE.Vector2(
		 uniforms.mouse.x / window.innerWidth * 2 - 1,
		-uniforms.mouse.y / window.innerHeight * 2 + 1
	);
  raycaster.setFromCamera(mouseVec, camera);
  return raycaster.intersectObject(object, true);
};
