/**
 * DRIVE SMART - Local Storage & Data Persistence Manager
 * Saves completed lessons, stars, high scores, garage choices,
 * settings, and official driver's license certificates.
 */

const StorageManager = {
    KEYS: {
        PROGRESS: 'drive_smart_progress',
        SETTINGS: 'drive_smart_settings',
        GARAGE: 'drive_smart_garage',
        LICENSE: 'drive_smart_license'
    },

    // Default game state
    _defaultProgress: {
        unlockedLevel: 1,
        levels: {
            1: { completed: false, stars: 0, score: 0, time: 0 },
            2: { completed: false, stars: 0, score: 0, time: 0 },
            3: { completed: false, stars: 0, score: 0, time: 0 },
            4: { completed: false, stars: 0, score: 0, time: 0 },
            5: { completed: false, stars: 0, score: 0, time: 0 }
        },
        totalKm: 0,
        violationsCount: 0
    },

    _defaultSettings: {
        volume: 0.8,
        soundMuted: false,
        timeOfDay: 'day',
        weather: 'clear',
        steeringSensitivity: 1.0,
        graphics: 'high'
    },

    _defaultGarage: {
        selectedCar: 'hatchback', // 'hatchback', 'sedan', 'suv', 'sport'
        selectedColor: '#d32f2f'
    },

    getProgress() {
        try {
            const data = localStorage.getItem(this.KEYS.PROGRESS);
            if (data) return JSON.parse(data);
        } catch (e) {
            console.warn("Storage load error:", e);
        }
        return JSON.parse(JSON.stringify(this._defaultProgress));
    },

    saveLevelProgress(levelIndex, result) {
        const progress = this.getProgress();
        const current = progress.levels[levelIndex] || { completed: false, stars: 0, score: 0, time: 0 };

        // Save best score & stars
        progress.levels[levelIndex] = {
            completed: true,
            stars: Math.max(current.stars, result.stars),
            score: Math.max(current.score, result.score),
            time: current.time > 0 ? Math.min(current.time, result.time) : result.time
        };

        // Unlock next level
        if (levelIndex >= progress.unlockedLevel && levelIndex < 5) {
            progress.unlockedLevel = levelIndex + 1;
        }

        try {
            localStorage.setItem(this.KEYS.PROGRESS, JSON.stringify(progress));
        } catch (e) {
            console.warn("Storage save error:", e);
        }
    },

    getSettings() {
        try {
            const data = localStorage.getItem(this.KEYS.SETTINGS);
            if (data) return JSON.parse(data);
        } catch (e) {
            console.warn("Settings load error:", e);
        }
        return JSON.parse(JSON.stringify(this._defaultSettings));
    },

    saveSettings(settings) {
        try {
            localStorage.setItem(this.KEYS.SETTINGS, JSON.stringify(settings));
        } catch (e) {
            console.warn("Settings save error:", e);
        }
    },

    getGarage() {
        try {
            const data = localStorage.getItem(this.KEYS.GARAGE);
            if (data) return JSON.parse(data);
        } catch (e) {
            console.warn("Garage load error:", e);
        }
        return JSON.parse(JSON.stringify(this._defaultGarage));
    },

    saveGarage(garage) {
        try {
            localStorage.setItem(this.KEYS.GARAGE, JSON.stringify(garage));
        } catch (e) {
            console.warn("Garage save error:", e);
        }
    },

    getLicense() {
        try {
            const data = localStorage.getItem(this.KEYS.LICENSE);
            if (data) return JSON.parse(data);
        } catch (e) {
            console.warn("License load error:", e);
        }
        return null;
    },

    saveLicense(licenseData) {
        try {
            localStorage.setItem(this.KEYS.LICENSE, JSON.stringify(licenseData));
        } catch (e) {
            console.warn("License save error:", e);
        }
    },

    resetAll() {
        try {
            localStorage.removeItem(this.KEYS.PROGRESS);
            localStorage.removeItem(this.KEYS.LICENSE);
        } catch (e) {
            console.warn("Reset error:", e);
        }
    }
};

window.StorageManager = StorageManager;
