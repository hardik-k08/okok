/**
 * DRIVE SMART - AI Traffic Simulation Engine
 * Simulates multiple realistic vehicles: Auto-rickshaws, city buses,
 * trucks, sedans, and motorcycles following road waypoints,
 * stopping at red lights, and maintaining safe distances.
 */

class AITrafficManager {
    constructor(scene) {
        this.scene = scene;
        this.vehicles = [];

        this._spawnFleet();
    }

    _spawnFleet() {
        // Waypoint Loop A: South Avenue -> Roundabout -> North Boulevard -> East Loop
        const loopA = [
            new THREE.Vector3(-3.5, 0, -120),
            new THREE.Vector3(-3.5, 0, 50),
            // Roundabout entrance & curve
            new THREE.Vector3(-14, 0, 85),
            new THREE.Vector3(-18, 0, 100),
            new THREE.Vector3(-14, 0, 115),
            new THREE.Vector3(-3.5, 0, 126),
            // North Boulevard
            new THREE.Vector3(-3.5, 0, 240),
            // North Intersection turn to East Loop
            new THREE.Vector3(15, 0, 270),
            new THREE.Vector3(120, 0, 250),
            new THREE.Vector3(120, 0, 150),
            new THREE.Vector3(120, 0, 100),
            new THREE.Vector3(45, 0, 100),
            new THREE.Vector3(14, 0, 85),
            new THREE.Vector3(-3.5, 0, 60),
            new THREE.Vector3(-3.5, 0, -50)
        ];

        // Waypoint Loop B: Oncoming traffic (opposite lane X = +3.5 traveling south)
        const loopB = [
            new THREE.Vector3(3.5, 0, 260),
            new THREE.Vector3(3.5, 0, 130),
            new THREE.Vector3(14, 0, 115),
            new THREE.Vector3(18, 0, 100),
            new THREE.Vector3(14, 0, 85),
            new THREE.Vector3(3.5, 0, 70),
            new THREE.Vector3(3.5, 0, -140),
            new THREE.Vector3(-3.5, 0, -150)
        ];

        // 1. Iconic Indian Auto-Rickshaw (Yellow & Green)
        this.vehicles.push(new AIVehicle(this.scene, 'rickshaw', loopA, 0, 7.5, '#eab308'));

        // 2. City Transit Bus (Red & White)
        this.vehicles.push(new AIVehicle(this.scene, 'bus', loopA, 4, 6.8, '#dc2626'));

        // 3. Family Sedan (Pearl White)
        this.vehicles.push(new AIVehicle(this.scene, 'sedan', loopA, 8, 9.0, '#f8fafc'));

        // 4. Commercial Cargo Truck
        this.vehicles.push(new AIVehicle(this.scene, 'truck', loopB, 0, 7.0, '#2563eb'));

        // 5. Oncoming Auto-Rickshaw
        this.vehicles.push(new AIVehicle(this.scene, 'rickshaw', loopB, 3, 7.5, '#16a34a'));

        // 6. Commuter Motorcycle / Scooter
        this.vehicles.push(new AIVehicle(this.scene, 'motorcycle', loopB, 5, 8.5, '#0f172a'));
    }

    update(dt, playerPos, isRedLight) {
        this.vehicles.forEach(v => {
            // Check other AI vehicles ahead for collision avoidance
            let vehicleAhead = false;
            this.vehicles.forEach(other => {
                if (other !== v) {
                    const d = v.position.distanceTo(other.position);
                    if (d < 11.0) {
                        const forward = new THREE.Vector3(Math.sin(v.heading), 0, Math.cos(v.heading));
                        const toOther = other.position.clone().sub(v.position).normalize();
                        if (forward.dot(toOther) > 0.65) {
                            vehicleAhead = true;
                        }
                    }
                }
            });

            // Check if player vehicle is directly ahead
            if (playerPos) {
                const dPlayer = v.position.distanceTo(playerPos);
                if (dPlayer < 10.0) {
                    const forward = new THREE.Vector3(Math.sin(v.heading), 0, Math.cos(v.heading));
                    const toPlayer = playerPos.clone().sub(v.position).normalize();
                    if (forward.dot(toPlayer) > 0.65) {
                        vehicleAhead = true;
                    }
                }
            }

            // Check if approaching red light near North Intersection (z: 250 to 265)
            let stopForLight = false;
            if (isRedLight && v.position.z > 245 && v.position.z < 268) {
                stopForLight = true;
            }

            v.update(dt, vehicleAhead || stopForLight);
        });
    }
}

class AIVehicle {
    constructor(scene, type, waypoints, startWpIdx, maxSpeed, colorHex) {
        this.scene = scene;
        this.type = type;
        this.waypoints = waypoints;
        this.currentWpIdx = startWpIdx;
        this.maxSpeed = maxSpeed; // m/s
        this.currentSpeed = maxSpeed;
        this.heading = 0;
        this.position = waypoints[startWpIdx].clone();

        this.group = new THREE.Group();
        this._buildModel(type, colorHex);
        this.group.position.copy(this.position);
        this.scene.add(this.group);
    }

    _buildModel(type, colorHex) {
        if (type === 'rickshaw') {
            // Indian Auto-Rickshaw (Yellow upper, Green lower, 3 wheels)
            const bodyLower = new THREE.Mesh(
                new THREE.BoxGeometry(1.4, 0.7, 2.4),
                new THREE.MeshLambertMaterial({ color: 0x16a34a }) // Green
            );
            bodyLower.position.y = 0.55;
            this.group.add(bodyLower);

            const cabinUpper = new THREE.Mesh(
                new THREE.BoxGeometry(1.3, 0.85, 1.8),
                new THREE.MeshLambertMaterial({ color: 0xfacc15 }) // Yellow
            );
            cabinUpper.position.set(0, 1.3, -0.1);
            this.group.add(cabinUpper);

            const roof = new THREE.Mesh(
                new THREE.BoxGeometry(1.35, 0.15, 2.2),
                new THREE.MeshLambertMaterial({ color: 0x1e293b }) // Black canvas roof
            );
            roof.position.set(0, 1.8, -0.05);
            this.group.add(roof);

            // Front single wheel
            const wFront = new THREE.Mesh(
                new THREE.CylinderGeometry(0.24, 0.24, 0.16, 12),
                new THREE.MeshLambertMaterial({ color: 0x111111 })
            );
            wFront.rotation.z = Math.PI / 2;
            wFront.position.set(0, 0.24, 1.1);
            this.group.add(wFront);

            // Rear dual wheels
            const wRL = wFront.clone();
            wRL.position.set(-0.7, 0.24, -0.8);
            this.group.add(wRL);
            const wRR = wFront.clone();
            wRR.position.set(0.7, 0.24, -0.8);
            this.group.add(wRR);

        } else if (type === 'bus') {
            // City Transit Bus
            const busBody = new THREE.Mesh(
                new THREE.BoxGeometry(2.4, 2.6, 8.5),
                new THREE.MeshLambertMaterial({ color: colorHex })
            );
            busBody.position.y = 1.6;
            this.group.add(busBody);

            // Window Glass strip
            const glass = new THREE.Mesh(
                new THREE.BoxGeometry(2.45, 0.9, 7.8),
                new THREE.MeshLambertMaterial({ color: 0x1e293b })
            );
            glass.position.set(0, 2.1, 0);
            this.group.add(glass);

            // 4 Bus Wheels
            const wGeo = new THREE.CylinderGeometry(0.45, 0.45, 0.35, 14);
            wGeo.rotateZ(Math.PI / 2);
            const wMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
            [-1.25, 1.25].forEach(x => {
                [-2.6, 2.4].forEach(z => {
                    const w = new THREE.Mesh(wGeo, wMat);
                    w.position.set(x, 0.45, z);
                    this.group.add(w);
                });
            });

        } else if (type === 'truck') {
            // Cargo Delivery Truck
            const cabin = new THREE.Mesh(
                new THREE.BoxGeometry(2.2, 2.2, 2.0),
                new THREE.MeshLambertMaterial({ color: 0x2563eb })
            );
            cabin.position.set(0, 1.4, 1.8);
            this.group.add(cabin);

            const cargo = new THREE.Mesh(
                new THREE.BoxGeometry(2.3, 2.5, 4.8),
                new THREE.MeshLambertMaterial({ color: 0xf59e0b }) // Yellow cargo box
            );
            cargo.position.set(0, 1.6, -1.6);
            this.group.add(cargo);

            // Wheels
            const wGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.32, 12);
            wGeo.rotateZ(Math.PI / 2);
            const wMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
            [-1.15, 1.15].forEach(x => {
                [-2.4, -0.8, 1.8].forEach(z => {
                    const w = new THREE.Mesh(wGeo, wMat);
                    w.position.set(x, 0.42, z);
                    this.group.add(w);
                });
            });

        } else if (type === 'motorcycle') {
            // Motorcycle / Scooter
            const body = new THREE.Mesh(
                new THREE.BoxGeometry(0.4, 0.7, 1.8),
                new THREE.MeshLambertMaterial({ color: colorHex })
            );
            body.position.y = 0.6;
            this.group.add(body);

            // Rider figure
            const rider = new THREE.Mesh(
                new THREE.BoxGeometry(0.45, 0.75, 0.35),
                new THREE.MeshLambertMaterial({ color: 0x334155 })
            );
            rider.position.set(0, 1.25, -0.1);
            this.group.add(rider);

            // Helmet
            const helmet = new THREE.Mesh(
                new THREE.SphereGeometry(0.2, 8, 8),
                new THREE.MeshLambertMaterial({ color: 0xd97706 })
            );
            helmet.position.set(0, 1.75, -0.1);
            this.group.add(helmet);

            // 2 Wheels
            const wGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.12, 12);
            wGeo.rotateZ(Math.PI / 2);
            const wMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
            const wF = new THREE.Mesh(wGeo, wMat);
            wF.position.set(0, 0.3, 0.8);
            this.group.add(wF);
            const wR = new THREE.Mesh(wGeo, wMat);
            wR.position.set(0, 0.3, -0.7);
            this.group.add(wR);

        } else {
            // Standard Sedan Car
            const body = new THREE.Mesh(
                new THREE.BoxGeometry(1.85, 0.65, 4.2),
                new THREE.MeshLambertMaterial({ color: colorHex })
            );
            body.position.y = 0.65;
            this.group.add(body);

            const cabin = new THREE.Mesh(
                new THREE.BoxGeometry(1.65, 0.65, 2.3),
                new THREE.MeshLambertMaterial({ color: 0x1e293b })
            );
            cabin.position.set(0, 1.25, -0.2);
            this.group.add(cabin);

            // 4 Wheels
            const wGeo = new THREE.CylinderGeometry(0.34, 0.34, 0.22, 12);
            wGeo.rotateZ(Math.PI / 2);
            const wMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
            [-0.95, 0.95].forEach(x => {
                [-1.3, 1.3].forEach(z => {
                    const w = new THREE.Mesh(wGeo, wMat);
                    w.position.set(x, 0.34, z);
                    this.group.add(w);
                });
            });
        }
    }

    update(dt, shouldStop) {
        // Target speed
        const targetSpeed = shouldStop ? 0 : this.maxSpeed;
        const accelRate = shouldStop ? 16.0 : 5.0;
        this.currentSpeed += (targetSpeed - this.currentSpeed) * dt * accelRate;

        if (this.waypoints.length === 0) return;

        const targetWp = this.waypoints[this.currentWpIdx];
        const toWp = targetWp.clone().sub(this.position);
        const distToWp = toWp.length();

        // Advance to next waypoint
        if (distToWp < 4.5) {
            this.currentWpIdx = (this.currentWpIdx + 1) % this.waypoints.length;
        }

        // Steer smoothly towards target waypoint
        const targetHeading = Math.atan2(toWp.x, toWp.z);
        let angleDiff = targetHeading - this.heading;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

        this.heading += angleDiff * Math.min(1.0, dt * 2.6);
        this.heading = (this.heading + Math.PI * 2) % (Math.PI * 2);

        // Move forward along heading
        const forward = new THREE.Vector3(Math.sin(this.heading), 0, Math.cos(this.heading));
        this.position.add(forward.multiplyScalar(this.currentSpeed * dt));

        this.group.position.copy(this.position);
        this.group.rotation.y = this.heading;
    }
}

window.AITrafficManager = AITrafficManager;
