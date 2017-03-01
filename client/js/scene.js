
const init = () => {
    
};

const clear = () => {
    scene.reset && scene.reset();
    camera.position.set(0,0,5);
    camera.rotation.set(0,0,0);
    scene = Scene.base;
}