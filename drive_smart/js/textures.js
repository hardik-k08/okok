/**
 * DRIVE SMART - Procedural Canvas Texture Generator
 * Creates realistic, high-resolution textures dynamically without external image files.
 * Works 100% offline and never fails with CORS or 404 errors!
 */

const TextureGen = {
    // Cache generated textures
    _cache: {},

    // Helper: Create a canvas
    _createCanvas(width, height) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        return { canvas, ctx: canvas.getContext('2d') };
    },

    // Asphalt Texture with fine noise and subtle color variation
    getAsphaltTexture() {
        if (this._cache['asphalt']) return this._cache['asphalt'];
        const { canvas, ctx } = this._createCanvas(512, 512);

        // Base asphalt color
        ctx.fillStyle = '#26292b';
        ctx.fillRect(0, 0, 512, 512);

        // Noise flecks
        const imgData = ctx.getImageData(0, 0, 512, 512);
        const data = imgData.data;
        for (let i = 0; i < data.length; i += 4) {
            const noise = (Math.random() - 0.5) * 28;
            data[i] = Math.min(255, Math.max(0, data[i] + noise));
            data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
            data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
        }
        ctx.putImageData(imgData, 0, 0);

        const tex = new THREE.CanvasTexture(canvas);
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(10, 10);
        this._cache['asphalt'] = tex;
        return tex;
    },

    // Road Texture with Indian Left-Hand Traffic Markings:
    // Driving on left: left lane goes forward, right lane is oncoming.
    // Double solid yellow center divider, white broken lane markers, white edge lines.
    getRoadSegmentTexture(type = 'straight') {
        const key = 'road_' + type;
        if (this._cache[key]) return this._cache[key];
        const { canvas, ctx } = this._createCanvas(512, 512);

        // Asphalt base
        ctx.fillStyle = '#222527';
        ctx.fillRect(0, 0, 512, 512);

        // Subtly lighter asphalt grain
        ctx.fillStyle = '#2a2d30';
        for (let i = 0; i < 4000; i++) {
            ctx.fillRect(Math.random() * 512, Math.random() * 512, 2, 2);
        }

        if (type === 'straight') {
            // White side edge lines
            ctx.fillStyle = '#e8edf0';
            ctx.fillRect(25, 0, 12, 512);
            ctx.fillRect(475, 0, 12, 512);

            // Double yellow center divider (Indian style)
            ctx.fillStyle = '#f5b027';
            ctx.fillRect(250, 0, 6, 512);
            ctx.fillRect(260, 0, 6, 512);

            // Broken white lane lines inside left and right lanes
            ctx.fillStyle = '#e8edf0';
            for (let y = 30; y < 512; y += 90) {
                // Left carriage inner lane divider
                ctx.fillRect(135, y, 8, 45);
                // Right carriage inner lane divider
                ctx.fillRect(375, y, 8, 45);
            }
        } else if (type === 'zebra') {
            // Pedestrian crosswalk (Zebra crossing) with white stop bar
            // Stop lines (white solid)
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(25, 40, 462, 20); // Stop line 1
            ctx.fillRect(25, 450, 462, 20); // Stop line 2

            // Zebra stripes
            for (let x = 40; x < 470; x += 55) {
                ctx.fillRect(x, 100, 32, 310);
            }

            // Yellow center line approaching
            ctx.fillStyle = '#f5b027';
            ctx.fillRect(252, 0, 8, 40);
            ctx.fillRect(252, 470, 8, 42);
        } else if (type === 'parking') {
            // Parking bays texture
            ctx.fillStyle = '#ffffff';
            // Bay markings
            ctx.lineWidth = 8;
            ctx.strokeStyle = '#ffffff';
            for (let y = 20; y < 512; y += 120) {
                ctx.beginPath();
                ctx.moveTo(30, y);
                ctx.lineTo(220, y);
                ctx.stroke();

                ctx.beginPath();
                ctx.moveTo(292, y);
                ctx.lineTo(482, y);
                ctx.stroke();
            }
        }

        const tex = new THREE.CanvasTexture(canvas);
        tex.wrapS = THREE.ClampToEdgeWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        this._cache[key] = tex;
        return tex;
    },

    // Curb texture with alternating black & yellow hazard stripes
    getCurbTexture() {
        if (this._cache['curb']) return this._cache['curb'];
        const { canvas, ctx } = this._createCanvas(256, 64);

        const stripeWidth = 32;
        for (let x = 0; x < 256; x += stripeWidth * 2) {
            ctx.fillStyle = '#f5b027'; // Bright yellow
            ctx.fillRect(x, 0, stripeWidth, 64);
            ctx.fillStyle = '#1c1e20'; // Black
            ctx.fillRect(x + stripeWidth, 0, stripeWidth, 64);
        }

        const tex = new THREE.CanvasTexture(canvas);
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.ClampToEdgeWrapping;
        tex.repeat.set(8, 1);
        this._cache['curb'] = tex;
        return tex;
    },

    // Grass texture with variations and lawn flecks
    getGrassTexture() {
        if (this._cache['grass']) return this._cache['grass'];
        const { canvas, ctx } = this._createCanvas(256, 256);

        ctx.fillStyle = '#346b38';
        ctx.fillRect(0, 0, 256, 256);

        // Grass speckles
        for (let i = 0; i < 3000; i++) {
            const tone = Math.random() > 0.5 ? '#3e7c42' : '#2b572e';
            ctx.fillStyle = tone;
            ctx.fillRect(Math.random() * 256, Math.random() * 256, 3, 4);
        }

        const tex = new THREE.CanvasTexture(canvas);
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(30, 30);
        this._cache['grass'] = tex;
        return tex;
    },

    // Concrete Sidewalk texture
    getSidewalkTexture() {
        if (this._cache['sidewalk']) return this._cache['sidewalk'];
        const { canvas, ctx } = this._createCanvas(256, 256);

        ctx.fillStyle = '#8a9094';
        ctx.fillRect(0, 0, 256, 256);

        // Tile slab lines
        ctx.strokeStyle = '#5a5e62';
        ctx.lineWidth = 3;
        ctx.strokeRect(4, 4, 124, 124);
        ctx.strokeRect(132, 4, 120, 124);
        ctx.strokeRect(4, 132, 124, 120);
        ctx.strokeRect(132, 132, 120, 120);

        // Concrete grain
        for (let i = 0; i < 1500; i++) {
            ctx.fillStyle = Math.random() > 0.5 ? '#9ba1a6' : '#767b80';
            ctx.fillRect(Math.random() * 256, Math.random() * 256, 2, 2);
        }

        const tex = new THREE.CanvasTexture(canvas);
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(2, 20);
        this._cache['sidewalk'] = tex;
        return tex;
    },

    // Realistic Building Facade with illuminated windows
    getBuildingTexture(theme = 'office', isNight = false) {
        const key = `bldg_${theme}_${isNight}`;
        if (this._cache[key]) return this._cache[key];
        const { canvas, ctx } = this._createCanvas(256, 512);

        // Base building color
        ctx.fillStyle = theme === 'office' ? '#2c333a' : '#3d342d';
        ctx.fillRect(0, 0, 256, 512);

        // Grid of windows
        const cols = 5;
        const rows = 12;
        const winW = 32;
        const winH = 26;
        const gapX = 18;
        const gapY = 16;

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const x = 12 + c * (winW + gapX);
                const y = 14 + r * (winH + gapY);

                // Window glass
                const isLit = Math.random() > (isNight ? 0.35 : 0.7);
                if (isLit) {
                    ctx.fillStyle = isNight ? '#ffea9f' : '#88c8e8'; // Warm glow or sky reflection
                } else {
                    ctx.fillStyle = '#161c22';
                }
                ctx.fillRect(x, y, winW, winH);

                // Window frame
                ctx.strokeStyle = '#111417';
                ctx.lineWidth = 2;
                ctx.strokeRect(x, y, winW, winH);
                ctx.beginPath();
                ctx.moveTo(x + winW / 2, y);
                ctx.lineTo(x + winW / 2, y + winH);
                ctx.stroke();
            }
        }

        const tex = new THREE.CanvasTexture(canvas);
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        this._cache[key] = tex;
        return tex;
    },

    // Pothole Texture
    getPotholeTexture() {
        if (this._cache['pothole']) return this._cache['pothole'];
        const { canvas, ctx } = this._createCanvas(256, 256);

        ctx.clearRect(0, 0, 256, 256);

        // Dark crater shadow
        const grad = ctx.createRadialGradient(128, 128, 20, 128, 128, 115);
        grad.addColorStop(0, '#0c0d0e');
        grad.addColorStop(0.65, '#161819');
        grad.addColorStop(0.9, '#303437');
        grad.addColorStop(1, 'rgba(40,43,46,0)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.ellipse(128, 128, 110, 85, 0.2, 0, Math.PI * 2);
        ctx.fill();

        // Cracks around rim
        ctx.strokeStyle = '#050607';
        ctx.lineWidth = 3;
        for (let i = 0; i < 9; i++) {
            const angle = (i / 9) * Math.PI * 2;
            const rx = 128 + Math.cos(angle) * 85;
            const ry = 128 + Math.sin(angle) * 65;
            ctx.beginPath();
            ctx.moveTo(rx, ry);
            ctx.lineTo(rx + (Math.random() - 0.5) * 35, ry + (Math.random() - 0.5) * 35);
            ctx.stroke();
        }

        const tex = new THREE.CanvasTexture(canvas);
        this._cache['pothole'] = tex;
        return tex;
    },

    // Traffic Road Signs
    getSignTexture(type) {
        if (this._cache['sign_' + type]) return this._cache['sign_' + type];
        const { canvas, ctx } = this._createCanvas(256, 256);

        ctx.clearRect(0, 0, 256, 256);

        if (type === 'stop') {
            // Octagonal STOP sign
            ctx.fillStyle = '#d32f2f';
            ctx.beginPath();
            const r = 115;
            const cx = 128, cy = 128;
            for (let i = 0; i < 8; i++) {
                const a = (i * Math.PI) / 4 + Math.PI / 8;
                const x = cx + r * Math.cos(a);
                const y = cy + r * Math.sin(a);
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.fill();

            // White border
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 8;
            ctx.stroke();

            // STOP text
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 64px Arial, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('STOP', 128, 130);

        } else if (type === 'limit40') {
            // Speed Limit 40 Circle
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(128, 128, 115, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = '#d32f2f';
            ctx.lineWidth = 22;
            ctx.stroke();

            ctx.fillStyle = '#111111';
            ctx.font = '900 86px Arial, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('40', 128, 130);

        } else if (type === 'limit25') {
            // School Zone 25 Circle
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(128, 128, 115, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = '#d32f2f';
            ctx.lineWidth = 22;
            ctx.stroke();

            ctx.fillStyle = '#111111';
            ctx.font = '900 78px Arial, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('25', 128, 118);

            ctx.font = 'bold 22px Arial, sans-serif';
            ctx.fillText('SCHOOL', 128, 172);

        } else if (type === 'pedestrian') {
            // Blue square with pedestrian crosswalk icon
            ctx.fillStyle = '#1976d2';
            ctx.fillRect(16, 16, 224, 224);

            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 8;
            ctx.strokeRect(16, 16, 224, 224);

            // White zebra lines at bottom
            ctx.fillStyle = '#ffffff';
            for (let x = 50; x < 210; x += 35) {
                ctx.fillRect(x, 180, 20, 40);
            }

            // Simple walking person silhouette
            ctx.beginPath();
            ctx.arc(128, 70, 18, 0, Math.PI * 2); // Head
            ctx.fill();

            ctx.lineWidth = 14;
            ctx.lineCap = 'round';
            // Torso
            ctx.beginPath();
            ctx.moveTo(128, 90);
            ctx.lineTo(128, 135);
            // Left leg
            ctx.lineTo(105, 180);
            // Right leg
            ctx.moveTo(128, 135);
            ctx.lineTo(155, 180);
            // Left arm
            ctx.moveTo(128, 105);
            ctx.lineTo(105, 135);
            // Right arm
            ctx.moveTo(128, 105);
            ctx.lineTo(150, 125);
            ctx.stroke();

        } else if (type === 'keep_left') {
            // Indian Traffic Sign: Keep Left (Blue circle with arrow curving left)
            ctx.fillStyle = '#1976d2';
            ctx.beginPath();
            ctx.arc(128, 128, 115, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 8;
            ctx.stroke();

            // Arrow pointing diagonally down-left
            ctx.fillStyle = '#ffffff';
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 20;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            ctx.beginPath();
            ctx.moveTo(165, 80);
            ctx.lineTo(95, 150);
            ctx.stroke();

            // Arrow head
            ctx.beginPath();
            ctx.moveTo(70, 155);
            ctx.lineTo(125, 165);
            ctx.lineTo(100, 110);
            ctx.closePath();
            ctx.fill();
        }

        const tex = new THREE.CanvasTexture(canvas);
        this._cache['sign_' + type] = tex;
        return tex;
    },

    // License Plate Texture
    getLicensePlateTexture(text = 'IND • DL 01 AB 2026') {
        const { canvas, ctx } = this._createCanvas(256, 64);

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 256, 64);

        // Indian blue IND stripe on left
        ctx.fillStyle = '#0a2f7c';
        ctx.fillRect(0, 0, 36, 64);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 13px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('IND', 18, 40);

        // Chakra wheel emblem
        ctx.strokeStyle = '#ff9933';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(18, 20, 6, 0, Math.PI * 2);
        ctx.stroke();

        // Plate border
        ctx.strokeStyle = '#111111';
        ctx.lineWidth = 3;
        ctx.strokeRect(0, 0, 256, 64);

        // Registration Text
        ctx.fillStyle = '#111111';
        ctx.font = '900 24px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(text, 146, 42);

        const tex = new THREE.CanvasTexture(canvas);
        return tex;
    },

    // Wheel Rim and Tire Texture
    getWheelTexture() {
        if (this._cache['wheel']) return this._cache['wheel'];
        const { canvas, ctx } = this._createCanvas(256, 256);

        // Dark tire rubber
        ctx.fillStyle = '#18191a';
        ctx.beginPath();
        ctx.arc(128, 128, 124, 0, Math.PI * 2);
        ctx.fill();

        // Alloy Rim outer ring
        ctx.fillStyle = '#bdc3c7';
        ctx.beginPath();
        ctx.arc(128, 128, 86, 0, Math.PI * 2);
        ctx.fill();

        // Rim inner dark recess
        ctx.fillStyle = '#2c3e50';
        ctx.beginPath();
        ctx.arc(128, 128, 76, 0, Math.PI * 2);
        ctx.fill();

        // Rim 5-spoke design
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 14;
        for (let i = 0; i < 5; i++) {
            const angle = (i * Math.PI * 2) / 5;
            ctx.beginPath();
            ctx.moveTo(128, 128);
            ctx.lineTo(128 + Math.cos(angle) * 74, 128 + Math.sin(angle) * 74);
            ctx.stroke();
        }

        // Center hub cap with academy logo dot
        ctx.fillStyle = '#3498db';
        ctx.beginPath();
        ctx.arc(128, 128, 18, 0, Math.PI * 2);
        ctx.fill();

        // Brake disc caliper in background
        ctx.fillStyle = '#e74c3c';
        ctx.beginPath();
        ctx.arc(155, 100, 16, 0, Math.PI * 2);
        ctx.fill();

        const tex = new THREE.CanvasTexture(canvas);
        this._cache['wheel'] = tex;
        return tex;
    }
};

window.TextureGen = TextureGen;
