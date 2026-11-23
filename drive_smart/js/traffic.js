/**
 * DRIVE SMART - Traffic Light, Pedestrian, and AI Traffic Engine
 * Implements interactive traffic signals with violation triggers,
 * animated pedestrians on zebra crossings, and rule-following AI traffic.
 */

class TrafficLight {
    constructor(scene, x, z, rotation = 0, initialPhase = 'green') {
        this.scene = scene;
        this.position = new THREE.Vector3(x, 0, z);
        this.rotation = rotation;
        this.phase = initialPhase; // 'green', 'amber', 'red'
        this.timer = 0;

        // Phase Durations (seconds)
        this.greenDuration = 10.0;
        this.amberDuration = 3.0;
        this.redDuration = 8.0;

        // Visual Materials
        this.redMat = null;
        this.amberMat = null;
        this.greenMat = null;

        // Trigger Stop Line
        this.stopLineZ = z;
        this.stopLineX = x;

        this.group = new THREE.Group();
        this._build();
        this.scene.add(this.group);
    }

    _build() {
        // Mast & Post
        const postGeo = new THREE.CylinderGeometry(0.12, 0.14, 5.5, 12);
        const postMat = new THREE.MeshStandardMaterial({ color: 0x22262a, metalness: 0.8 });
        const post = new THREE.Mesh(postGeo, postMat);
        post.position.y = 2.75;
        this.group.add(post);

        // Horizontal Arm over road
        const armGeo = new THREE.CylinderGeometry(0.09, 0.09, 3.8, 10);
        armGeo.rotateZ(Math.PI / 2);
        const arm = new THREE.Mesh(armGeo, postMat);
        arm.position.set(1.9, 5.2, 0);
        this.group.add(arm);

        // Signal Housing Box
        const boxGeo = new THREE.BoxGeometry(0.5, 1.35, 0.4);
        const boxMat = new THREE.MeshStandardMaterial({ color: 0x111315, roughness: 0.9 });
        const box = new THREE.Mesh(boxGeo, boxMat);
        box.position.set(3.4, 4.6, 0);
        this.group.add(box);

        // 3 Signal Lenses (Red, Amber, Green)
        const lensGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.06, 16);
        lensGeo.rotateX(Math.PI / 2);

        this.redMat = new THREE.MeshStandardMaterial({ color: 0x330000, emissive: 0xff0000, emissiveIntensity: 0.1 });
        const redLens = new THREE.Mesh(lensGeo, this.redMat);
        redLens.position.set(3.4, 4.95, 0.21);
        this.group.add(redLens);

        this.amberMat = new THREE.MeshStandardMaterial({ color: 0x332200, emissive: 0xffaa00, emissiveIntensity: 0.1 });
        const amberLens = new THREE.Mesh(lensGeo, this.amberMat);
        amberLens.position.set(3.4, 4.6, 0.21);
        this.group.add(amberLens);

        this.greenMat = new THREE.MeshStandardMaterial({ color: 0x003300, emissive: 0x00ff44, emissiveIntensity: 0.1 });
        const greenLens = new THREE.Mesh(lensGeo, this.greenMat);
        greenLens.position.set(3.4, 4.25, 0.21);
        this.group.add(greenLens);

        this.group.position.copy(this.position);
        this.group.rotation.y = this.rotation;

        this._updateLenses();
    }

    _updateLenses() {
        if (!this.redMat || !this.amberMat || !this.greenMat) return;
        this.redMat.emissiveIntensity = (this.phase === 'red') ? 2.2 : 0.08;
        this.amberMat.emissiveIntensity = (this.phase === 'amber') ? 2.2 : 0.08;
        this.greenMat.emissiveIntensity = (this.phase === 'green') ? 2.2 : 0.08;
    }

    update(dt) {
        this.timer += dt;
        if (this.phase === 'green' && this.timer >= this.greenDuration) {
            this.phase = 'amber';
            this.timer = 0;
            this._updateLenses();
        } else if (this.phase === 'amber' && this.timer >= this.amberDuration) {
            this.phase = 'red';
            this.timer = 0;
            this._updateLenses();
        } else if (this.phase === 'red' && this.timer >= this.redDuration) {
            this.phase = 'green';
            this.timer = 0;
            this._updateLenses();
        }
    }

    isRed() {
        return this.phase === 'red';
    }

    destroy() {
        this.scene.remove(this.group);
    }
}

class AnimatedPedestrian {
    constructor(scene, startX, startZ, endX, endZ, speed = 1.6) {
        this.scene = scene;
        this.start = new THREE.Vector3(startX, 0, startZ);
        this.end = new THREE.Vector3(endX, 0, endZ);
        this.position = this.start.clone();
        this.speed = speed;
        this.direction = 1; // 1: forward to end, -1: back to start
        this.isYielded = false;

        this.group = new THREE.Group();
        this.leftLeg = null;
        this.rightLeg = null;
        this.leftArm = null;
        this.rightArm = null;
        this.walkCycle = Math.random() * Math.PI * 2;

        this._build();
        this.scene.add(this.group);
    }

    _build() {
        // Head
        const headGeo = new THREE.SphereGeometry(0.16, 12, 12);
        const skinMat = new THREE.MeshStandardMaterial({ color: 0xd49b73, roughness: 0.8 });
        const head = new THREE.Mesh(headGeo, skinMat);
        head.position.y = 1.62;
        head.castShadow = true;
        this.group.add(head);

        // Torso / Shirt
        const shirtMat = new THREE.MeshStandardMaterial({
            color: Math.random() > 0.5 ? 0x2563eb : 0xd97706,
            roughness: 0.7
        });
        const torsoGeo = new THREE.BoxGeometry(0.38, 0.55, 0.22);
        const torso = new THREE.Mesh(torsoGeo, shirtMat);
        torso.position.y = 1.25;
        torso.castShadow = true;
        this.group.add(torso);

        // Legs (Pants)
        const pantsMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });
        const legGeo = new THREE.BoxGeometry(0.14, 0.72, 0.16);
        legGeo.translate(0, -0.36, 0);

        this.leftLeg = new THREE.Mesh(legGeo, pantsMat);
        this.leftLeg.position.set(-0.11, 0.85, 0);
        this.leftLeg.castShadow = true;
        this.group.add(this.leftLeg);

        this.rightLeg = new THREE.Mesh(legGeo, pantsMat);
        this.rightLeg.position.set(0.11, 0.85, 0);
        this.rightLeg.castShadow = true;
        this.group.add(this.rightLeg);

        // Arms
        const armGeo = new THREE.BoxGeometry(0.1, 0.52, 0.12);
        armGeo.translate(0, -0.26, 0);

        this.leftArm = new THREE.Mesh(armGeo, shirtMat);
        this.leftArm.position.set(-0.24, 1.45, 0);
        this.group.add(this.leftArm);

        this.rightArm = new THREE.Mesh(armGeo, shirtMat);
        this.rightArm.position.set(0.24, 1.45, 0);
        this.group.add(this.rightArm);

        this.group.position.copy(this.position);
    }

    update(dt) {
        // Move along path
        const target = this.direction === 1 ? this.end : this.start;
        const diff = target.clone().sub(this.position);
        const dist = diff.length();

        if (dist < 0.2) {
            // Reached destination, turn back
            this.direction *= -1;
        } else {
            const moveStep = Math.min(dist, this.speed * dt);
            const moveVec = diff.normalize().multiplyScalar(moveStep);
            this.position.add(moveVec);
            this.group.position.copy(this.position);

            // Face travel direction
            this.group.rotation.y = Math.atan2(diff.x, diff.z);

            // Animate walking limbs
            this.walkCycle += dt * 7.0;
            const legAngle = Math.sin(this.walkCycle) * 0.45;
            this.leftLeg.rotation.x = legAngle;
            this.rightLeg.rotation.x = -legAngle;
            this.leftArm.rotation.x = -legAngle;
            this.rightArm.rotation.x = legAngle;
        }
    }

    destroy() {
        this.scene.remove(this.group);
    }
}

class AITrafficCar {
    constructor(scene, waypoints, speed = 8.5, color = '#2563eb') {
        this.scene = scene;
        this.waypoints = waypoints; // Array of THREE.Vector3
        this.currentWpIndex = 0;
        this.speed = speed;
        this.targetSpeed = speed;
        this.isStopped = false;

        this.carModel = new CarModel('sedan', color);
        this.position = waypoints[0].clone();
        this.heading = 0;

        this.carModel.group.position.copy(this.position);
        this.scene.add(this.carModel.group);
    }

    update(dt, playerPos, trafficLights = []) {
        if (this.waypoints.length === 0) return;

        const targetWp = this.waypoints[this.currentWpIndex];
        const toWp = targetWp.clone().sub(this.position);
        const distToWp = toWp.length();

        if (distToWp < 3.0) {
            this.currentWpIndex = (this.currentWpIndex + 1) % this.waypoints.length;
        }

        // Check if approaching a Red Traffic Light ahead
        let shouldStopForLight = false;
        trafficLights.forEach(tl => {
            if (tl.isRed()) {
                const distToLight = this.position.distanceTo(tl.position);
                if (distToLight < 16 && distToLight > 2) {
                    shouldStopForLight = true;
                }
            }
        });

        // Check if player vehicle is directly ahead
        let shouldStopForPlayer = false;
        if (playerPos) {
            const distToPlayer = this.position.distanceTo(playerPos);
            if (distToPlayer < 9.0) {
                // Vector dot product to check if player is ahead
                const forward = new THREE.Vector3(Math.sin(this.heading), 0, Math.cos(this.heading));
                const toPlayer = playerPos.clone().sub(this.position).normalize();
                if (forward.dot(toPlayer) > 0.6) {
                    shouldStopForPlayer = true;
                }
            }
        }

        // Speed adjustment
        if (shouldStopForLight || shouldStopForPlayer) {
            this.targetSpeed = 0;
            this.isStopped = true;
        } else {
            this.targetSpeed = this.speed;
            this.isStopped = false;
        }

        const currentSpd = THREE.MathUtils.lerp(this.isStopped ? 0 : this.speed, this.targetSpeed, dt * 3.0);

        // Steering towards target waypoint
        const targetHeading = Math.atan2(toWp.x, toWp.z);
        // Shortest angle difference
        let angleDiff = targetHeading - this.heading;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

        this.heading += angleDiff * Math.min(1.0, dt * 2.8);
        this.heading = (this.heading + Math.PI * 2) % (Math.PI * 2);

        // Move forward
        const forward = new THREE.Vector3(Math.sin(this.heading), 0, Math.cos(this.heading));
        this.position.add(forward.multiplyScalar(currentSpd * dt));

        this.carModel.group.position.copy(this.position);
        this.carModel.group.rotation.y = this.heading;
        this.carModel.update(currentSpd, angleDiff, this.isStopped, false, 'none', false);
    }

    destroy() {
        this.scene.remove(this.carModel.group);
    }
}

window.TrafficLight = TrafficLight;
window.AnimatedPedestrian = AnimatedPedestrian;
window.AITrafficCar = AITrafficCar;
