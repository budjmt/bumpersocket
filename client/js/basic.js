
const lerp = (a, b, t) => (1 - t) * a + t * b;

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

const setupStatics = () => {
  Scene.base = (() => {
    const s = new Scene(new Physijs.Scene());
		// defines fall-off fog; exponential and off-white, from 0.5 to 10
		// s.scene.fog = new THREE.FogExp2(0xEEEEEE, 3, 10);
    return s;
  })();

  Player.CollideTrail = Player.genCollideTrail();

  const loader = new THREE.TextureLoader();  
  Powerup.templates[Powerup.types.speed].texture = "media/shoe.png";
  Powerup.templates[Powerup.types.heavy].texture = "media/weight.png";
  Object.keys(Powerup.templates).forEach(pow => {
    const p = Powerup.templates[pow];
    loader.load(p.texture, (tex) => p.texture = tex);
  })
};

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

  setupStatics();

  canvas = document.querySelector('canvas');
	// canvas.width  = initWidth;
	// canvas.height = initHeight;
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(1);
  renderer.setSize(width(), height(), false);
	// renderer.setViewport(0, 0, initWidth, initHeight);
  renderer.setClearColor(0xFFFFFF, 1);
	renderer.shadowMap.enabled = true;

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
