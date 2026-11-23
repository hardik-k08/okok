/**
 * DRIVE SMART - Lesson & Mission Definition Engine
 * Contains procedural environment layouts, objective trackers,
 * educational coaching prompts, and grading rubrics for Levels 1 through 5.
 */

class LevelManager {
    constructor(game) {
        this.game = game;
        this.currentLevelIndex = 1;
        this.score = 100;
        this.deductions = [];
        this.objectives = [];
        this.levelCompleted = false;
        this.levelFailed = false;
        this.levelTimer = 0;

        // Active level entities
        this.trafficLights = [];
        this.pedestrians = [];
        this.aiCars = [];
        this.checkpoints = [];
        this.parkingTarget = null;
        this.emergencyHazardTriggered = false;
    }

    loadLevel(levelIndex) {
        this.currentLevelIndex = levelIndex;
        this.score = 100;
        this.deductions = [];
        this.objectives = [];
        this.levelCompleted = false;
        this.levelFailed = false;
        this.levelTimer = 0;
        this.emergencyHazardTriggered = false;

        // Clear previous entities
        this._clearEntities();
        this.game.environment.clearWorld();

        switch (levelIndex) {
            case 1:
                this._setupLevel1_BasicDriving();
                break;
            case 2:
                this._setupLevel2_ObstacleAvoidance();
                break;
            case 3:
                this._setupLevel3_CityDriving();
                break;
            case 4:
                this._setupLevel4_ParkingAcademy();
                break;
            case 5:
                this._setupLevel5_DrivingAssessment();
                break;
            default:
                this._setupLevel1_BasicDriving();
        }

        // Initialize UI with objectives
        this.game.ui.updateObjectives(this.objectives);
        this.game.ui.updateScore(this.score);
    }

    _clearEntities() {
        this.trafficLights.forEach(tl => tl.destroy());
        this.trafficLights = [];
        this.pedestrians.forEach(p => p.destroy());
        this.pedestrians = [];
        this.aiCars.forEach(car => car.destroy());
        this.aiCars = [];
        this.checkpoints = [];
        this.parkingTarget = null;
    }

    deductPoints(points, reason, instructorAdvice) {
        if (this.levelCompleted || this.levelFailed) return;
        this.score = Math.max(0, this.score - points);
        this.deductions.push({ reason, points });
        this.game.ui.showDeductionNotification(`-${points} ${reason}`);
        this.game.ui.updateScore(this.score);
        window.soundEngine.playDeductionBuzzer();

        if (instructorAdvice) {
            this.game.ui.showInstructorSpeech(instructorAdvice, 'warning');
        }

        if (this.score < 50 && this.currentLevelIndex === 5) {
            this.failLevel("Score dropped below passing grade (50%).");
        }
    }

    awardPoints(points, reason) {
        this.score = Math.min(100, this.score + points);
        this.game.ui.showAwardNotification(`+${points} ${reason}`);
        this.game.ui.updateScore(this.score);
        window.soundEngine.playCheckChime();
    }

    checkObjective(index) {
        if (this.objectives[index] && !this.objectives[index].completed) {
            this.objectives[index].completed = true;
            this.game.ui.updateObjectives(this.objectives);
            window.soundEngine.playCheckChime();

            // Check if all objectives are completed
            const allDone = this.objectives.every(obj => obj.completed);
            if (allDone) {
                this.completeLevel();
            }
        }
    }

    completeLevel() {
        if (this.levelCompleted || this.levelFailed) return;
        this.levelCompleted = true;

        // Calculate stars
        let stars = 1;
        if (this.score >= 90) stars = 3;
        else if (this.score >= 75) stars = 2;

        // Save progress
        StorageManager.saveLevelProgress(this.currentLevelIndex, {
            completed: true,
            stars,
            score: this.score,
            time: Math.round(this.levelTimer)
        });

        this.game.ui.showLevelCompleteModal({
            level: this.currentLevelIndex,
            score: this.score,
            stars,
            time: Math.round(this.levelTimer),
            deductions: this.deductions
        });
    }

    failLevel(reason) {
        if (this.levelCompleted || this.levelFailed) return;
        this.levelFailed = true;
        this.game.ui.showGameOverModal(reason);
    }

    // ==========================================
    // LEVEL 1: BASIC DRIVING
    // ==========================================
    _setupLevel1_BasicDriving() {
        const env = this.game.environment;
        env.buildGround(300);
        env.setTimeOfDay('day');
        env.setWeather('clear');

        // Long straight training track
        env.buildRoad(0, 0, 220, 14, 0, 'straight');

        // Trees along track edges
        for (let z = -90; z <= 90; z += 25) {
            env.buildTree(-14, z, 1.1);
            env.buildTree(14, z, 1.1);
        }

        // Training Slalom Cones (Gates)
        const conePositions = [
            { x: -2.5, z: 20 },
            { x: 2.5, z: 45 },
            { x: -2.5, z: 70 },
            { x: 2.5, z: 95 }
        ];
        conePositions.forEach(pos => {
            env.buildTrafficCone(pos.x, pos.z);
        });

        // Yellow Stop Box at z = 125
        const stopBoxGeo = new THREE.PlaneGeometry(8, 6);
        const stopBoxMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b, transparent: true, opacity: 0.45 });
        const stopBox = new THREE.Mesh(stopBoxGeo, stopBoxMat);
        stopBox.rotation.x = -Math.PI / 2;
        stopBox.position.set(-3.5, 0.02, 125);
        env.worldGroup.add(stopBox);

        // Reversing Bay at z = 145 (car must reverse into it)
        const revBayGeo = new THREE.PlaneGeometry(4, 7);
        const revBayMat = new THREE.MeshBasicMaterial({ color: 0x3b82f6, transparent: true, opacity: 0.45 });
        const revBay = new THREE.Mesh(revBayGeo, revBayMat);
        revBay.rotation.x = -Math.PI / 2;
        revBay.position.set(-3.5, 0.02, 150);
        env.worldGroup.add(revBay);

        // Position car at starting bay
        this.game.physics.reset(new THREE.Vector3(-3.5, 0, -85), 0);

        this.objectives = [
            { text: "Accelerate gently with [W] to reach 30 km/h", completed: false },
            { text: "Steer with [A / D] through the slalom gates", completed: false },
            { text: "Brake smoothly with [S] to stop inside the yellow stop box", completed: false },
            { text: "Shift into Reverse with [S] and back up 15 meters cleanly", completed: false }
        ];

        this.game.ui.showInstructorSpeech(
            "Welcome to Drive Smart Academy! Let's master the basics: Press [W] to accelerate smoothly. Keep your car on the left side of the track.",
            'info'
        );
    }

    _updateLevel1(dt) {
        const speedKmh = Math.abs(this.game.physics.velocity * 3.6);
        const pos = this.game.physics.position;

        // Obj 0: Reach 30 km/h
        if (!this.objectives[0].completed && speedKmh >= 28) {
            this.checkObjective(0);
            this.game.ui.showInstructorSpeech("Good speed control! Now steer smoothly through the cone slalom ahead.", 'info');
        }

        // Obj 1: Passed slalom
        if (!this.objectives[1].completed && pos.z > 105) {
            // Check knocked cones
            const knocked = this.game.environment.cones.filter(c => c.isHit).length;
            if (knocked === 0) {
                this.awardPoints(10, "Clean Slalom Navigation");
            }
            this.checkObjective(1);
            this.game.ui.showInstructorSpeech("Excellent steering! Now brake progressively to stop inside the yellow stop box.", 'info');
        }

        // Obj 2: Stop in yellow box (z: 122 to 128, speed < 0.2)
        if (this.objectives[1].completed && !this.objectives[2].completed) {
            if (pos.z >= 120 && pos.z <= 130 && speedKmh < 0.5) {
                this.awardPoints(10, "Precise Braking Stop");
                this.checkObjective(2);
                this.game.ui.showInstructorSpeech("Perfect stop! Now hold [S] to shift into Reverse and back up 15 meters safely.", 'info');
            }
        }

        // Obj 3: Reverse 15 meters cleanly
        if (this.objectives[2].completed && !this.objectives[3].completed) {
            if (this.game.physics.isReversing && this.game.physics.velocity < -0.5) {
                if (pos.z <= 112) {
                    this.awardPoints(10, "Controlled Reversing");
                    this.checkObjective(3);
                }
            }
        }
    }

    // ==========================================
    // LEVEL 2: OBSTACLE AVOIDANCE
    // ==========================================
    _setupLevel2_ObstacleAvoidance() {
        const env = this.game.environment;
        env.buildGround(300);
        env.setTimeOfDay('day');
        env.setWeather('clear');

        // Track
        env.buildRoad(0, 0, 240, 14, 0, 'straight');

        // Cones Chicane at z = -20 to 20
        const chicane = [
            { x: -3.5, z: -20 },
            { x: -1.0, z: -10 },
            { x: -4.5, z: 0 },
            { x: -1.5, z: 10 },
            { x: -4.0, z: 20 }
        ];
        chicane.forEach(p => env.buildTrafficCone(p.x, p.z));

        // Potholes at z = 40 to 65
        env.buildPothole(-3.5, 42, 1.2);
        env.buildPothole(-1.5, 54, 1.0);
        env.buildPothole(-4.2, 66, 1.3);

        // Emergency Barrier ahead at z = 115 (hidden or marked)
        env.buildBarrier(-3.5, 120, 5.0, 0);

        // Parked delivery car at z = 150
        env.buildParkedCar(-3.5, 155, '#f59e0b', 0);

        // Road Signs
        env.buildRoadSign(-7.8, -40, 'limit40', 0);

        // Start car at z = -75
        this.game.physics.reset(new THREE.Vector3(-3.5, 0, -75), 0);

        this.objectives = [
            { text: "Navigate through the tight cone chicane without knocking cones", completed: false },
            { text: "Evade road potholes without driving over them", completed: false },
            { text: "Emergency Stop: Brake immediately when the hazard warning appears!", completed: false },
            { text: "Overtake the stationary parked vehicle safely with proper clearance", completed: false }
        ];

        this.game.ui.showInstructorSpeech(
            "Obstacle training! Scan ahead down the road. Maintain a steady speed of 30-35 km/h to react safely.",
            'info'
        );
    }

    _updateLevel2(dt) {
        const speedKmh = Math.abs(this.game.physics.velocity * 3.6);
        const pos = this.game.physics.position;

        // Obj 0: Chicane passed at z > 25
        if (!this.objectives[0].completed && pos.z > 25) {
            const hitCones = this.game.environment.cones.filter(c => c.isHit).length;
            if (hitCones === 0) {
                this.awardPoints(10, "Flawless Chicane Navigation");
            }
            this.checkObjective(0);
            this.game.ui.showInstructorSpeech("Watch out! Deep potholes on the road ahead. Steer around them early!", 'warning');
        }

        // Obj 1: Pothole section passed at z > 75
        if (this.objectives[0].completed && !this.objectives[1].completed && pos.z > 75) {
            this.checkObjective(1);
            this.game.ui.showInstructorSpeech("Stay alert! An unexpected road hazard could appear at any moment.", 'warning');
        }

        // Trigger Emergency Hazard Warning around z = 90
        if (!this.emergencyHazardTriggered && pos.z > 88) {
            this.emergencyHazardTriggered = true;
            this.game.ui.showEmergencyAlert("⚠️ EMERGENCY HAZARD AHEAD! BRAKE NOW! [SPACE / S]");
            window.soundEngine.playDeductionBuzzer();
        }

        // Obj 2: Stopped safely before barrier (z: 105 to 118, speed < 0.2)
        if (this.emergencyHazardTriggered && !this.objectives[2].completed) {
            if (speedKmh < 0.4 && pos.z >= 102 && pos.z < 118) {
                this.awardPoints(15, "Emergency Stop Success");
                this.checkObjective(2);
                this.game.ui.showInstructorSpeech("Superb emergency reaction! Now steer right to safely overtake the stationary vehicle.", 'info');
            }
        }

        // Obj 3: Overtake parked car at z > 165
        if (this.objectives[2].completed && !this.objectives[3].completed && pos.z > 168) {
            this.awardPoints(10, "Safe Vehicle Overtake");
            this.checkObjective(3);
        }
    }

    // ==========================================
    // LEVEL 3: CITY DRIVING & INDIAN TRAFFIC RULES
    // ==========================================
    _setupLevel3_CityDriving() {
        const env = this.game.environment;
        env.buildGround(400);
        env.setTimeOfDay('dusk');
        env.setWeather('clear');

        // Main 4-lane Avenue (Indian Left-Hand: Player drives on LEFT side of center line)
        env.buildRoad(0, 0, 260, 14, 0, 'straight');

        // Zebra Crossing at z = 30
        env.buildRoad(0, 30, 16, 14, 0, 'zebra');

        // Cross street at z = 90
        env.buildRoad(0, 90, 14, 80, Math.PI / 2, 'straight');

        // City Buildings flanking the avenue
        for (let z = -80; z <= 140; z += 35) {
            if (Math.abs(z - 90) > 20) {
                env.buildBuilding(-18, z, 14, 18, 22, 'office');
                env.buildBuilding(18, z, 14, 18, 28, 'residence');
            }
        }

        // Streetlights
        for (let z = -70; z <= 120; z += 30) {
            env.buildStreetLamp(-8.2, z, 0);
            env.buildStreetLamp(8.2, z, Math.PI);
        }

        // Road Signs: Speed Limit 40 & Keep Left (Indian Rule!)
        env.buildRoadSign(-8.2, -60, 'keep_left', 0);
        env.buildRoadSign(-8.2, -40, 'limit40', 0);
        env.buildRoadSign(-8.2, 10, 'pedestrian', 0);

        // Traffic Light at Intersection (z = 82)
        const tl = new TrafficLight(env.scene, -7.8, 82, 0, 'green');
        this.trafficLights.push(tl);

        // Animated Pedestrian crossing zebra crossing at z = 30
        const ped = new AnimatedPedestrian(env.scene, -6.5, 30, 6.5, 30, 1.4);
        this.pedestrians.push(ped);

        // AI Traffic Car driving on the opposite ONCOMING right lane (x = +3.5)
        const aiWps = [
            new THREE.Vector3(3.5, 0, 120),
            new THREE.Vector3(3.5, 0, -80)
        ];
        const aiCar = new AITrafficCar(env.scene, aiWps, 7.5, '#2563eb');
        this.aiCars.push(aiCar);

        // Player starts on the LEFT LANE (x = -3.5)
        this.game.physics.reset(new THREE.Vector3(-3.5, 0, -80), 0);

        this.objectives = [
            { text: "Maintain Left-Hand traffic discipline (Keep to the left lane)", completed: false },
            { text: "Obey 40 km/h city speed limit", completed: false },
            { text: "Yield to the pedestrian crossing at the zebra crosswalk", completed: false },
            { text: "Stop at the Red traffic light and proceed when Green", completed: false }
        ];

        this.game.ui.showInstructorSpeech(
            "Welcome to City Driving! In India, traffic drives strictly on the LEFT side of the road. Obey speed limits and traffic lights.",
            'info'
        );
    }

    _updateLevel3(dt) {
        const speedKmh = Math.abs(this.game.physics.velocity * 3.6);
        const pos = this.game.physics.position;

        // Indian Rule Check: Driving on wrong side of road (x > 0 for extended time)
        if (pos.x > 0.8) {
            this.game.physics.wrongLaneTimer += dt;
            if (this.game.physics.wrongLaneTimer > 2.0 && !this.game.physics.isWrongLane) {
                this.game.physics.isWrongLane = true;
                this.deductPoints(15, "Wrong Lane Violation", "In India, drive on the LEFT side of the road divider!");
            }
        } else {
            this.game.physics.wrongLaneTimer = 0;
            this.game.physics.isWrongLane = false;
        }

        // Obj 0: Kept to left lane past z > -10
        if (!this.objectives[0].completed && pos.z > -10) {
            this.checkObjective(0);
        }

        // Obj 1: Speed limit observance
        if (speedKmh > 43) {
            this.deductPoints(10, "Speeding Violation (>40 km/h)", "City speed limit is 40 km/h. Ease off the throttle.");
        } else if (!this.objectives[1].completed && pos.z > 0) {
            this.checkObjective(1);
        }

        // Obj 2: Pedestrian Yield at z = 30
        if (!this.objectives[2].completed) {
            const ped = this.pedestrians[0];
            if (ped) {
                const distToPed = pos.distanceTo(ped.position);
                // If close to zebra crossing (z: 18 to 26) and stopped or slowed down
                if (pos.z > 16 && pos.z < 28 && speedKmh < 4.0) {
                    this.awardPoints(15, "Yielded to Pedestrian");
                    this.checkObjective(2);
                    this.game.ui.showInstructorSpeech("Courteous driving! Always yield to pedestrians at zebra crossings.", 'info');
                } else if (distToPed < 2.5) {
                    this.deductPoints(25, "Pedestrian Danger", "DANGER: You must stop for pedestrians at the zebra crossing!");
                }
            }
        }

        // Obj 3: Traffic Light at z = 82
        if (this.objectives[2].completed && !this.objectives[3].completed) {
            const tl = this.trafficLights[0];
            if (tl) {
                // Check if crossed stop line (z > 80) while light is RED
                if (tl.isRed() && pos.z > 79 && pos.z < 85 && speedKmh > 2.0) {
                    this.deductPoints(20, "Red Light Violation", "Red light means STOP behind the white stop line!");
                } else if (pos.z > 95) {
                    this.awardPoints(15, "Clean Intersection Crossing");
                    this.checkObjective(3);
                }
            }
        }
    }

    // ==========================================
    // LEVEL 4: PARKING ACADEMY
    // ==========================================
    _setupLevel4_ParkingAcademy() {
        const env = this.game.environment;
        env.buildGround(250);
        env.setTimeOfDay('day');
        env.setWeather('clear');

        // Parking Lot Surface
        env.buildRoad(0, 0, 120, 30, 0, 'parking');

        // Surrounding safety bollards / trees
        for (let x = -16; x <= 16; x += 6) {
            env.buildTrafficCone(x, -45);
            env.buildTrafficCone(x, 45);
        }

        // Stage 1: 90-Degree Bay Parking
        // Parked cars on adjacent bays
        env.buildParkedCar(-6.5, -15, '#1e40af', 0);
        env.buildParkedCar(-6.5, 5, '#047857', 0);

        // Target Box for Bay 1 (x: -6.5, z: -5)
        const bay1Geo = new THREE.PlaneGeometry(3.2, 5.5);
        const bay1Mat = new THREE.MeshBasicMaterial({ color: 0x10b981, transparent: true, opacity: 0.45 });
        const bay1 = new THREE.Mesh(bay1Geo, bay1Mat);
        bay1.rotation.x = -Math.PI / 2;
        bay1.position.set(-6.5, 0.02, -5);
        env.worldGroup.add(bay1);
        this.parkingTarget = { x: -6.5, z: -5, width: 2.8, length: 5.0, heading: 0, stage: 1 };

        // Stage 2: Parallel Parking setup (on right side)
        env.buildParkedCar(6.5, 25, '#b91c1c', 0);
        env.buildParkedCar(6.5, 5, '#4b5563', 0);

        // Start player car
        this.game.physics.reset(new THREE.Vector3(0, 0, -35), 0);

        this.objectives = [
            { text: "Bay Parking: Pull forward into marked Bay #1 and engage Handbrake [SPACE]", completed: false },
            { text: "Parallel Parking: Reverse between the two parked cars on the right curb", completed: false },
            { text: "Reverse Bay: Back smoothly into the final designated spot", completed: false }
        ];

        this.game.ui.showInstructorSpeech(
            "Parking Academy! Listen to your PDC sensors: beeps get faster as you near obstacles. Continuous tone = STOP!",
            'info'
        );
    }

    _updateLevel4(dt) {
        const speedKmh = Math.abs(this.game.physics.velocity * 3.6);
        const pos = this.game.physics.position;

        // Stage 1: Bay Parking Check
        if (!this.objectives[0].completed) {
            const t = this.parkingTarget;
            const dist = Math.hypot(pos.x - t.x, pos.z - t.z);
            const isAligned = Math.abs(Math.sin(this.game.physics.heading)) < 0.25;

            if (dist < 1.2 && isAligned && speedKmh < 0.2 && this.game.physics.isHandbraking) {
                this.awardPoints(15, "Perfect Bay Parking");
                this.checkObjective(0);

                // Setup Stage 2 Target (Parallel Park at x: 6.5, z: 15)
                const bay2Geo = new THREE.PlaneGeometry(2.8, 6.2);
                const bay2Mat = new THREE.MeshBasicMaterial({ color: 0x3b82f6, transparent: true, opacity: 0.45 });
                const bay2 = new THREE.Mesh(bay2Geo, bay2Mat);
                bay2.rotation.x = -Math.PI / 2;
                bay2.position.set(6.5, 0.02, 15);
                this.game.environment.worldGroup.add(bay2);
                this.parkingTarget = { x: 6.5, z: 15, width: 2.5, length: 5.6, heading: 0, stage: 2 };

                this.game.ui.showInstructorSpeech("Superb! Now reverse parallel park between the two cars on the right curb.", 'info');
            }
        }

        // Stage 2: Parallel Parking Check
        if (this.objectives[0].completed && !this.objectives[1].completed) {
            const t = this.parkingTarget;
            const dist = Math.hypot(pos.x - t.x, pos.z - t.z);
            const isAligned = Math.abs(Math.sin(this.game.physics.heading)) < 0.25;

            if (dist < 1.4 && isAligned && speedKmh < 0.2 && this.game.physics.isHandbraking) {
                this.awardPoints(15, "Master Parallel Park");
                this.checkObjective(1);

                // Setup Stage 3: Reverse Bay
                const bay3Geo = new THREE.PlaneGeometry(3.2, 5.5);
                const bay3Mat = new THREE.MeshBasicMaterial({ color: 0x8b5cf6, transparent: true, opacity: 0.45 });
                const bay3 = new THREE.Mesh(bay3Geo, bay3Mat);
                bay3.rotation.x = -Math.PI / 2;
                bay3.position.set(-6.5, 0.02, 35);
                this.game.environment.worldGroup.add(bay3);
                this.parkingTarget = { x: -6.5, z: 35, width: 2.8, length: 5.0, heading: 0, stage: 3 };

                this.game.ui.showInstructorSpeech("Outstanding! Final challenge: Reverse cleanly into Bay #3.", 'info');
            }
        }

        // Stage 3: Reverse Bay Check
        if (this.objectives[1].completed && !this.objectives[2].completed) {
            const t = this.parkingTarget;
            const dist = Math.hypot(pos.x - t.x, pos.z - t.z);

            if (dist < 1.2 && speedKmh < 0.2 && this.game.physics.isHandbraking) {
                this.awardPoints(15, "Reverse Bay Parked");
                this.checkObjective(2);
            }
        }
    }

    // ==========================================
    // LEVEL 5: DRIVING ASSESSMENT (FINAL EXAM)
    // ==========================================
    _setupLevel5_DrivingAssessment() {
        const env = this.game.environment;
        env.buildGround(500);
        env.setTimeOfDay('day');
        env.setWeather('rain'); // Realistic wet test conditions!

        // Complete driving test route
        env.buildRoad(0, 0, 300, 14, 0, 'straight');
        env.buildRoad(0, 50, 16, 14, 0, 'zebra');
        env.buildRoad(0, 120, 14, 90, Math.PI / 2, 'straight');

        // Buildings & Street Environment
        for (let z = -90; z <= 170; z += 35) {
            if (Math.abs(z - 120) > 20) {
                env.buildBuilding(-18, z, 14, 18, 24, 'office');
                env.buildBuilding(18, z, 14, 18, 20, 'residence');
            }
        }

        // Road Signs: Keep Left, 40 km/h, School Zone 25 km/h, Stop Sign
        env.buildRoadSign(-8.2, -70, 'keep_left', 0);
        env.buildRoadSign(-8.2, -30, 'limit40', 0);
        env.buildRoadSign(-8.2, 20, 'pedestrian', 0);
        env.buildRoadSign(-8.2, 95, 'limit25', 0);
        env.buildRoadSign(-8.2, 114, 'stop', 0);

        // Traffic Light at z = 112
        const tl = new TrafficLight(env.scene, -7.8, 112, 0, 'amber');
        this.trafficLights.push(tl);

        // Animated Pedestrian at z = 50
        const ped = new AnimatedPedestrian(env.scene, -6.5, 50, 6.5, 50, 1.3);
        this.pedestrians.push(ped);

        // AI Traffic
        const aiWps = [
            new THREE.Vector3(3.5, 0, 160),
            new THREE.Vector3(3.5, 0, -90)
        ];
        const aiCar = new AITrafficCar(env.scene, aiWps, 7.8, '#dc2626');
        this.aiCars.push(aiCar);

        // Final Parking Bay at z = 155
        const finishBayGeo = new THREE.PlaneGeometry(3.0, 5.5);
        const finishBayMat = new THREE.MeshBasicMaterial({ color: 0x10b981, transparent: true, opacity: 0.5 });
        const finishBay = new THREE.Mesh(finishBayGeo, finishBayMat);
        finishBay.rotation.x = -Math.PI / 2;
        finishBay.position.set(-3.5, 0.02, 155);
        env.worldGroup.add(finishBay);
        this.parkingTarget = { x: -3.5, z: 155, width: 2.8, length: 5.2 };

        // Start
        this.game.physics.reset(new THREE.Vector3(-3.5, 0, -90), 0);

        this.objectives = [
            { text: "Pass Vehicle Pre-check and maintain Left-lane discipline", completed: false },
            { text: "Yield to pedestrian at the rain-soaked crosswalk", completed: false },
            { text: "Adhere to the 25 km/h School Zone speed limit", completed: false },
            { text: "Come to a complete 2-second STOP at the Stop Sign / Signal", completed: false },
            { text: "Safely park inside the final DMV Examination Bay and set handbrake", completed: false }
        ];

        this.game.ui.showInstructorSpeech(
            "Final Road Test! Maintain left lane discipline, respect wet braking distances, and obey all road signs to pass.",
            'info'
        );
    }

    _updateLevel5(dt) {
        const speedKmh = Math.abs(this.game.physics.velocity * 3.6);
        const pos = this.game.physics.position;

        // Wrong lane check
        if (pos.x > 0.8) {
            this.game.physics.wrongLaneTimer += dt;
            if (this.game.physics.wrongLaneTimer > 2.0 && !this.game.physics.isWrongLane) {
                this.game.physics.isWrongLane = true;
                this.deductPoints(15, "Driving on Wrong Side of Road", "Serious violation: Keep to the LEFT in India!");
            }
        } else {
            this.game.physics.wrongLaneTimer = 0;
            this.game.physics.isWrongLane = false;
        }

        // Obj 0: Left lane discipline
        if (!this.objectives[0].completed && pos.z > -10) {
            this.checkObjective(0);
        }

        // Obj 1: Pedestrian yield at z = 50
        if (!this.objectives[1].completed) {
            const ped = this.pedestrians[0];
            if (ped) {
                const distToPed = pos.distanceTo(ped.position);
                if (pos.z > 36 && pos.z < 48 && speedKmh < 3.5) {
                    this.awardPoints(15, "Safe Crosswalk Yield");
                    this.checkObjective(1);
                } else if (distToPed < 2.2) {
                    this.deductPoints(25, "Dangerous Crosswalk Proximity", "Failure to yield to pedestrians in wet weather.");
                }
            }
        }

        // Obj 2: School Zone 25 km/h speed limit between z = 85 and 115
        if (pos.z >= 85 && pos.z <= 115) {
            if (speedKmh > 28) {
                this.deductPoints(10, "School Zone Speeding (>25 km/h)", "School Zone limit is 25 km/h!");
            } else if (!this.objectives[2].completed && pos.z > 105) {
                this.checkObjective(2);
            }
        }

        // Obj 3: Stop sign & traffic light at z = 112
        if (this.objectives[2].completed && !this.objectives[3].completed) {
            if (pos.z >= 106 && pos.z <= 114 && speedKmh < 0.3) {
                this.awardPoints(15, "Complete Stop at Stop Line");
                this.checkObjective(3);
                this.game.ui.showInstructorSpeech("Clean stop! Now proceed forward into the final DMV Examination Bay.", 'info');
            } else if (pos.z > 115 && speedKmh > 5.0) {
                this.deductPoints(20, "Failed to Stop at Stop Sign", "You ran through the Stop Sign without halting!");
                this.checkObjective(3);
            }
        }

        // Obj 4: Final Examination Bay Parking at z = 155
        if (this.objectives[3].completed && !this.objectives[4].completed) {
            const dist = Math.hypot(pos.x - (-3.5), pos.z - 155);
            if (dist < 1.5 && speedKmh < 0.2 && this.game.physics.isHandbraking) {
                this.awardPoints(15, "Examination Bay Secured");
                this.checkObjective(4);
            }
        }
    }

    update(dt) {
        if (this.levelCompleted || this.levelFailed) return;
        this.levelTimer += dt;

        // Update traffic lights
        this.trafficLights.forEach(tl => tl.update(dt));

        // Update pedestrians
        this.pedestrians.forEach(p => p.update(dt));

        // Update AI cars
        this.aiCars.forEach(car => car.update(dt, this.game.physics.position, this.trafficLights));

        // Level-specific logic
        switch (this.currentLevelIndex) {
            case 1: this._updateLevel1(dt); break;
            case 2: this._updateLevel2(dt); break;
            case 3: this._updateLevel3(dt); break;
            case 4: this._updateLevel4(dt); break;
            case 5: this._updateLevel5(dt); break;
        }

        // Ultrasonic Parking Distance Control (PDC) Beep calculation
        this._updatePDC();

        // Check pothole collisions
        this._checkPotholeCollisions();

        // Check cone collisions
        this._checkConeCollisions();

        // Check static obstacle collisions
        this._checkObstacleCollisions();
    }

    _updatePDC() {
        // Find closest obstacle to front or rear bumper
        let minDist = 999;
        const carPos = this.game.physics.position;

        // Check against parked cars / colliders
        this.game.environment.colliders.forEach(col => {
            let d = 999;
            if (col.type === 'cylinder') {
                d = Math.hypot(carPos.x - col.x, carPos.z - col.z) - col.radius;
            } else if (col.type === 'aabb') {
                const cx = (col.minX + col.maxX) * 0.5;
                const cz = (col.minZ + col.maxZ) * 0.5;
                d = Math.hypot(carPos.x - cx, carPos.z - cz) - 1.2;
            }
            if (d < minDist) minDist = d;
        });

        // Trigger audio beep based on distance
        window.soundEngine.triggerPDCBeep(minDist);
        this.game.ui.updatePDCRadar(minDist);
    }

    _checkPotholeCollisions() {
        const carPos = this.game.physics.position;
        this.game.environment.potholes.forEach(p => {
            const dist = Math.hypot(carPos.x - p.x, carPos.z - p.z);
            if (dist < p.radius && p.hitCount === 0) {
                p.hitCount++;
                window.soundEngine.playPotholeBump();
                this.deductPoints(10, "Pothole Impact", "Hitting potholes damages vehicle suspension. Steer around them!");
            }
        });
    }

    _checkConeCollisions() {
        this.game.environment.cones.forEach(c => {
            if (!c.isHit && this.game.physics.checkCircleCollision(c.x, c.z, c.radius)) {
                c.knockOver();
                window.soundEngine.playCollision(0.4);
                this.deductPoints(5, "Knocked Over Cone", "Maintain proper vehicle clearance when navigating markers.");
            }
        });
    }

    _checkObstacleCollisions() {
        this.game.environment.colliders.forEach(col => {
            let hit = false;
            if (col.type === 'cylinder') {
                hit = this.game.physics.checkCircleCollision(col.x, col.z, col.radius);
            } else if (col.type === 'aabb') {
                hit = this.game.physics.checkAABBCollision(col.minX, col.maxX, col.minZ, col.maxZ);
            }

            if (hit) {
                // Bounce car back
                this.game.physics.velocity = -this.game.physics.velocity * 0.4;
                window.soundEngine.playCollision(1.0);
                this.deductPoints(15, "Collision with Obstacle", "Ensure adequate clearance from curbs, barriers, and parked vehicles.");
            }
        });
    }
}

window.LevelManager = LevelManager;
