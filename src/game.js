const NodePhysijs = require('nodejs-physijs');
const THREE = NodePhysijs.THREE;
const Physijs = NodePhysijs.Physijs(THREE, NodePhysijs.Ammo);

const scene = new Physijs.Scene;
scene.add(new Physijs.BoxMesh(
    new THREE.BoxGeometry(20, 20, 1),
    new THREE.MeshBasicMaterial(),
    0 // mass
));
scene.addEventListener('update', () => {
    players.forEach(player => player.update());
});

const players = {};

class Player {
    constructor(name, position) {
        this.name = name;
        this.gameObject = new Physijs.BoxMesh(
            new THREE.BoxGeometry(1, 1, 1),
            new THREE.MeshBasicMaterial()
        );
        this.gameObject.position.set(position);
        this.gameObject.addEventListener('collision', this.onCollision.bind(this));
        this.direction = new THREE.Vector3(0, 0, 0);
    }

    create() {
        if(this.added) return;
        scene.add(this.gameObject);
        players[this.name] = this;
        this.added = true;
    }

    destroy() {
        if(!this.added) return;
        scene.remove(this.gameObject);
        delete players[this.name];
        this.added = false;
    }

    update() {
        this.gameObject.applyCentralForce(this.direction);
    }

    onCollision(other, relVel, relRot, contactNormal) {
        // if the other object is a player
        if(other.name) {
            
        }
    }

    updateDirection(input) {
        this.direction = input.direction;
    }
}

module.exports.players = players;
module.exports.Player = Player;