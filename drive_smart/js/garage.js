/**
 * DRIVE SMART - Garage & Vehicle Customization System
 * Allows selecting car models, colors, viewing specifications,
 * and rotating vehicles on a 3D showroom turntable.
 */

class GarageSystem {
    constructor(game) {
        this.game = game;

        this.cars = {
            hatchback: {
                id: 'hatchback',
                name: 'Swift Learner',
                category: 'Compact Hatchback',
                description: 'Lightweight and responsive with outstanding visibility. The recommended vehicle for beginner drivers.',
                specs: {
                    topSpeed: 100,     // km/h
                    acceleration: 15.0, // m/s^2
                    handling: 4.2,      // steer speed
                    braking: 24.0       // m/s^2
                }
            },
            sedan: {
                id: 'sedan',
                name: 'City Cruiser',
                category: 'Executive Sedan',
                description: 'Smooth handling with extended wheelbase. Offers exceptional stability for city commuting and highway driving.',
                specs: {
                    topSpeed: 120,
                    acceleration: 16.5,
                    handling: 3.6,
                    braking: 22.0
                }
            },
            suv: {
                id: 'suv',
                name: 'Urban Safari',
                category: 'Compact SUV',
                description: 'Elevated seating position with high ground clearance. Built to withstand rough road patches and obstacles with ease.',
                specs: {
                    topSpeed: 110,
                    acceleration: 13.5,
                    handling: 3.2,
                    braking: 20.0
                }
            },
            sport: {
                id: 'sport',
                name: 'Apex GT',
                category: 'Sport Coupe',
                description: 'Aerodynamic profile with firm sports suspension. Delivers razor-sharp steering and rapid throttle response.',
                specs: {
                    topSpeed: 140,
                    acceleration: 20.0,
                    handling: 4.5,
                    braking: 28.0
                }
            }
        };

        this.colors = [
            { name: 'Crimson Red', hex: '#d32f2f' },
            { name: 'Royal Blue', hex: '#1d4ed8' },
            { name: 'Pearl White', hex: '#f8fafc' },
            { name: 'Stealth Onyx', hex: '#18181b' },
            { name: 'Sunburst Yellow', hex: '#eab308' },
            { name: 'Racing Green', hex: '#15803d' }
        ];

        // Load saved choice
        const saved = StorageManager.getGarage();
        this.selectedCarId = saved.selectedCar || 'hatchback';
        this.selectedColor = saved.selectedColor || '#d32f2f';

        // 3D Turntable Scene
        this.turntableCar = null;
        this.turntableGroup = new THREE.Group();
        this.turntableAngle = 0;
    }

    getCarInfo(carId) {
        return this.cars[carId] || this.cars.hatchback;
    }

    selectCar(carId) {
        if (!this.cars[carId]) return;
        this.selectedCarId = carId;
        StorageManager.saveGarage({
            selectedCar: this.selectedCarId,
            selectedColor: this.selectedColor
        });
        this.updateShowroomCar();
        this.game.applyVehicleSelection();
    }

    selectColor(hexColor) {
        this.selectedColor = hexColor;
        StorageManager.saveGarage({
            selectedCar: this.selectedCarId,
            selectedColor: this.selectedColor
        });
        if (this.turntableCar) {
            this.turntableCar.setColor(hexColor);
        }
        this.game.applyVehicleSelection();
    }

    setupShowroom(scene) {
        // Showroom studio floor
        const floorGeo = new THREE.PlaneGeometry(80, 80);
        const floorMat = new THREE.MeshStandardMaterial({
            color: 0x090d16,
            roughness: 0.2,
            metalness: 0.8
        });
        const floor = new THREE.Mesh(floorGeo, floorMat);
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = -0.21;
        floor.receiveShadow = true;
        this.turntableGroup.add(floor);

        // Showroom rotating platform
        const platGeo = new THREE.CylinderGeometry(4.5, 4.8, 0.4, 32);
        const platMat = new THREE.MeshStandardMaterial({
            color: 0x1e293b,
            metalness: 0.85,
            roughness: 0.25
        });
        const platform = new THREE.Mesh(platGeo, platMat);
        platform.position.y = -0.2;
        platform.receiveShadow = true;
        this.turntableGroup.add(platform);

        // Circular LED neon ring on platform edge
        const ringGeo = new THREE.TorusGeometry(4.55, 0.06, 12, 48);
        ringGeo.rotateX(Math.PI / 2);
        const ringMat = new THREE.MeshStandardMaterial({
            color: 0x38bdf8,
            emissive: 0x0284c7,
            emissiveIntensity: 2.5
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.position.y = 0.01;
        this.turntableGroup.add(ring);

        // Overhead studio spotlight
        const studioSpot = new THREE.SpotLight(0xffffff, 3.5, 30, Math.PI / 4, 0.3, 1.0);
        studioSpot.position.set(0, 12, 0);
        studioSpot.target.position.set(0, 0, 0);
        this.turntableGroup.add(studioSpot);
        this.turntableGroup.add(studioSpot.target);

        this.turntableGroup.position.set(0, 0, 0);
        scene.add(this.turntableGroup);

        this.updateShowroomCar();
    }

    updateShowroomCar() {
        if (this.turntableCar) {
            this.turntableGroup.remove(this.turntableCar.group);
        }
        this.turntableCar = new CarModel(this.selectedCarId, this.selectedColor);
        this.turntableGroup.add(this.turntableCar.group);
    }

    update(dt) {
        if (this.turntableGroup && this.turntableCar) {
            this.turntableAngle += dt * 0.45;
            this.turntableCar.group.rotation.y = this.turntableAngle;
        }
    }

    showTurntable(visible) {
        this.turntableGroup.visible = visible;
    }
}

window.GarageSystem = GarageSystem;
