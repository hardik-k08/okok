/**
 * DRIVE SMART - Master Game Controller
 * Manages Three.js WebGL rendering, camera rigs, physics loop,
 * audio integration, state management, and user interaction.
 */

class DriveSmartGame {
    constructor() {
        this.container = document.getElementById('game-container');
        this.clock = new THREE.Clock();
        this.isPlaying = false;
        this.isPaused = false;

        // Camera Modes
        this.cameraModes = ['chase', 'cockpit', 'close', 'overhead'];
        this.currentCamIndex = 0; // default chase
        this.headlightsOn = false;
        this.turnSignalState = 'none'; // 'none', 'left', 'right', 'hazard'

        // Three.js Core
        this.scene = null;
        this.camera = null;
        this.renderer = null;

        // Core Subsystems
        this.physics = null;
        this.playerCar = null;
        this.environment = null;
        this.garage = null;
        this.levelManager = null;
        this.ui = null;

        this.init();
    }

    init() {
        // 1. Scene & Camera
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(
            60,
            window.innerWidth / window.innerHeight,
            0.1,
            800
        );

        // 2. Renderer (Optimized for standard laptops)
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            powerPreference: 'high-performance',
            stencil: false
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)); // optimized pixel ratio
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.05;
        this.container.appendChild(this.renderer.domElement);

        // 3. Subsystems Initialization
        this.physics = new VehiclePhysics();
        this.environment = new GameEnvironment(this.scene);
        this.garage = new GarageSystem(this);
        this.levelManager = new LevelManager(this);
        this.ui = new UIManager(this);

        // Apply saved settings
        const settings = StorageManager.getSettings();
        this.environment.setTimeOfDay(settings.timeOfDay || 'day');
        this.environment.setWeather(settings.weather || 'clear');

        // 4. Create Player Car
        this.applyVehicleSelection();

        // 5. Setup Showroom turntable for garage
        this.garage.setupShowroom(this.scene);
        this.garage.showTurntable(false);

        // 6. Window Resize Handler
        window.addEventListener('resize', () => this.onWindowResize());

        // 7. Start Render Loop
        this.animate = this.animate.bind(this);
        requestAnimationFrame(this.animate);
    }

    applyVehicleSelection() {
        if (this.playerCar) {
            this.scene.remove(this.playerCar.group);
        }
        const carId = this.garage.selectedCarId;
        const color = this.garage.selectedColor;
        this.playerCar = new CarModel(carId, color);
        this.scene.add(this.playerCar.group);

        const specs = this.garage.getCarInfo(carId).specs;
        this.physics.setSpecs(specs);
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    startLevel(levelIndex) {
        window.soundEngine.init();
        window.soundEngine.resume();

        this.isPlaying = true;
        this.isPaused = false;
        this.garage.showTurntable(false);

        // Switch to game HUD
        this.ui.showScreen('hud');

        // Load level geometry & entities
        this.levelManager.loadLevel(levelIndex);

        // Reset camera index to Chase
        this.currentCamIndex = 0;
        this.ui.updateCameraLabel('Chase View [C]');
    }

    togglePause() {
        if (!this.isPlaying) return;
        this.isPaused = !this.isPaused;
        const modal = document.getElementById('pause-modal');
        if (this.isPaused) {
            modal.classList.remove('hidden');
        } else {
            modal.classList.add('hidden');
        }
    }

    exitToMainMenu() {
        this.isPlaying = false;
        this.isPaused = false;
        document.querySelectorAll('.modal-overlay').forEach(m => m.classList.add('hidden'));
        this.ui.showScreen('mainMenu');
        this.garage.showTurntable(false);

        // Default menu camera
        this.camera.position.set(0, 15, 25);
        this.camera.lookAt(0, 0, 0);
    }

    showGarageTurntable(show) {
        this.garage.showTurntable(show);
        if (show) {
            // Position camera for showroom turntable
            this.camera.position.set(5.5, 2.8, 6.5);
            this.camera.lookAt(0, 0.9, 0);
        }
    }

    cycleCamera() {
        this.currentCamIndex = (this.currentCamIndex + 1) % this.cameraModes.length;
        const mode = this.cameraModes[this.currentCamIndex];
        const labels = {
            chase: 'Chase Cam [C]',
            cockpit: 'Cockpit / 1st-Person [C]',
            close: 'Close Bumper Cam [C]',
            overhead: 'Top-Down Radar [C]'
        };
        this.ui.updateCameraLabel(labels[mode]);
    }

    resetCarPosition() {
        // Re-align car safely on left side of track
        this.physics.velocity = 0;
        this.physics.heading = 0;
        this.physics.pitch = 0;
        this.physics.roll = 0;
        this.ui.showInstructorSpeech("Vehicle reset to upright driving position.", 'info');
    }

    toggleTurnSignal(direction) {
        if (this.turnSignalState === direction) {
            this.turnSignalState = 'none';
        } else {
            this.turnSignalState = direction;
            window.soundEngine.playTurnSignalClick(true);
        }
    }

    toggleHeadlights() {
        this.headlightsOn = !this.headlightsOn;
        this.ui.showInstructorSpeech(this.headlightsOn ? "Headlights ON" : "Headlights OFF", 'info');
    }

    updateCamera(dt) {
        if (!this.playerCar) return;

        const mode = this.cameraModes[this.currentCamIndex];
        const carPos = this.physics.position;
        const heading = this.physics.heading;

        if (mode === 'chase') {
            // Smooth trailing chase camera
            const dist = 6.0;
            const height = 2.4;
            const targetCamPos = new THREE.Vector3(
                carPos.x - Math.sin(heading) * dist,
                carPos.y + height,
                carPos.z - Math.cos(heading) * dist
            );

            this.camera.position.lerp(targetCamPos, dt * 7.0);

            // Look slightly ahead of car
            const lookTarget = new THREE.Vector3(
                carPos.x + Math.sin(heading) * 4.0,
                carPos.y + 1.2,
                carPos.z + Math.cos(heading) * 4.0
            );
            this.camera.lookAt(lookTarget);

        } else if (mode === 'close') {
            // Tight bumper / chase camera
            const dist = 4.2;
            const height = 1.6;
            const targetCamPos = new THREE.Vector3(
                carPos.x - Math.sin(heading) * dist,
                carPos.y + height,
                carPos.z - Math.cos(heading) * dist
            );
            this.camera.position.lerp(targetCamPos, dt * 10.0);
            const lookTarget = new THREE.Vector3(
                carPos.x + Math.sin(heading) * 6.0,
                carPos.y + 1.0,
                carPos.z + Math.cos(heading) * 6.0
            );
            this.camera.lookAt(lookTarget);

        } else if (mode === 'cockpit') {
            // First-person driver view (Indian Right-Hand Drive seat!)
            const worldAnchor = new THREE.Vector3();
            this.playerCar.cockpitAnchor.getWorldPosition(worldAnchor);
            this.camera.position.copy(worldAnchor);

            // Look forward through windshield
            const lookTarget = new THREE.Vector3(
                carPos.x + Math.sin(heading) * 18.0,
                carPos.y + 1.2,
                carPos.z + Math.cos(heading) * 18.0
            );
            this.camera.lookAt(lookTarget);

        } else if (mode === 'overhead') {
            // Overhead top-down tactical / parking camera
            const targetCamPos = new THREE.Vector3(carPos.x, carPos.y + 20, carPos.z);
            this.camera.position.lerp(targetCamPos, dt * 8.0);
            this.camera.lookAt(carPos.x, 0, carPos.z);
        }
    }

    animate() {
        requestAnimationFrame(this.animate);

        const dt = Math.min(this.clock.getDelta(), 0.05);

        if (this.isPlaying && !this.isPaused) {
            // 1. Update Physics
            this.physics.update(dt);

            // 2. Sync Car Visual Mesh
            this.playerCar.group.position.copy(this.physics.position);
            this.playerCar.group.rotation.y = this.physics.heading;
            this.playerCar.group.rotation.x = this.physics.pitch;
            this.playerCar.group.rotation.z = this.physics.roll;

            // 3. Update Car Model internals (wheels, steering wheel, lights)
            this.playerCar.update(
                this.physics.velocity,
                this.physics.steerInput,
                this.physics.isBraking,
                this.physics.isReversing,
                this.turnSignalState,
                this.headlightsOn
            );

            // 4. Update Environment & Dynamic Weather
            this.environment.update(dt);

            // 5. Update Level Logic & Objectives
            this.levelManager.update(dt);

            // 6. Update Audio Engine
            const rpmRatio = (this.physics.rpm - 800) / 5700;
            window.soundEngine.updateEngine(rpmRatio, this.physics.throttle, this.physics.isBraking);
            window.soundEngine.updateSkid(this.physics.skidIntensity);

            // 7. Update HUD Gauges & Radar
            const speedKmh = Math.abs(this.physics.velocity * 3.6);
            this.ui.updateHUD(
                speedKmh,
                this.physics.rpm,
                this.physics.gear,
                this.physics.totalDistance,
                this.turnSignalState
            );

            // 8. Update Camera Position & Orientation
            this.updateCamera(dt);

        } else if (!this.isPlaying) {
            // Showroom Turntable Animation if in garage or menu
            this.garage.update(dt);
        }

        // Render Frame
        this.renderer.render(this.scene, this.camera);
    }
}

// Global start
window.addEventListener('DOMContentLoaded', () => {
    window.game = new DriveSmartGame();
});
