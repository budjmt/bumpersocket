
const clear = () => {
  scene.reset && scene.reset();
  camera.position.set(0, 0, 5);
  camera.rotation.set(0, 0, 0);
  scene = Scene.base;
};

const cubeSetup = () => {
  const cubeS = new Physijs.Scene();
  const cube = new Physijs.BoxMesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshPhongMaterial({
          color: 0x00ffee,
          emissive: 0x553333,
        }),
        0 // mass
    );

  const light = new THREE.DirectionalLight(0xffffff, 1.0);
  light.position.set(1, 2, 3);
  light.rotation.set(-Math.PI / 4, Math.PI / 4, 0);
  cubeS.add(cube);
  cubeS.add(light);

  const magenta = new THREE.Color(0xff0066);
  const cyan = new THREE.Color(0x00ffee);
  const green = new THREE.Color(0x00ffaa);

  const s = new Scene(cubeS);
  s.reset = () => {
    cube.position.set(0, 0, 0);
    cube.rotation.set(Math.PI / 18, Math.PI * 0.25, 0);
    cube.__dirtyPosition = true;
    cube.__dirtyRotation = true;
  };
  s.reset();
  s.update = (dt) => {
    cube.rotation.y -= 0.5 * dt;

    const mousePoint = mouseWorldCoords(cube.position.z);
    if (mouseCast(cube).length) {
      cube.material.color = magenta;
    }		else cube.material.color = cyan;

    if (uniforms.mouseDown > 0) {
      cube.material.color = green;
      cube.position.lerp(mousePoint, 2 * dt);
    }

    cube.__dirtyRotation = cube.__dirtyPosition = true;
  };
  return s;
};

const cubeScene = cubeSetup();
const basicCube = () => scene = cubeScene;

const basicGameSetup = () => {
  const gameS = new Physijs.Scene();
  gameS.setGravity(new THREE.Vector3( 0, -9.8, 0 ));
  const ground = new Physijs.BoxMesh(
        new THREE.CubeGeometry(20, 20, 1),
        Physijs.createMaterial(new THREE.MeshPhongMaterial({
          color: 0x000000,
          emissive: 0x553333,
        }), 0.8, 0.7),
        0 // mass
    );
  ground.rotation.set(Math.PI / 2, 0, 0);
  gameS.add(ground);

  const light = new THREE.DirectionalLight(0xffffff, 1.0);
  light.position.set(5, 4, 3);
  light.rotation.set(-Math.PI / 2, Math.PI / 2, 0);
  gameS.add(light);

  const s = new Scene(gameS);
  s.reset = () => {};
  s.reset();
  s.update = (dt) => {};
  return s;
};

const basicGameScene = basicGameSetup();
const basicGame = () => scene = basicGameScene;
