/**
 * DRIVE SMART - Procedural Web Audio Engine
 * High-performance, zero-asset audio synthesizer for realistic car acoustics:
 * Engine RPM roar, tire skid, horn, collisions, turn signals, and PDC parking beeper.
 */

class SoundEngine {
    constructor() {
        this.ctx = null;
        this.isMuted = false;
        this.masterVolume = 0.8;
        this.initialized = false;

        // Engine Audio Nodes
        this.engineGain = null;
        this.engineOsc1 = null;
        this.engineOsc2 = null;
        this.engineFilter = null;
        this.isPlayingEngine = false;

        // Skid Audio Nodes
        this.skidGain = null;
        this.skidSource = null;
        this.skidFilter = null;

        // Horn Audio Nodes
        this.hornOsc1 = null;
        this.hornOsc2 = null;
        this.hornGain = null;
        this.isHonking = false;

        // Parking Distance Control (PDC) Beeper
        this.pdcLastBeepTime = 0;
        this.pdcBeepInterval = 0; // ms
        this.pdcActive = false;

        // Rain Audio
        this.rainGain = null;
        this.rainSource = null;

        // Noise buffer cache
        this.noiseBuffer = null;
    }

    init() {
        if (this.initialized) return;
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.masterVolume, this.ctx.currentTime);
            this.masterGain.connect(this.ctx.destination);

            this._generateNoiseBuffer();
            this._setupEngine();
            this._setupSkid();
            this._setupHorn();
            this._setupRain();

            this.initialized = true;
        } catch (e) {
            console.warn("Web Audio initialization error:", e);
        }
    }

    resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    _generateNoiseBuffer() {
        if (!this.ctx) return;
        const bufferSize = this.ctx.sampleRate * 2;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        this.noiseBuffer = buffer;
    }

    _setupEngine() {
        if (!this.ctx) return;
        // Dual oscillator setup for deep cylinder rumble & engine revs
        this.engineOsc1 = this.ctx.createOscillator();
        this.engineOsc2 = this.ctx.createOscillator();
        this.engineOsc1.type = 'sawtooth';
        this.engineOsc2.type = 'triangle';

        this.engineFilter = this.ctx.createBiquadFilter();
        this.engineFilter.type = 'lowpass';
        this.engineFilter.frequency.setValueAtTime(120, this.ctx.currentTime);
        this.engineFilter.Q.setValueAtTime(2.5, this.ctx.currentTime);

        this.engineGain = this.ctx.createGain();
        this.engineGain.gain.setValueAtTime(0, this.ctx.currentTime);

        this.engineOsc1.connect(this.engineFilter);
        this.engineOsc2.connect(this.engineFilter);
        this.engineFilter.connect(this.engineGain);
        this.engineGain.connect(this.masterGain);

        this.engineOsc1.start();
        this.engineOsc2.start();
    }

    _setupSkid() {
        if (!this.ctx || !this.noiseBuffer) return;
        this.skidSource = this.ctx.createBufferSource();
        this.skidSource.buffer = this.noiseBuffer;
        this.skidSource.loop = true;

        this.skidFilter = this.ctx.createBiquadFilter();
        this.skidFilter.type = 'bandpass';
        this.skidFilter.frequency.setValueAtTime(1100, this.ctx.currentTime);
        this.skidFilter.Q.setValueAtTime(3.0, this.ctx.currentTime);

        this.skidGain = this.ctx.createGain();
        this.skidGain.gain.setValueAtTime(0, this.ctx.currentTime);

        this.skidSource.connect(this.skidFilter);
        this.skidFilter.connect(this.skidGain);
        this.skidGain.connect(this.masterGain);
        this.skidSource.start();
    }

    _setupHorn() {
        if (!this.ctx) return;
        // Standard automotive dual-tone horn: F4 (349Hz) and A4 (440Hz)
        this.hornOsc1 = this.ctx.createOscillator();
        this.hornOsc2 = this.ctx.createOscillator();
        this.hornOsc1.type = 'sawtooth';
        this.hornOsc2.type = 'sawtooth';
        this.hornOsc1.frequency.setValueAtTime(370, this.ctx.currentTime);
        this.hornOsc2.frequency.setValueAtTime(466, this.ctx.currentTime);

        const hornFilter = this.ctx.createBiquadFilter();
        hornFilter.type = 'lowpass';
        hornFilter.frequency.setValueAtTime(2200, this.ctx.currentTime);

        this.hornGain = this.ctx.createGain();
        this.hornGain.gain.setValueAtTime(0, this.ctx.currentTime);

        this.hornOsc1.connect(hornFilter);
        this.hornOsc2.connect(hornFilter);
        hornFilter.connect(this.hornGain);
        this.hornGain.connect(this.masterGain);

        this.hornOsc1.start();
        this.hornOsc2.start();
    }

    _setupRain() {
        if (!this.ctx || !this.noiseBuffer) return;
        this.rainSource = this.ctx.createBufferSource();
        this.rainSource.buffer = this.noiseBuffer;
        this.rainSource.loop = true;

        const rainFilter = this.ctx.createBiquadFilter();
        rainFilter.type = 'lowpass';
        rainFilter.frequency.setValueAtTime(800, this.ctx.currentTime);

        this.rainGain = this.ctx.createGain();
        this.rainGain.gain.setValueAtTime(0, this.ctx.currentTime);

        this.rainSource.connect(rainFilter);
        rainFilter.connect(this.rainGain);
        this.rainGain.connect(this.masterGain);
        this.rainSource.start();
    }

    setRain(enabled) {
        if (!this.rainGain || !this.ctx) return;
        const target = enabled ? 0.25 : 0;
        this.rainGain.gain.linearRampToValueAtTime(target, this.ctx.currentTime + 0.5);
    }

    updateEngine(rpmRatio, throttle, isBraking) {
        if (!this.initialized || !this.ctx) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();

        // Base idle frequency ~35Hz, peak ~180Hz
        const baseFreq = 32 + (rpmRatio * 150);
        const filterFreq = 140 + (rpmRatio * 900) + (throttle * 400);
        const volume = 0.15 + (throttle * 0.2) + (rpmRatio * 0.15);

        const now = this.ctx.currentTime;
        this.engineOsc1.frequency.setTargetAtTime(baseFreq, now, 0.05);
        this.engineOsc2.frequency.setTargetAtTime(baseFreq * 1.5, now, 0.05);
        this.engineFilter.frequency.setTargetAtTime(filterFreq, now, 0.05);
        this.engineGain.gain.setTargetAtTime(this.isMuted ? 0 : volume, now, 0.05);
    }

    updateSkid(skidIntensity) {
        if (!this.initialized || !this.skidGain || !this.ctx) return;
        const targetGain = this.isMuted ? 0 : Math.min(1.0, skidIntensity) * 0.35;
        this.skidGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.04);
    }

    startHorn() {
        if (!this.initialized || !this.hornGain || !this.ctx || this.isHonking) return;
        this.isHonking = true;
        this.hornGain.gain.cancelScheduledValues(this.ctx.currentTime);
        this.hornGain.gain.setValueAtTime(this.isMuted ? 0 : 0.35, this.ctx.currentTime);
    }

    stopHorn() {
        if (!this.initialized || !this.hornGain || !this.ctx || !this.isHonking) return;
        this.isHonking = false;
        this.hornGain.gain.cancelScheduledValues(this.ctx.currentTime);
        this.hornGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.08);
    }

    playPotholeBump() {
        if (!this.initialized || !this.ctx || this.isMuted) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(90, now);
        osc.frequency.exponentialRampToValueAtTime(25, now + 0.18);

        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.22);
    }

    playCollision(intensity = 1.0) {
        if (!this.initialized || !this.ctx || this.isMuted) return;
        const now = this.ctx.currentTime;
        const vol = Math.min(1.0, Math.max(0.2, intensity)) * 0.6;

        // Low thump
        const osc = this.ctx.createOscillator();
        const oscGain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.25);
        oscGain.gain.setValueAtTime(vol, now);
        oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        osc.connect(oscGain);
        oscGain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.26);

        // Crunch noise
        if (this.noiseBuffer) {
            const noise = this.ctx.createBufferSource();
            noise.buffer = this.noiseBuffer;
            const filter = this.ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(600, now);
            const nGain = this.ctx.createGain();
            nGain.gain.setValueAtTime(vol * 0.7, now);
            nGain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
            noise.connect(filter);
            filter.connect(nGain);
            nGain.connect(this.masterGain);
            noise.start(now);
            noise.stop(now + 0.22);
        }
    }

    playTurnSignalClick(isUp = true) {
        if (!this.initialized || !this.ctx || this.isMuted) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(isUp ? 1400 : 950, now);

        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.04);
    }

    triggerPDCBeep(distance) {
        if (!this.initialized || !this.ctx || this.isMuted) return;
        const now = performance.now();
        // Distance in meters: > 2.5m: silence, 2m: 600ms, 1m: 300ms, 0.4m: 120ms, < 0.25m: continuous tone
        let interval = 0;
        if (distance > 2.5) {
            this.pdcActive = false;
            return;
        } else if (distance > 1.5) {
            interval = 600;
        } else if (distance > 1.0) {
            interval = 350;
        } else if (distance > 0.6) {
            interval = 200;
        } else if (distance > 0.3) {
            interval = 100;
        } else {
            interval = 40; // virtually continuous
        }

        if (now - this.pdcLastBeepTime >= interval) {
            this.pdcLastBeepTime = now;
            const t = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(1750, t);

            const beepDur = Math.min(0.06, interval / 1000 * 0.7);
            gain.gain.setValueAtTime(0.18, t);
            gain.gain.setValueAtTime(0.18, t + beepDur * 0.8);
            gain.gain.exponentialRampToValueAtTime(0.001, t + beepDur);

            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start(t);
            osc.stop(t + beepDur);
        }
    }

    playCheckChime() {
        if (!this.initialized || !this.ctx || this.isMuted) return;
        const now = this.ctx.currentTime;
        const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
        notes.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now + idx * 0.08);

            gain.gain.setValueAtTime(0, now + idx * 0.08);
            gain.gain.linearRampToValueAtTime(0.2, now + idx * 0.08 + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.35);

            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start(now + idx * 0.08);
            osc.stop(now + idx * 0.08 + 0.38);
        });
    }

    playDeductionBuzzer() {
        if (!this.initialized || !this.ctx || this.isMuted) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.setValueAtTime(150, now + 0.1);

        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.28);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.3);
    }

    setMuted(muted) {
        this.isMuted = muted;
        if (this.masterGain && this.ctx) {
            this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.masterVolume, this.ctx.currentTime);
        }
    }

    setVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));
        if (this.masterGain && this.ctx && !this.isMuted) {
            this.masterGain.gain.setValueAtTime(this.masterVolume, this.ctx.currentTime);
        }
    }
}

// Global instance
window.soundEngine = new SoundEngine();
