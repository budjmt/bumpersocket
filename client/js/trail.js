
// simple class that keeps track of a trail behind a game object
// mesh is the trail object
// length is the number of trail objects in the trail
// lifetime is how long any given trail object will remain visible
// update is called after each render; takes the trail instance and a t parameter for lerping
// reset is called when a trail object reappears; takes the trail instance that must be reset
class Trail {
    constructor(mesh, length, lifetime, update, reset) {
        this.meshCache = new Array(length);
        this.lastIndex = 0;
        this.lifetime = lifetime;
        
        const def = () => {};
        this.customUpdate = update || def;
        this.reset = reset || def;
        
        for(let i = 0; i < length; ++i) {
            let curr = mesh.clone();
            curr.visible = false;
            this.meshCache[i] = curr;
        }
    }

    addToScene(scene) {
        this.meshCache.forEach(mesh => scene.add(mesh));
    }

    removeFromScene(scene) {
        this.meshCache.forEach(mesh => scene.remove(mesh));
    }

    // parent is the game object that is being "trailed"
    // position is a custom spawn location, if needed
    // at least one must be defined
    update(parent, position) {
        let curr = this.meshCache[this.lastIndex++];
        this.lastIndex %= this.meshCache.length;
        
        this.reset(curr);
        let pos = position || parent.position;
        curr.position.set(pos.x, pos.y, pos.z);
        curr.liveTime = new Date().getTime();
        curr.onAfterRender = () => {
            let elapsed = new Date().getTime() - curr.liveTime;
            if(elapsed > this.lifetime) {
                curr.visible = false;
                curr.onAfterRender = null;
            } else {
                this.customUpdate(curr, elapsed / this.lifetime, parent);
            }
        };
        curr.visible = true;
    }
};