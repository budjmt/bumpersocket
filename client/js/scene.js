
const init = () => {
    
};

const clear = () => {
    scene.reset && scene.reset();
    camera.position.set(0,0,5);
    camera.rotation.set(0,0,0);
    scene = Scene.base;
}

const cubeSetup = () => {
    let cubeS = new Physijs.Scene();
    let cube = new Physijs.BoxMesh(
        new THREE.BoxGeometry(1,1,1),
        new THREE.MeshPhongMaterial({ 
            color: 0x00ffee,
            emissive: 0x553333
        }), 
        0 // mass
    );
    
    let light = new THREE.DirectionalLight(0xffffff,1.0);
    light.position.set(1,2,3);
    light.rotation.set(-45,45,0);
    cubeS.add(cube);
    cubeS.add(light);
	
	const magenta = new THREE.Color(0xff0066);
	const cyan    = new THREE.Color(0x00ffee);
	const green   = new THREE.Color(0x00ffaa);
	
    let s = new Scene();
    s.scene = cubeS;
    s.reset = () => { 
        cube.position.set(0,0,0); 
        cube.rotation.set(10,45,0); 
        cube.__dirtyPosition = true;
        cube.__dirtyRotation = true;
    };
    s.reset();
    s.update = (dt) => {
        cube.rotation.y -= 0.5 * dt;

		let mousePoint = mouseWorldCoords(cube.position.z);
		if(mouseCast(cube).length) {
			cube.material.color = magenta;
		}
		else cube.material.color = cyan;
        
		if(uniforms.mouseDown > 0) {
			cube.material.color = green;
			cube.position.lerp(mousePoint,2*dt);
		}

        cube.__dirtyRotation = cube.__dirtyPosition = true;
    };
    return s;
};

const cubeScene = cubeSetup();
const basicCube = () => { scene = cubeScene; };