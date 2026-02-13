"use strict";

const CONFIG = {
    GRAVITY: -22,
    JUMP_STRENGTH: 9,
    SPEED: 6,
    PILLAR_GAP: 5,
    COOKIE_TARGET: 20,
    BG_COLOR: 0xffccd5,
};

// --- AUDIO SYSTEM (Web Audio API) ---
class AudioManager {
    constructor() {
        this.ctx = null;
        this.musicGain = null;
        this.musicPlaying = false;
    }
    init() {
        if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    // --- SOUND EFFECTS ---
    playJump() {
        if (!this.ctx) return;
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(400, this.ctx.currentTime);
        o.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.08);
        o.frequency.exponentialRampToValueAtTime(600, this.ctx.currentTime + 0.15);
        g.gain.setValueAtTime(0.12, this.ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);
        o.connect(g); g.connect(this.ctx.destination);
        o.start(); o.stop(this.ctx.currentTime + 0.15);
    }
    playScore() {
        if (!this.ctx) return;
        // Two-note chime
        const t = this.ctx.currentTime;
        [600, 900].forEach((freq, i) => {
            const o = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            o.type = 'sine';
            o.frequency.setValueAtTime(freq, t + i * 0.1);
            g.gain.setValueAtTime(0.15, t + i * 0.1);
            g.gain.exponentialRampToValueAtTime(0.01, t + i * 0.1 + 0.25);
            o.connect(g); g.connect(this.ctx.destination);
            o.start(t + i * 0.1); o.stop(t + i * 0.1 + 0.25);
        });
    }
    playHit() {
        if (!this.ctx) return;
        // Crash explosion
        const t = this.ctx.currentTime;
        const noise = this.ctx.createBufferSource();
        const bufSize = this.ctx.sampleRate * 0.4;
        const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * 0.5;
        noise.buffer = buf;
        const g = this.ctx.createGain();
        g.gain.setValueAtTime(0.2, t);
        g.gain.exponentialRampToValueAtTime(0.01, t + 0.4);
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1500, t);
        filter.frequency.exponentialRampToValueAtTime(200, t + 0.3);
        noise.connect(filter); filter.connect(g); g.connect(this.ctx.destination);
        noise.start(t); noise.stop(t + 0.4);
    }
    playWoosh() {
        if (!this.ctx) return;
        const t = this.ctx.currentTime;
        const noise = this.ctx.createBufferSource();
        const bufSize = this.ctx.sampleRate * 0.2;
        const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1);
        noise.buffer = buf;
        const g = this.ctx.createGain();
        g.gain.setValueAtTime(0.05, t);
        g.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(2000, t);
        filter.frequency.exponentialRampToValueAtTime(500, t + 0.2);
        filter.Q.value = 2;
        noise.connect(filter); filter.connect(g); g.connect(this.ctx.destination);
        noise.start(t); noise.stop(t + 0.2);
    }
    playPillarPass() {
        if (!this.ctx) return;
        const t = this.ctx.currentTime;
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = 'triangle';
        o.frequency.setValueAtTime(300, t);
        o.frequency.exponentialRampToValueAtTime(350, t + 0.08);
        g.gain.setValueAtTime(0.06, t);
        g.gain.exponentialRampToValueAtTime(0.01, t + 0.08);
        o.connect(g); g.connect(this.ctx.destination);
        o.start(t); o.stop(t + 0.08);
    }
    playWin() {
        if (!this.ctx) return;
        // Victory fanfare
        const t = this.ctx.currentTime;
        const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
        notes.forEach((freq, i) => {
            const o = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            o.type = 'sine';
            o.frequency.setValueAtTime(freq, t + i * 0.15);
            g.gain.setValueAtTime(0.15, t + i * 0.15);
            g.gain.exponentialRampToValueAtTime(0.01, t + i * 0.15 + 0.4);
            o.connect(g); g.connect(this.ctx.destination);
            o.start(t + i * 0.15); o.stop(t + i * 0.15 + 0.4);
        });
    }
    playButtonClick() {
        if (!this.ctx) return;
        const t = this.ctx.currentTime;
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(1200, t);
        o.frequency.exponentialRampToValueAtTime(800, t + 0.05);
        g.gain.setValueAtTime(0.1, t);
        g.gain.exponentialRampToValueAtTime(0.01, t + 0.05);
        o.connect(g); g.connect(this.ctx.destination);
        o.start(t); o.stop(t + 0.05);
    }
    playNoBuzz() {
        if (!this.ctx) return;
        const t = this.ctx.currentTime;
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = 'sawtooth';
        o.frequency.setValueAtTime(80, t);
        g.gain.setValueAtTime(0.08, t);
        g.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
        o.connect(g); g.connect(this.ctx.destination);
        o.start(t); o.stop(t + 0.15);
    }
    // --- BACKGROUND MUSIC (procedural looping melody) ---
    startMusic() {
        if (!this.ctx || this.musicPlaying) return;
        this.musicPlaying = true;
        this.musicGain = this.ctx.createGain();
        this.musicGain.gain.value = 0.04;
        this.musicGain.connect(this.ctx.destination);

        // Simple looping bass + melody
        const bpm = 120;
        const beatDur = 60 / bpm;
        const barDur = beatDur * 4;
        const melodyNotes = [
            392, 440, 494, 523, 494, 440, 392, 349,
            330, 349, 392, 440, 392, 349, 330, 294
        ]; // G4-based happy melody
        const bassNotes = [196, 196, 220, 220, 175, 175, 165, 165]; // bass pattern

        const scheduleBar = (startTime) => {
            if (!this.musicPlaying) return;
            // Melody
            melodyNotes.forEach((freq, i) => {
                const o = this.ctx.createOscillator();
                const g = this.ctx.createGain();
                o.type = 'sine';
                o.frequency.value = freq;
                const noteStart = startTime + i * (beatDur * 0.5);
                g.gain.setValueAtTime(0.06, noteStart);
                g.gain.exponentialRampToValueAtTime(0.001, noteStart + beatDur * 0.45);
                o.connect(g); g.connect(this.musicGain);
                o.start(noteStart); o.stop(noteStart + beatDur * 0.5);
            });
            // Bass
            bassNotes.forEach((freq, i) => {
                const o = this.ctx.createOscillator();
                const g = this.ctx.createGain();
                o.type = 'triangle';
                o.frequency.value = freq;
                const noteStart = startTime + i * beatDur;
                g.gain.setValueAtTime(0.08, noteStart);
                g.gain.exponentialRampToValueAtTime(0.001, noteStart + beatDur * 0.9);
                o.connect(g); g.connect(this.musicGain);
                o.start(noteStart); o.stop(noteStart + beatDur);
            });
            // Schedule next bar
            const nextBar = startTime + melodyNotes.length * beatDur * 0.5;
            const delay = (nextBar - this.ctx.currentTime) * 1000;
            this._musicTimeout = setTimeout(() => scheduleBar(nextBar), Math.max(delay - 200, 0));
        };
        scheduleBar(this.ctx.currentTime);
    }
    stopMusic() {
        this.musicPlaying = false;
        if (this._musicTimeout) clearTimeout(this._musicTimeout);
        if (this.musicGain) {
            this.musicGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.5);
        }
    }
}

// --- SHAREABLE MESH UTILS ---
const AssetUtils = {
    createCookie() {
        const group = new THREE.Group();
        const body = new THREE.Mesh(
            new THREE.CylinderGeometry(0.4, 0.4, 0.2, 16),
            new THREE.MeshPhongMaterial({ color: 0xc68642, emissive: 0x221100 })
        );
        body.rotation.x = Math.PI / 2;
        group.add(body);

        const addChips = (yShift) => {
            const chips = [];
            const count = 6 + Math.floor(Math.random() * 2);
            for (let i = 0; i < count; i++) {
                let x, z, tooClose;
                let attempts = 0;
                do {
                    tooClose = false;
                    const angle = Math.random() * Math.PI * 2;
                    const radius = Math.random() * 0.28;
                    x = Math.cos(angle) * radius;
                    z = Math.sin(angle) * radius;
                    for (let other of chips) {
                        const dx = x - other.x;
                        const dz = z - other.z;
                        if (Math.sqrt(dx * dx + dz * dz) < 0.12) {
                            tooClose = true;
                            break;
                        }
                    }
                    attempts++;
                } while (tooClose && attempts < 20);

                const chip = new THREE.Mesh(
                    new THREE.SphereGeometry(0.065, 8, 8),
                    new THREE.MeshBasicMaterial({ color: 0x3d2b1f })
                );
                chip.position.set(x, yShift, z);
                body.add(chip);
                chips.push({ x, z });
            }
        };
        addChips(0.12); addChips(-0.12);
        return group;
    },
    createTea() {
        const group = new THREE.Group();
        const cup = new THREE.Mesh(
            new THREE.CylinderGeometry(0.35, 0.25, 0.55, 16),
            new THREE.MeshPhongMaterial({ color: 0xffffff, emissive: 0x333333 })
        );
        group.add(cup);
        const handle = new THREE.Mesh(
            new THREE.TorusGeometry(0.18, 0.05, 8, 16),
            new THREE.MeshPhongMaterial({ color: 0xffffff, emissive: 0x333333 })
        );
        handle.position.x = 0.35;
        group.add(handle);

        const liquid = new THREE.Mesh(
            new THREE.CylinderGeometry(0.34, 0.32, 0.5, 16),
            new THREE.MeshBasicMaterial({ color: 0xb5651d })
        );
        liquid.position.y = 0.04;
        group.add(liquid);

        const surface = new THREE.Mesh(
            new THREE.CircleGeometry(0.33, 16),
            new THREE.MeshBasicMaterial({ color: 0xcd853f })
        );
        surface.rotation.x = -Math.PI / 2;
        surface.position.y = 0.285;
        group.add(surface);
        return group;
    },
    createToast() {
        const group = new THREE.Group();
        const bread = new THREE.Mesh(
            new THREE.BoxGeometry(0.75, 0.75, 0.18),
            new THREE.MeshPhongMaterial({ color: 0xe6a15c, emissive: 0x110000 })
        );
        group.add(bread);
        const cheese = new THREE.Mesh(
            new THREE.BoxGeometry(0.65, 0.65, 0.05),
            new THREE.MeshBasicMaterial({ color: 0xffd700 })
        );
        cheese.position.z = 0.1;
        group.add(cheese);
        const ham = new THREE.Mesh(
            new THREE.BoxGeometry(0.5, 0.4, 0.05),
            new THREE.MeshBasicMaterial({ color: 0xffa07a })
        );
        ham.position.set(0, 0, 0.13);
        group.add(ham);
        return group;
    }
};

class HeartPlayer {
    constructor(scene) {
        this.velocity = 0;
        this.mesh = this.createHeartMesh();
        scene.add(this.mesh);
        this.bbox = new THREE.Box3();
        this.mesh.position.set(0, 0, 0);
    }
    createHeartMesh() {
        const shape = new THREE.Shape();
        const x = 0, y = 0;
        shape.moveTo(x + 5, y + 5);
        shape.bezierCurveTo(x + 5, y + 5, x + 4, y, x, y);
        shape.bezierCurveTo(x - 6, y, x - 6, y + 7, x - 6, y + 7);
        shape.bezierCurveTo(x - 6, y + 11, x - 3, y + 15.4, x + 5, y + 19);
        shape.bezierCurveTo(x + 12, y + 15.4, x + 16, y + 11, x + 16, y + 7);
        shape.bezierCurveTo(x + 16, y + 7, x + 16, y, x + 10, y);
        shape.bezierCurveTo(x + 7, y, x + 5, y + 5, x + 5, y + 5);
        const geometry = new THREE.ExtrudeGeometry(shape, { depth: 4, bevelEnabled: true, bevelSize: 1.5, bevelThickness: 1.5 });
        geometry.center();
        const material = new THREE.MeshPhongMaterial({ color: 0xff0054, shininess: 100, emissive: 0x330000 });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.scale.set(0.045, 0.045, 0.045);
        mesh.rotation.x = Math.PI;
        return mesh;
    }
    update(dt) {
        this.velocity += CONFIG.GRAVITY * dt;
        this.mesh.position.y += this.velocity * dt;
        this.mesh.rotation.z = THREE.MathUtils.lerp(this.mesh.rotation.z, Math.max(Math.min(this.velocity * 0.06, 0.6), -0.6), 0.1);
        this.bbox.setFromCenterAndSize(this.mesh.position, new THREE.Vector3(0.6, 0.6, 0.4));
    }
    jump() { this.velocity = CONFIG.JUMP_STRENGTH; }
    reset() { this.mesh.position.set(0, 0, 0); this.velocity = 0; this.mesh.rotation.z = 0; }
}

class Pillar {
    constructor(scene, x) {
        this.scene = scene;
        this.gapY = (Math.random() - 0.5) * 5;
        const geometry = new THREE.CylinderGeometry(0.8, 1.2, 30, 8);
        const material = new THREE.MeshPhongMaterial({ color: 0xff8fa3, shininess: 30 });
        this.top = new THREE.Mesh(geometry, material);
        this.top.position.set(x, this.gapY + 15 + CONFIG.PILLAR_GAP / 2, 0);
        this.bottom = new THREE.Mesh(geometry, material);
        this.bottom.position.set(x, this.gapY - 15 - CONFIG.PILLAR_GAP / 2, 0);
        scene.add(this.top); scene.add(this.bottom);
        this.topBbox = new THREE.Box3(); this.bottomBbox = new THREE.Box3();
        this.scored = false;
    }
    update(dt) {
        this.top.position.x -= CONFIG.SPEED * dt;
        this.bottom.position.x -= CONFIG.SPEED * dt;
        this.topBbox.setFromCenterAndSize(this.top.position, new THREE.Vector3(2, 30, 2));
        this.bottomBbox.setFromCenterAndSize(this.bottom.position, new THREE.Vector3(2, 30, 2));
    }
    isOffscreen() { return this.top.position.x < -18; }
    destroy() { this.scene.remove(this.top); this.scene.remove(this.bottom); }
}

class Pickup {
    constructor(scene, x, y, type) {
        this.scene = scene;
        this.group = this.createMesh(type);
        this.group.position.set(x, y, 0);
        scene.add(this.group);
        this.bbox = new THREE.Box3();
    }
    createMesh(type) {
        if (type === 'cookie') return AssetUtils.createCookie();
        if (type === 'tea') return AssetUtils.createTea();
        return AssetUtils.createToast();
    }
    update(dt) {
        this.group.position.x -= CONFIG.SPEED * dt;
        this.group.rotation.y += 2.5 * dt;
        this.group.rotation.x += 1.2 * dt;
        this.bbox.setFromCenterAndSize(this.group.position, new THREE.Vector3(1, 1, 1));
    }
    destroy() { this.scene.remove(this.group); }
}

class Letter {
    constructor(scene, x) {
        this.scene = scene;
        this.mesh = new THREE.Group();
        const paper = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1, 0.1), new THREE.MeshPhongMaterial({ color: 0xffffff, emissive: 0x333333 }));
        const seal = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.08), new THREE.MeshBasicMaterial({ color: 0xff0000 }));
        seal.position.z = 0.06;
        this.mesh.add(paper, seal);
        this.mesh.position.set(x, 0, 0);
        scene.add(this.mesh);
        this.bbox = new THREE.Box3();
    }
    update(dt) {
        this.mesh.position.x -= (CONFIG.SPEED * 0.4) * dt;
        this.mesh.rotation.y += 2 * dt;
        this.bbox.setFromCenterAndSize(this.mesh.position, new THREE.Vector3(1.5, 1, 0.5));
    }
}

class Game {
    constructor() {
        this.audio = new AudioManager();
        this.initThree();
        this.addLight();
        this.player = new HeartPlayer(this.scene);
        this.pillars = []; this.pickups = []; this.letter = null;
        this.score = 0; this.pillarsSpawned = 0; this.state = 'START';
        this.clock = new THREE.Clock(); this.spawnTimer = 0;
        this.initUI();
        this.initBackground();
        window.addEventListener('resize', () => this.onResize());
        const trigger = () => {
            if (this.state === 'PLAYING') {
                this.player.jump();
                this.audio.playJump();
            }
        };
        window.addEventListener('keydown', (e) => { if (e.code === 'Space') trigger(); });
        window.addEventListener('mousedown', trigger);
        this.animate();
        this.initPreviews();
    }

    initThree() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.z = 10;
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        document.getElementById('game-container').appendChild(this.renderer.domElement);
    }

    addLight() {
        this.scene.add(new THREE.AmbientLight(0xffffff, 0.9));
        const pL = new THREE.PointLight(0xffffff, 2);
        pL.position.set(5, 5, 10);
        this.scene.add(pL);
    }

    initUI() {
        document.getElementById('start-button').onclick = (e) => {
            e.stopPropagation();
            this.audio.init();
            this.audio.playButtonClick();
            this.start();
        };
        document.getElementById('retry-button').onclick = (e) => {
            e.stopPropagation();
            this.audio.playButtonClick();
            this.start();
        };
        document.getElementById('yes-button').onclick = (e) => {
            e.stopPropagation();
            this.audio.playButtonClick();
            this.audio.playWin();
            this.finish();
        };
        document.getElementById('no-button').onclick = (e) => {
            e.stopPropagation();
            this.audio.playNoBuzz();
        };

        // "NIE" button — reparent to body so it escapes panel transform containing block
        const noBtn = document.getElementById('no-button');
        this._noBtnParent = noBtn.parentElement; // save original parent for reset
        const moveNoButton = () => {
            // Move to body so position:fixed works relative to viewport, not the transformed panel
            if (noBtn.parentElement !== document.body) {
                document.body.appendChild(noBtn);
            }
            noBtn.classList.add('running');
            const btnW = noBtn.offsetWidth || 160;
            const btnH = noBtn.offsetHeight || 60;
            const margin = 40;
            const x = margin + Math.random() * Math.max(0, window.innerWidth - btnW - margin * 2);
            const y = margin + Math.random() * Math.max(0, window.innerHeight - btnH - margin * 2);
            noBtn.style.left = x + 'px';
            noBtn.style.top = y + 'px';
        };
        noBtn.addEventListener('mouseover', moveNoButton);
        noBtn.addEventListener('touchstart', (e) => { e.preventDefault(); moveNoButton(); });
    }

    initPreviews() {
        const createPreview = (id, type) => {
            const cont = document.getElementById(id);
            if (!cont) return;
            const scene = new THREE.Scene();
            const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 10);
            camera.position.z = 2;
            const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
            renderer.setSize(100, 100);
            cont.appendChild(renderer.domElement);
            scene.add(new THREE.AmbientLight(0xffffff, 1));
            const pL = new THREE.PointLight(0xffffff, 2); pL.position.set(2, 2, 5); scene.add(pL);
            let mesh;
            if (type === 'cookie') mesh = AssetUtils.createCookie();
            else if (type === 'tea') mesh = AssetUtils.createTea();
            else mesh = AssetUtils.createToast();
            mesh.scale.set(1.4, 1.4, 1.4);
            scene.add(mesh);
            const anim = () => {
                if (this.state !== 'START') return;
                requestAnimationFrame(anim);
                mesh.rotation.y += 0.02;
                mesh.rotation.x += 0.01;
                renderer.render(scene, camera);
            };
            anim();
        };
        createPreview('preview-toast', 'toast');
        createPreview('preview-tea', 'tea');
        createPreview('preview-cookie', 'cookie');
    }

    initBackground() {
        const container = document.getElementById('bg-hearts');
        if (!container) return;
        container.innerHTML = '';
        const hearts = ['❤️', '💕', '💗', '💖', '🩷'];
        for (let i = 0; i < 35; i++) {
            const h = document.createElement('div');
            h.className = 'floating-heart';
            h.innerText = hearts[Math.floor(Math.random() * hearts.length)];
            h.style.left = Math.random() * 100 + 'vw';
            h.style.fontSize = (18 + Math.random() * 20) + 'px';
            h.style.animationDuration = (Math.random() * 10 + 10) + 's';
            h.style.animationDelay = (Math.random() * 10) + 's';
            container.appendChild(h);
        }
    }

    start() {
        this.state = 'PLAYING'; this.score = 0; this.pillarsSpawned = 0;
        this.player.reset();
        this.pillars.forEach(p => p.destroy());
        this.pickups.forEach(p => p.destroy());
        if (this.letter) this.scene.remove(this.letter.mesh);
        this.pillars = []; this.pickups = []; this.letter = null;
        this.spawnTimer = 0; this.updateHUD();
        document.getElementById('start-screen').classList.add('hidden');
        document.querySelectorAll('.side-previews').forEach(el => el.classList.add('hidden'));
        document.getElementById('game-over-screen').classList.add('hidden');
        document.getElementById('proposal-screen').classList.add('hidden');
        document.getElementById('hud').classList.remove('hidden');
        // Reset NO button — put it back inside the panel
        const noBtn = document.getElementById('no-button');
        noBtn.classList.remove('running');
        noBtn.classList.remove('no-hidden');
        noBtn.style.left = '';
        noBtn.style.top = '';
        if (this._noBtnParent && noBtn.parentElement !== this._noBtnParent) {
            this._noBtnParent.appendChild(noBtn);
        }
        // Start music
        this.audio.startMusic();
    }

    updateHUD() {
        document.getElementById('score').innerText = this.score;
        document.getElementById('progress-fill').style.width = (this.score / CONFIG.COOKIE_TARGET * 100) + '%';
    }

    finish() {
        this.audio.stopMusic();
        // Hide the NO button after clicking TAK
        const noBtn = document.getElementById('no-button');
        noBtn.classList.add('no-hidden');
        const panel = document.querySelector('#proposal-screen .modern-panel');
        if (panel) {
            panel.innerHTML = `
                <h1 class="romantic-title">
                    <span class="gradient-text">JEJEJEJEJ!</span> 🥰
                </h1>
                <p>OKURR wiedziałem.. 🥰🥰 Wiem ze jakas gupia gra z latającym serduszkiem to nie super prezent ale nie moglem wpasc na cos lepszego z moim obecnym brakiem umiejetnosci w programowanie ehhh...💔</p>
                <div class="hearts-glow">💖 ✨ 💖</div>
            `;
        }
    }

    onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        const dt = Math.min(this.clock.getDelta(), 0.1);
        if (this.state === 'PLAYING') {
            this.player.update(dt);
            if (Math.abs(this.player.mesh.position.y) > 8.5) {
                this.audio.playHit();
                this.audio.stopMusic();
                this.state = 'GAMEOVER';
                document.getElementById('game-over-screen').classList.remove('hidden');
                document.getElementById('hud').classList.add('hidden');
            }
            this.spawnTimer -= dt;
            if (this.spawnTimer <= 0 && this.pillarsSpawned < CONFIG.COOKIE_TARGET) {
                const p = new Pillar(this.scene, 18);
                this.pillars.push(p);
                this.pillarsSpawned++;
                const types = ['cookie', 'tea', 'toast'];
                const type = types[Math.floor(Math.random() * 3)];
                this.pickups.push(new Pickup(this.scene, 18, p.gapY, type));
                this.spawnTimer = 8.5 / CONFIG.SPEED;
                this.audio.playWoosh();
            }
            for (let i = this.pillars.length - 1; i >= 0; i--) {
                const p = this.pillars[i]; p.update(dt);
                if (this.player.bbox.intersectsBox(p.topBbox) || this.player.bbox.intersectsBox(p.bottomBbox)) {
                    this.audio.playHit();
                    this.audio.stopMusic();
                    this.state = 'GAMEOVER';
                    document.getElementById('game-over-screen').classList.remove('hidden');
                    document.getElementById('hud').classList.add('hidden');
                }
                // Pillar pass sound
                if (!p.scored && p.top.position.x < this.player.mesh.position.x) {
                    p.scored = true;
                    this.audio.playPillarPass();
                }
                if (p.isOffscreen()) { p.destroy(); this.pillars.splice(i, 1); }
            }
            for (let i = this.pickups.length - 1; i >= 0; i--) {
                const p = this.pickups[i]; p.update(dt);
                if (this.player.bbox.intersectsBox(p.bbox)) {
                    this.audio.playScore();
                    p.destroy(); this.pickups.splice(i, 1);
                    this.score++; this.updateHUD();
                    if (this.score === CONFIG.COOKIE_TARGET) this.letter = new Letter(this.scene, 18);
                } else if (p.group.position.x < -18) { p.destroy(); this.pickups.splice(i, 1); }
            }
            if (this.letter) {
                this.letter.update(dt);
                if (this.player.bbox.intersectsBox(this.letter.bbox)) {
                    this.audio.stopMusic();
                    this.audio.playWin();
                    this.state = 'PROPOSAL';
                    document.getElementById('proposal-screen').classList.remove('hidden');
                    document.getElementById('hud').classList.add('hidden');
                    this.createConfetti();
                } else if (this.letter.mesh.position.x < -18) {
                    // Letter went offscreen
                    this.audio.playHit();
                    this.audio.stopMusic();
                    this.state = 'GAMEOVER';
                    document.getElementById('game-over-screen').classList.remove('hidden');
                    document.getElementById('hud').classList.add('hidden');
                }
            }
            // All food spawned but not all collected — missed too many
            if (!this.letter && this.pillarsSpawned >= CONFIG.COOKIE_TARGET
                && this.pickups.length === 0 && this.pillars.length === 0
                && this.score < CONFIG.COOKIE_TARGET) {
                this.audio.playHit();
                this.audio.stopMusic();
                this.state = 'GAMEOVER';
                document.getElementById('game-over-screen').classList.remove('hidden');
                document.getElementById('hud').classList.add('hidden');
            }
        }
        this.renderer.render(this.scene, this.camera);
    }

    createConfetti() {
        const container = document.getElementById('confetti-container');
        if (!container) return;
        container.innerHTML = '';
        for (let i = 0; i < 80; i++) {
            const div = document.createElement('div');
            div.className = 'confetti-piece';
            div.style.left = Math.random() * 100 + 'vw';
            div.style.background = ['#ff4d6d', '#ffb703', '#ffffff'][Math.floor(Math.random() * 3)];
            div.style.animationDuration = (Math.random() * 2 + 1) + 's';
            div.style.width = (Math.random() * 10 + 5) + 'px';
            div.style.height = div.style.width;
            container.appendChild(div);
        }
    }
}

window.onload = () => { window.game = new Game(); };
