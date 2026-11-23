/**
 * DRIVE SMART - UI & HUD System
 * Manages menus, in-game instrument cluster, analog speedometer,
 * minimap radar, instructor dialogue, modals, and certificate generator.
 */

class UIManager {
    constructor(game) {
        this.game = game;

        // Cache DOM Elements
        this.screens = {
            mainMenu: document.getElementById('screen-main-menu'),
            lessons: document.getElementById('screen-lessons'),
            garage: document.getElementById('screen-garage'),
            settings: document.getElementById('screen-settings'),
            progress: document.getElementById('screen-progress'),
            hud: document.getElementById('in-game-hud'),
            pauseModal: document.getElementById('pause-modal'),
            completeModal: document.getElementById('complete-modal'),
            failedModal: document.getElementById('failed-modal')
        };

        // HUD Elements
        this.speedometerNeedle = document.getElementById('speedo-needle');
        this.speedDigital = document.getElementById('speedo-digital');
        this.gearDisplay = document.getElementById('gear-display');
        this.rpmBar = document.getElementById('rpm-fill');
        this.odometer = document.getElementById('odometer-val');
        this.scoreDisplay = document.getElementById('score-val');
        this.objectivesList = document.getElementById('objectives-checklist');
        this.instructorBox = document.getElementById('instructor-box');
        this.instructorText = document.getElementById('instructor-text');
        this.indicatorLeft = document.getElementById('turn-ind-left');
        this.indicatorRight = document.getElementById('turn-ind-right');
        this.pdcRadar = document.getElementById('pdc-radar-bar');
        this.cameraPill = document.getElementById('camera-mode-pill');
        this.emergencyAlert = document.getElementById('emergency-alert-banner');

        // Minimap Canvas
        this.minimapCanvas = document.getElementById('minimap-canvas');
        this.minimapCtx = this.minimapCanvas ? this.minimapCanvas.getContext('2d') : null;

        // Instructor Toast Timer
        this.instructorTimer = null;

        this._bindEvents();
    }

    _bindEvents() {
        // Main Menu buttons
        document.getElementById('btn-play-game').addEventListener('click', () => {
            window.soundEngine.init();
            const prog = StorageManager.getProgress();
            this.game.startLevel(prog.unlockedLevel || 1);
        });

        document.getElementById('btn-lessons').addEventListener('click', () => {
            this.showScreen('lessons');
            this.renderLessonsScreen();
        });

        document.getElementById('btn-garage').addEventListener('click', () => {
            this.showScreen('garage');
            this.renderGarageScreen();
            this.game.showGarageTurntable(true);
        });

        document.getElementById('btn-settings').addEventListener('click', () => {
            this.showScreen('settings');
            this.renderSettingsScreen();
        });

        document.getElementById('btn-progress').addEventListener('click', () => {
            this.showScreen('progress');
            this.renderProgressScreen();
        });

        // Back to Menu buttons
        document.querySelectorAll('.btn-back-menu').forEach(btn => {
            btn.addEventListener('click', () => {
                this.game.showGarageTurntable(false);
                this.showScreen('mainMenu');
            });
        });

        // In-game Pause & Controls
        window.addEventListener('keydown', (e) => {
            if (e.code === 'KeyP' || e.code === 'Escape') {
                if (this.game.isPlaying) {
                    this.game.togglePause();
                }
            } else if (e.code === 'KeyC') {
                if (this.game.isPlaying) {
                    this.game.cycleCamera();
                }
            } else if (e.code === 'KeyH') {
                if (this.game.isPlaying) {
                    window.soundEngine.startHorn();
                }
            } else if (e.code === 'KeyR') {
                if (this.game.isPlaying) {
                    this.game.resetCarPosition();
                }
            } else if (e.code === 'KeyQ') {
                if (this.game.isPlaying) {
                    this.game.toggleTurnSignal('left');
                }
            } else if (e.code === 'KeyE') {
                if (this.game.isPlaying) {
                    this.game.toggleTurnSignal('right');
                }
            } else if (e.code === 'KeyL') {
                if (this.game.isPlaying) {
                    this.game.toggleHeadlights();
                }
            }
        });

        window.addEventListener('keyup', (e) => {
            if (e.code === 'KeyH') {
                window.soundEngine.stopHorn();
            }
        });

        // Pause Modal buttons
        document.getElementById('btn-resume').addEventListener('click', () => {
            this.game.togglePause();
        });

        document.getElementById('btn-restart-level').addEventListener('click', () => {
            this.screens.pauseModal.classList.add('hidden');
            this.screens.failedModal.classList.add('hidden');
            this.screens.completeModal.classList.add('hidden');
            this.game.startLevel(this.game.levelManager.currentLevelIndex);
        });

        document.getElementById('btn-pause-menu').addEventListener('click', () => {
            this.game.exitToMainMenu();
        });

        // Complete Modal buttons
        document.getElementById('btn-next-level').addEventListener('click', () => {
            this.screens.completeModal.classList.add('hidden');
            const nextLvl = this.game.levelManager.currentLevelIndex + 1;
            if (nextLvl <= 5) {
                this.game.startLevel(nextLvl);
            } else {
                this.game.exitToMainMenu();
            }
        });

        document.getElementById('btn-complete-menu').addEventListener('click', () => {
            this.screens.completeModal.classList.add('hidden');
            this.game.exitToMainMenu();
        });

        // Failed Modal buttons
        document.getElementById('btn-retry-level').addEventListener('click', () => {
            this.screens.failedModal.classList.add('hidden');
            this.game.startLevel(this.game.levelManager.currentLevelIndex);
        });

        document.getElementById('btn-failed-menu').addEventListener('click', () => {
            this.screens.failedModal.classList.add('hidden');
            this.game.exitToMainMenu();
        });
    }

    showScreen(screenKey) {
        Object.keys(this.screens).forEach(key => {
            if (this.screens[key]) {
                if (key === screenKey) {
                    this.screens[key].classList.remove('hidden');
                } else if (!key.includes('Modal')) {
                    this.screens[key].classList.add('hidden');
                }
            }
        });
    }

    // --- LESSON SELECTION SCREEN ---
    renderLessonsScreen() {
        const list = document.getElementById('lessons-grid');
        list.innerHTML = '';

        const progress = StorageManager.getProgress();
        const lessons = [
            { id: 1, title: 'Lesson 1: Basic Driving', desc: 'Master gentle acceleration, smooth braking, slalom steering, and reverse bay navigation.', badge: 'Fundamentals' },
            { id: 2, title: 'Lesson 2: Obstacle Avoidance', desc: 'Cone chicanes, deep potholes, emergency reaction stops, and stationary vehicle clearance.', badge: 'Hazard Perception' },
            { id: 3, title: 'Lesson 3: City Driving', desc: 'Indian-style Left-Hand traffic discipline, traffic lights, 40 km/h speed limit, and pedestrian crosswalks.', badge: 'Urban Rules' },
            { id: 4, title: 'Lesson 4: Parking Academy', desc: '90-degree bay parking, parallel curb parking, reverse bay, and ultrasonic PDC distance sensors.', badge: 'Precision' },
            { id: 5, title: 'Lesson 5: Driving Assessment', desc: 'The comprehensive road exam! Put all skills to the test in wet conditions to earn your Driver’s License.', badge: 'Official License Exam' }
        ];

        lessons.forEach(l => {
            const isUnlocked = l.id <= progress.unlockedLevel;
            const lvlProg = progress.levels[l.id] || { completed: false, stars: 0, score: 0 };

            const card = document.createElement('div');
            card.className = `lesson-card ${isUnlocked ? 'unlocked' : 'locked'}`;

            let starsHtml = '';
            for (let s = 1; s <= 3; s++) {
                starsHtml += `<span class="star ${s <= lvlProg.stars ? 'active' : ''}">★</span>`;
            }

            card.innerHTML = `
                <div class="lesson-header">
                    <span class="lesson-badge">${l.badge}</span>
                    <span class="lesson-stars">${starsHtml}</span>
                </div>
                <h3 class="lesson-title">${l.title}</h3>
                <p class="lesson-desc">${l.desc}</p>
                <div class="lesson-footer">
                    ${isUnlocked ? 
                        `<div class="lesson-best">Best Score: ${lvlProg.score > 0 ? lvlProg.score + ' pts' : 'Unplayed'}</div>
                         <button class="btn btn-primary btn-start-lesson" data-level="${l.id}">Start Lesson</button>` 
                        : `<div class="lesson-locked-notice">🔒 Complete Lesson ${l.id - 1} to Unlock</div>`
                    }
                </div>
            `;

            if (isUnlocked) {
                card.querySelector('.btn-start-lesson').addEventListener('click', () => {
                    this.game.startLevel(l.id);
                });
            }

            list.appendChild(card);
        });
    }

    // --- GARAGE SCREEN ---
    renderGarageScreen() {
        const garage = this.game.garage;
        const carInfo = garage.getCarInfo(garage.selectedCarId);

        // Update Car Name & Desc
        document.getElementById('garage-car-name').textContent = carInfo.name;
        document.getElementById('garage-car-cat').textContent = carInfo.category;
        document.getElementById('garage-car-desc').textContent = carInfo.description;

        // Specs Bars (Top Speed, Accel, Handling, Braking)
        document.getElementById('bar-speed').style.width = `${(carInfo.specs.topSpeed / 140) * 100}%`;
        document.getElementById('val-speed').textContent = `${carInfo.specs.topSpeed} km/h`;

        document.getElementById('bar-accel').style.width = `${(carInfo.specs.acceleration / 22) * 100}%`;
        document.getElementById('val-accel').textContent = `${Math.round(carInfo.specs.acceleration)} m/s²`;

        document.getElementById('bar-handling').style.width = `${(carInfo.specs.handling / 5) * 100}%`;
        document.getElementById('val-handling').textContent = `${carInfo.specs.handling.toFixed(1)}`;

        document.getElementById('bar-braking').style.width = `${(carInfo.specs.braking / 30) * 100}%`;
        document.getElementById('val-braking').textContent = `${carInfo.specs.braking} m/s²`;

        // Render Car Model Buttons
        const carList = document.getElementById('garage-car-selector');
        carList.innerHTML = '';
        Object.keys(garage.cars).forEach(id => {
            const c = garage.cars[id];
            const btn = document.createElement('button');
            btn.className = `btn car-select-btn ${id === garage.selectedCarId ? 'active' : ''}`;
            btn.textContent = c.name;
            btn.addEventListener('click', () => {
                garage.selectCar(id);
                this.renderGarageScreen();
            });
            carList.appendChild(btn);
        });

        // Render Paint Swatches
        const swatchContainer = document.getElementById('garage-color-swatches');
        swatchContainer.innerHTML = '';
        garage.colors.forEach(col => {
            const swatch = document.createElement('div');
            swatch.className = `color-swatch ${col.hex === garage.selectedColor ? 'active' : ''}`;
            swatch.style.backgroundColor = col.hex;
            swatch.title = col.name;
            swatch.addEventListener('click', () => {
                garage.selectColor(col.hex);
                this.renderGarageScreen();
            });
            swatchContainer.appendChild(swatch);
        });
    }

    // --- SETTINGS SCREEN ---
    renderSettingsScreen() {
        const settings = StorageManager.getSettings();

        // Volume Slider
        const volSlider = document.getElementById('setting-volume');
        const volVal = document.getElementById('setting-volume-val');
        volSlider.value = Math.round(settings.volume * 100);
        volVal.textContent = `${Math.round(settings.volume * 100)}%`;
        volSlider.oninput = (e) => {
            const v = e.target.value / 100;
            volVal.textContent = `${e.target.value}%`;
            settings.volume = v;
            window.soundEngine.setVolume(v);
            StorageManager.saveSettings(settings);
        };

        // Time of Day
        document.querySelectorAll('.time-of-day-btn').forEach(btn => {
            const time = btn.dataset.time;
            btn.classList.toggle('active', time === settings.timeOfDay);
            btn.onclick = () => {
                settings.timeOfDay = time;
                this.game.environment.setTimeOfDay(time);
                StorageManager.saveSettings(settings);
                this.renderSettingsScreen();
            };
        });

        // Weather
        document.querySelectorAll('.weather-btn').forEach(btn => {
            const weather = btn.dataset.weather;
            btn.classList.toggle('active', weather === settings.weather);
            btn.onclick = () => {
                settings.weather = weather;
                this.game.environment.setWeather(weather);
                StorageManager.saveSettings(settings);
                this.renderSettingsScreen();
            };
        });
    }

    // --- PROGRESS & LICENSE SCREEN ---
    renderProgressScreen() {
        const progress = StorageManager.getProgress();
        const settings = StorageManager.getSettings();

        // Stats summary
        let totalStars = 0;
        let completedCount = 0;
        Object.keys(progress.levels).forEach(k => {
            const l = progress.levels[k];
            if (l.completed) {
                completedCount++;
                totalStars += l.stars;
            }
        });

        document.getElementById('stat-completed-lessons').textContent = `${completedCount} / 5`;
        document.getElementById('stat-total-stars').textContent = `${totalStars} ★`;
        document.getElementById('stat-total-km').textContent = `${(this.game.physics.totalDistance / 1000).toFixed(2)} km`;

        // Driver's License Card Rendering
        const licenseCard = document.getElementById('driver-license-card');
        const lvl5 = progress.levels[5];

        if (lvl5 && lvl5.completed && lvl5.score >= 50) {
            licenseCard.classList.remove('locked');
            licenseCard.innerHTML = `
                <div class="dl-header">
                    <div class="dl-govt">UNION OF INDIA • MINISTRY OF ROAD TRANSPORT</div>
                    <div class="dl-title">DRIVING LICENSE / DRIVER ACADEMY CERTIFICATE</div>
                </div>
                <div class="dl-body">
                    <div class="dl-photo">
                        <div class="dl-avatar-icon">🚗</div>
                        <div class="dl-valid">VALID NATIONWIDE</div>
                    </div>
                    <div class="dl-info">
                        <div class="dl-row"><span class="dl-lbl">DL NO:</span> <span class="dl-val">DL-04-2026-0089201</span></div>
                        <div class="dl-row"><span class="dl-lbl">NAME:</span> <span class="dl-val" id="dl-driver-name">ACADEMY GRADUATE</span></div>
                        <div class="dl-row"><span class="dl-lbl">VEHICLE CLASS:</span> <span class="dl-val">LMV-NT (LIGHT MOTOR VEHICLE)</span></div>
                        <div class="dl-row"><span class="dl-lbl">EXAM SCORE:</span> <span class="dl-val score-highlight">${lvl5.score} / 100 (${lvl5.stars} Stars)</span></div>
                        <div class="dl-row"><span class="dl-lbl">TRAFFIC RULE:</span> <span class="dl-val">INDIAN LEFT-HAND DRIVE CERTIFIED</span></div>
                        <div class="dl-row"><span class="dl-lbl">DATE OF ISSUE:</span> <span class="dl-val">${new Date().toLocaleDateString()}</span></div>
                    </div>
                    <div class="dl-seal">
                        <div class="dl-gold-badge">★ PASS ★</div>
                        <div class="dl-auth">OFFICIAL ISSUED</div>
                    </div>
                </div>
                <div class="dl-footer">
                    <button class="btn btn-secondary" id="btn-print-license">🖨️ Print / Save License</button>
                </div>
            `;
            document.getElementById('btn-print-license').onclick = () => {
                window.print();
            };
        } else {
            licenseCard.classList.add('locked');
            licenseCard.innerHTML = `
                <div class="dl-locked-content">
                    <div class="lock-icon">🔒</div>
                    <h3>Driver's License Not Yet Earned</h3>
                    <p>Complete all 5 driving lessons and pass Lesson 5 (Driving Assessment) with a score of 75% or higher to receive your official driving certificate.</p>
                </div>
            `;
        }

        // Reset progress button
        document.getElementById('btn-reset-progress').onclick = () => {
            if (confirm("Are you sure you want to reset all game progress and stars?")) {
                StorageManager.resetAll();
                this.renderProgressScreen();
            }
        };
    }

    // --- IN-GAME HUD UPDATES ---
    updateHUD(speedKmh, rpm, gear, distanceMeters, turnSignalState) {
        // Speedometer Needle: -120 deg (0 km/h) to +120 deg (140 km/h)
        const clampedSpeed = Math.min(140, Math.max(0, speedKmh));
        const angle = -120 + (clampedSpeed / 140) * 240;
        this.speedometerNeedle.style.transform = `rotate(${angle}deg)`;
        this.speedDigital.textContent = Math.round(clampedSpeed);

        // Gear & RPM
        this.gearDisplay.textContent = gear;
        const rpmPercent = Math.min(100, Math.max(0, ((rpm - 800) / 5700) * 100));
        this.rpmBar.style.width = `${rpmPercent}%`;

        // Odometer
        this.odometer.textContent = `${(distanceMeters / 1000).toFixed(1)} KM`;

        // Turn Signal Indicators
        const blink = (Math.floor(performance.now() / 350) % 2 === 0);
        this.indicatorLeft.classList.toggle('active', (turnSignalState === 'left' || turnSignalState === 'hazard') && blink);
        this.indicatorRight.classList.toggle('active', (turnSignalState === 'right' || turnSignalState === 'hazard') && blink);

        // Render Minimap
        this._renderMinimap();
    }

    updateScore(score) {
        this.scoreDisplay.textContent = `${score}`;
    }

    updateObjectives(objectives) {
        this.objectivesList.innerHTML = '';
        objectives.forEach(obj => {
            const li = document.createElement('li');
            li.className = `obj-item ${obj.completed ? 'completed' : ''}`;
            li.innerHTML = `
                <span class="obj-check">${obj.completed ? '✓' : '○'}</span>
                <span class="obj-text">${obj.text}</span>
            `;
            this.objectivesList.appendChild(li);
        });
    }

    showDeductionNotification(text) {
        const floater = document.createElement('div');
        floater.className = 'floating-score-deduct';
        floater.textContent = text;
        document.body.appendChild(floater);
        setTimeout(() => floater.remove(), 2500);
    }

    showAwardNotification(text) {
        const floater = document.createElement('div');
        floater.className = 'floating-score-award';
        floater.textContent = text;
        document.body.appendChild(floater);
        setTimeout(() => floater.remove(), 2500);
    }

    showInstructorSpeech(text, type = 'info') {
        if (!this.instructorBox) return;
        this.instructorText.textContent = text;
        this.instructorBox.className = `instructor-toast ${type} show`;

        clearTimeout(this.instructorTimer);
        this.instructorTimer = setTimeout(() => {
            this.instructorBox.classList.remove('show');
        }, 6500);
    }

    showEmergencyAlert(text) {
        if (!this.emergencyAlert) return;
        this.emergencyAlert.textContent = text;
        this.emergencyAlert.classList.remove('hidden');
        setTimeout(() => {
            this.emergencyAlert.classList.add('hidden');
        }, 4000);
    }

    updatePDCRadar(distance) {
        if (!this.pdcRadar) return;
        if (distance > 2.5) {
            this.pdcRadar.style.width = '0%';
            this.pdcRadar.className = 'pdc-fill';
        } else {
            const pct = Math.max(5, Math.min(100, (1.0 - (distance / 2.5)) * 100));
            this.pdcRadar.style.width = `${pct}%`;
            if (distance < 0.4) {
                this.pdcRadar.className = 'pdc-fill danger';
            } else if (distance < 1.0) {
                this.pdcRadar.className = 'pdc-fill warning';
            } else {
                this.pdcRadar.className = 'pdc-fill safe';
            }
        }
    }

    updateCameraLabel(label) {
        if (this.cameraPill) {
            this.cameraPill.textContent = label;
        }
    }

    _renderMinimap() {
        if (!this.minimapCtx) return;
        const ctx = this.minimapCtx;
        const w = this.minimapCanvas.width;
        const h = this.minimapCanvas.height;
        const cx = w * 0.5;
        const cy = h * 0.5;

        // Dark background
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.fillRect(0, 0, w, h);

        const carPos = this.game.physics.position;
        const carHeading = this.game.physics.heading;
        const scale = 0.85; // pixels per world meter

        // Road network (centered on car)
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(-carHeading);

        // Draw main road strip
        ctx.fillStyle = '#334155';
        ctx.fillRect(-7 * scale, -100 * scale, 14 * scale, 200 * scale);

        // Center line (Double yellow)
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, -100 * scale);
        ctx.lineTo(0, 100 * scale);
        ctx.stroke();

        // Draw Cones / Obstacles
        this.game.environment.cones.forEach(c => {
            const dx = (c.x - carPos.x) * scale;
            const dz = (c.z - carPos.z) * scale;
            ctx.fillStyle = c.isHit ? '#64748b' : '#f97316';
            ctx.beginPath();
            ctx.arc(dx, dz, 3, 0, Math.PI * 2);
            ctx.fill();
        });

        // Draw AI cars
        this.game.levelManager.aiCars.forEach(ai => {
            const dx = (ai.position.x - carPos.x) * scale;
            const dz = (ai.position.z - carPos.z) * scale;
            ctx.fillStyle = '#ef4444';
            ctx.fillRect(dx - 3, dz - 6, 6, 12);
        });

        // Draw Pedestrians
        this.game.levelManager.pedestrians.forEach(p => {
            const dx = (p.position.x - carPos.x) * scale;
            const dz = (p.position.z - carPos.z) * scale;
            ctx.fillStyle = '#38bdf8';
            ctx.beginPath();
            ctx.arc(dx, dz, 3.5, 0, Math.PI * 2);
            ctx.fill();
        });

        // Draw Target Objective Marker (Flag)
        const target = this.game.levelManager.parkingTarget;
        if (target) {
            const dx = (target.x - carPos.x) * scale;
            const dz = (target.z - carPos.z) * scale;
            ctx.fillStyle = '#10b981';
            ctx.fillRect(dx - 4, dz - 6, 8, 12);
        }

        ctx.restore();

        // Draw Player Car at Center (Pointing UP)
        ctx.save();
        ctx.translate(cx, cy);
        ctx.fillStyle = '#ffffff';
        // Directional cone (vision field)
        ctx.fillStyle = 'rgba(56, 189, 248, 0.15)';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-24, -45);
        ctx.lineTo(24, -45);
        ctx.closePath();
        ctx.fill();

        // Car icon
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(-4, -8, 8, 16);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-2, -9, 4, 3);
        ctx.restore();
    }

    showLevelCompleteModal(data) {
        const modal = this.screens.completeModal;
        document.getElementById('complete-level-num').textContent = data.level;
        document.getElementById('complete-score').textContent = `${data.score} / 100`;
        document.getElementById('complete-time').textContent = `${data.time}s`;

        // Stars
        let starsHtml = '';
        for (let s = 1; s <= 3; s++) {
            starsHtml += `<span class="modal-star ${s <= data.stars ? 'active' : ''}">★</span>`;
        }
        document.getElementById('complete-stars').innerHTML = starsHtml;

        // Deductions list
        const dedList = document.getElementById('complete-deductions-list');
        dedList.innerHTML = '';
        if (data.deductions.length === 0) {
            dedList.innerHTML = '<li class="no-deductions">🏆 Flawless Driving! Zero penalties recorded.</li>';
        } else {
            data.deductions.forEach(d => {
                const li = document.createElement('li');
                li.innerHTML = `<span>⚠️ ${d.reason}</span> <span class="ded-pts">-${d.points} pts</span>`;
                dedList.appendChild(li);
            });
        }

        // Hide "Next Level" on level 5
        const nextBtn = document.getElementById('btn-next-level');
        if (data.level >= 5) {
            nextBtn.textContent = 'View Driver License 🎓';
        } else {
            nextBtn.textContent = 'Next Lesson →';
        }

        modal.classList.remove('hidden');
    }

    showGameOverModal(reason) {
        const modal = this.screens.failedModal;
        document.getElementById('failed-reason').textContent = reason;
        modal.classList.remove('hidden');
    }
}

window.UIManager = UIManager;
