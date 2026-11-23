/**
 * DRIVE SMART - Indian 3D City Environment & Street Furniture
 * Creates multi-story commercial buildings, storefront shops with signage,
 * street lampposts, traffic signals, Indian road signboards, trees, and sky lighting.
 */

class CityEnvironment {
    constructor(scene) {
        this.scene = scene;
        this.group = new THREE.Group();
        this.scene.add(this.group);

        // Traffic Light references
        this.trafficLights = [];
        this.trafficLightPhase = 'green';
        this.trafficTimer = 0;

        this._setupLighting();
        this._buildCity();
    }

    _setupLighting() {
        // Sky Color & Fog
        this.scene.background = new THREE.Color(0x7ebbf0);
        this.scene.fog = new THREE.Fog(0x7ebbf0, 140, 480);

        // Ambient Light
        const ambient = new THREE.AmbientLight(0xfff5ea, 0.75);
        this.group.add(ambient);

        // Directional Sun
        const sun = new THREE.DirectionalLight(0xfff8ee, 1.25);
        sun.position.set(70, 110, 50);
        sun.castShadow = true;
        sun.shadow.mapSize.width = 1024;
        sun.shadow.mapSize.height = 1024;
        const d = 90;
        sun.shadow.camera.left = -d;
        sun.shadow.camera.right = d;
        sun.shadow.camera.top = d;
        sun.shadow.camera.bottom = -d;
        sun.shadow.bias = -0.0005;
        this.group.add(sun);
    }

    _buildCity() {
        // 1. Buildings along South Main Avenue (z = -150 to z = 50)
        for (let z = -140; z <= 40; z += 38) {
            // West side buildings
            this._buildBuilding(-22, z, 16, 26, 20 + Math.random() * 24, 'commercial');
            // East side buildings
            this._buildBuilding(22, z, 16, 26, 18 + Math.random() * 22, 'residential');

            // Streetlamps on sidewalks
            this._buildStreetLamp(-8.6, z, 0);
            this._buildStreetLamp(8.6, z, Math.PI);

            // Roadside Trees
            this._buildTree(-11.5, z + 16);
            this._buildTree(11.5, z + 16);
        }

        // 2. Shops with Colorful Awnings & Signboards along South Avenue
        this._buildShopFront(-15.5, -90, 'CHAI & SNACKS • FRESH SAMOSA', '#f59e0b', 0);
        this._buildShopFront(15.5, -90, 'CITY MEDICAL & PHARMACY 24/7', '#10b981', Math.PI);
        this._buildShopFront(-15.5, -30, 'DRIVE SMART ACADEMY HQ', '#0284c7', 0);
        this._buildShopFront(15.5, -30, 'SUPER AUTO SPARES & TIRES', '#dc2626', Math.PI);

        // 3. Roundabout Surroundings (z = 100)
        // Outer curved palm trees
        for (let i = 0; i < 16; i++) {
            const angle = (i / 16) * Math.PI * 2;
            const px = Math.cos(angle) * 32;
            const pz = 100 + Math.sin(angle) * 32;
            // Leave gaps for the 4 entering roads
            if (Math.abs(px) > 12 && Math.abs(pz - 100) > 12) {
                this._buildPalmTree(px, pz);
            }
        }

        // 4. Buildings along North Boulevard (z = 130 to 250)
        for (let z = 140; z <= 240; z += 38) {
            this._buildBuilding(-22, z, 18, 28, 24 + Math.random() * 26, 'office');
            this._buildBuilding(22, z, 18, 28, 22 + Math.random() * 20, 'commercial');
            this._buildStreetLamp(-8.6, z, 0);
            this._buildStreetLamp(8.6, z, Math.PI);
            this._buildTree(-11.5, z + 18);
            this._buildTree(11.5, z + 18);
        }

        // 5. 4-Way North Intersection Traffic Signals at (0, 270)
        this._buildTrafficSignalGantry(-7.8, 262, 0);       // South approach
        this._buildTrafficSignalGantry(7.8, 278, Math.PI);   // North approach

        // 6. Authentic Indian Traffic Road Signposts
        this._buildRoadSign(-8.6, -130, 'KEEP LEFT', 'left');
        this._buildRoadSign(-8.6, -80, 'LIMIT 40', 'speed40');
        this._buildRoadSign(-8.6, 20, 'ROUNDABOUT', 'roundabout');
        this._buildRoadSign(-8.6, 140, 'LIMIT 40', 'speed40');
        this._buildRoadSign(-8.6, 230, 'SCHOOL ZONE', 'school25');
        this._buildRoadSign(-8.6, 258, 'STOP', 'stop');
    }

    _buildBuilding(x, z, width, depth, height, type = 'commercial') {
        const bldgGroup = new THREE.Group();

        // Facade color
        let color = 0x273549; // Dark modern office
        if (type === 'residential') color = 0xb45309; // Terracotta apartment
        else if (type === 'commercial') color = 0x334155; // Slate business

        const bodyGeo = new THREE.BoxGeometry(width, height, depth);
        const bodyMat = new THREE.MeshLambertMaterial({ color });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = height * 0.5;
        body.castShadow = true;
        body.receiveShadow = true;
        bldgGroup.add(body);

        // Window Rows (simple procedural geometry)
        const winGeo = new THREE.BoxGeometry(0.1, 1.4, 2.0);
        const winMatLit = new THREE.MeshBasicMaterial({ color: 0xfef08a }); // Lit window
        const winMatDark = new THREE.MeshLambertMaterial({ color: 0x0f172a }); // Dark window

        const floors = Math.floor(height / 3.8);
        for (let f = 1; f < floors; f++) {
            const wy = f * 3.8;
            for (let d = -depth * 0.35; d <= depth * 0.35; d += 4.5) {
                const isLit = Math.random() > 0.45;
                const win = new THREE.Mesh(winGeo, isLit ? winMatLit : winMatDark);
                // Windows on front face (facing road)
                win.position.set(x < 0 ? width * 0.5 + 0.05 : -width * 0.5 - 0.05, wy, d);
                bldgGroup.add(win);
            }
        }

        // Roof Trim
        const trim = new THREE.Mesh(
            new THREE.BoxGeometry(width + 0.4, 0.6, depth + 0.4),
            new THREE.MeshLambertMaterial({ color: 0x0f172a })
        );
        trim.position.y = height + 0.3;
        bldgGroup.add(trim);

        bldgGroup.position.set(x, 0, z);
        this.group.add(bldgGroup);
    }

    _buildShopFront(x, z, title, awningColorHex, rotation = 0) {
        const shopGroup = new THREE.Group();

        // Main Storefront Base
        const base = new THREE.Mesh(
            new THREE.BoxGeometry(10, 4.5, 6),
            new THREE.MeshLambertMaterial({ color: 0xe2e8f0 })
        );
        base.position.y = 2.25;
        shopGroup.add(base);

        // Colorful Striped Canvas Awning
        const awning = new THREE.Mesh(
            new THREE.BoxGeometry(10.4, 0.35, 2.6),
            new THREE.MeshLambertMaterial({ color: awningColorHex })
        );
        awning.position.set(0, 3.8, 3.8);
        awning.rotation.x = 0.25;
        shopGroup.add(awning);

        // Shop Signboard
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 96;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, 512, 96);
        ctx.strokeStyle = awningColorHex;
        ctx.lineWidth = 6;
        ctx.strokeRect(4, 4, 504, 88);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 26px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(title, 256, 48);

        const tex = new THREE.CanvasTexture(canvas);
        const signMat = new THREE.MeshBasicMaterial({ map: tex });
        const signBoard = new THREE.Mesh(new THREE.PlaneGeometry(8.5, 1.6), signMat);
        signBoard.position.set(0, 4.7, 3.1);
        shopGroup.add(signBoard);

        shopGroup.position.set(x, 0, z);
        shopGroup.rotation.y = rotation;
        this.group.add(shopGroup);
    }

    _buildStreetLamp(x, z, rotation = 0) {
        const lampGroup = new THREE.Group();

        // Metal Pole
        const pole = new THREE.Mesh(
            new THREE.CylinderGeometry(0.12, 0.16, 6.2, 8),
            new THREE.MeshLambertMaterial({ color: 0x334155 })
        );
        pole.position.y = 3.1;
        lampGroup.add(pole);

        // Arm
        const arm = new THREE.Mesh(
            new THREE.BoxGeometry(0.1, 0.1, 1.8),
            new THREE.MeshLambertMaterial({ color: 0x334155 })
        );
        arm.position.set(0, 6.1, 0.7);
        lampGroup.add(arm);

        // Glowing Fixture Head
        const head = new THREE.Mesh(
            new THREE.BoxGeometry(0.4, 0.15, 0.6),
            new THREE.MeshBasicMaterial({ color: 0xfef08a })
        );
        head.position.set(0, 6.0, 1.4);
        lampGroup.add(head);

        lampGroup.position.set(x, 0, z);
        lampGroup.rotation.y = rotation;
        this.group.add(lampGroup);
    }

    _buildTrafficSignalGantry(x, z, rotation = 0) {
        const signalGroup = new THREE.Group();

        // Vertical Mast
        const mast = new THREE.Mesh(
            new THREE.CylinderGeometry(0.16, 0.18, 5.8, 8),
            new THREE.MeshLambertMaterial({ color: 0x1e293b })
        );
        mast.position.y = 2.9;
        signalGroup.add(mast);

        // Overhead Arm across lane
        const arm = new THREE.Mesh(
            new THREE.CylinderGeometry(0.1, 0.1, 4.5, 8),
            new THREE.MeshLambertMaterial({ color: 0x1e293b })
        );
        arm.rotation.z = Math.PI / 2;
        arm.position.set(2.2, 5.4, 0);
        signalGroup.add(arm);

        // 3-Aspect Signal Box
        const box = new THREE.Mesh(
            new THREE.BoxGeometry(0.5, 1.4, 0.45),
            new THREE.MeshLambertMaterial({ color: 0x0f172a })
        );
        box.position.set(3.8, 4.8, 0);
        signalGroup.add(box);

        // Lenses: Red, Amber, Green
        const lensGeo = new THREE.CylinderGeometry(0.16, 0.16, 0.08, 12);
        lensGeo.rotateX(Math.PI / 2);

        const redLens = new THREE.Mesh(lensGeo, new THREE.MeshBasicMaterial({ color: 0x440000 }));
        redLens.position.set(3.8, 5.2, 0.24);
        signalGroup.add(redLens);

        const amberLens = new THREE.Mesh(lensGeo, new THREE.MeshBasicMaterial({ color: 0x442200 }));
        amberLens.position.set(3.8, 4.8, 0.24);
        signalGroup.add(amberLens);

        const greenLens = new THREE.Mesh(lensGeo, new THREE.MeshBasicMaterial({ color: 0x00ff44 }));
        greenLens.position.set(3.8, 4.4, 0.24);
        signalGroup.add(greenLens);

        signalGroup.position.set(x, 0, z);
        signalGroup.rotation.y = rotation;
        this.group.add(signalGroup);

        this.trafficLights.push({ redLens, amberLens, greenLens });
    }

    _buildRoadSign(x, z, label, type) {
        const signGroup = new THREE.Group();

        // Pole
        const pole = new THREE.Mesh(
            new THREE.CylinderGeometry(0.06, 0.06, 2.8, 8),
            new THREE.MeshLambertMaterial({ color: 0x64748b })
        );
        pole.position.y = 1.4;
        signGroup.add(pole);

        // Sign Plate Canvas
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');

        if (type === 'stop') {
            ctx.fillStyle = '#dc2626';
            ctx.beginPath();
            ctx.arc(64, 64, 60, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 6;
            ctx.stroke();
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 36px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('STOP', 64, 64);
        } else if (type === 'speed40') {
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(64, 64, 60, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#dc2626';
            ctx.lineWidth = 14;
            ctx.stroke();
            ctx.fillStyle = '#0f172a';
            ctx.font = 'bold 52px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('40', 64, 64);
        } else if (type === 'school25') {
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(64, 64, 60, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#dc2626';
            ctx.lineWidth = 14;
            ctx.stroke();
            ctx.fillStyle = '#0f172a';
            ctx.font = 'bold 44px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('25', 64, 55);
            ctx.font = 'bold 16px Arial';
            ctx.fillText('SCHOOL', 64, 90);
        } else if (type === 'left') {
            // Keep Left Indian Sign (Blue circle with white diagonal arrow)
            ctx.fillStyle = '#0284c7';
            ctx.beginPath();
            ctx.arc(64, 64, 60, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 6;
            ctx.stroke();
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 20px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('KEEP', 64, 45);
            ctx.fillText('LEFT ◀', 64, 75);
        } else if (type === 'roundabout') {
            ctx.fillStyle = '#0284c7';
            ctx.beginPath();
            ctx.arc(64, 64, 60, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 6;
            ctx.stroke();
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 18px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('ROUND', 64, 45);
            ctx.fillText('ABOUT', 64, 75);
        }

        const tex = new THREE.CanvasTexture(canvas);
        const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.0), new THREE.MeshBasicMaterial({ map: tex }));
        sign.position.set(0, 2.3, 0.04);
        signGroup.add(sign);

        signGroup.position.set(x, 0, z);
        this.group.add(signGroup);
    }

    _buildTree(x, z) {
        const tree = new THREE.Group();
        const trunk = new THREE.Mesh(
            new THREE.CylinderGeometry(0.25, 0.35, 2.6, 8),
            new THREE.MeshLambertMaterial({ color: 0x5c3a21 })
        );
        trunk.position.y = 1.3;
        trunk.castShadow = true;
        tree.add(trunk);

        const leafMat = new THREE.MeshLambertMaterial({ color: 0x2e7d32 });
        const foliage = new THREE.Mesh(new THREE.DodecahedronGeometry(1.6, 1), leafMat);
        foliage.position.y = 3.2;
        foliage.castShadow = true;
        tree.add(foliage);

        const foliage2 = new THREE.Mesh(new THREE.DodecahedronGeometry(1.2, 1), leafMat);
        foliage2.position.set(0.3, 4.0, 0.2);
        foliage2.castShadow = true;
        tree.add(foliage2);

        tree.position.set(x, 0, z);
        this.group.add(tree);
    }

    _buildPalmTree(x, z) {
        const palm = new THREE.Group();
        const trunk = new THREE.Mesh(
            new THREE.CylinderGeometry(0.2, 0.35, 5.0, 8),
            new THREE.MeshLambertMaterial({ color: 0x78502f })
        );
        trunk.position.y = 2.5;
        trunk.castShadow = true;
        palm.add(trunk);

        // Palm fronds
        const frondMat = new THREE.MeshLambertMaterial({ color: 0x15803d });
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const frond = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.08, 0.5), frondMat);
            frond.position.set(Math.cos(angle) * 1.1, 4.9, Math.sin(angle) * 1.1);
            frond.rotation.y = angle;
            frond.rotation.z = -0.35;
            palm.add(frond);
        }

        palm.position.set(x, 0, z);
        this.group.add(palm);
    }

    update(dt) {
        // Traffic signal light cycles
        this.trafficTimer += dt;
        if (this.trafficLightPhase === 'green' && this.trafficTimer >= 10.0) {
            this.trafficLightPhase = 'amber';
            this.trafficTimer = 0;
            this._updateSignalColors();
        } else if (this.trafficLightPhase === 'amber' && this.trafficTimer >= 3.0) {
            this.trafficLightPhase = 'red';
            this.trafficTimer = 0;
            this._updateSignalColors();
        } else if (this.trafficLightPhase === 'red' && this.trafficTimer >= 8.0) {
            this.trafficLightPhase = 'green';
            this.trafficTimer = 0;
            this._updateSignalColors();
        }
    }

    _updateSignalColors() {
        this.trafficLights.forEach(tl => {
            tl.redLens.material.color.setHex(this.trafficLightPhase === 'red' ? 0xff0000 : 0x440000);
            tl.amberLens.material.color.setHex(this.trafficLightPhase === 'amber' ? 0xffaa00 : 0x442200);
            tl.greenLens.material.color.setHex(this.trafficLightPhase === 'green' ? 0x00ff44 : 0x004400);
        });
    }
}

window.CityEnvironment = CityEnvironment;
