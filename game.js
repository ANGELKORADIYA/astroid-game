class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.resizeCanvas();
        
        this.player = null;
        this.asteroids = [];
        this.bullets = [];
        this.score = 0;
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
        this.lastFPSUpdate = Date.now();
        
        // Audio system
        this.audioContext = null;
        this.backgroundMusic = null;
        this.musicGainNode = null;
        this.thrustSound = null;
        this.comboCount = 0;
        this.lastHitTime = 0;
        
        window.addEventListener('resize', () => this.resizeCanvas());
        this.initAudio();
        this.loadSettingsFromUI();
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
        this.setupEventListeners();
        this.updateUI();
        this.gameLoop();
    }
    
    getAsteroidCount() {
        const difficultyMultiplier = {
            easy: 0.7,
            normal: 1,
            hard: 1.5
        };
        return Math.floor(5 * difficultyMultiplier[this.settings.difficulty]);
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
        this.applyDifficultySettings();
        
        const difficultySettings = {
            easy: { speedMultiplier: 0.7 },
            normal: { speedMultiplier: 1 },
            hard: { speedMultiplier: 1.5 }
        };
        
        const settings = difficultySettings[this.settings.difficulty];
        
        // Adjust existing asteroids
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
        
        // Add or remove asteroids if needed
        const asteroidCountSettings = {
            easy: Math.floor(5 * 0.7),
            normal: 5,
            hard: Math.floor(5 * 1.5)
        };
        const targetCount = asteroidCountSettings[this.settings.difficulty];
        const currentCount = this.asteroids.length;
        
        if (currentCount < targetCount) {
            for (let i = currentCount; i < targetCount; i++) {
                let x, y;
                do {
                    x = Math.random() * this.width;
                    y = Math.random() * this.height;
                } while (this.distance(x, y, this.player.x, this.player.y) < 100);
                
                const newAsteroid = new Asteroid(x, y, 'large');
                newAsteroid.velocity.x *= settings.speedMultiplier;
                newAsteroid.velocity.y *= settings.speedMultiplier;
                this.asteroids.push(newAsteroid);
            }
        } else if (currentCount > targetCount) {
            this.asteroids.splice(targetCount);
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
    
    loadSettingsFromUI() {
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
    
    update() {
        if (this.gameOver || this.paused) return;
        
        // Update time
        this.elapsedTime = Date.now() - this.startTime;
        this.timeBonus = Math.floor(this.elapsedTime / 1000) * 2; // 2 points per second
        
        // Update FPS
        this.frameCount++;
        const now = Date.now();
        if (now - this.lastFPSUpdate >= 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.lastFPSUpdate = now;
        }
        
        this.player.update(this.keys, this.width, this.height);
        
        // Play thrust sound when moving
        if ((this.keys['arrowup'] || this.keys['w']) && !this.thrustSound) {
            this.playSound('thrust');
        }
        
        this.bullets = this.bullets.filter(bullet => {
            bullet.update();
            return bullet.life > 0 && 
                   bullet.x > 0 && bullet.x < this.width && 
                   bullet.y > 0 && bullet.y < this.height;
        });
        
        this.asteroids.forEach(asteroid => {
            asteroid.update(this.width, this.height);
        });
        
        if (this.settings.particles) {
            this.particles = this.particles.filter(particle => {
                particle.update();
                return particle.life > 0;
            });
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
            normal: { speedMultiplier: 1 },
            hard: { speedMultiplier: 1.5 }
        };
        
        const settings = difficultySettings[this.settings.difficulty];
        
        this.asteroids.forEach(asteroid => {
            const currentSpeed = Math.sqrt(asteroid.velocity.x ** 2 + asteroid.velocity.y ** 2);
            if (currentSpeed > 0) {
                const targetSpeed = (asteroid.size === 'large' ? 2 : asteroid.size === 'medium' ? 3 : 4) * settings.speedMultiplier;
                const ratio = targetSpeed / currentSpeed;
                asteroid.velocity.x *= ratio;
                asteroid.velocity.y *= ratio;
            }
        });
    }
    
    checkCollisions() {
        this.bullets.forEach((bullet, bulletIndex) => {
            this.asteroids.forEach((asteroid, asteroidIndex) => {
                if (this.distance(bullet.x, bullet.y, asteroid.x, asteroid.y) < asteroid.radius) {
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
                    }
                    
                    // Apply combo multiplier
                    const comboMultiplier = Math.min(this.comboCount, 5);
                    points *= comboMultiplier;
                    this.score += points;
                    
                    // Play powerup sound for high combos
                    if (this.comboCount === 5 || this.comboCount === 10) {
                        this.playSound('powerup');
                    }
                    
                    this.asteroids.splice(asteroidIndex, 1);
                }
            });
        });
        
        this.asteroids.forEach(asteroid => {
            if (this.distance(this.player.x, this.player.y, asteroid.x, asteroid.y) < asteroid.radius + 10) {
                this.playSound('hit');
                this.endGame();
            }
        });
    }
    
    createExplosion(x, y, radius) {
        const particleCount = Math.floor(radius / 2);
        for (let i = 0; i < particleCount; i++) {
            this.particles.push(new Particle(x, y));
        }
    }
    
    draw() {
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
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
        
        if (this.settings.showFPS) {
            this.drawFPS();
        }
        
        if (this.paused) {
            this.drawPauseScreen();
        }
    }
    
    drawStars() {
        this.ctx.fillStyle = '#fff';
        for (let i = 0; i < 50; i++) {
            const x = (i * 73) % this.width;
            const y = (i * 37) % this.height;
            const size = (i % 3) * 0.5 + 0.5;
            this.ctx.fillRect(x, y, size, size);
        }
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
    
    gameLoop() {
        if (!this.paused && !this.gameOver) {
            this.update();
            this.draw();
            requestAnimationFrame(() => this.gameLoop());
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
        // Reload settings first to get current difficulty
        this.settings = this.loadSettings();
        this.loadSettingsFromUI();
        
        // Reset game state
        this.player = new Player(this.width / 2, this.height / 2);
        this.asteroids = [];
        this.bullets = [];
        this.particles = [];
        this.score = 0;
        this.level = 1;
        this.gameOver = false;
        this.paused = false;
        this.keys = {};
        this.startTime = Date.now();
        this.elapsedTime = 0;
        this.timeBonus = 0;
        this.comboCount = 0;
        this.lastHitTime = 0;
        
        // Apply difficulty settings immediately
        this.applyDifficultySettings();
        
        document.getElementById('pauseBtn').textContent = '⏸️';
        this.updateUI();
        this.createAsteroids(this.getAsteroidCount());
        document.getElementById('gameOver').classList.add('hidden');
        this.gameLoop();
    }
    
    applyDifficultySettings() {
        const difficultySettings = {
            easy: {
                asteroidCount: Math.floor(5 * 0.7),
                speedMultiplier: 0.7,
                thrustPower: 0.6
            },
            normal: {
                asteroidCount: 5,
                speedMultiplier: 1,
                thrustPower: 0.5
            },
            hard: {
                asteroidCount: Math.floor(5 * 1.5),
                speedMultiplier: 1.5,
                thrustPower: 0.4,
                boostPower: 0.8 // Special boost for restart on hard
            }
        };
        
        const settings = difficultySettings[this.settings.difficulty];
        
        // Apply player settings
        if (this.player) {
            this.player.thrust = settings.thrustPower;
            this.player.color = this.settings.shipColor;
            
            // Special restart boost for hard difficulty
            if (this.settings.difficulty === 'hard') {
                this.player.thrust = settings.boostPower; // Boost to 0.8 thrust!
                this.player.boostTime = Date.now(); // Track boost duration
                this.playSound('powerup'); // Play powerup sound for boost
            }
        }
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
    }
    
    update(keys, canvasWidth, canvasHeight) {
        // Check for boost expiration
        if (this.boostTime && Date.now() - this.boostTime > this.boostDuration) {
            // Reset to normal hard difficulty thrust
            this.thrust = 0.4;
            this.boostTime = null;
        }
        
        // Arrow keys
        if (keys['arrowleft']) {
            this.angle -= 0.1;
        }
        if (keys['arrowright']) {
            this.angle += 0.1;
        }
        if (keys['arrowup']) {
            this.velocity.x += Math.cos(this.angle) * this.thrust;
            this.velocity.y += Math.sin(this.angle) * this.thrust;
        }
        
        // WASD keys
        if (keys['a']) {
            this.angle -= 0.1;
        }
        if (keys['d']) {
            this.angle += 0.1;
        }
        if (keys['w']) {
            this.velocity.x += Math.cos(this.angle) * this.thrust;
            this.velocity.y += Math.sin(this.angle) * this.thrust;
        }
        
        this.velocity.x *= this.friction;
        this.velocity.y *= this.friction;
        
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        
        if (this.x < 0) this.x = canvasWidth;
        if (this.x > canvasWidth) this.x = 0;
        if (this.y < 0) this.y = canvasHeight;
        if (this.y > canvasHeight) this.y = 0;
    }
    
    shoot() {
        const bullet = new Bullet(
            this.x + Math.cos(this.angle) * 15,
            this.y + Math.sin(this.angle) * 15,
            Math.cos(this.angle) * 10,
            Math.sin(this.angle) * 10
        );
        game.bullets.push(bullet);
        game.playSound('shoot');
    }
    
    draw(ctx, keys) {
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
    
    update(canvasWidth, canvasHeight) {
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        this.rotation += this.rotationSpeed;
        
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
    constructor(x, y, vx, vy) {
        this.x = x;
        this.y = y;
        this.velocity = { x: vx, y: vy };
        this.life = 40;
    }
    
    update() {
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        this.life--;
    }
    
    draw(ctx) {
        ctx.fillStyle = '#ff6b6b';
        ctx.fillRect(this.x - 2, this.y - 2, 4, 4);
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
    
    update() {
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        this.velocity.x *= 0.98;
        this.velocity.y *= 0.98;
        this.life--;
    }
    
    draw(ctx) {
        const alpha = this.life / this.maxLife;
        ctx.fillStyle = this.color.replace('50%', `${50 * alpha}%`);
        ctx.globalAlpha = alpha;
        ctx.fillRect(this.x - 2, this.y - 2, 4, 4);
        ctx.globalAlpha = 1;
    }
}

let game;
window.addEventListener('load', () => {
    game = new Game();
});