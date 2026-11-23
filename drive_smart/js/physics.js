/**
 * DRIVE SMART - Advanced Vehicle Physics & Kinematic Steering Engine
 * Implements realistic bicycle model kinematics with rear-axle pivot,
 * speed-sensitive steering angle attenuation, suspension pitch/roll,
 * and progressive braking.
 */

class AdvancedVehiclePhysics {
    constructor() {
        // Position & Orientation
        this.x = -3.5;       // Indian Left-Hand driving lane
        this.y = 0;
        this.z = -50;
        this.heading = 0;    // Yaw in radians (0 = along +Z axis)
        
        // Kinematic Dimensions
        this.wheelbase = 2.65; // Distance between front & rear axles (meters)
        this.trackWidth = 1.82;
        this.rearOverhang = 0.85;
        this.frontOverhang = 0.90;

        // Velocities
        this.velocity = 0;         // Longitudinal speed in m/s (forward > 0, reverse < 0)
        this.angularVelocity = 0;  // Yaw rate in rad/s
        this.acceleration = 0;     // Current acceleration m/s^2

        // Steering Subsystem
        this.steerInput = 0;         // Target input [-1, 1]
        this.currentSteerAngle = 0;  // Actual front wheel steering angle (radians)
        this.steerRate = 2.2;        // Steering wheel turning speed (smooth, non-instant)
        this.returnRate = 3.5;       // Self-centering rate (caster return effect)

        // Suspension Dynamics
        this.pitch = 0;            // Pitch angle (squat on accel, dive on brake)
        this.roll = 0;             // Roll angle (body lean in corners)
        this.targetPitch = 0;
        this.targetRoll = 0;

        // Transmission & Engine
        this.gear = 'P';           // P, R, N, D1, D2, D3, D4, D5
        this.rpm = 850;            // Engine RPM
        this.maxForwardSpeed = 110 / 3.6; // ~30.5 m/s (~110 km/h)
        this.maxReverseSpeed = 25 / 3.6;  // ~7 m/s (~25 km/h)
        this.enginePower = 13.5;          // Base forward acceleration (m/s^2)
        this.brakeForce = 22.0;           // Service brake deceleration (m/s^2)
        this.handbrakeForce = 32.0;       // Emergency brake deceleration
        this.naturalDrag = 3.5;           // Engine braking / aerodynamic drag
        this.rollingResistance = 0.04;

        // Control Keys
        this.keys = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            handbrake: false
        };

        // State Flags
        this.isBraking = false;
        this.isReversing = false;
        this.isHandbraking = false;
        this.skidIntensity = 0;
        this.wheelRotation = 0;

        this._bindKeyboard();
    }

    _bindKeyboard() {
        window.addEventListener('keydown', (e) => {
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
                e.preventDefault();
            }
            if (e.code === 'KeyW' || e.code === 'ArrowUp') this.keys.forward = true;
            if (e.code === 'KeyS' || e.code === 'ArrowDown') this.keys.backward = true;
            if (e.code === 'KeyA' || e.code === 'ArrowLeft') this.keys.left = true;
            if (e.code === 'KeyD' || e.code === 'ArrowRight') this.keys.right = true;
            if (e.code === 'Space') this.keys.handbrake = true;
            if (e.code === 'KeyR') this.reset();
        });

        window.addEventListener('keyup', (e) => {
            if (e.code === 'KeyW' || e.code === 'ArrowUp') this.keys.forward = false;
            if (e.code === 'KeyS' || e.code === 'ArrowDown') this.keys.backward = false;
            if (e.code === 'KeyA' || e.code === 'ArrowLeft') this.keys.left = false;
            if (e.code === 'KeyD' || e.code === 'ArrowRight') this.keys.right = false;
            if (e.code === 'Space') this.keys.handbrake = false;
        });
    }

    reset(x = -3.5, z = -50, heading = 0) {
        this.x = x;
        this.y = 0;
        this.z = z;
        this.heading = heading;
        this.velocity = 0;
        this.acceleration = 0;
        this.angularVelocity = 0;
        this.currentSteerAngle = 0;
        this.steerInput = 0;
        this.pitch = 0;
        this.roll = 0;
        this.gear = 'P';
        this.rpm = 850;
    }

    update(dt) {
        dt = Math.min(dt, 0.05); // Prevent tunneling on frame lag

        const speedKmh = Math.abs(this.velocity * 3.6);
        const isMovingForward = this.velocity > 0.08;
        const isMovingBackward = this.velocity < -0.08;
        const isStopped = Math.abs(this.velocity) <= 0.08;

        // 1. Smooth Steering Input & Speed-Sensitive Lock Angle
        // At low speeds (e.g. <15 km/h for parking & street junctions): max 28 degrees (0.49 rad)
        // At 50 km/h: max ~13 degrees (0.23 rad)
        // At 90 km/h: max ~7.5 degrees (0.13 rad)
        const maxSteerRad = 0.49 / (1.0 + Math.pow(speedKmh / 26.0, 1.15));

        let targetSteer = 0;
        if (this.keys.left) targetSteer += 1.0;
        if (this.keys.right) targetSteer -= 1.0;
        this.steerInput = targetSteer;

        // Gradual steering turn rate (interpolated, never instant!)
        const rate = (targetSteer !== 0) ? this.steerRate : this.returnRate;
        const targetAngle = this.steerInput * maxSteerRad;
        this.currentSteerAngle += (targetAngle - this.currentSteerAngle) * dt * rate;

        // 2. Throttle, Braking, and Reverse Logic
        let driveAccel = 0;
        this.isBraking = false;
        this.isHandbraking = this.keys.handbrake;

        if (this.keys.forward) {
            if (isMovingBackward) {
                // Foot braking against reverse motion
                driveAccel = this.brakeForce;
                this.isBraking = true;
            } else {
                // Smooth progressive acceleration (torque decreases as speed rises)
                const speedRatio = Math.min(1.0, this.velocity / this.maxForwardSpeed);
                driveAccel = this.enginePower * Math.max(0.15, 1.0 - (speedRatio * 0.82));
            }
        } else if (this.keys.backward) {
            if (isMovingForward) {
                // Foot braking against forward motion
                driveAccel = -this.brakeForce;
                this.isBraking = true;
            } else {
                // Reversing
                this.isReversing = true;
                const revRatio = Math.min(1.0, Math.abs(this.velocity) / this.maxReverseSpeed);
                driveAccel = -this.enginePower * 0.60 * Math.max(0.2, 1.0 - revRatio);
            }
        } else {
            // Natural engine braking & drag
            if (this.velocity > 0.08) driveAccel = -this.naturalDrag;
            else if (this.velocity < -0.08) driveAccel = this.naturalDrag;
            else {
                driveAccel = 0;
                this.velocity = 0;
            }
        }

        // Emergency Handbrake (locks rear wheels)
        if (this.isHandbraking) {
            this.isBraking = true;
            if (this.velocity > 0) driveAccel -= this.handbrakeForce;
            else if (this.velocity < 0) driveAccel += this.handbrakeForce;
        }

        // Apply acceleration to velocity
        const prevVelocity = this.velocity;
        this.acceleration = driveAccel;
        this.velocity += driveAccel * dt;

        // Check if braking brought vehicle to standstill
        if ((prevVelocity > 0 && this.velocity < 0 && !this.keys.backward) ||
            (prevVelocity < 0 && this.velocity > 0 && !this.keys.forward)) {
            this.velocity = 0;
        }

        // Clamp speeds
        if (this.velocity > this.maxForwardSpeed) this.velocity = this.maxForwardSpeed;
        if (this.velocity < -this.maxReverseSpeed) this.velocity = -this.maxReverseSpeed;

        // 3. Realistic Bicycle Model Kinematics (Rear-Axle Pivot)
        // Rear axle position advances strictly in direction of heading:
        const moveDist = this.velocity * dt;
        
        // Yaw rate: psi_dot = (v / L) * tan(delta)
        // With rear-axle pivot, the turn is smooth, wide, and never spins like a tank!
        if (Math.abs(this.velocity) > 0.05) {
            this.angularVelocity = (this.velocity / this.wheelbase) * Math.tan(this.currentSteerAngle);
            this.heading += this.angularVelocity * dt;
        } else {
            this.angularVelocity = 0;
        }

        // Keep heading within [0, 2PI]
        this.heading = (this.heading + Math.PI * 2) % (Math.PI * 2);

        // Update world coordinates along heading
        this.x += Math.sin(this.heading) * moveDist;
        this.z += Math.cos(this.heading) * moveDist;

        // 4. Suspension Pitch & Roll Dynamics
        // Weight transfer: pitch forward when braking, pitch back when accelerating
        const pitchTarget = THREE.MathUtils.clamp(-this.acceleration * 0.0028, -0.045, 0.035);
        this.pitch += (pitchTarget - this.pitch) * dt * 7.0;

        // Cornering roll: body rolls outward proportional to lateral acceleration (v^2 / R)
        const lateralAccel = this.velocity * this.angularVelocity;
        const rollTarget = THREE.MathUtils.clamp(-lateralAccel * 0.0035, -0.065, 0.065);
        this.roll += (rollTarget - this.roll) * dt * 8.0;

        // 5. Automatic Transmission & Engine RPM
        this._updateTransmission(speedKmh, isStopped);

        // 6. Wheel Rolling Spin
        this.wheelRotation += (this.velocity * dt * 2.85);

        // 7. Skid calculation (for tire audio & visual skid marks)
        let skid = 0;
        if (this.isHandbraking && Math.abs(this.velocity) > 2.0) {
            skid = 0.85;
        } else if (Math.abs(lateralAccel) > 12.0) {
            skid = Math.min(1.0, (Math.abs(lateralAccel) - 12.0) / 8.0);
        } else if (this.isBraking && speedKmh > 55) {
            skid = 0.35;
        }
        this.skidIntensity += (skid - this.skidIntensity) * dt * 6.0;
    }

    _updateTransmission(speedKmh, isStopped) {
        if (this.velocity < -0.1) {
            this.gear = 'R';
            this.isReversing = true;
            this.rpm = 850 + (Math.abs(this.velocity) / this.maxReverseSpeed) * 3200;
        } else if (isStopped && !this.keys.forward && !this.keys.backward) {
            this.gear = this.keys.handbrake ? 'P' : 'N';
            this.isReversing = false;
            this.rpm += (850 - this.rpm) * 0.1;
        } else {
            this.isReversing = false;
            if (speedKmh < 22) {
                this.gear = 'D1';
                this.rpm = 900 + (speedKmh / 22) * 2800;
            } else if (speedKmh < 42) {
                this.gear = 'D2';
                this.rpm = 1300 + ((speedKmh - 22) / 20) * 2600;
            } else if (speedKmh < 65) {
                this.gear = 'D3';
                this.rpm = 1500 + ((speedKmh - 42) / 23) * 2800;
            } else if (speedKmh < 88) {
                this.gear = 'D4';
                this.rpm = 1700 + ((speedKmh - 65) / 23) * 2700;
            } else {
                this.gear = 'D5';
                this.rpm = 1900 + ((speedKmh - 88) / 30) * 2500;
            }
        }

        // Throttle roar
        if (this.keys.forward && !this.isBraking) {
            this.rpm += 450;
        }
        this.rpm = Math.min(6200, Math.max(850, this.rpm));
    }
}

window.AdvancedVehiclePhysics = AdvancedVehiclePhysics;
