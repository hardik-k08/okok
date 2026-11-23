/**
 * DRIVE SMART - 3D Car Model & Component System
 * Realistic vehicle meshes with working steering wheels, brake lights,
 * headlights, turn signals, and interior cockpit for first-person driving.
 */

class CarModel {
    constructor(type = 'hatchback', color = '#d32f2f') {
        this.type = type;
        this.bodyColor = color;
        this.group = new THREE.Group();

        // References for dynamic components
        this.wheels = {
            frontLeft: null,
            frontRight: null,
            rearLeft: null,
            rearRight: null
        };
        this.wheelSpinAngle = 0;
        this.steerAngle = 0;

        // Interior & Controls
        this.steeringWheel = null;
        this.cockpitAnchor = new THREE.Object3D();
        this.chaseCamAnchor = new THREE.Object3D();
        this.bumperCamAnchor = new THREE.Object3D();

        // Lights
        this.headlights = [];
        this.spotlights = [];
        this.taillightMaterials = [];
        this.reverselightMaterials = [];
        this.leftIndicatorMaterials = [];
        this.rightIndicatorMaterials = [];

        // Materials
        this.bodyMaterial = null;
        this.glassMaterial = null;
        this.trimMaterial = null;
        this.chromeMaterial = null;

        this._initMaterials();
        this._buildCar();
    }

    _initMaterials() {
        this.bodyMaterial = new THREE.MeshStandardMaterial({
            color: this.bodyColor,
            metalness: 0.7,
            roughness: 0.25,
            envMapIntensity: 1.0
        });

        this.glassMaterial = new THREE.MeshPhysicalMaterial({
            color: 0x111e2e,
            transparent: true,
            opacity: 0.55,
            roughness: 0.1,
            metalness: 0.1,
            transmission: 0.7,
            ior: 1.5
        });

        this.trimMaterial = new THREE.MeshStandardMaterial({
            color: 0x1e2124,
            roughness: 0.7,
            metalness: 0.1
        });

        this.chromeMaterial = new THREE.MeshStandardMaterial({
            color: 0xeeeeee,
            metalness: 0.95,
            roughness: 0.1
        });
    }

    setColor(hexColor) {
        this.bodyColor = hexColor;
        if (this.bodyMaterial) {
            this.bodyMaterial.color.set(hexColor);
        }
    }

    _buildCar() {
        // Clear any prior children
        while (this.group.children.length > 0) {
            this.group.remove(this.group.children[0]);
        }

        const carGroup = new THREE.Group();

        // Dimensions based on type
        let length = 4.2, width = 1.85, height = 1.45, wheelbase = 2.5;
        if (this.type === 'sedan') {
            length = 4.6; width = 1.88; height = 1.42; wheelbase = 2.7;
        } else if (this.type === 'suv') {
            length = 4.5; width = 1.95; height = 1.70; wheelbase = 2.65;
        } else if (this.type === 'sport') {
            length = 4.4; width = 1.92; height = 1.28; wheelbase = 2.55;
        }

        // 1. Lower Chassis / Floorpan
        const floorGeo = new THREE.BoxGeometry(width - 0.1, 0.2, length - 0.2);
        const floor = new THREE.Mesh(floorGeo, this.trimMaterial);
        floor.position.y = 0.35;
        floor.castShadow = true;
        carGroup.add(floor);

        // 2. Main Body / Hood & Waistline
        const bodyGeo = new THREE.BoxGeometry(width, height * 0.45, length);
        const body = new THREE.Mesh(bodyGeo, this.bodyMaterial);
        body.position.y = 0.65;
        body.castShadow = true;
        body.receiveShadow = true;
        carGroup.add(body);

        // Front Hood Slope
        const hoodGeo = new THREE.BoxGeometry(width - 0.08, 0.18, length * 0.32);
        const hood = new THREE.Mesh(hoodGeo, this.bodyMaterial);
        hood.position.set(0, 0.82, length * 0.26);
        hood.rotation.x = -0.06;
        hood.castShadow = true;
        carGroup.add(hood);

        // Front Grille
        const grilleGeo = new THREE.BoxGeometry(width * 0.65, 0.25, 0.08);
        const grille = new THREE.Mesh(grilleGeo, this.trimMaterial);
        grille.position.set(0, 0.58, length * 0.5 + 0.02);
        carGroup.add(grille);

        // Front License Plate (Indian DL plate)
        const plateTex = TextureGen.getLicensePlateTexture('IND • DL 01 AC 8820');
        const plateMat = new THREE.MeshBasicMaterial({ map: plateTex });
        const plateGeo = new THREE.PlaneGeometry(0.85, 0.22);
        const frontPlate = new THREE.Mesh(plateGeo, plateMat);
        frontPlate.position.set(0, 0.42, length * 0.5 + 0.04);
        carGroup.add(frontPlate);

        // Rear License Plate
        const rearPlate = new THREE.Mesh(plateGeo, plateMat);
        rearPlate.position.set(0, 0.55, -length * 0.5 - 0.04);
        rearPlate.rotation.y = Math.PI;
        carGroup.add(rearPlate);

        // 3. Cabin & Glass Greenhouse
        const cabinWidth = width * 0.88;
        const cabinHeight = height * 0.48;
        const cabinLength = length * 0.52;
        const cabinZ = (this.type === 'sedan' || this.type === 'sport') ? -0.15 : -0.05;

        const cabinGeo = new THREE.BoxGeometry(cabinWidth, cabinHeight, cabinLength);
        const cabin = new THREE.Mesh(cabinGeo, this.bodyMaterial);
        cabin.position.set(0, 0.95 + cabinHeight * 0.45, cabinZ);
        cabin.castShadow = true;
        carGroup.add(cabin);

        // Windshield (Front)
        const wsWidth = cabinWidth * 0.92;
        const wsHeight = cabinHeight * 0.95;
        const wsGeo = new THREE.PlaneGeometry(wsWidth, wsHeight);
        const windshield = new THREE.Mesh(wsGeo, this.glassMaterial);
        windshield.position.set(0, 1.22, cabinZ + cabinLength * 0.5 + 0.02);
        windshield.rotation.x = 0.42; // Sleek slant
        carGroup.add(windshield);

        // Rear Windshield
        const rwsGeo = new THREE.PlaneGeometry(wsWidth, wsHeight * 0.9);
        const rearWindshield = new THREE.Mesh(rwsGeo, this.glassMaterial);
        rearWindshield.position.set(0, 1.20, cabinZ - cabinLength * 0.5 - 0.02);
        rearWindshield.rotation.x = -0.38;
        rearWindshield.rotation.y = Math.PI;
        carGroup.add(rearWindshield);

        // Side Windows (Left & Right)
        const sideWinGeo = new THREE.PlaneGeometry(cabinLength * 0.85, cabinHeight * 0.75);
        const leftWindow = new THREE.Mesh(sideWinGeo, this.glassMaterial);
        leftWindow.position.set(-cabinWidth * 0.5 - 0.01, 1.20, cabinZ);
        leftWindow.rotation.y = -Math.PI / 2;
        carGroup.add(leftWindow);

        const rightWindow = new THREE.Mesh(sideWinGeo, this.glassMaterial);
        rightWindow.position.set(cabinWidth * 0.5 + 0.01, 1.20, cabinZ);
        rightWindow.rotation.y = Math.PI / 2;
        carGroup.add(rightWindow);

        // 4. Roof Sign: "DRIVE SMART - L ACADEMY"
        const roofSignGroup = new THREE.Group();
        const signBoxGeo = new THREE.BoxGeometry(0.7, 0.22, 0.35);
        const signMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });
        const signBox = new THREE.Mesh(signBoxGeo, signMat);
        signBox.position.y = 0.11;
        roofSignGroup.add(signBox);

        // Red "L" decals on front and rear of roof box
        const lCanvas = document.createElement('canvas');
        lCanvas.width = 128; lCanvas.height = 128;
        const lCtx = lCanvas.getContext('2d');
        lCtx.fillStyle = '#ffffff';
        lCtx.fillRect(0, 0, 128, 128);
        lCtx.fillStyle = '#d32f2f';
        lCtx.font = '900 110px Arial';
        lCtx.textAlign = 'center';
        lCtx.textBaseline = 'middle';
        lCtx.fillText('L', 64, 64);
        const lTex = new THREE.CanvasTexture(lCanvas);
        const lMat = new THREE.MeshBasicMaterial({ map: lTex });

        const lPlateF = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 0.18), lMat);
        lPlateF.position.set(0, 0.11, 0.18);
        roofSignGroup.add(lPlateF);

        const lPlateB = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 0.18), lMat);
        lPlateB.position.set(0, 0.11, -0.18);
        lPlateB.rotation.y = Math.PI;
        roofSignGroup.add(lPlateB);

        roofSignGroup.position.set(0, 0.95 + cabinHeight * 0.95, cabinZ);
        carGroup.add(roofSignGroup);

        // 5. Headlights & Spotlights
        this._buildHeadlights(carGroup, width, length);

        // 6. Taillights & Reverse Lights
        this._buildTaillights(carGroup, width, length);

        // 7. Side Mirrors (Indian Right-Hand Drive setup: Driver on Right!)
        this._buildMirrors(carGroup, cabinWidth, cabinZ, cabinLength);

        // 8. Interior Cockpit (Steering Wheel, Dashboard, Rearview Mirror)
        this._buildCockpit(carGroup, cabinWidth, cabinZ, cabinLength);

        // 9. Wheels & Suspension Mounts
        this._buildWheels(carGroup, width, wheelbase);

        // 10. Camera Anchors
        // Cockpit camera anchor (Driver seat on Right side for Indian RHD - elevated for clear road sightline)
        this.cockpitAnchor.position.set(cabinWidth * 0.28, 1.30, cabinZ + 0.12);
        carGroup.add(this.cockpitAnchor);

        // Chase Cam Anchor (Behind and elevated)
        this.chaseCamAnchor.position.set(0, 2.2, -5.5);
        carGroup.add(this.chaseCamAnchor);

        // Bumper / Hood Cam Anchor
        this.bumperCamAnchor.position.set(0, 1.05, length * 0.38);
        carGroup.add(this.bumperCamAnchor);

        // Ground Contact Drop Shadow
        const shadowGeo = new THREE.PlaneGeometry(width * 1.05, length * 1.05);
        const shadowMat = new THREE.MeshBasicMaterial({
            color: 0x000000,
            transparent: true,
            opacity: 0.38
        });
        const dropShadow = new THREE.Mesh(shadowGeo, shadowMat);
        dropShadow.rotation.x = -Math.PI / 2;
        dropShadow.position.y = 0.02;
        carGroup.add(dropShadow);

        this.group.add(carGroup);
    }

    _buildHeadlights(parent, width, length) {
        this.headlights = [];
        this.spotlights = [];

        const hlGeo = new THREE.BoxGeometry(0.32, 0.14, 0.08);
        const hlMat = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            emissive: 0xeeffff,
            emissiveIntensity: 0.8,
            roughness: 0.1
        });

        // Left Headlight
        const hlLeft = new THREE.Mesh(hlGeo, hlMat);
        hlLeft.position.set(-width * 0.36, 0.72, length * 0.5 + 0.01);
        parent.add(hlLeft);
        this.headlights.push(hlMat);

        // Right Headlight
        const hlRight = new THREE.Mesh(hlGeo, hlMat);
        hlRight.position.set(width * 0.36, 0.72, length * 0.5 + 0.01);
        parent.add(hlRight);
        this.headlights.push(hlMat);

        // Spotlight projectors for night driving!
        const spotL = new THREE.SpotLight(0xfffaed, 2.8, 45, Math.PI / 6, 0.4, 1.2);
        spotL.position.set(-width * 0.36, 0.72, length * 0.5 + 0.1);
        const targetL = new THREE.Object3D();
        targetL.position.set(-width * 0.36, 0.1, length * 0.5 + 20);
        parent.add(spotL);
        parent.add(targetL);
        spotL.target = targetL;
        this.spotlights.push(spotL);

        const spotR = new THREE.SpotLight(0xfffaed, 2.8, 45, Math.PI / 6, 0.4, 1.2);
        spotR.position.set(width * 0.36, 0.72, length * 0.5 + 0.1);
        const targetR = new THREE.Object3D();
        targetR.position.set(width * 0.36, 0.1, length * 0.5 + 20);
        parent.add(spotR);
        parent.add(targetR);
        spotR.target = targetR;
        this.spotlights.push(spotR);

        // Front Turn Indicators (Amber)
        const indGeo = new THREE.BoxGeometry(0.12, 0.12, 0.08);
        const indMatL = new THREE.MeshStandardMaterial({
            color: 0xffaa00,
            emissive: 0xff8800,
            emissiveIntensity: 0.0
        });
        const indL = new THREE.Mesh(indGeo, indMatL);
        indL.position.set(-width * 0.46, 0.72, length * 0.48);
        parent.add(indL);
        this.leftIndicatorMaterials.push(indMatL);

        const indMatR = new THREE.MeshStandardMaterial({
            color: 0xffaa00,
            emissive: 0xff8800,
            emissiveIntensity: 0.0
        });
        const indR = new THREE.Mesh(indGeo, indMatR);
        indR.position.set(width * 0.46, 0.72, length * 0.48);
        parent.add(indR);
        this.rightIndicatorMaterials.push(indMatR);
    }

    _buildTaillights(parent, width, length) {
        this.taillightMaterials = [];
        this.reverselightMaterials = [];

        const tlGeo = new THREE.BoxGeometry(0.35, 0.14, 0.08);

        // Left Taillight
        const tlMatL = new THREE.MeshStandardMaterial({
            color: 0xaa1111,
            emissive: 0x550000,
            emissiveIntensity: 0.4
        });
        const tlLeft = new THREE.Mesh(tlGeo, tlMatL);
        tlLeft.position.set(-width * 0.36, 0.76, -length * 0.5 - 0.01);
        parent.add(tlLeft);
        this.taillightMaterials.push(tlMatL);

        // Right Taillight
        const tlMatR = new THREE.MeshStandardMaterial({
            color: 0xaa1111,
            emissive: 0x550000,
            emissiveIntensity: 0.4
        });
        const tlRight = new THREE.Mesh(tlGeo, tlMatR);
        tlRight.position.set(width * 0.36, 0.76, -length * 0.5 - 0.01);
        parent.add(tlRight);
        this.taillightMaterials.push(tlMatR);

        // Reverse Lights (White)
        const revGeo = new THREE.BoxGeometry(0.12, 0.10, 0.08);
        const revMat = new THREE.MeshStandardMaterial({
            color: 0xcccccc,
            emissive: 0x000000,
            emissiveIntensity: 0
        });
        const revL = new THREE.Mesh(revGeo, revMat);
        revL.position.set(-width * 0.22, 0.76, -length * 0.5 - 0.01);
        parent.add(revL);
        const revR = new THREE.Mesh(revGeo, revMat);
        revR.position.set(width * 0.22, 0.76, -length * 0.5 - 0.01);
        parent.add(revR);
        this.reverselightMaterials.push(revMat);

        // Rear Turn Indicators
        const indMatRearL = new THREE.MeshStandardMaterial({
            color: 0xffaa00,
            emissive: 0xff8800,
            emissiveIntensity: 0.0
        });
        const rIndL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.08), indMatRearL);
        rIndL.position.set(-width * 0.46, 0.76, -length * 0.48);
        parent.add(rIndL);
        this.leftIndicatorMaterials.push(indMatRearL);

        const indMatRearR = new THREE.MeshStandardMaterial({
            color: 0xffaa00,
            emissive: 0xff8800,
            emissiveIntensity: 0.0
        });
        const rIndR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.08), indMatRearR);
        rIndR.position.set(width * 0.46, 0.76, -length * 0.48);
        parent.add(rIndR);
        this.rightIndicatorMaterials.push(indMatRearR);
    }

    _buildMirrors(parent, cabinWidth, cabinZ, cabinLength) {
        const mirrorGeo = new THREE.BoxGeometry(0.24, 0.14, 0.1);
        const glassGeo = new THREE.PlaneGeometry(0.2, 0.11);
        const glassMat = new THREE.MeshStandardMaterial({
            color: 0xccddee,
            metalness: 0.9,
            roughness: 0.1
        });

        // Right Mirror (Driver side in India!)
        const mirrorR = new THREE.Mesh(mirrorGeo, this.trimMaterial);
        mirrorR.position.set(cabinWidth * 0.55 + 0.12, 1.05, cabinZ + cabinLength * 0.38);
        const mGlassR = new THREE.Mesh(glassGeo, glassMat);
        mGlassR.position.set(0, 0, -0.055);
        mGlassR.rotation.y = Math.PI - 0.1;
        mirrorR.add(mGlassR);
        parent.add(mirrorR);

        // Left Mirror
        const mirrorL = new THREE.Mesh(mirrorGeo, this.trimMaterial);
        mirrorL.position.set(-cabinWidth * 0.55 - 0.12, 1.05, cabinZ + cabinLength * 0.38);
        const mGlassL = new THREE.Mesh(glassGeo, glassMat);
        mGlassL.position.set(0, 0, -0.055);
        mGlassL.rotation.y = Math.PI + 0.1;
        mirrorL.add(mGlassL);
        parent.add(mirrorL);
    }

    _buildCockpit(parent, cabinWidth, cabinZ, cabinLength) {
        // Dashboard console
        const dashGeo = new THREE.BoxGeometry(cabinWidth * 0.92, 0.35, 0.45);
        const dash = new THREE.Mesh(dashGeo, this.trimMaterial);
        dash.position.set(0, 0.95, cabinZ + cabinLength * 0.36);
        parent.add(dash);

        // Steering Wheel (Right-hand drive, centered on right side X = +0.28)
        const wheelGroup = new THREE.Group();
        const torusGeo = new THREE.TorusGeometry(0.18, 0.024, 12, 24);
        const wheelRim = new THREE.Mesh(torusGeo, this.trimMaterial);
        wheelGroup.add(wheelRim);

        // Spokes and hub
        const spokeGeo = new THREE.BoxGeometry(0.34, 0.03, 0.02);
        const spoke = new THREE.Mesh(spokeGeo, this.chromeMaterial);
        wheelGroup.add(spoke);
        const hubGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.04, 16);
        hubGeo.rotateX(Math.PI / 2);
        const hub = new THREE.Mesh(hubGeo, this.trimMaterial);
        wheelGroup.add(hub);

        wheelGroup.position.set(cabinWidth * 0.28, 1.06, cabinZ + cabinLength * 0.22);
        wheelGroup.rotation.x = -0.35; // Tilted toward driver
        parent.add(wheelGroup);
        this.steeringWheel = wheelGroup;

        // Rearview Mirror inside windshield
        const rvGeo = new THREE.BoxGeometry(0.24, 0.07, 0.03);
        const rvMirror = new THREE.Mesh(rvGeo, this.trimMaterial);
        rvMirror.position.set(0, 1.42, cabinZ + cabinLength * 0.42);
        parent.add(rvMirror);

        // Driver Seat
        const seatGeo = new THREE.BoxGeometry(0.48, 0.45, 0.45);
        const seatMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.9 });
        const driverSeat = new THREE.Mesh(seatGeo, seatMat);
        driverSeat.position.set(cabinWidth * 0.28, 0.55, cabinZ);
        parent.add(driverSeat);

        // Driver Seatback
        const backGeo = new THREE.BoxGeometry(0.46, 0.65, 0.12);
        const seatBack = new THREE.Mesh(backGeo, seatMat);
        seatBack.position.set(cabinWidth * 0.28, 0.95, cabinZ - 0.22);
        seatBack.rotation.x = -0.15;
        parent.add(seatBack);

        // Passenger Seat (Left side)
        const passSeat = new THREE.Mesh(seatGeo, seatMat);
        passSeat.position.set(-cabinWidth * 0.28, 0.55, cabinZ);
        parent.add(passSeat);

        const passSeatBack = new THREE.Mesh(backGeo, seatMat);
        passSeatBack.position.set(-cabinWidth * 0.28, 0.95, cabinZ - 0.22);
        passSeatBack.rotation.x = -0.15;
        parent.add(passSeatBack);
    }

    _buildWheels(parent, width, wheelbase) {
        const radius = 0.34;
        const thickness = 0.22;
        const wheelTex = TextureGen.getWheelTexture();

        const createWheelMesh = () => {
            const group = new THREE.Group();

            // Cylinder wheel
            const geo = new THREE.CylinderGeometry(radius, radius, thickness, 24);
            geo.rotateZ(Math.PI / 2);

            // Disc faces with wheel rim texture
            const materials = [
                new THREE.MeshStandardMaterial({ color: 0x18191a, roughness: 0.8 }), // tread
                new THREE.MeshStandardMaterial({ map: wheelTex, roughness: 0.4, metalness: 0.6 }), // outside rim face
                new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 }) // inside face
            ];

            const mesh = new THREE.Mesh(geo, materials);
            mesh.castShadow = true;
            group.add(mesh);
            return { pivot: group, mesh };
        };

        const halfW = width * 0.48;
        const halfL = wheelbase * 0.5;

        // Front Left
        const fl = createWheelMesh();
        fl.pivot.position.set(-halfW, radius, halfL);
        parent.add(fl.pivot);
        this.wheels.frontLeft = fl;

        // Front Right
        const fr = createWheelMesh();
        fr.pivot.position.set(halfW, radius, halfL);
        // Outside rim faces outward
        fr.mesh.rotation.y = Math.PI;
        parent.add(fr.pivot);
        this.wheels.frontRight = fr;

        // Rear Left
        const rl = createWheelMesh();
        rl.pivot.position.set(-halfW, radius, -halfL);
        parent.add(rl.pivot);
        this.wheels.rearLeft = rl;

        // Rear Right
        const rr = createWheelMesh();
        rr.pivot.position.set(halfW, radius, -halfL);
        rr.mesh.rotation.y = Math.PI;
        parent.add(rr.pivot);
        this.wheels.rearRight = rr;
    }

    update(speed, steerInput, isBraking, isReversing, turnSignalState = 'none', headlightsOn = false) {
        // 1. Wheel spin proportional to speed (distance = speed * dt)
        this.wheelSpinAngle += (speed * 0.05);

        if (this.wheels.frontLeft) {
            this.wheels.frontLeft.mesh.rotation.x = this.wheelSpinAngle;
            this.wheels.frontRight.mesh.rotation.x = -this.wheelSpinAngle; // mirrored
            this.wheels.rearLeft.mesh.rotation.x = this.wheelSpinAngle;
            this.wheels.rearRight.mesh.rotation.x = -this.wheelSpinAngle; // mirrored

            // Front wheel steering pivot
            this.steerAngle = THREE.MathUtils.lerp(this.steerAngle, -steerInput * 0.55, 0.2);
            this.wheels.frontLeft.pivot.rotation.y = this.steerAngle;
            this.wheels.frontRight.pivot.rotation.y = this.steerAngle;
        }

        // 2. Cockpit Steering Wheel Sync
        if (this.steeringWheel) {
            // Rotates up to +/- 180 degrees (PI radians) for realistic full-lock steering
            this.steeringWheel.rotation.z = -steerInput * Math.PI * 0.85;
        }

        // 3. Headlights & Spotlights
        this.spotlights.forEach(spot => {
            spot.intensity = headlightsOn ? 2.8 : 0.0;
        });
        this.headlights.forEach(mat => {
            mat.emissiveIntensity = headlightsOn ? 1.0 : 0.2;
        });

        // 4. Brake Lights
        const brakeIntensity = isBraking ? 1.5 : (headlightsOn ? 0.35 : 0.08);
        const brakeColor = isBraking ? 0xff0000 : 0xaa0000;
        this.taillightMaterials.forEach(mat => {
            mat.emissive.setHex(brakeColor);
            mat.emissiveIntensity = brakeIntensity;
        });

        // 5. Reverse Lights
        this.reverselightMaterials.forEach(mat => {
            mat.emissive.setHex(isReversing ? 0xffffff : 0x000000);
            mat.emissiveIntensity = isReversing ? 1.2 : 0;
        });

        // 6. Turn Indicators Blinking (left, right, hazard)
        const blinkOn = (Math.floor(performance.now() / 350) % 2 === 0);

        const leftActive = (turnSignalState === 'left' || turnSignalState === 'hazard') && blinkOn;
        this.leftIndicatorMaterials.forEach(mat => {
            mat.emissiveIntensity = leftActive ? 1.8 : 0.0;
        });

        const rightActive = (turnSignalState === 'right' || turnSignalState === 'hazard') && blinkOn;
        this.rightIndicatorMaterials.forEach(mat => {
            mat.emissiveIntensity = rightActive ? 1.8 : 0.0;
        });
    }
}

window.CarModel = CarModel;
