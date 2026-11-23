/**
 * DRIVE SMART - Connected 3D Road Network Engine
 * Builds a realistic urban road network with curves, 4-way intersections,
 * 2-lane circular roundabout, Indian left-hand road markings, zebra crosswalks,
 * curbs, and seamless road junctions.
 */

class RoadNetwork {
    constructor(scene) {
        this.scene = scene;
        this.group = new THREE.Group();
        this.scene.add(this.group);

        // Materials (Optimized standard materials, zero external textures)
        this.asphaltMat = new THREE.MeshLambertMaterial({ color: 0x22262a });
        this.yellowMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
        this.whiteMat = new THREE.MeshBasicMaterial({ color: 0xf8fafc });
        this.curbMat = new THREE.MeshLambertMaterial({ color: 0x94a3b8 });
        this.sidewalkMat = new THREE.MeshLambertMaterial({ color: 0x64748b });
        this.grassMat = new THREE.MeshLambertMaterial({ color: 0x3d7e42 });

        // Build entire connected network
        this._buildNetwork();
    }

    _buildNetwork() {
        // 1. South Main Avenue: from z = -160 to z = 76 (width = 14m)
        this._buildStraightRoad(0, -42, 14, 236, 0);

        // 2. Central Roundabout: center at (0, 100), outer R = 24m, inner R = 13m
        this._buildRoundabout(0, 100, 13, 25);

        // 3. North Boulevard: from z = 124 to z = 260
        this._buildStraightRoad(0, 192, 14, 136, 0);

        // 4. North 4-Way Cross Intersection at (0, 270)
        this._buildIntersection(0, 270, 14);

        // 5. East Branch Road: leaves roundabout towards X = +120
        this._buildStraightRoad(72, 100, 12, 96, Math.PI / 2);

        // 6. West Branch Road: leaves roundabout towards X = -120
        this._buildStraightRoad(-72, 100, 12, 96, Math.PI / 2);

        // 7. East Connecting Curved Loop: connects East Branch to North Junction
        this._buildCurveArc(120, 200, 60, Math.PI * 1.5, Math.PI * 2, 12);
        this._buildStraightRoad(120, 150, 12, 100, 0);

        // 8. Ground Terrain
        const ground = new THREE.Mesh(new THREE.PlaneGeometry(1200, 1200), this.grassMat);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -0.06;
        ground.receiveShadow = true;
        this.group.add(ground);
    }

    _buildStraightRoad(x, z, width, length, rotation = 0) {
        const roadGroup = new THREE.Group();

        // Asphalt Surface
        const road = new THREE.Mesh(new THREE.PlaneGeometry(width, length), this.asphaltMat);
        road.rotation.x = -Math.PI / 2;
        road.receiveShadow = true;
        roadGroup.add(road);

        // Double Yellow Center Line (Indian Left-Hand Rule: vehicles stay on left side)
        const lineGeo = new THREE.PlaneGeometry(0.2, length);
        const yLine1 = new THREE.Mesh(lineGeo, this.yellowMat);
        yLine1.rotation.x = -Math.PI / 2;
        yLine1.position.set(-0.25, 0.01, 0);
        roadGroup.add(yLine1);

        const yLine2 = new THREE.Mesh(lineGeo, this.yellowMat);
        yLine2.rotation.x = -Math.PI / 2;
        yLine2.position.set(0.25, 0.01, 0);
        roadGroup.add(yLine2);

        // White Outer Boundary Lines
        const edgeGeo = new THREE.PlaneGeometry(0.24, length);
        const edgeL = new THREE.Mesh(edgeGeo, this.whiteMat);
        edgeL.rotation.x = -Math.PI / 2;
        edgeL.position.set(-width * 0.5 + 0.35, 0.01, 0);
        roadGroup.add(edgeL);

        const edgeR = new THREE.Mesh(edgeGeo, this.whiteMat);
        edgeR.rotation.x = -Math.PI / 2;
        edgeR.position.set(width * 0.5 - 0.35, 0.01, 0);
        roadGroup.add(edgeR);

        // Dashed Lane Dividers
        const dashGeo = new THREE.PlaneGeometry(0.18, 3.2);
        const halfL = length * 0.5;
        for (let lz = -halfL + 6; lz < halfL - 6; lz += 8.5) {
            const dashL = new THREE.Mesh(dashGeo, this.whiteMat);
            dashL.rotation.x = -Math.PI / 2;
            dashL.position.set(-width * 0.28, 0.01, lz);
            roadGroup.add(dashL);

            const dashR = new THREE.Mesh(dashGeo, this.whiteMat);
            dashR.rotation.x = -Math.PI / 2;
            dashR.position.set(width * 0.28, 0.01, lz);
            roadGroup.add(dashR);
        }

        // Sidewalks & Curbs
        const curbGeo = new THREE.BoxGeometry(0.4, 0.22, length);
        const curbL = new THREE.Mesh(curbGeo, this.curbMat);
        curbL.position.set(-width * 0.5 - 0.2, 0.1, 0);
        roadGroup.add(curbL);

        const curbR = new THREE.Mesh(curbGeo, this.curbMat);
        curbR.position.set(width * 0.5 + 0.2, 0.1, 0);
        roadGroup.add(curbR);

        const swGeo = new THREE.BoxGeometry(3.0, 0.16, length);
        const swL = new THREE.Mesh(swGeo, this.sidewalkMat);
        swL.position.set(-width * 0.5 - 1.9, 0.08, 0);
        roadGroup.add(swL);

        const swR = new THREE.Mesh(swGeo, this.sidewalkMat);
        swR.position.set(width * 0.5 + 1.9, 0.08, 0);
        roadGroup.add(swR);

        roadGroup.position.set(x, 0, z);
        roadGroup.rotation.y = rotation;
        this.group.add(roadGroup);
    }

    _buildRoundabout(cx, cz, innerRadius, outerRadius) {
        const roundGroup = new THREE.Group();

        // Circular Asphalt Ring
        const ringGeo = new THREE.RingGeometry(innerRadius, outerRadius, 48);
        const ring = new THREE.Mesh(ringGeo, this.asphaltMat);
        ring.rotation.x = -Math.PI / 2;
        ring.receiveShadow = true;
        roundGroup.add(ring);

        // Circular Dashed Lane Divider in Roundabout
        const midRadius = (innerRadius + outerRadius) * 0.5;
        const dashCount = 32;
        for (let i = 0; i < dashCount; i++) {
            if (i % 2 === 0) {
                const a1 = (i / dashCount) * Math.PI * 2;
                const a2 = ((i + 0.75) / dashCount) * Math.PI * 2;
                const segGeo = new THREE.RingGeometry(midRadius - 0.1, midRadius + 0.1, 8, 1, a1, a2 - a1);
                const seg = new THREE.Mesh(segGeo, this.whiteMat);
                seg.rotation.x = -Math.PI / 2;
                seg.position.y = 0.01;
                roundGroup.add(seg);
            }
        }

        // Outer Curb Ring
        const outerCurb = new THREE.Mesh(
            new THREE.RingGeometry(outerRadius, outerRadius + 0.5, 48),
            this.curbMat
        );
        outerCurb.rotation.x = -Math.PI / 2;
        outerCurb.position.y = 0.05;
        roundGroup.add(outerCurb);

        // Inner Island Curb Ring
        const innerCurb = new THREE.Mesh(
            new THREE.RingGeometry(innerRadius - 0.5, innerRadius, 48),
            this.curbMat
        );
        innerCurb.rotation.x = -Math.PI / 2;
        innerCurb.position.y = 0.05;
        roundGroup.add(innerCurb);

        // Center Landscaped Island
        const islandGeo = new THREE.CircleGeometry(innerRadius - 0.5, 36);
        const island = new THREE.Mesh(islandGeo, new THREE.MeshLambertMaterial({ color: 0x2e7d32 }));
        island.rotation.x = -Math.PI / 2;
        island.position.y = 0.1;
        roundGroup.add(island);

        // Monument / Fountain in Roundabout Center
        const baseGeo = new THREE.CylinderGeometry(3.5, 4.0, 0.8, 16);
        const baseMat = new THREE.MeshLambertMaterial({ color: 0xd1d5db });
        const monumentBase = new THREE.Mesh(baseGeo, baseMat);
        monumentBase.position.y = 0.5;
        roundGroup.add(monumentBase);

        const pillarGeo = new THREE.CylinderGeometry(0.8, 1.2, 5.5, 12);
        const monumentPillar = new THREE.Mesh(pillarGeo, new THREE.MeshLambertMaterial({ color: 0xf3f4f6 }));
        monumentPillar.position.y = 3.4;
        roundGroup.add(monumentPillar);

        // Indian Ashoka Emblem Style Golden Sphere Top
        const goldTop = new THREE.Mesh(
            new THREE.SphereGeometry(1.2, 16, 16),
            new THREE.MeshLambertMaterial({ color: 0xf59e0b })
        );
        goldTop.position.y = 6.8;
        roundGroup.add(goldTop);

        roundGroup.position.set(cx, 0, cz);
        this.group.add(roundGroup);
    }

    _buildIntersection(cx, cz, width) {
        const intGroup = new THREE.Group();

        // Center Box
        const box = new THREE.Mesh(new THREE.PlaneGeometry(width, width), this.asphaltMat);
        box.rotation.x = -Math.PI / 2;
        box.receiveShadow = true;
        intGroup.add(box);

        // Zebra Crosswalks on all 4 arms
        const createZebra = (dx, dz, rot) => {
            const zGroup = new THREE.Group();
            // Solid Stop Line
            const stopLine = new THREE.Mesh(new THREE.PlaneGeometry(width * 0.48, 0.6), this.whiteMat);
            stopLine.rotation.x = -Math.PI / 2;
            stopLine.position.set(-width * 0.24, 0.01, -3.2);
            zGroup.add(stopLine);

            // Zebra Stripes
            for (let x = -width * 0.45; x < width * 0.45; x += 1.2) {
                const stripe = new THREE.Mesh(new THREE.PlaneGeometry(0.65, 2.4), this.whiteMat);
                stripe.rotation.x = -Math.PI / 2;
                stripe.position.set(x + 0.3, 0.01, -1.2);
                zGroup.add(stripe);
            }
            zGroup.position.set(dx, 0, dz);
            zGroup.rotation.y = rot;
            intGroup.add(zGroup);
        };

        createZebra(0, -width * 0.5, 0);           // South arm
        createZebra(0, width * 0.5, Math.PI);      // North arm
        createZebra(-width * 0.5, 0, Math.PI / 2); // West arm
        createZebra(width * 0.5, 0, -Math.PI / 2); // East arm

        // Cross Road East-West through intersection
        const crossRoad = new THREE.Mesh(new THREE.PlaneGeometry(width, 160), this.asphaltMat);
        crossRoad.rotation.x = -Math.PI / 2;
        crossRoad.rotation.z = Math.PI / 2;
        crossRoad.receiveShadow = true;
        intGroup.add(crossRoad);

        intGroup.position.set(cx, 0, cz);
        this.group.add(intGroup);
    }

    _buildCurveArc(cx, cz, radius, startAngle, endAngle, width) {
        const curveGroup = new THREE.Group();
        const segments = 24;
        const angleSpan = endAngle - startAngle;

        for (let i = 0; i < segments; i++) {
            const a1 = startAngle + (i / segments) * angleSpan;
            const a2 = startAngle + ((i + 1) / segments) * angleSpan;
            const segGeo = new THREE.RingGeometry(radius - width * 0.5, radius + width * 0.5, 4, 1, a1, a2 - a1);
            const mesh = new THREE.Mesh(segGeo, this.asphaltMat);
            mesh.rotation.x = -Math.PI / 2;
            mesh.receiveShadow = true;
            curveGroup.add(mesh);

            // Center double yellow line arc
            const yGeo = new THREE.RingGeometry(radius - 0.2, radius + 0.2, 4, 1, a1, a2 - a1);
            const yMesh = new THREE.Mesh(yGeo, this.yellowMat);
            yMesh.rotation.x = -Math.PI / 2;
            yMesh.position.y = 0.01;
            curveGroup.add(yMesh);
        }

        curveGroup.position.set(cx, 0, cz);
        this.group.add(curveGroup);
    }
}

window.RoadNetwork = RoadNetwork;
