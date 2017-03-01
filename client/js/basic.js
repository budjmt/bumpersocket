
class Uniform {
	constructor(typeStr) {
		this.type = typeStr;
		switch(this.type) {
			case 'f':  this.value = 0; break;
			case 'v2': this.value = new THREE.Vector2; break;
			case 'v3': this.value = new THREE.Vector3; break;
			case 'v4': this.value = new THREE.Vector4; break;
		}
	}
};

class Scene {
    constructor(scene) {
        this.scene = scene;
        this.update = undefined;
        this.reset = undefined;
    }

    render() {
        requestAnimationFrame(render);
    
        dt = clock.getDelta();
        if(this.scene.update) this.scene.update(dt);
        this.scene.simulate();
    
        uniforms.time.value += dt;
        renderer.render(this.scene, camera);
    }
};

let canvas;
let camera, renderer, raycaster;
let uniforms, clock, dt = 0;

let scene;

const width  = () => window.innerWidth  * 0.65;
const height = () => window.innerHeight * 0.65;

const render = () => scene.render();

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
	
const resize = () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(width(), height(), false);
    //renderer.setViewport(0, 0, window.innerWidth, window.innerHeight);
};
window.addEventListener('resize', resize);

window.addEventListener('load', () => {
	const initWidth  = window.innerWidth;
	const initHeight = window.innerHeight;

	Scene.base = (() => { 
		const s = new Scene(new Physijs.Scene());
		//defines fall-off fog; exponential and off-white, from 0.5 to 10
		//s.scene.fog = new THREE.FogExp2(0xEEEEEE, 3, 10);
		return s;
	})();

	canvas = document.querySelector('canvas');
	//canvas.width  = initWidth;
	//canvas.height = initHeight;
	renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
	renderer.setPixelRatio(1);
	renderer.setSize(width(), height(), false);
	//renderer.setViewport(0, 0, initWidth, initHeight);
	renderer.setClearColor(0xFFFFFF, 1);
	//renderer.shadowMapEnabled = true;
		
	uniforms = {
		time : new Uniform('f'),
		mouse: new Uniform('v2'),
		mouseDown: new Uniform('f'),
		resolution: new Uniform('v2')
	};
		
	raycaster = new THREE.Raycaster();
	clock = new THREE.Clock(true);

	scene = Scene.base;

	//fov, aspect, near, far
	camera = new THREE.PerspectiveCamera(75, initWidth / initHeight, 0.1, 1000);
	camera.position.z = 5;

	requestAnimationFrame(render);
});

const mouseWorldCoords = (zDepth) => {
	const mouseVec = new THREE.Vector3(
		 uniforms.mouse.x / window.innerWidth  * 2 - 1, 
		-uniforms.mouse.y / window.innerHeight * 2 + 1, 
		0.5
	);
	mouseVec.unproject(camera);
	
	const dir = mouseVec.sub(camera.position).normalize();
	const dist = (zDepth - camera.position.z) / dir.z;
	mouseVec = camera.position.clone().add(dir.multiplyScalar(dist));
	return mouseVec;
};

const mouseCast = (object) => {
	const mouseVec = new THREE.Vector2(
		 uniforms.mouse.x / window.innerWidth  * 2 - 1, 
		-uniforms.mouse.y / window.innerHeight * 2 + 1 
	);
	raycaster.setFromCamera(mouseVec, camera);
	return raycaster.intersectObject(object,true);
};