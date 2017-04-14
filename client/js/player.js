const players = {};
class Player {
  constructor(name, color, position) {
    this.name = name;
    this.color = color;
    
    let threeColor = new THREE.Color(this.color);
    let emissive = threeColor.r > threeColor.b ? 0x000022 : 0x220000;
    this.gameObject = new Physijs.SphereMesh(
      new THREE.SphereBufferGeometry(1, 64, 64),
      Physijs.createMaterial(
        new THREE.MeshPhongMaterial({
          color: color,
          emissive: emissive
        }), 0.8, 0.7)
    );
    this.gameObject.name = 'car';
    this.gameObject.castShadow = true;
    this.gameObject.receiveShadow = true;
    this.gameObject.position.set(position.x, position.y, position.z);
    this.gameObject.addEventListener('collision', this.onCollision.bind(this));

    this.score = this.genScore(name, threeColor.getStyle());

    threeColor.offsetHSL(0, 0.1, 0.2);
    this.trail = new Trail((() => {
        const trailMesh = new THREE.Mesh(
        new THREE.CircleBufferGeometry(0.9),
        new THREE.MeshBasicMaterial({
          color: threeColor,
          transparent: true,
          opacity: 1
        })
      );
      trailMesh.rotation.set(-Math.PI / 2, 0, 0);
      return trailMesh;
    })(), 50, 500, (me, t) => {
      const fromScale = new THREE.Vector3(0.9,0.9,0.9);
      const toScale = new THREE.Vector3(0.05,0.05,0.05);
      fromScale.lerp(toScale, t);
      me.scale.set(fromScale.x, fromScale.y, fromScale.z);
      //me.material.opacity = lerp(1, 0.1, t);
    }, (me) => {
      me.scale.set(0.9, 0.9, 0.9);
      //me.material.opacity = 1;
    });

    this.direction = new THREE.Vector3(0, 0, 0);
    this.speed = 1.25;

    this.lastUpdate = new Date().getTime();
    this.customUpdate = null;
    this.nextState = null;
  }

  get linearVel() { return this.gameObject.getLinearVelocity(); }
  set linearVel(val) { this.gameObject.setLinearVelocity(val); }

  get angularVel() { return this.gameObject.getAngularVelocity(); }
  set angularVel(val) { this.gameObject.setAngularVelocity(val); }

  // color should be a css style
  genScore(name, color) {
    let scoreDisplay = new Display('tr', null, function(score) {
      const delta = score - this.value;
      if(delta === 0) return;
      this.value = score;
      this.display.update(this.value, delta);
    }, (el) => {
      el.innerHTML = `<th>${name}<div class="scoreColor" style="background-color: ${color}"></div></th><td class="display"></td>`;
    });
    scoreDisplay.value = 0;

    scoreDisplay.display = new Display(scoreDisplay.element.querySelector('.display'), null, function(score, delta) {
      this.element.innerHTML = score;
      this.change.update(delta);
    }, (el) => {
      el.innerHTML = scoreDisplay.value;
    });
    
    scoreDisplay.display.change = new Display('span', scoreDisplay.element, function(delta) {
        let sign = {};
        if(delta > 0) { sign.punc = '+'; sign.color = 'green'; }
        else { sign.punc = '-'; sign.color = 'red'; }
        this.element.innerHTML = `${sign.punc}${Math.abs(delta).toString()}`;
        this.element.style.color = sign.color;
        this.element.style.opacity = 1;
        this.element.style.top = '0px';
        window.clearTimeout(this.timeout);
        this.timeout = window.setTimeout(() => {
          this.element.style.opacity = 0;
          this.element.style.top = '-20px';
        }, 500);
    }, (el) => {
      el.style.transition = 'all 0.2s';
      el.style.display = 'inline-block';
      el.style.position = 'relative';
      el.style.left = '10px';
    });

    return scoreDisplay;
  }

  instantiate(scoreBoard) {
    if (this.added) return;
    scene.scene.add(this.gameObject);
    this.trail.addToScene(scene.scene);
    players[this.name] = this;
    this.added = true;

    this.score.setParent(scoreBoard || document.querySelector('#scores'));
  }

  destroy(scoreBoard) {
    if (!this.added) return;
    scene.scene.remove(this.gameObject);
    this.trail.removeFromScene(scene.scene);
    delete players[this.name];
    this.added = false;

    this.score.parent.removeChild(this.score.element);
    this.score = null;
  }

  get packet() {
    return {
      name: this.name,
      color: this.color,
      score: this.score.value,
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
    let av = this.angularVel.multiplyScalar(0.8 / this.speed);
    if(av.length() < 0.001) av.set(0, 0, 0);
    this.angularVel = av;
  }

  update() {
    this.direction.multiplyScalar(this.speed);
    this.gameObject.applyCentralForce(this.direction);
    if(this.direction.length() === 0) this.applyFriction();
    this.direction.set(0, 0, 0);
    
    this.adjustState();
    if(this.customUpdate) this.customUpdate();
    this.trail.update(this.gameObject);
  }

  onCollision(other, relVel, relRot, contactNormal) {
    // check if other object is a player
    if(other.name === 'car') {
      let v = contactNormal;
      v.setLength(20);
      other.applyCentralForce(v);
    }
  }

  updateDirection(input) {
    this.direction.set(input.direction.x, input.direction.y, input.direction.z);
  }

  static genCollideTrail() {
    return new Trail((() => {
      const trailMesh = new THREE.Mesh(
        new THREE.CircleBufferGeometry(0.9),
        new THREE.MeshBasicMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 1
        })
      );
      trailMesh.rotation.set(-Math.PI / 2, 0, 0);
      return trailMesh;
    })(), 20, 500, (me, t) => {
      //console.log('hi');
      me.material.opacity = lerp(1, 0, t);
    }, (me) => {
      me.material.opacity = 1;
    });
  }
}