/**
 * DRIVE SMART - Detailed Realistic 3D Player Car Model
 * Features accurate automotive proportions, functioning headlights,
 * reactive brake & reverse lights, blinking turn indicators,
 * realistic wheels with alloy rims, and interior cockpit with turning steering wheel.
 */

class RealisticPlayerCar {
    constructor() {
        this.group = new THREE.Group();

        // Dimensions
        this.length = 4.3;
        this.width = 1.86;
        this.height = 1.44;

        // Dynamic wheel references
        this.wheels = {
            fl: null,
            fr: null,
            rl: null,
            rr: null
        };

        // Lighting references
        this.taillightMaterials = [];
        this.reverselightMaterials = [];
        this.turnLeftMaterials = [];
        this.turnRightMaterials = [];
        this.headlightSpotlights = [];

        // Interior
        this.steeringWheel = null;
        this.cockpitAnchor = new THREE.Object3D();

        // State
        this.turnSignal = 'none'; // 'none', 'left', 'right', 'hazard'
        this.headlightsOn = false;

        this._buildCar();
    }

    _buildCar() {
        const carBody = new THREE.Group();

        // Materials (Optimized standard PBR materials)
        const paintMat = new THREE.MeshLambertMaterial({ color: 0xd32f2f }); // Sport Red Paint
        const darkTrimMat = new THREE.MeshLambertMaterial({ color: 0x1e293b }); // Lower trim & bumpers
        const glassMat = new THREE.MeshLambertMaterial({ color: 0x0f172a }); // Tinted Glass
        const chromeMat = new THREE.MeshLambertMaterial({ color: 0xe2e8f0 }); // Chrome trim

        // 1. Lower Chassis & Underbody
        const underbody = new THREE.Mesh(
            new THREE.BoxGeometry(this.width - 0.1, 0.22, this.length - 0.2),
            darkTrimMat
        );
        underbody.position.y = 0.35;
        carBody.add(underbody);

        // 2. Main Waistline Body
        const mainBody = new THREE.Mesh(
            new THREE.BoxGeometry(this.width, 0.58, this.length),
            paintMat
        );
        mainBody.position.y = 0.65;
        mainBody.castShadow = true;
        mainBody.receiveShadow = true;
        carBody.add(mainBody);

        // Tapered Front Hood
        const hood = new THREE.Mesh(
            new THREE.BoxGeometry(this.width - 0.08, 0.18, this.length * 0.34),
            paintMat
        );
        hood.position.set(0, 0.84, this.length * 0.26);
        hood.rotation.x = -0.06;
        hood.castShadow = true;
        carBody.add(hood);

        // Radiator Front Grille with Chrome Outline
        const grille = new THREE.Mesh(
            new THREE.BoxGeometry(this.width * 0.65, 0.26, 0.06),
            darkTrimMat
        );
        grille.position.set(0, 0.56, this.length * 0.5 + 0.02);
        carBody.add(grille);

        const grilleBorder = new THREE.Mesh(
            new THREE.BoxGeometry(this.width * 0.68, 0.30, 0.04),
            chromeMat
        );
        grilleBorder.position.set(0, 0.56, this.length * 0.5 + 0.01);
        carBody.add(grilleBorder);

        // Indian License Plates ("IND • DL 01 AC 8820")
        const makePlate = () => {
            const canvas = document.createElement('canvas');
            canvas.width = 256;
            canvas.height = 64;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, 256, 64);
            // Blue IND band on left
            ctx.fillStyle = '#0284c7';
            ctx.fillRect(0, 0, 36, 64);
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('IND', 18, 40);
            // Reg number
            ctx.fillStyle = '#111111';
            ctx.font = 'bold 22px Arial';
            ctx.fillText('DL 01 AC 8820', 145, 42);
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 3;
            ctx.strokeRect(0, 0, 256, 64);

            const tex = new THREE.CanvasTexture(canvas);
            return new THREE.Mesh(new THREE.PlaneGeometry(0.85, 0.22), new THREE.MeshBasicMaterial({ map: tex }));
        };

        const frontPlate = makePlate();
        frontPlate.position.set(0, 0.42, this.length * 0.5 + 0.04);
        carBody.add(frontPlate);

        const rearPlate = makePlate();
        rearPlate.position.set(0, 0.52, -this.length * 0.5 - 0.04);
        rearPlate.rotation.y = Math.PI;
        carBody.add(rearPlate);

        // 3. Cabin & Glass Greenhouse
        const cabinW = this.width * 0.88;
        const cabinH = 0.66;
        const cabinL = this.length * 0.54;
        const cabinZ = -0.15;

        const cabin = new THREE.Mesh(
            new THREE.BoxGeometry(cabinW, cabinH, cabinL),
            paintMat
        );
        cabin.position.set(0, 1.22, cabinZ);
        cabin.castShadow = true;
        carBody.add(cabin);

        // Windshield (Front)
        const windshield = new THREE.Mesh(
            new THREE.PlaneGeometry(cabinW * 0.92, cabinH * 0.95),
            glassMat
        );
        windshield.position.set(0, 1.25, cabinZ + cabinL * 0.5 + 0.02);
        windshield.rotation.x = 0.42;
        carBody.add(windshield);

        // Rear Windshield
        const rearWindshield = new THREE.Mesh(
            new THREE.PlaneGeometry(cabinW * 0.92, cabinH * 0.88),
            glassMat
        );
        rearWindshield.position.set(0, 1.24, cabinZ - cabinL * 0.5 - 0.02);
        rearWindshield.rotation.x = -0.38;
        rearWindshield.rotation.y = Math.PI;
        carBody.add(rearWindshield);

        // Side Windows
        const sideWinGeo = new THREE.PlaneGeometry(cabinL * 0.82, cabinH * 0.72);
        const winL = new THREE.Mesh(sideWinGeo, glassMat);
        winL.position.set(-cabinW * 0.5 - 0.01, 1.22, cabinZ);
        winL.rotation.y = -Math.PI / 2;
        carBody.add(winL);

        const winR = new THREE.Mesh(sideWinGeo, glassMat);
        winR.position.set(cabinW * 0.5 + 0.01, 1.22, cabinZ);
        winR.rotation.y = Math.PI / 2;
        carBody.add(winR);

        // Academy Roof Sign Box ("L")
        const roofSign = new THREE.Mesh(
            new THREE.BoxGeometry(0.75, 0.24, 0.35),
            new THREE.MeshLambertMaterial({ color: 0xffffff })
        );
        roofSign.position.set(0, 1.66, cabinZ);
        carBody.add(roofSign);

        // Red "L" on roof box
        const lCanvas = document.createElement('canvas');
        lCanvas.width = 64; lCanvas.height = 64;
        const lCtx = lCanvas.getContext('2d');
        lCtx.fillStyle = '#ffffff'; lCtx.fillRect(0, 0, 64, 64);
        lCtx.fillStyle = '#dc2626'; lCtx.font = 'bold 54px Arial';
        lCtx.textAlign = 'center'; lCtx.textBaseline = 'middle';
        lCtx.fillText('L', 32, 32);
        const lTex = new THREE.CanvasTexture(lCanvas);
        const lPlate = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.2), new THREE.MeshBasicMaterial({ map: lTex }));
        lPlate.position.set(0, 1.66, cabinZ + 0.18);
        carBody.add(lPlate);

        // 4. Headlights & Taillights
        this._buildLighting(carBody);

        // 5. Side Rearview Mirrors (Indian RHD setup)
        const mirrorGeo = new THREE.BoxGeometry(0.22, 0.14, 0.1);
        const mirrorL = new THREE.Mesh(mirrorGeo, darkTrimMat);
        mirrorL.position.set(-cabinW * 0.5 - 0.12, 1.1, cabinZ + cabinL * 0.35);
        carBody.add(mirrorL);

        const mirrorR = new THREE.Mesh(mirrorGeo, darkTrimMat);
        mirrorR.position.set(cabinW * 0.5 + 0.12, 1.1, cabinZ + cabinL * 0.35);
        carBody.add(mirrorR);

        // 6. Cockpit Interior (Steering wheel & Driver eye position)
        this._buildCockpit(carBody, cabinW, cabinZ, cabinL);

        // 7. Alloy Wheels
        this._buildWheels(carBody);

        this.group.add(carBody);
    }

    _buildLighting(parent) {
        // Front Projector Headlights
        const hlMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const hlL = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.14, 0.08), hlMat);
        hlL.position.set(-this.width * 0.36, 0.72, this.length * 0.5 + 0.01);
        parent.add(hlL);

        const hlR = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.14, 0.08), hlMat);
        hlR.position.set(this.width * 0.36, 0.72, this.length * 0.5 + 0.01);
        parent.add(hlR);

        // Taillights (Red lightbars that brighten when braking)
        const makeTaillight = (x) => {
            const mat = new THREE.MeshBasicMaterial({ color: 0x880000 });
            const tl = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.14, 0.08), mat);
            tl.position.set(x, 0.75, -this.length * 0.5 - 0.01);
            parent.add(tl);
            this.taillightMaterials.push(mat);
        };
        makeTaillight(-this.width * 0.36);
        makeTaillight(this.width * 0.36);

        // Reverse Lights (White lamps)
        const revMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
        const revL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.10, 0.08), revMat);
        revL.position.set(-this.width * 0.22, 0.75, -this.length * 0.5 - 0.01);
        parent.add(revL);
        const revR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.10, 0.08), revMat);
        revR.position.set(this.width * 0.22, 0.75, -this.length * 0.5 - 0.01);
        parent.add(revR);
        this.reverselightMaterials.push(revMat);

        // Turn Signal Indicators (Amber corner markers)
        const indMatL = new THREE.MeshBasicMaterial({ color: 0x442200 });
        const indFL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.08), indMatL);
        indFL.position.set(-this.width * 0.46, 0.72, this.length * 0.48);
        parent.add(indFL);
        const indRL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.08), indMatL);
        indRL.position.set(-this.width * 0.46, 0.75, -this.length * 0.48);
        parent.add(indRL);
        this.turnLeftMaterials.push(indMatL);

        const indMatR = new THREE.MeshBasicMaterial({ color: 0x442200 });
        const indFR = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.08), indMatR);
        indFR.position.set(this.width * 0.46, 0.72, this.length * 0.48);
        parent.add(indFR);
        const indRR = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.08), indMatR);
        indRR.position.set(this.width * 0.46, 0.75, -this.length * 0.48);
        parent.add(indRR);
        this.turnRightMaterials.push(indMatR);
    }

    _buildCockpit(parent, cabinW, cabinZ, cabinL) {
        // Dashboard
        const dash = new THREE.Mesh(
            new THREE.BoxGeometry(cabinW * 0.9, 0.35, 0.45),
            new THREE.MeshLambertMaterial({ color: 0x1e293b })
        );
        dash.position.set(0, 0.98, cabinZ + cabinL * 0.36);
        parent.add(dash);

        // Steering Wheel (Right-Hand Drive position: X = +0.28)
        const wheelGroup = new THREE.Group();
        const rim = new THREE.Mesh(
            new THREE.TorusGeometry(0.18, 0.024, 8, 20),
            new THREE.MeshLambertMaterial({ color: 0x111111 })
        );
        wheelGroup.add(rim);

        const spoke = new THREE.Mesh(
            new THREE.BoxGeometry(0.32, 0.03, 0.02),
            new THREE.MeshLambertMaterial({ color: 0x94a3b8 })
        );
        wheelGroup.add(spoke);

        wheelGroup.position.set(cabinW * 0.28, 1.08, cabinZ + cabinL * 0.24);
        wheelGroup.rotation.x = -0.32;
        parent.add(wheelGroup);
        this.steeringWheel = wheelGroup;

        // Cockpit Camera Anchor (Driver eye level)
        this.cockpitAnchor.position.set(cabinW * 0.28, 1.30, cabinZ + 0.12);
        parent.add(this.cockpitAnchor);
    }

    _buildWheels(parent) {
        const radius = 0.35;
        const thickness = 0.24;

        const createWheelMesh = (isLeft) => {
            const pivot = new THREE.Group();

            // Rubber Tire
            const tireGeo = new THREE.CylinderGeometry(radius, radius, thickness, 16);
            tireGeo.rotateZ(Math.PI / 2);
            const tireMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
            const tire = new THREE.Mesh(tireGeo, tireMat);
            tire.castShadow = true;
            pivot.add(tire);

            // Alloy 5-Spoke Rim Face
            const rimFace = new THREE.Mesh(
                new THREE.CircleGeometry(radius * 0.68, 12),
                new THREE.MeshLambertMaterial({ color: 0xd1d5db })
            );
            rimFace.rotation.y = isLeft ? -Math.PI / 2 : Math.PI / 2;
            rimFace.position.x = isLeft ? -thickness * 0.51 : thickness * 0.51;
            pivot.add(rimFace);

            return { pivot, mesh: tire };
        };

        const halfW = this.width * 0.48;
        const halfL = 1.32;

        // Front Left & Right (with steering pivot)
        this.wheels.fl = createWheelMesh(true);
        this.wheels.fl.pivot.position.set(-halfW, radius, halfL);
        parent.add(this.wheels.fl.pivot);

        this.wheels.fr = createWheelMesh(false);
        this.wheels.fr.pivot.position.set(halfW, radius, halfL);
        parent.add(this.wheels.fr.pivot);

        // Rear Left & Right
        this.wheels.rl = createWheelMesh(true);
        this.wheels.rl.pivot.position.set(-halfW, radius, -halfL);
        parent.add(this.wheels.rl.pivot);

        this.wheels.rr = createWheelMesh(false);
        this.wheels.rr.pivot.position.set(halfW, radius, -halfL);
        parent.add(this.wheels.rr.pivot);
    }

    update(physics) {
        // 1. Sync Front Wheel Steering Pivot
        const steerAngle = -physics.currentSteerAngle;
        if (this.wheels.fl) {
            this.wheels.fl.pivot.rotation.y = steerAngle;
            this.wheels.fr.pivot.rotation.y = steerAngle;
        }

        // 2. Sync Cockpit Steering Wheel (Rotates up to 1.5 turns)
        if (this.steeringWheel) {
            this.steeringWheel.rotation.z = -physics.currentSteerAngle * 4.2;
        }

        // 3. Roll Wheels with vehicle motion
        const roll = physics.wheelRotation;
        if (this.wheels.fl) {
            this.wheels.fl.mesh.rotation.x = roll;
            this.wheels.fr.mesh.rotation.x = -roll;
            this.wheels.rl.mesh.rotation.x = roll;
            this.wheels.rr.mesh.rotation.x = -roll;
        }

        // 4. Taillights & Braking
        const brakeColor = physics.isBraking ? 0xff0000 : 0x770000;
        this.taillightMaterials.forEach(mat => mat.color.setHex(brakeColor));

        // 5. Reverse Lights
        const revColor = physics.isReversing ? 0xffffff : 0x111111;
        this.reverselightMaterials.forEach(mat => mat.color.setHex(revColor));

        // 6. Blinking Turn Indicators
        const blink = Math.floor(performance.now() / 320) % 2 === 0;
        const leftOn = (this.turnSignal === 'left' || this.turnSignal === 'hazard') && blink;
        this.turnLeftMaterials.forEach(m => m.color.setHex(leftOn ? 0xffaa00 : 0x442200));

        const rightOn = (this.turnSignal === 'right' || this.turnSignal === 'hazard') && blink;
        this.turnRightMaterials.forEach(m => m.color.setHex(rightOn ? 0xffaa00 : 0x442200));
    }
}

window.RealisticPlayerCar = RealisticPlayerCar;
