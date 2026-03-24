class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.resizeCanvas();
        
        this.player = null;
        this.asteroids = [];
        this.bullets = [];
        this.powerUps = [];
        this.ufo = null;
        this.floatingTexts = [];
        this.score = 0;
        this.asteroidSpawnTimer = 0;
        this.level = 1;
        this.gameOver = false;
        this.paused = false;
        this.keys = {};
        
        // Time tracking
        this.startTime = Date.now();
        this.elapsedTime = 0;
        this.timeBonus = 0;
        
        // Settings
        this.settings = this.loadSettings();
        
        // High score system
        this.highScore = this.loadHighScore();
        
        this.particles = [];
        this.fps = 0;
        this.frameCount = 0;
        this.lastFPSUpdate = performance.now();
        this.lastTime = performance.now();
        
        // Visual effects
        this.screenShake = 0;
        this.stars = this.generateStars();
        
        // Audio system
        this.audioContext = null;
        this.backgroundMusic = null;
        this.musicGainNode = null;
        this.thrustSound = null;
        this.comboCount = 0;
        this.lastHitTime = 0;
        
        window.addEventListener('resize', () => this.resizeCanvas());
        this.initAudio();
        this.syncSettingsToUI();
        
        this.ufoCooldown = 15000 + Math.random() * 15000;
        this.powerUpCooldown = 10000 + Math.random() * 20000;
        
        this.init();
    }
    
    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.width = this.canvas.width;
        this.height = this.canvas.height;
    }
    
    initAudio() {
        try {
            window.AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContext();
            
            // Create background music using oscillators
            this.createBackgroundMusic();
        } catch (e) {
            console.log('Web Audio API not supported');
        }
    }
    
    createBackgroundMusic() {
        if (!this.audioContext) return;
        
        // Create music gain node for volume control
        this.musicGainNode = this.audioContext.createGain();
        this.musicGainNode.gain.value = this.settings.musicVolume * 0.3;
        this.musicGainNode.connect(this.audioContext.destination);
        
        // Create a simple ambient music pattern
        this.playBackgroundMusic();
    }
    
    playBackgroundMusic() {
        if (!this.audioContext || !this.settings.music) return;
        
        const playNote = (frequency, startTime, duration) => {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(frequency, startTime);
            
            gainNode.gain.setValueAtTime(0, startTime);
            gainNode.gain.linearRampToValueAtTime(0.1, startTime + 0.1);
            gainNode.gain.linearRampToValueAtTime(0, startTime + duration);
            
            oscillator.connect(gainNode);
            gainNode.connect(this.musicGainNode);
            
            oscillator.start(startTime);
            oscillator.stop(startTime + duration);
        };
        
        // Simple ambient melody
        const melody = [
            { freq: 220, time: 0, duration: 0.5 },    // A3
            { freq: 246.94, time: 0.5, duration: 0.5 }, // B3
            { freq: 261.63, time: 1, duration: 0.5 },   // C4
            { freq: 293.66, time: 1.5, duration: 0.5 }, // D4
            { freq: 329.63, time: 2, duration: 0.5 },   // E4
            { freq: 293.66, time: 2.5, duration: 0.5 }, // D4
            { freq: 261.63, time: 3, duration: 0.5 },   // C4
            { freq: 246.94, time: 3.5, duration: 0.5 }, // B3
        ];
        
        const currentTime = this.audioContext.currentTime;
        
        // Play the melody in a loop
        melody.forEach(note => {
            playNote(note.freq, currentTime + note.time, note.duration);
        });
        
        // Schedule the next loop
        if (this.settings.music) {
            setTimeout(() => this.playBackgroundMusic(), 4000);
        }
    }
    
    playSound(type) {
        if (!this.audioContext || !this.settings.sound) return;
        
        const currentTime = this.audioContext.currentTime;
        
        switch(type) {
            case 'shoot':
                this.createShootSound(currentTime);
                break;
                
            case 'explosion':
                this.createExplosionSound(currentTime);
                break;
                
            case 'hit':
                this.createHitSound(currentTime);
                break;
                
            case 'thrust':
                this.createThrustSound(currentTime);
                break;
                
            case 'combo':
                this.createComboSound(currentTime);
                break;
                
            case 'levelup':
                this.createLevelUpSound(currentTime);
                break;
                
            case 'powerup':
                this.createPowerUpSound(currentTime);
                break;
        }
    }
    
    createShootSound(time) {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(1200, time);
        oscillator.frequency.exponentialRampToValueAtTime(600, time + 0.08);
        
        gainNode.gain.setValueAtTime(0.2, time);
        gainNode.gain.exponentialRampToValueAtTime(0.01, time + 0.08);
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.start(time);
        oscillator.stop(time + 0.1);
    }
    
    createExplosionSound(time) {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();
        
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(150, time);
        oscillator.frequency.exponentialRampToValueAtTime(40, time + 0.3);
        
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2000, time);
        filter.frequency.exponentialRampToValueAtTime(200, time + 0.3);
        
        gainNode.gain.setValueAtTime(0.5, time);
        gainNode.gain.exponentialRampToValueAtTime(0.01, time + 0.3);
        
        oscillator.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.start(time);
        oscillator.stop(time + 0.4);
    }
    
    createHitSound(time) {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(300, time);
        oscillator.frequency.exponentialRampToValueAtTime(100, time + 0.15);
        
        gainNode.gain.setValueAtTime(0.4, time);
        gainNode.gain.exponentialRampToValueAtTime(0.01, time + 0.15);
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.start(time);
        oscillator.stop(time + 0.2);
    }
    
    createThrustSound(time) {
        if (this.thrustSound) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();
        
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(80, time);
        
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(400, time);
        filter.Q.setValueAtTime(10, time);
        
        gainNode.gain.setValueAtTime(0.15, time);
        gainNode.gain.exponentialRampToValueAtTime(0.01, time + 0.05);
        
        oscillator.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.start(time);
        oscillator.stop(time + 0.05);
        
        this.thrustSound = setTimeout(() => {
            this.thrustSound = null;
        }, 50);
    }
    
    createComboSound(time) {
        const comboLevel = Math.min(this.comboCount, 5);
        const baseFreq = 400 + (comboLevel * 200);
        
        for (let i = 0; i < 3; i++) {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.type = i === 0 ? 'sine' : 'square';
            oscillator.frequency.setValueAtTime(baseFreq + (i * 200), time + i * 0.05);
            
            gainNode.gain.setValueAtTime(0.3 - (i * 0.05), time + i * 0.05);
            gainNode.gain.exponentialRampToValueAtTime(0.01, time + i * 0.05 + 0.1);
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.start(time + i * 0.05);
            oscillator.stop(time + i * 0.05 + 0.15);
        }
    }
    
    createLevelUpSound(time) {
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        
        notes.forEach((freq, index) => {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(freq, time + index * 0.1);
            
            gainNode.gain.setValueAtTime(0.3, time + index * 0.1);
            gainNode.gain.exponentialRampToValueAtTime(0.01, time + index * 0.1 + 0.3);
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.start(time + index * 0.1);
            oscillator.stop(time + index * 0.1 + 0.4);
        });
    }
    
    createPowerUpSound(time) {
        for (let i = 0; i < 2; i++) {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(800, time);
            oscillator.frequency.exponentialRampToValueAtTime(1600, time + 0.2);
            
            gainNode.gain.setValueAtTime(0, time);
            gainNode.gain.linearRampToValueAtTime(0.4, time + 0.05);
            gainNode.gain.linearRampToValueAtTime(0, time + 0.2);
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.start(time);
            oscillator.stop(time + 0.2);
        }
    }
    
    init() {
        this.player = new Player(this.width / 2, this.height / 2);
        this.createAsteroids(this.getAsteroidCount());
        
        const spawnIntervals = { easy: 30000, normal: 20000, hard: 10000 };
        this.asteroidSpawnTimer = spawnIntervals[this.settings.difficulty];
        
        this.setupEventListeners();
        this.updateUI();
        this.gameLoop();
    }
    
    getAsteroidCount() {
        const counts = { easy: 3, normal: 5, hard: 10 };
        return counts[this.settings.difficulty] || 5;
    }
    
    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            
            if (e.key === ' ') {
                e.preventDefault();
                if (!this.paused && !this.gameOver) {
                    this.player.shoot();
                }
            }
            
            if (e.key === 'p' || e.key === 'P') {
                this.togglePause();
            }
            
            if (e.key === 'm' || e.key === 'M') {
                this.toggleMusic();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });
        
        document.getElementById('restartBtn').addEventListener('click', () => {
            this.restart();
        });
        
        document.getElementById('playAgainBtn').addEventListener('click', () => {
            this.restart();
        });
        
        document.getElementById('pauseBtn').addEventListener('click', () => {
            this.togglePause();
        });
        
        document.getElementById('settingsBtn').addEventListener('click', () => {
            this.toggleSettings();
        });
        
        document.getElementById('closeSettings').addEventListener('click', () => {
            this.toggleSettings();
        });
        
        // Remove difficulty event listener since it's now in settings
        
        document.getElementById('soundToggle').addEventListener('change', (e) => {
            this.settings.sound = e.target.checked;
            this.saveSettings();
        });
        
        document.getElementById('musicToggle').addEventListener('change', (e) => {
            this.settings.music = e.target.checked;
            this.saveSettings();
            if (this.musicGainNode) {
                this.musicGainNode.gain.value = this.settings.music ? this.settings.musicVolume * 0.3 : 0;
            }
        });
        
        document.getElementById('musicVolume').addEventListener('input', (e) => {
            this.settings.musicVolume = e.target.value / 100;
            this.saveSettings();
            if (this.musicGainNode) {
                this.musicGainNode.gain.value = this.settings.music ? this.settings.musicVolume * 0.3 : 0;
            }
        });
        
        document.getElementById('particlesToggle').addEventListener('change', (e) => {
            this.settings.particles = e.target.checked;
            this.saveSettings();
        });
        
        document.getElementById('fpsToggle').addEventListener('change', (e) => {
            this.settings.showFPS = e.target.checked;
            this.saveSettings();
        });
        
        document.getElementById('shipColor').addEventListener('change', (e) => {
            this.settings.shipColor = e.target.value;
            this.saveSettings();
            if (this.player) {
                this.player.color = e.target.value;
            }
        });
        
        document.getElementById('difficulty').addEventListener('change', (e) => {
            this.settings.difficulty = e.target.value;
            this.saveSettings();
            // Apply difficulty immediately without restart
            this.applyDifficulty();
        });
    }
    
    applyDifficulty() {
        const difficultySettings = {
            easy: { speedMultiplier: 0.7, thrustPower: 0.6, asteroidCount: 3 },
            normal: { speedMultiplier: 1.0, thrustPower: 0.5, asteroidCount: 5 },
            hard: { speedMultiplier: 2.0, thrustPower: 0.7, asteroidCount: 10, boostPower: 1.0 }
        };
        
        const settings = difficultySettings[this.settings.difficulty];
        
        // Update spawn timer based on difficulty
        const spawnIntervals = { easy: 30000, normal: 20000, hard: 10000 };
        this.asteroidSpawnTimer = spawnIntervals[this.settings.difficulty];
        
        // Apply player settings
        if (this.player) {
            this.player.thrust = settings.thrustPower;
            this.player.color = this.settings.shipColor;
        }
    }
    
    toggleMusic() {
        this.settings.music = !this.settings.music;
        document.getElementById('musicToggle').checked = this.settings.music;
        
        if (this.musicGainNode) {
            this.musicGainNode.gain.value = this.settings.music ? this.settings.musicVolume * 0.3 : 0;
        }
        
        if (this.settings.music && !this.backgroundMusic) {
            this.playBackgroundMusic();
        }
    }
    
    togglePause() {
        if (!this.gameOver) {
            this.paused = !this.paused;
            document.getElementById('pauseBtn').textContent = this.paused ? '▶️' : '⏸️';
            if (!this.paused) {
                this.gameLoop();
            }
        }
    }
    
    syncSettingsToUI() {
        // Update UI elements with loaded settings
        document.getElementById('difficulty').value = this.settings.difficulty;
        document.getElementById('soundToggle').checked = this.settings.sound;
        document.getElementById('musicToggle').checked = this.settings.music;
        document.getElementById('musicVolume').value = this.settings.musicVolume * 100;
        document.getElementById('particlesToggle').checked = this.settings.particles;
        document.getElementById('fpsToggle').checked = this.settings.showFPS;
        document.getElementById('shipColor').value = this.settings.shipColor;
    }
    
    loadSettings() {
        const defaultSettings = {
            sound: true,
            music: true,
            musicVolume: 0.5,
            particles: true,
            showFPS: false,
            shipColor: '#4ecdc4',
            difficulty: 'normal'
        };
        
        try {
            const saved = localStorage.getItem('asteroidGameSettings');
            return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
        } catch (e) {
            return defaultSettings;
        }
    }
    
    saveSettings() {
        try {
            localStorage.setItem('asteroidGameSettings', JSON.stringify(this.settings));
        } catch (e) {
            console.log('Could not save settings');
        }
    }
    
    loadHighScore() {
        try {
            return parseInt(localStorage.getItem('asteroidGameHighScore') || '0');
        } catch (e) {
            return 0;
        }
    }
    
    saveHighScore(score) {
        try {
            localStorage.setItem('asteroidGameHighScore', score.toString());
        } catch (e) {
            console.log('Could not save high score');
        }
    }
    
    toggleSettings() {
        const panel = document.getElementById('settingsPanel');
        panel.classList.toggle('hidden');
        if (!panel.classList.contains('hidden')) {
            this.playSound('powerup');
        }
    }
    
    createAsteroids(count) {
        for (let i = 0; i < count; i++) {
            let x, y;
            do {
                x = Math.random() * this.width;
                y = Math.random() * this.height;
            } while (this.distance(x, y, this.player.x, this.player.y) < 100);
            
            this.asteroids.push(new Asteroid(x, y, 'large'));
        }
    }
    
    distance(x1, y1, x2, y2) {
        return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    }
    
    update(dt) {
        if (this.gameOver || this.paused) return;
        
        // Update time
        this.elapsedTime = Date.now() - this.startTime;
        this.timeBonus = Math.floor(this.elapsedTime / 1000) * 2;
        
        // Update FPS
        this.frameCount++;
        const now = performance.now();
        if (now - this.lastFPSUpdate >= 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.lastFPSUpdate = now;
        }
        
        
        // Update screen shake
        if (this.screenShake > 0) {
            this.screenShake *= 0.9;
            if (this.screenShake < 0.1) this.screenShake = 0;
        }
        
        this.player.update(this.keys, this.width, this.height, dt);
        
        // Play thrust sound when moving
        if ((this.keys['arrowup'] || this.keys['w']) && !this.thrustSound) {
            this.playSound('thrust');
        }
        
        this.bullets = this.bullets.filter(bullet => {
            bullet.update(dt);
            return bullet.life > 0 && 
                   bullet.x > -10 && bullet.x < this.width + 10 && 
                   bullet.y > -10 && bullet.y < this.height + 10;
        });
        
        this.asteroids.forEach(asteroid => {
            // Apply time warp effect
            const speedScale = this.player.timeWarp > 0 ? 0.4 : 1.0;
            asteroid.update(this.width, this.height, dt * speedScale);
        });
        
        if (this.settings.particles) {
            this.particles = this.particles.filter(particle => {
                particle.update(dt);
                return particle.life > 0;
            });
        }
        
        // Update Power-ups
        this.powerUps = this.powerUps.filter(p => {
            p.update(dt);
            return p.life > 0;
        });
        
        // Update UFO
        if (this.ufo) {
            if (!this.ufo.update(this.width, this.height, this.player, dt)) {
                this.ufo = null;
            }
        } else {
            this.ufoCooldown -= dt * 16.67;
            if (this.ufoCooldown <= 0) {
                this.ufo = new UFO(this.width, this.height);
                this.ufoCooldown = 20000 + Math.random() * 20000;
            }
        }
        
        // Update Floating Texts
        this.floatingTexts = this.floatingTexts.filter(ft => {
            ft.update(dt);
            return ft.life > 0;
        });
        
        // Time-based asteroid spawning
        const spawnIntervals = { easy: 30000, normal: 20000, hard: 10000 };
        const interval = spawnIntervals[this.settings.difficulty];
        
        this.asteroidSpawnTimer -= dt * 16.67;
        if (this.asteroidSpawnTimer <= 0) {
            this.spawnPeriodicAsteroid();
            this.asteroidSpawnTimer = interval;
        }
        
        this.checkCollisions();
        this.updateUI();
        
        // Reset combo if no hits for 2 seconds
        if (now - this.lastHitTime > 2000) {
            this.comboCount = 0;
        }
        
        if (this.asteroids.length === 0) {
            this.level++;
            this.playSound('levelup');
            const asteroidCount = Math.min(8, this.getAsteroidCount() + Math.floor(this.level / 2));
            this.createAsteroids(asteroidCount);
        }
        
        // Adjust asteroid speeds based on difficulty in real-time
        this.updateDifficulty();
    }
    
    updateDifficulty() {
        const difficultySettings = {
            easy: { speedMultiplier: 0.7 },
            normal: { speedMultiplier: 1.0 },
            hard: { speedMultiplier: 2.0 }
        };
        
        const settings = difficultySettings[this.settings.difficulty];
        
        this.asteroids.forEach(asteroid => {
            const currentSpeed = Math.sqrt(asteroid.velocity.x ** 2 + asteroid.velocity.y ** 2);
            if (currentSpeed > 0) {
                const baseSpeed = asteroid.size === 'large' ? 2 : asteroid.size === 'medium' ? 3 : 4;
                const targetSpeed = baseSpeed * settings.speedMultiplier;
                const ratio = targetSpeed / currentSpeed;
                asteroid.velocity.x *= ratio;
                asteroid.velocity.y *= ratio;
            }
        });
    }
    
    checkCollisions() {
        this.bullets.forEach((bullet, bulletIndex) => {
            // Bullet vs Asteroid
            this.asteroids.forEach((asteroid, asteroidIndex) => {
                if (this.distance(bullet.x, bullet.y, asteroid.x, asteroid.y) < asteroid.radius) {
                    if (!bullet.enemy) {
                        this.bullets.splice(bulletIndex, 1);
                        
                        if (this.settings.particles) {
                            this.createExplosion(asteroid.x, asteroid.y, asteroid.radius);
                        }
                        
                        // Update combo and play combo sound
                        this.comboCount++;
                        this.lastHitTime = Date.now();
                        
                        if (this.comboCount > 1) {
                            this.playSound('combo');
                        }
                        
                        this.playSound('explosion');
                        this.screenShake = Math.max(this.screenShake, asteroid.radius / 2);
                        
                        let points = 0;
                        if (asteroid.size === 'large') {
                            this.asteroids.push(new Asteroid(asteroid.x, asteroid.y, 'medium'));
                            this.asteroids.push(new Asteroid(asteroid.x, asteroid.y, 'medium'));
                            points = 20;
                        } else if (asteroid.size === 'medium') {
                            this.asteroids.push(new Asteroid(asteroid.x, asteroid.y, 'small'));
                            this.asteroids.push(new Asteroid(asteroid.x, asteroid.y, 'small'));
                            points = 50;
                        } else {
                            points = 100;
                            // Chance to spawn power-up from small asteroids
                            if (Math.random() < 0.1) {
                                this.powerUps.push(new PowerUp(asteroid.x, asteroid.y));
                            }
                        }
                        
                        const comboMultiplier = Math.min(this.comboCount, 5);
                        points *= comboMultiplier;
                        this.score += points;
                        this.floatingTexts.push(new FloatingText(asteroid.x, asteroid.y, `+${points}`, '#ffd93d'));
                        
                        this.asteroids.splice(asteroidIndex, 1);
                    }
                }
            });
            
            // Bullet vs UFO
            if (this.ufo && !bullet.enemy && this.distance(bullet.x, bullet.y, this.ufo.x, this.ufo.y) < this.ufo.radius) {
                this.bullets.splice(bulletIndex, 1);
                this.createExplosion(this.ufo.x, this.ufo.y, this.ufo.radius);
                this.playSound('explosion');
                this.score += 500;
                this.floatingTexts.push(new FloatingText(this.ufo.x, this.ufo.y, "+500", '#ff6b6b'));
                this.ufo = null;
            }
            
            // Enemy Bullet vs Player
            if (bullet.enemy && this.distance(bullet.x, bullet.y, this.player.x, this.player.y) < this.player.radius + 5) {
                if (this.player.shield > 0) {
                    this.player.shield--;
                    this.bullets.splice(bulletIndex, 1);
                    this.playSound('powerup');
                    this.floatingTexts.push(new FloatingText(this.player.x, this.player.y, "SHIELD!", '#4ecdc4'));
                } else {
                    this.playSound('hit');
                    this.screenShake = 20;
                    this.endGame();
                }
            }
        });
        
        // Player vs Asteroid
        this.asteroids.forEach(asteroid => {
            if (this.distance(this.player.x, this.player.y, asteroid.x, asteroid.y) < asteroid.radius + 10) {
                if (this.player.shield > 0) {
                    this.player.shield--;
                    // Bounce away
                    const angle = Math.atan2(this.player.y - asteroid.y, this.player.x - asteroid.x);
                    this.player.velocity.x = Math.cos(angle) * 10;
                    this.player.velocity.y = Math.sin(angle) * 10;
                    this.playSound('powerup');
                    this.floatingTexts.push(new FloatingText(this.player.x, this.player.y, "SHIELD!", '#4ecdc4'));
                    // Destroy asteroid too
                    this.createExplosion(asteroid.x, asteroid.y, asteroid.radius);
                    this.asteroids.splice(this.asteroids.indexOf(asteroid), 1);
                } else {
                    this.playSound('hit');
                    this.screenShake = 20;
                    this.endGame();
                }
            }
        });
        
        // Player vs PowerUp
        this.powerUps.forEach((p, index) => {
            if (this.distance(this.player.x, this.player.y, p.x, p.y) < p.radius + 15) {
                this.applyPowerUp(p.type);
                this.playSound('powerup');
                this.powerUps.splice(index, 1);
            }
        });
    }

    applyPowerUp(type) {
        switch(type) {
            case 'shield':
                this.player.shield = 1;
                this.floatingTexts.push(new FloatingText(this.player.x, this.player.y, "SHIELD ACTIVE", '#4ecdc4'));
                break;
            case 'rapid':
                this.player.rapidFire = 300; // ~5 seconds
                this.floatingTexts.push(new FloatingText(this.player.x, this.player.y, "RAPID FIRE", '#ff6b6b'));
                break;
            case 'multi':
                this.player.multiShot = 300;
                this.floatingTexts.push(new FloatingText(this.player.x, this.player.y, "MULTI SHOT", '#ffd93d'));
                break;
            case 'time':
                this.player.timeWarp = 300;
                this.floatingTexts.push(new FloatingText(this.player.x, this.player.y, "TIME WARP", '#95e77e'));
                break;
        }
    }
    
    createExplosion(x, y, radius) {
        const particleCount = Math.floor(radius / 2);
        for (let i = 0; i < particleCount; i++) {
            this.particles.push(new Particle(x, y));
        }
    }
    
    draw() {
        this.ctx.save();
        
        // Apply screen shake
        if (this.screenShake > 0) {
            const dx = (Math.random() - 0.5) * this.screenShake;
            const dy = (Math.random() - 0.5) * this.screenShake;
            this.ctx.translate(dx, dy);
        }
        
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(-100, -100, this.width + 200, this.height + 200);
        
        this.drawStars();
        
        if (this.settings.particles) {
            this.particles.forEach(particle => {
                particle.draw(this.ctx);
            });
        }
        
        this.player.draw(this.ctx, this.keys);
        
        this.asteroids.forEach(asteroid => {
            asteroid.draw(this.ctx);
        });
        
        this.bullets.forEach(bullet => {
            bullet.draw(this.ctx);
        });
        
        this.powerUps.forEach(p => p.draw(this.ctx));
        if (this.ufo) this.ufo.draw(this.ctx);
        this.floatingTexts.forEach(ft => ft.draw(this.ctx));
        
        this.ctx.restore();
        
        this.ctx.restore();
        
        if (this.settings.showFPS) {
            this.drawFPS();
        }
        
        if (this.paused) {
            this.drawPauseScreen();
        }
    }
    
    generateStars() {
        const layers = [];
        const layerCount = 3;
        for (let l = 0; l < layerCount; l++) {
            const stars = [];
            const count = 50 + (l * 50);
            for (let i = 0; i < count; i++) {
                stars.push({
                    x: Math.random() * this.width,
                    y: Math.random() * this.height,
                    size: Math.random() * (l + 1) * 0.5 + 0.5,
                    opacity: 0.3 + Math.random() * 0.7
                });
            }
            layers.push({
                stars: stars,
                speedMultiplier: (l + 1) * 0.2
            });
        }
        return layers;
    }
    
    drawStars() {
        this.stars.forEach(layer => {
            this.ctx.fillStyle = `rgba(255, 255, 255, 0.8)`;
            layer.stars.forEach(star => {
                // Parallax shift based on player velocity
                let sx = star.x - (this.player.x * layer.speedMultiplier);
                let sy = star.y - (this.player.y * layer.speedMultiplier);
                
                // Wrap stars
                sx = ((sx % this.width) + this.width) % this.width;
                sy = ((sy % this.height) + this.height) % this.height;
                
                this.ctx.beginPath();
                this.ctx.arc(sx, sy, star.size, 0, Math.PI * 2);
                this.ctx.fill();
            });
        });
    }
    
    drawFPS() {
        this.ctx.fillStyle = '#4ecdc4';
        this.ctx.font = '14px Arial';
        this.ctx.fillText(`FPS: ${this.fps}`, 10, 20);
    }
    
    drawPauseScreen() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        this.ctx.fillStyle = '#4ecdc4';
        this.ctx.font = 'bold 48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('PAUSED', this.width / 2, this.height / 2);
        
        this.ctx.font = '20px Arial';
        this.ctx.fillText('Press P to resume', this.width / 2, this.height / 2 + 40);
        this.ctx.textAlign = 'left';
    }
    
    gameLoop(timestamp) {
        if (!this.paused && !this.gameOver) {
            const currentTime = performance.now();
            const dt = (currentTime - this.lastTime) / 16.67; // Normalize to 60fps (1.0 = 1 frame at 60fps)
            this.lastTime = currentTime;
            
            // Limit dt to prevent huge jumps if tab was inactive
            const cappedDt = Math.min(dt, 5);
            
            this.update(cappedDt);
            this.draw();
            requestAnimationFrame((t) => this.gameLoop(t));
        }
    }
    
    updateUI() {
        const totalScore = this.score + this.timeBonus;
        document.getElementById('score').textContent = totalScore;
        document.getElementById('highScore').textContent = this.highScore;
        document.getElementById('level').textContent = this.level;
        
        // Add combo indicator
        const scoreElement = document.getElementById('score');
        if (this.comboCount > 1) {
            scoreElement.textContent = `${totalScore} x${this.comboCount}`;
            scoreElement.classList.add('combo-active');
        } else {
            scoreElement.classList.remove('combo-active');
        }
        
        const seconds = Math.floor(this.elapsedTime / 1000);
        const minutes = Math.floor(seconds / 60);
        const displaySeconds = seconds % 60;
        document.getElementById('time').textContent = 
            `${minutes.toString().padStart(2, '0')}:${displaySeconds.toString().padStart(2, '0')}`;
            
        document.getElementById('modeDisplay').textContent = 
            this.settings.difficulty.charAt(0).toUpperCase() + this.settings.difficulty.slice(1);
            
        this.updatePowerUpUI();
    }
    
    updatePowerUpUI() {
        const container = document.getElementById('powerupStatus');
        container.innerHTML = '';
        
        const active = [];
        if (this.player.shield > 0) active.push({ type: 'shield', label: '🛡️ Shield' });
        if (this.player.rapidFire > 0) active.push({ type: 'rapid', label: '⚡ Rapid' });
        if (this.player.multiShot > 0) active.push({ type: 'multi', label: '🔱 Multi' });
        if (this.player.timeWarp > 0) active.push({ type: 'time', label: '⏳ Time' });
        
        active.forEach(p => {
            const pill = document.createElement('div');
            pill.className = `powerup-pill ${p.type}`;
            pill.textContent = p.label;
            container.appendChild(pill);
        });
    }
    
    endGame() {
        this.gameOver = true;
        const totalScore = this.score + this.timeBonus;
        
        // Check for new high score
        const isNewHighScore = totalScore > this.highScore;
        if (isNewHighScore) {
            this.highScore = totalScore;
            this.saveHighScore(this.highScore);
        }
        
        document.getElementById('finalScore').textContent = totalScore;
        document.getElementById('bestScore').textContent = this.highScore;
        document.getElementById('finalLevel').textContent = this.level;
        document.getElementById('finalMode').textContent = 
            this.settings.difficulty.charAt(0).toUpperCase() + this.settings.difficulty.slice(1);
        
        // Show new high score message if applicable
        const newHighScoreSection = document.getElementById('newHighScoreSection');
        if (isNewHighScore) {
            document.getElementById('newHighScore').textContent = totalScore;
            newHighScoreSection.classList.remove('hidden');
        } else {
            newHighScoreSection.classList.add('hidden');
        }
        
        const seconds = Math.floor(this.elapsedTime / 1000);
        const minutes = Math.floor(seconds / 60);
        const displaySeconds = seconds % 60;
        document.getElementById('finalTime').textContent = 
            `${minutes.toString().padStart(2, '0')}:${displaySeconds.toString().padStart(2, '0')}`;
        
        document.getElementById('gameOver').classList.remove('hidden');
    }
    
    restart() {
        // Reset timing first
        this.lastTime = performance.now();
        this.startTime = Date.now();
        this.elapsedTime = 0;
        this.timeBonus = 0;
        
        // Core game state
        this.score = 0;
        this.level = 1;
        this.gameOver = false;
        this.paused = false;
        this.comboCount = 0;
        this.lastHitTime = 0;
        
        // Clear entities
        this.bullets = [];
        this.asteroids = [];
        this.particles = [];
        this.powerUps = [];
        this.ufo = null;
        this.floatingTexts = [];
        
        // Reload settings and re-init player
        this.settings = this.loadSettings();
        this.syncSettingsToUI();
        this.player = new Player(this.width / 2, this.height / 2);
        
        // Cooldowns
        this.ufoCooldown = 15000 + Math.random() * 15000;
        this.powerUpCooldown = 10000 + Math.random() * 20000;
        
        this.applyDifficultySettings();
        
        document.getElementById('pauseBtn').textContent = '⏸️';
        document.getElementById('gameOver').classList.add('hidden');
        this.updateUI();
        
        const initialCount = this.getAsteroidCount();
        this.createAsteroids(initialCount);
        
        const spawnIntervals = { easy: 30000, normal: 20000, hard: 10000 };
        this.asteroidSpawnTimer = spawnIntervals[this.settings.difficulty];
        
        this.gameLoop();
    }
    
    applyDifficultySettings() {
        this.applyDifficulty();
    }
    
    spawnPeriodicAsteroid() {
        let x, y;
        const margin = 100;
        
        // Pick a random side to spawn from
        const side = Math.floor(Math.random() * 4);
        switch(side) {
            case 0: // Top
                x = Math.random() * this.width;
                y = -margin;
                break;
            case 1: // Right
                x = this.width + margin;
                y = Math.random() * this.height;
                break;
            case 2: // Bottom
                x = Math.random() * this.width;
                y = this.height + margin;
                break;
            case 3: // Left
                x = -margin;
                y = Math.random() * this.height;
                break;
        }
        
        const asteroid = new Asteroid(x, y, 'large');
        // Apply current difficulty speed multiplier
        const speedMultiplier = this.settings.difficulty === 'hard' ? 2.0 : this.settings.difficulty === 'normal' ? 1.0 : 0.7;
        asteroid.velocity.x *= speedMultiplier;
        asteroid.velocity.y *= speedMultiplier;
        
        this.asteroids.push(asteroid);
        this.floatingTexts.push(new FloatingText(this.width / 2, 50, "NEW ASTEROID APPROACHING!", '#ff6b6b'));
    }
}

class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.angle = 0;
        this.velocity = { x: 0, y: 0 };
        this.radius = 10;
        this.thrust = 0.5;
        this.friction = 0.99;
        this.color = '#4ecdc4';
        this.rotationSpeed = 0.1;
        this.trails = [];
        
        // Power-up states
        this.shield = 0;
        this.rapidFire = 0;
        this.multiShot = 0;
        this.timeWarp = 0;
        this.lastShotTime = 0;
    }
    
    update(keys, canvasWidth, canvasHeight, dt) {
        // Check for boost expiration
        if (this.boostTime && Date.now() - this.boostTime > this.boostDuration) {
            // Reset to normal hard difficulty thrust
            this.thrust = 0.4;
            this.boostTime = null;
        }
        
        // Arrow keys
        if (keys['arrowleft']) {
            this.angle -= this.rotationSpeed * dt;
        }
        if (keys['arrowright']) {
            this.angle += this.rotationSpeed * dt;
        }
        if (keys['arrowup']) {
            this.velocity.x += Math.cos(this.angle) * this.thrust * dt;
            this.velocity.y += Math.sin(this.angle) * this.thrust * dt;
        }
        
        // WASD keys
        if (keys['a']) {
            this.angle -= this.rotationSpeed * dt;
        }
        if (keys['d']) {
            this.angle += this.rotationSpeed * dt;
        }
        if (keys['w']) {
            this.velocity.x += Math.cos(this.angle) * this.thrust * dt;
            this.velocity.y += Math.sin(this.angle) * this.thrust * dt;
        }
        
        this.velocity.x *= Math.pow(this.friction, dt);
        this.velocity.y *= Math.pow(this.friction, dt);
        
        this.x += this.velocity.x * dt;
        this.y += this.velocity.y * dt;
        
        // Update trails
        if (Math.abs(this.velocity.x) > 0.1 || Math.abs(this.velocity.y) > 0.1) {
            this.trails.push({ x: this.x, y: this.y, angle: this.angle, life: 20 });
        }
        this.trails = this.trails.filter(t => {
            t.life -= dt;
            return t.life > 0;
        });
        
        if (this.x < 0) this.x = canvasWidth;
        if (this.x > canvasWidth) this.x = 0;
        if (this.y < 0) this.y = canvasHeight;
        if (this.y > canvasHeight) this.y = 0;
        
        // Update power-up timers
        if (this.rapidFire > 0) this.rapidFire -= dt;
        if (this.multiShot > 0) this.multiShot -= dt;
        if (this.timeWarp > 0) this.timeWarp -= dt;
    }
    
    shoot() {
        const now = Date.now();
        const cooldown = this.rapidFire > 0 ? 100 : 250;
        
        if (now - this.lastShotTime < cooldown) return;
        this.lastShotTime = now;
        
        if (this.multiShot > 0) {
            // Triple shot
            for (let i = -1; i <= 1; i++) {
                const angle = this.angle + (i * 0.2);
                const bullet = new Bullet(
                    this.x + Math.cos(angle) * 15,
                    this.y + Math.sin(angle) * 15,
                    Math.cos(angle) * 10,
                    Math.sin(angle) * 10
                );
                game.bullets.push(bullet);
            }
        } else {
            // Single shot
            const bullet = new Bullet(
                this.x + Math.cos(this.angle) * 15,
                this.y + Math.sin(this.angle) * 15,
                Math.cos(this.angle) * 10,
                Math.sin(this.angle) * 10
            );
            game.bullets.push(bullet);
        }
        game.playSound('shoot');
    }
    
    draw(ctx, keys) {
        // Draw trails
        this.trails.forEach(t => {
            ctx.save();
            ctx.translate(t.x, t.y);
            ctx.rotate(t.angle);
            ctx.strokeStyle = this.color;
            ctx.globalAlpha = t.life / 40;
            ctx.beginPath();
            ctx.moveTo(-5, -4);
            ctx.lineTo(-10, 0);
            ctx.lineTo(-5, 4);
            ctx.stroke();
            ctx.restore();
        });
        
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        
        // Draw ship with boost effect
        if (this.boostTime && Date.now() - this.boostTime < this.boostDuration) {
            // Boost active - draw glowing effect
            ctx.shadowBlur = 20;
            ctx.shadowColor = '#ffd93d';
            ctx.strokeStyle = '#ffd93d';
        } else {
            ctx.strokeStyle = this.color;
        }
        
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(15, 0);
        ctx.lineTo(-10, -8);
        ctx.lineTo(-5, 0);
        ctx.lineTo(-10, 8);
        ctx.closePath();
        ctx.stroke();
        
        // Draw thrust flame
        if ((keys && keys['arrowup']) || (keys && keys['w'])) {
            if (this.boostTime && Date.now() - this.boostTime < this.boostDuration) {
                // Boost flame - bigger and golden
                ctx.strokeStyle = '#ffd93d';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(-5, -6);
                ctx.lineTo(-15, 0);
                ctx.lineTo(-5, 6);
                ctx.stroke();
            } else {
                // Normal flame
                ctx.strokeStyle = '#ff6b6b';
                ctx.beginPath();
                ctx.moveTo(-5, -4);
                ctx.lineTo(-10, 0);
                ctx.lineTo(-5, 4);
                ctx.stroke();
            }
        }
        
        ctx.restore();
    }
}

class Asteroid {
    constructor(x, y, size) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.radius = size === 'large' ? 40 : size === 'medium' ? 25 : 15;
        this.velocity = {
            x: (Math.random() - 0.5) * 3,
            y: (Math.random() - 0.5) * 3
        };
        this.rotation = 0;
        this.rotationSpeed = (Math.random() - 0.5) * 0.05;
        this.vertices = this.generateVertices();
    }
    
    generateVertices() {
        const vertices = [];
        const numVertices = 8 + Math.floor(Math.random() * 5);
        
        for (let i = 0; i < numVertices; i++) {
            const angle = (i / numVertices) * Math.PI * 2;
            const variance = 0.8 + Math.random() * 0.4;
            vertices.push({
                x: Math.cos(angle) * this.radius * variance,
                y: Math.sin(angle) * this.radius * variance
            });
        }
        
        return vertices;
    }
    
    update(canvasWidth, canvasHeight, dt) {
        this.x += this.velocity.x * dt;
        this.y += this.velocity.y * dt;
        this.rotation += this.rotationSpeed * dt;
        
        if (this.x < -this.radius) this.x = canvasWidth + this.radius;
        if (this.x > canvasWidth + this.radius) this.x = -this.radius;
        if (this.y < -this.radius) this.y = canvasHeight + this.radius;
        if (this.y > canvasHeight + this.radius) this.y = -this.radius;
    }
    
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        this.vertices.forEach((vertex, index) => {
            if (index === 0) {
                ctx.moveTo(vertex.x, vertex.y);
            } else {
                ctx.lineTo(vertex.x, vertex.y);
            }
        });
        
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
    }
}

class Bullet {
    constructor(x, y, vx, vy, enemy = false) {
        this.x = x;
        this.y = y;
        this.velocity = { x: vx, y: vy };
        this.life = 40;
        this.enemy = enemy;
    }
    
    update(dt) {
        this.x += this.velocity.x * dt;
        this.y += this.velocity.y * dt;
        this.life -= dt;
    }
    
    draw(ctx) {
        ctx.fillStyle = this.enemy ? '#ff6b6b' : '#fff';
        ctx.shadowBlur = 10;
        ctx.shadowColor = ctx.fillStyle;
        ctx.fillRect(this.x - 2, this.y - 2, 4, 4);
        ctx.shadowBlur = 0;
    }
}

class Particle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.velocity = {
            x: (Math.random() - 0.5) * 8,
            y: (Math.random() - 0.5) * 8
        };
        this.life = 30;
        this.maxLife = 30;
        this.color = `hsl(${Math.random() * 60 + 10}, 100%, 50%)`;
    }
    
    update(dt) {
        this.x += this.velocity.x * dt;
        this.y += this.velocity.y * dt;
        this.velocity.x *= Math.pow(0.98, dt);
        this.velocity.y *= Math.pow(0.98, dt);
        this.life -= dt;
    }
    
    draw(ctx) {
        const alpha = this.life / this.maxLife;
        ctx.fillStyle = this.color;
        ctx.globalAlpha = alpha;
        ctx.fillRect(this.x - 2, this.y - 2, 4, 4);
        ctx.globalAlpha = 1;
    }
}

class PowerUp {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        const types = ['shield', 'rapid', 'multi', 'time'];
        this.type = types[Math.floor(Math.random() * types.length)];
        this.radius = 12;
        this.life = 600; // ~10 seconds
        this.angle = 0;
    }
    
    update(dt) {
        this.life -= dt;
        this.angle += 0.05 * dt;
    }
    
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        
        const colors = {
            shield: '#4ecdc4',
            rapid: '#ff6b6b',
            multi: '#ffd93d',
            time: '#95e77e'
        };
        
        ctx.strokeStyle = colors[this.type];
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            const a = (i / 5) * Math.PI * 2;
            const r = this.radius + Math.sin(this.angle * 2 + i) * 3;
            if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
            else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        }
        ctx.closePath();
        ctx.stroke();
        
        ctx.font = '10px Arial';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.fillText(this.type[0].toUpperCase(), 0, 4);
        
        ctx.restore();
    }
}

class UFO {
    constructor(canvasWidth, canvasHeight) {
        this.side = Math.random() < 0.5 ? 'left' : 'right';
        this.x = this.side === 'left' ? -30 : canvasWidth + 30;
        this.y = Math.random() * canvasHeight;
        this.velocity = {
            x: this.side === 'left' ? 2 : -2,
            y: (Math.random() - 0.5) * 2
        };
        this.radius = 15;
        this.shootCooldown = 2000;
    }
    
    update(canvasWidth, canvasHeight, player, dt) {
        this.x += this.velocity.x * dt;
        this.y += this.velocity.y * dt;
        
        this.shootCooldown -= dt * 16.67;
        if (this.shootCooldown <= 0) {
            this.shoot(player);
            this.shootCooldown = 2000 + Math.random() * 2000;
        }
        
        return !(this.x < -40 || this.x > canvasWidth + 40);
    }
    
    shoot(player) {
        const angle = Math.atan2(player.y - this.y, player.x - this.x);
        game.bullets.push(new Bullet(this.x, this.y, Math.cos(angle) * 5, Math.sin(angle) * 5, true));
    }
    
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.strokeStyle = '#ff6b6b';
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        ctx.ellipse(0, 0, 15, 6, 0, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.arc(0, -3, 6, 0, Math.PI, true);
        ctx.stroke();
        
        ctx.restore();
    }
}

class FloatingText {
    constructor(x, y, text, color) {
        this.x = x;
        this.y = y;
        this.text = text;
        this.color = color || '#fff';
        this.life = 60;
        this.maxLife = 60;
    }
    
    update(dt) {
        this.y -= 1 * dt;
        this.life -= dt;
    }
    
    draw(ctx) {
        const alpha = this.life / this.maxLife;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.text, this.x, this.y);
        ctx.restore();
    }
}

let game;
window.addEventListener('load', () => {
    game = new Game();
});