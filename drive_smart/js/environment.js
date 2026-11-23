/**
 * DRIVE SMART - 3D Environment & World Builder
 * Generates realistic roads, Indian left-hand road markings, curbs, sidewalks,
 * buildings, streetlights, vegetation, weather (rain & fog), and day/dusk/night cycles.
 */

class GameEnvironment {
    constructor(scene) {
        this.scene = scene;

        // Lighting References
        this.ambientLight = null;
        this.sunLight = null;
        this.streetLights = [];
        this.timeOfDay = 'day'; // 'day', 'dusk', 'night'
        this.weather = 'clear'; // 'clear', 'rain', 'fog'

        // Weather particle system
        this.rainParticles = null;
        this.rainGeo = null;

        // Static Colliders (cones, barriers, buildings, parked cars)
        this.colliders = [];
        this.cones = [];
        this.potholes = [];
        this.parkingBays = [];
        this.zebraCrossings = [];
        this.trafficLights = [];

        // Groups
        this.worldGroup = new THREE.Group();
        this.scene.add(this.worldGroup);

        this._setupLighting();
    }

    _setupLighting() {
        this.ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
        this.scene.add(this.ambientLight);

        this.sunLight = new THREE.DirectionalLight(0xfffaed, 1.2);
        this.sunLight.position.set(60, 100, 40);
        this.sunLight.castShadow = true;
        this.sunLight.shadow.mapSize.width = 2048;
        this.sunLight.shadow.mapSize.height = 2048;
        this.sunLight.shadow.camera.near = 10;
        this.sunLight.shadow.camera.far = 300;
        const d = 90;
        this.sunLight.shadow.camera.left = -d;
        this.sunLight.shadow.camera.right = d;
        this.sunLight.shadow.camera.top = d;
        this.sunLight.shadow.camera.bottom = -d;
        this.sunLight.shadow.bias = -0.0005;
        this.scene.add(this.sunLight);
    }

    setTimeOfDay(time) {
        this.timeOfDay = time;
        if (time === 'day') {
            this.scene.background = new THREE.Color(0x87ceeb); // Clear Sky Blue
            this.ambientLight.color.setHex(0xffffff);
            this.ambientLight.intensity = 0.75;
            this.sunLight.color.setHex(0xfffaed);
            this.sunLight.intensity = 1.3;
            this.sunLight.position.set(60, 100, 40);
            this._toggleStreetLights(false);
        } else if (time === 'dusk') {
            this.scene.background = new THREE.Color(0xd27d50); // Warm Golden Dusk
            this.ambientLight.color.setHex(0xfda085);
            this.ambientLight.intensity = 0.55;
            this.sunLight.color.setHex(0xff7744);
            this.sunLight.intensity = 0.85;
            this.sunLight.position.set(90, 25, -20);
            this._toggleStreetLights(true, 0.8);
        } else if (time === 'night') {
            this.scene.background = new THREE.Color(0x060810); // Deep Night
            this.ambientLight.color.setHex(0x1a243b);
            this.ambientLight.intensity = 0.22;
            this.sunLight.color.setHex(0x3a4b6e);
            this.sunLight.intensity = 0.2;
            this.sunLight.position.set(20, 80, 20);
            this._toggleStreetLights(true, 1.8);
        }
    }

    setWeather(weather) {
        this.weather = weather;
        if (weather === 'clear') {
            this.scene.fog = null;
            this._destroyRain();
            window.soundEngine.setRain(false);
        } else if (weather === 'rain') {
            this.scene.fog = new THREE.FogExp2(0x5a636e, 0.012);
            this._setupRain();
            window.soundEngine.setRain(true);
        } else if (weather === 'fog') {
            this.scene.fog = new THREE.FogExp2(0xa0a8b2, 0.024);
            this._destroyRain();
            window.soundEngine.setRain(false);
        }
    }

    _setupRain() {
        if (this.rainParticles) return;
        const count = 4500;
        this.rainGeo = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const velocities = new Float32Array(count);

        for (let i = 0; i < count; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 160;
            positions[i * 3 + 1] = Math.random() * 45;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 160;
            velocities[i] = 25 + Math.random() * 15;
        }

        this.rainGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        this.rainVelocities = velocities;

        const rainMat = new THREE.PointsMaterial({
            color: 0x99ccff,
            size: 0.18,
            transparent: true,
            opacity: 0.65
        });

        this.rainParticles = new THREE.Points(this.rainGeo, rainMat);
        this.scene.add(this.rainParticles);
    }

    _destroyRain() {
        if (this.rainParticles) {
            this.scene.remove(this.rainParticles);
            this.rainGeo.dispose();
            this.rainParticles = null;
            this.rainGeo = null;
        }
    }

    _toggleStreetLights(active, intensity = 1.0) {
        this.streetLights.forEach(light => {
            light.light.intensity = active ? intensity : 0.0;
            if (light.glow) {
                light.glow.material.emissiveIntensity = active ? 2.0 : 0.0;
            }
        });
    }

    clearWorld() {
        while (this.worldGroup.children.length > 0) {
            const child = this.worldGroup.children[0];
            this.worldGroup.remove(child);
        }
        this.colliders = [];
        this.cones = [];
        this.potholes = [];
        this.parkingBays = [];
        this.zebraCrossings = [];
        this.streetLights = [];
        this.trafficLights = [];
        this._destroyRain();
    }

    // --- PROCEDURAL ASSET BUILDERS ---

    // Build Ground Plane (Grass)
    buildGround(size = 400) {
        const grassTex = TextureGen.getGrassTexture();
        const geo = new THREE.PlaneGeometry(size, size);
        const mat = new THREE.MeshStandardMaterial({
            map: grassTex,
            roughness: 0.9,
            metalness: 0.05
        });
        const ground = new THREE.Mesh(geo, mat);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -0.05;
        ground.receiveShadow = true;
        this.worldGroup.add(ground);
    }

    // Build a Road Segment with Indian Left-Hand Markings
    // roadWidth: standard 14m (2 lanes each direction = 4 lanes, or 2 wide lanes)
    buildRoad(x, z, length, width = 14, rotation = 0, type = 'straight') {
        const roadGroup = new THREE.Group();

        // Asphalt surface
        const roadTex = TextureGen.getRoadSegmentTexture(type);
        const geo = new THREE.PlaneGeometry(width, length);
        const mat = new THREE.MeshStandardMaterial({
            map: roadTex,
            roughness: 0.75,
            metalness: 0.1
        });
        const roadMesh = new THREE.Mesh(geo, mat);
        roadMesh.rotation.x = -Math.PI / 2;
        roadMesh.receiveShadow = true;
        roadGroup.add(roadMesh);

        // Curbs on left and right edges (with black & yellow hazard stripes)
        const curbTex = TextureGen.getCurbTexture();
        const curbMat = new THREE.MeshStandardMaterial({ map: curbTex, roughness: 0.6 });
        const curbGeo = new THREE.BoxGeometry(0.5, 0.22, length);

        const curbL = new THREE.Mesh(curbGeo, curbMat);
        curbL.position.set(-width * 0.5 - 0.25, 0.1, 0);
        curbL.receiveShadow = true;
        curbL.castShadow = true;
        roadGroup.add(curbL);

        const curbR = new THREE.Mesh(curbGeo, curbMat);
        curbR.position.set(width * 0.5 + 0.25, 0.1, 0);
        curbR.receiveShadow = true;
        curbR.castShadow = true;
        roadGroup.add(curbR);

        // Sidewalks
        const swTex = TextureGen.getSidewalkTexture();
        const swMat = new THREE.MeshStandardMaterial({ map: swTex, roughness: 0.8 });
        const swGeo = new THREE.BoxGeometry(3.5, 0.18, length);

        const swL = new THREE.Mesh(swGeo, swMat);
        swL.position.set(-width * 0.5 - 2.2, 0.08, 0);
        swL.receiveShadow = true;
        roadGroup.add(swL);

        const swR = new THREE.Mesh(swGeo, swMat);
        swR.position.set(width * 0.5 + 2.2, 0.08, 0);
        swR.receiveShadow = true;
        roadGroup.add(swR);

        roadGroup.position.set(x, 0, z);
        roadGroup.rotation.y = rotation;
        this.worldGroup.add(roadGroup);

        return roadGroup;
    }

    // Street Lamppost
    buildStreetLamp(x, z, rotation = 0) {
        const lampGroup = new THREE.Group();

        // Pole
        const poleMat = new THREE.MeshStandardMaterial({ color: 0x374151, metalness: 0.8, roughness: 0.3 });
        const poleGeo = new THREE.CylinderGeometry(0.12, 0.16, 6.5, 12);
        const pole = new THREE.Mesh(poleGeo, poleMat);
        pole.position.y = 3.25;
        pole.castShadow = true;
        lampGroup.add(pole);

        // Arm
        const armGeo = new THREE.CylinderGeometry(0.08, 0.08, 2.2, 8);
        armGeo.rotateZ(Math.PI / 3);
        const arm = new THREE.Mesh(armGeo, poleMat);
        arm.position.set(0.9, 6.3, 0);
        lampGroup.add(arm);

        // Glowing Fixture Head
        const headGeo = new THREE.BoxGeometry(0.7, 0.18, 0.35);
        const glowMat = new THREE.MeshStandardMaterial({
            color: 0xfff0cc,
            emissive: 0xffd277,
            emissiveIntensity: 0.0
        });
        const head = new THREE.Mesh(headGeo, glowMat);
        head.position.set(1.7, 6.7, 0);
        lampGroup.add(head);

        // PointLight source
        const light = new THREE.PointLight(0xffeaad, 0.0, 28, 1.2);
        light.position.set(1.7, 6.2, 0);
        lampGroup.add(light);

        lampGroup.position.set(x, 0, z);
        lampGroup.rotation.y = rotation;
        this.worldGroup.add(lampGroup);

        this.streetLights.push({ light, glow: head });
        // Solid pole collider
        this.colliders.push({ type: 'cylinder', x, z, radius: 0.35 });

        return lampGroup;
    }

    // Traffic Cone with physics tipping support
    buildTrafficCone(x, z) {
        const coneGroup = new THREE.Group();

        // Black rubber base
        const baseGeo = new THREE.BoxGeometry(0.55, 0.06, 0.55);
        const baseMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
        const base = new THREE.Mesh(baseGeo, baseMat);
        base.position.y = 0.03;
        base.castShadow = true;
        coneGroup.add(base);

        // Orange cone body
        const coneGeo = new THREE.ConeGeometry(0.24, 0.85, 16);
        const coneMat = new THREE.MeshStandardMaterial({ color: 0xff5500, roughness: 0.4 });
        const cone = new THREE.Mesh(coneGeo, coneMat);
        cone.position.y = 0.45;
        cone.castShadow = true;
        coneGroup.add(cone);

        // Reflective white stripes
        const stripeGeo = new THREE.CylinderGeometry(0.18, 0.22, 0.22, 16);
        const stripeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });
        const stripe = new THREE.Mesh(stripeGeo, stripeMat);
        stripe.position.y = 0.42;
        coneGroup.add(stripe);

        coneGroup.position.set(x, 0, z);
        this.worldGroup.add(coneGroup);

        const coneObj = {
            group: coneGroup,
            x,
            z,
            radius: 0.32,
            isHit: false,
            knockOver: () => {
                if (!coneObj.isHit) {
                    coneObj.isHit = true;
                    // Tilt over realistically
                    coneGroup.rotation.x = 1.35;
                    coneGroup.position.y = 0.1;
                }
            }
        };

        this.cones.push(coneObj);
        return coneObj;
    }

    // Pothole on road
    buildPothole(x, z, scale = 1.0) {
        const potTex = TextureGen.getPotholeTexture();
        const potGeo = new THREE.PlaneGeometry(1.6 * scale, 1.4 * scale);
        const potMat = new THREE.MeshStandardMaterial({
            map: potTex,
            transparent: true,
            roughness: 0.95
        });
        const potMesh = new THREE.Mesh(potGeo, potMat);
        potMesh.rotation.x = -Math.PI / 2;
        potMesh.position.set(x, 0.015, z);
        this.worldGroup.add(potMesh);

        this.potholes.push({
            x,
            z,
            radius: 0.85 * scale,
            hitCount: 0
        });
    }

    // Traffic Road Sign on pole
    buildRoadSign(x, z, type = 'limit40', rotation = 0) {
        const signGroup = new THREE.Group();

        // Pole
        const poleGeo = new THREE.CylinderGeometry(0.06, 0.06, 2.8, 10);
        const poleMat = new THREE.MeshStandardMaterial({ color: 0x9ca3af, metalness: 0.8 });
        const pole = new THREE.Mesh(poleGeo, poleMat);
        pole.position.y = 1.4;
        pole.castShadow = true;
        signGroup.add(pole);

        // Sign plate
        const signTex = TextureGen.getSignTexture(type);
        const plateGeo = new THREE.PlaneGeometry(0.9, 0.9);
        const plateMat = new THREE.MeshStandardMaterial({ map: signTex, roughness: 0.3 });
        const plate = new THREE.Mesh(plateGeo, plateMat);
        plate.position.set(0, 2.35, 0.04);
        signGroup.add(plate);

        // Backplate
        const backGeo = new THREE.PlaneGeometry(0.92, 0.92);
        const backMat = new THREE.MeshStandardMaterial({ color: 0x4b5563, metalness: 0.6 });
        const back = new THREE.Mesh(backGeo, backMat);
        back.position.set(0, 2.35, -0.01);
        back.rotation.y = Math.PI;
        signGroup.add(back);

        signGroup.position.set(x, 0, z);
        signGroup.rotation.y = rotation;
        this.worldGroup.add(signGroup);

        this.colliders.push({ type: 'cylinder', x, z, radius: 0.25 });
        return signGroup;
    }

    // City Building
    buildBuilding(x, z, width = 16, depth = 16, height = 24, theme = 'office') {
        const bldgGroup = new THREE.Group();

        const bldgTex = TextureGen.getBuildingTexture(theme, this.timeOfDay === 'night');
        bldgTex.repeat.set(Math.ceil(width / 8), Math.ceil(height / 10));

        const geo = new THREE.BoxGeometry(width, height, depth);
        const mat = new THREE.MeshStandardMaterial({
            map: bldgTex,
            roughness: 0.7,
            metalness: 0.2
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.y = height * 0.5;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        bldgGroup.add(mesh);

        // Roof trim
        const trimGeo = new THREE.BoxGeometry(width + 0.4, 0.8, depth + 0.4);
        const trimMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.8 });
        const trim = new THREE.Mesh(trimGeo, trimMat);
        trim.position.y = height + 0.4;
        bldgGroup.add(trim);

        bldgGroup.position.set(x, 0, z);
        this.worldGroup.add(bldgGroup);

        // Add AABB collider
        this.colliders.push({
            type: 'aabb',
            minX: x - width * 0.5,
            maxX: x + width * 0.5,
            minZ: z - depth * 0.5,
            maxZ: z + depth * 0.5
        });

        return bldgGroup;
    }

    // Organic Tree
    buildTree(x, z, scale = 1.0) {
        const treeGroup = new THREE.Group();

        // Trunk
        const trunkGeo = new THREE.CylinderGeometry(0.25 * scale, 0.35 * scale, 3.2 * scale, 8);
        const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4a2e18, roughness: 0.9 });
        const trunk = new THREE.Mesh(trunkGeo, trunkMat);
        trunk.position.y = 1.6 * scale;
        trunk.castShadow = true;
        treeGroup.add(trunk);

        // Foliage (layered organic spheres)
        const leafMat = new THREE.MeshStandardMaterial({ color: 0x2e6930, roughness: 0.8 });
        const leafGeo1 = new THREE.DodecahedronGeometry(1.6 * scale, 1);
        const leaves1 = new THREE.Mesh(leafGeo1, leafMat);
        leaves1.position.y = 3.6 * scale;
        leaves1.castShadow = true;
        treeGroup.add(leaves1);

        const leafMat2 = new THREE.MeshStandardMaterial({ color: 0x3d7e40, roughness: 0.8 });
        const leafGeo2 = new THREE.DodecahedronGeometry(1.2 * scale, 1);
        const leaves2 = new THREE.Mesh(leafGeo2, leafMat2);
        leaves2.position.set(0.4 * scale, 4.4 * scale, 0.2 * scale);
        leaves2.castShadow = true;
        treeGroup.add(leaves2);

        treeGroup.position.set(x, 0, z);
        this.worldGroup.add(treeGroup);

        this.colliders.push({ type: 'cylinder', x, z, radius: 0.45 * scale });
        return treeGroup;
    }

    // Parked Stationary Car (Obstacle)
    buildParkedCar(x, z, color = '#3498db', rotation = 0) {
        const car = new CarModel('sedan', color);
        car.group.position.set(x, 0, z);
        car.group.rotation.y = rotation;
        this.worldGroup.add(car.group);

        // Approximate collider with box
        this.colliders.push({
            type: 'aabb',
            minX: x - 1.2,
            maxX: x + 1.2,
            minZ: z - 2.4,
            maxZ: z + 2.4,
            isVehicle: true
        });

        return car;
    }

    // Road Construction Barrier
    buildBarrier(x, z, width = 3.0, rotation = 0) {
        const barrierGroup = new THREE.Group();

        // Concrete / Plastic striped barrier
        const barGeo = new THREE.BoxGeometry(width, 0.9, 0.4);
        // Canvas diagonal red-white stripes
        const { canvas, ctx } = TextureGen._createCanvas(256, 128);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 256, 128);
        ctx.fillStyle = '#d32f2f';
        for (let i = -128; i < 384; i += 40) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i + 40, 128);
            ctx.lineTo(i + 20, 128);
            ctx.lineTo(i - 20, 0);
            ctx.fill();
        }
        const tex = new THREE.CanvasTexture(canvas);
        tex.wrapS = THREE.RepeatWrapping;
        tex.repeat.set(2, 1);

        const barMat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.5 });
        const mesh = new THREE.Mesh(barGeo, barMat);
        mesh.position.y = 0.45;
        mesh.castShadow = true;
        barrierGroup.add(mesh);

        barrierGroup.position.set(x, 0, z);
        barrierGroup.rotation.y = rotation;
        this.worldGroup.add(barrierGroup);

        this.colliders.push({
            type: 'aabb',
            minX: x - width * 0.5,
            maxX: x + width * 0.5,
            minZ: z - 0.4,
            maxZ: z + 0.4
        });

        return barrierGroup;
    }

    // Update dynamic weather (e.g. rain animation)
    update(dt) {
        if (this.rainParticles && this.rainGeo) {
            const pos = this.rainGeo.attributes.position.array;
            const count = this.rainVelocities.length;
            for (let i = 0; i < count; i++) {
                pos[i * 3 + 1] -= this.rainVelocities[i] * dt;
                // If hits ground, reset to cloud top
                if (pos[i * 3 + 1] < 0) {
                    pos[i * 3 + 1] = 45;
                }
            }
            this.rainGeo.attributes.position.needsUpdate = true;
        }
    }
}

window.GameEnvironment = GameEnvironment;
