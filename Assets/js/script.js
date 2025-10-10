// Game Variables
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game State
let gameState = {
    running: false,
    paused: false,
    score: 0,
    lives: 3,
    gameOver: false,
    level: 1,
    levelPoints: 0,
    levelTimer: 0,
    maxLevel: 4,
    place: 1,
    currentMap: 1,
    bulletCount: 1
};

// Player Object
const player = {
    x: canvas.width / 2 - 25,
    y: canvas.height - 80,
    width: 50,
    height: 50,
    speed: 5,
    color: '#00ffff'
};

// Arrays for game objects
let bullets = [];
let enemies = [];
let particles = [];

// Input handling
const keys = {};

// Admin Panel Variables
let adminAuthenticated = false;
const ADMIN_PASSWORD = 'fachryganteng';

// Cheat System Variables
let cheatState = {
    rapidFire: false,
    bigBullets: false,
    slowMotion: false,
    invincible: false,
    noEnemies: false,
    autoShoot: false,
    rainbowMode: false,
    enemySpeed: 2,
    bulletSpeed: 7,
    lastShotTime: 0
};

// Initialize game
function init() {
    setupEventListeners();
    gameLoop();
}

// Event Listeners
function setupEventListeners() {
    // Keyboard events
    document.addEventListener('keydown', (e) => {
        keys[e.key.toLowerCase()] = true;
        if (e.key === ' ') {
            e.preventDefault();
            shoot();
        }
    });

    document.addEventListener('keyup', (e) => {
        keys[e.key.toLowerCase()] = false;
    });

    // Game control buttons
    document.getElementById('start-btn').addEventListener('click', startGame);
    document.getElementById('pause-btn').addEventListener('click', togglePause);
    
    // Admin panel events
    document.getElementById('admin-toggle').addEventListener('click', openAdminPanel);
    document.querySelector('.close').addEventListener('click', closeAdminPanel);
    document.getElementById('login-btn').addEventListener('click', authenticateAdmin);
    
    // Admin controls
    document.getElementById('player-speed').addEventListener('input', updatePlayerSpeed);
    document.getElementById('add-score-btn').addEventListener('click', addScore);
    document.getElementById('set-lives-btn').addEventListener('click', setLives);
    document.getElementById('reset-game-btn').addEventListener('click', resetGame);
    document.getElementById('god-mode-btn').addEventListener('click', toggleGodMode);
    document.getElementById('spawn-enemy-btn').addEventListener('click', spawnEnemy);
    document.getElementById('clear-enemies-btn').addEventListener('click', clearEnemies);
    document.getElementById('set-level-btn').addEventListener('click', setLevel);
    document.getElementById('add-level-points-btn').addEventListener('click', addLevelPoints);
    document.getElementById('change-map-btn').addEventListener('click', adminChangeMap);
    document.getElementById('reset-level-btn').addEventListener('click', resetLevelSystem);
    
    // Cheat system event listeners
    document.getElementById('max-score-btn').addEventListener('click', maxScore);
    document.getElementById('max-lives-btn').addEventListener('click', maxLives);
    document.getElementById('max-level-btn').addEventListener('click', maxLevel);
    document.getElementById('rapid-fire-btn').addEventListener('click', toggleRapidFire);
    document.getElementById('big-bullets-btn').addEventListener('click', toggleBigBullets);
    document.getElementById('slow-motion-btn').addEventListener('click', toggleSlowMotion);
    document.getElementById('invincible-btn').addEventListener('click', toggleInvincible);
    document.getElementById('no-enemies-btn').addEventListener('click', toggleNoEnemies);
    document.getElementById('auto-shoot-btn').addEventListener('click', toggleAutoShoot);
    document.getElementById('enemy-speed').addEventListener('input', updateEnemySpeed);
    document.getElementById('bullet-speed').addEventListener('input', updateBulletSpeed);
    document.getElementById('spawn-boss-btn').addEventListener('click', spawnBoss);
    document.getElementById('rainbow-mode-btn').addEventListener('click', toggleRainbowMode);

    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        const modal = document.getElementById('admin-modal');
        if (e.target === modal) {
            closeAdminPanel();
        }
    });
}

// Game Loop
function gameLoop() {
    if (!gameState.paused) {
        update();
    }
    draw();
    requestAnimationFrame(gameLoop);
}

// Update game logic
function update() {
    if (!gameState.running || gameState.gameOver) return;

    // Update player
    updatePlayer();

    // Update bullets
    updateBullets();

    // Update enemies
    updateEnemies();

    // Update particles
    updateParticles();

    // Update level system
    updateLevelSystem();

    // Spawn enemies (disabled if no enemies cheat is on)
    if (!cheatState.noEnemies && Math.random() < 0.02) {
        spawnEnemy();
    }
    
    // Auto shoot
    if (cheatState.autoShoot && Math.random() < 0.1) {
        shoot();
    }

    // Check collisions
    checkCollisions();
}

// Update player position
function updatePlayer() {
    if (keys['a'] || keys['arrowleft']) {
        player.x -= player.speed;
    }
    if (keys['d'] || keys['arrowright']) {
        player.x += player.speed;
    }
    if (keys['w'] || keys['arrowup']) {
        player.y -= player.speed;
    }
    if (keys['s'] || keys['arrowdown']) {
        player.y += player.speed;
    }

    // Keep player in bounds
    player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));
    player.y = Math.max(0, Math.min(canvas.height - player.height, player.y));
}

// Update bullets
function updateBullets() {
    bullets = bullets.filter(bullet => {
        bullet.y -= bullet.speed;
        return bullet.y > 0;
    });
}

// Update enemies
function updateEnemies() {
    enemies = enemies.filter(enemy => {
        const speedMultiplier = cheatState.slowMotion ? 0.3 : 1;
        enemy.y += enemy.speed * speedMultiplier;
        return enemy.y < canvas.height;
    });
}

// Update particles
function updateParticles() {
    particles = particles.filter(particle => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.life--;
        return particle.life > 0;
    });
}

// Check collisions
function checkCollisions() {
    // Bullet vs Enemy
    bullets.forEach((bullet, bulletIndex) => {
        enemies.forEach((enemy, enemyIndex) => {
            if (isColliding(bullet, enemy)) {
                // Remove bullet and enemy
                bullets.splice(bulletIndex, 1);
                enemies.splice(enemyIndex, 1);
                
                // Add score and level points
                gameState.score += 10;
                gameState.levelPoints += 10;
                updateScore();
                checkLevelUp();
                
                // Create explosion particles
                createExplosion(enemy.x + enemy.width/2, enemy.y + enemy.height/2);
            }
        });
    });

    // Player vs Enemy (disabled if invincible cheat is on)
    if (!cheatState.invincible) {
        enemies.forEach((enemy, enemyIndex) => {
            if (isColliding(player, enemy)) {
                enemies.splice(enemyIndex, 1);
                gameState.lives--;
                updateLives();
                
                // Create explosion particles
                createExplosion(player.x + player.width/2, player.y + player.height/2);
                
                if (gameState.lives <= 0) {
                    gameOver();
                }
            }
        });
    }
}

// Collision detection
function isColliding(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

// Create explosion particles
function createExplosion(x, y) {
    for (let i = 0; i < 10; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4,
            life: 30,
            color: `hsl(${Math.random() * 60}, 100%, 50%)`
        });
    }
}

// Shoot bullet
function shoot() {
    if (!gameState.running || gameState.gameOver) return;
    
    const currentTime = Date.now();
    
    // Rapid fire check
    if (cheatState.rapidFire && currentTime - cheatState.lastShotTime < 50) {
        return;
    }
    
    // Create multiple bullets based on level
    for (let i = 0; i < gameState.bulletCount; i++) {
        let bulletX = player.x + player.width/2 - 2;
        
        // Spread bullets if multiple
        if (gameState.bulletCount > 1) {
            bulletX += (i - (gameState.bulletCount - 1) / 2) * 8;
        }
        
        const bulletWidth = cheatState.bigBullets ? 8 : 4;
        const bulletHeight = cheatState.bigBullets ? 20 : 10;
        
        bullets.push({
            x: bulletX,
            y: player.y,
            width: bulletWidth,
            height: bulletHeight,
            speed: cheatState.bulletSpeed,
            color: cheatState.rainbowMode ? `hsl(${Math.random() * 360}, 100%, 50%)` : '#00ff00'
        });
    }
    
    cheatState.lastShotTime = currentTime;
}

// Spawn enemy
function spawnEnemy() {
    enemies.push({
        x: Math.random() * (canvas.width - 40),
        y: -40,
        width: 40,
        height: 40,
        speed: cheatState.enemySpeed + Math.random() * 1,
        color: `hsl(${Math.random() * 360}, 70%, 50%)`
    });
}

// Draw everything
function draw() {
    // Clear canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw stars background
    drawStars();

    if (gameState.running && !gameState.gameOver) {
        // Draw player
        drawPlayer();

        // Draw bullets
        bullets.forEach(bullet => {
            ctx.fillStyle = bullet.color;
            ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
        });

        // Draw enemies
        enemies.forEach(enemy => {
            ctx.fillStyle = enemy.color;
            ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
        });
    }

    // Draw particles
    particles.forEach(particle => {
        ctx.fillStyle = particle.color;
        ctx.globalAlpha = particle.life / 30;
        ctx.fillRect(particle.x, particle.y, 3, 3);
        ctx.globalAlpha = 1;
    });

    // Draw game over screen
    if (gameState.gameOver) {
        drawGameOver();
    }
}

// Draw player
function drawPlayer() {
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.width, player.height);
    
    // Add glow effect
    ctx.shadowColor = player.color;
    ctx.shadowBlur = 20;
    ctx.fillRect(player.x, player.y, player.width, player.height);
    ctx.shadowBlur = 0;
}

// Draw stars
function drawStars() {
    ctx.fillStyle = '#fff';
    for (let i = 0; i < 100; i++) {
        const x = (i * 7) % canvas.width;
        const y = (i * 11) % canvas.height;
        ctx.fillRect(x, y, 1, 1);
    }
}

// Draw game over screen
function drawGameOver() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#ff6b6b';
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvas.width/2, canvas.height/2 - 50);
    
    ctx.font = '24px Arial';
    ctx.fillText(`Final Score: ${gameState.score}`, canvas.width/2, canvas.height/2);
    
    ctx.font = '18px Arial';
    ctx.fillText('Press Start to play again', canvas.width/2, canvas.height/2 + 50);
}

// Level System Functions
function updateLevelSystem() {
    if (gameState.level > 1) {
        gameState.levelTimer += 1/60; // Assuming 60 FPS
        
        // Level hilang setelah 10 detik
        if (gameState.levelTimer >= 10) {
            gameState.level = 1;
            gameState.levelPoints = 0;
            gameState.levelTimer = 0;
            gameState.bulletCount = 1;
            updateLevelDisplay();
        }
    }
}

function checkLevelUp() {
    const pointsNeeded = gameState.level * 50; // 50, 100, 150, 200 points per level
    
    if (gameState.levelPoints >= pointsNeeded && gameState.level < gameState.maxLevel) {
        gameState.level++;
        gameState.levelPoints = 0;
        gameState.levelTimer = 0;
        gameState.bulletCount = gameState.level; // More bullets per level
        
        // Level up effect
        createLevelUpEffect();
        updateLevelDisplay();
        
        // Check if level > 4 for map change
        if (gameState.level > gameState.maxLevel) {
            changeMap();
        }
    }
}

function changeMap() {
    gameState.currentMap++;
    gameState.place = 1;
    gameState.level = 1;
    gameState.levelPoints = 0;
    gameState.levelTimer = 0;
    gameState.bulletCount = 1;
    
    // Clear all enemies for new map
    enemies = [];
    bullets = [];
    
    // Create map change effect
    createMapChangeEffect();
    updateLevelDisplay();
}

function createLevelUpEffect() {
    // Create level up particles
    for (let i = 0; i < 20; i++) {
        particles.push({
            x: player.x + player.width/2,
            y: player.y + player.height/2,
            vx: (Math.random() - 0.5) * 6,
            vy: (Math.random() - 0.5) * 6,
            life: 60,
            color: '#ffff00'
        });
    }
}

function createMapChangeEffect() {
    // Create map change particles
    for (let i = 0; i < 50; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4,
            life: 90,
            color: `hsl(${Math.random() * 360}, 100%, 50%)`
        });
    }
}

// Game control functions
function startGame() {
    gameState.running = true;
    gameState.gameOver = false;
    gameState.score = 0;
    gameState.lives = 3;
    gameState.level = 1;
    gameState.levelPoints = 0;
    gameState.levelTimer = 0;
    gameState.place = 1;
    gameState.currentMap = 1;
    gameState.bulletCount = 1;
    bullets = [];
    enemies = [];
    particles = [];
    updateScore();
    updateLives();
    updateLevelDisplay();
}

function togglePause() {
    gameState.paused = !gameState.paused;
    const btn = document.getElementById('pause-btn');
    btn.textContent = gameState.paused ? 'Resume' : 'Pause';
}

function gameOver() {
    gameState.gameOver = true;
    gameState.running = false;
}

// Update UI
function updateScore() {
    document.getElementById('score').textContent = gameState.score;
}

function updateLives() {
    document.getElementById('lives').textContent = gameState.lives;
}

function updateLevelDisplay() {
    document.getElementById('level').textContent = gameState.level;
    document.getElementById('level-points').textContent = gameState.levelPoints;
    document.getElementById('level-timer').textContent = Math.max(0, 10 - gameState.levelTimer).toFixed(1);
    document.getElementById('place').textContent = gameState.place;
    document.getElementById('map').textContent = gameState.currentMap;
}

// Admin Panel Functions
function openAdminPanel() {
    document.getElementById('admin-modal').style.display = 'block';
    document.getElementById('admin-password').focus();
}

function closeAdminPanel() {
    document.getElementById('admin-modal').style.display = 'none';
    document.getElementById('admin-password').value = '';
    document.getElementById('admin-controls').style.display = 'none';
    adminAuthenticated = false;
}

function authenticateAdmin() {
    const password = document.getElementById('admin-password').value;
    if (password === ADMIN_PASSWORD) {
        adminAuthenticated = true;
        document.getElementById('admin-controls').style.display = 'block';
        document.getElementById('admin-password').value = '';
    } else {
        alert('Incorrect password!');
        document.getElementById('admin-password').value = '';
    }
}

function updatePlayerSpeed() {
    if (!adminAuthenticated) return;
    const speedSlider = document.getElementById('player-speed');
    const speedValue = document.getElementById('speed-value');
    player.speed = parseInt(speedSlider.value);
    speedValue.textContent = speedSlider.value;
}

function addScore() {
    if (!adminAuthenticated) return;
    const scoreInput = document.getElementById('score-adjust');
    const points = parseInt(scoreInput.value) || 0;
    gameState.score += points;
    updateScore();
}

function setLives() {
    if (!adminAuthenticated) return;
    const livesInput = document.getElementById('lives-adjust');
    const newLives = parseInt(livesInput.value) || 0;
    gameState.lives = Math.max(0, Math.min(10, newLives));
    updateLives();
}

function resetGame() {
    if (!adminAuthenticated) return;
    startGame();
    closeAdminPanel();
}

function toggleGodMode() {
    if (!adminAuthenticated) return;
    // Toggle invincibility (no collision with enemies)
    if (player.color === '#00ffff') {
        player.color = '#ffff00';
        alert('God Mode: ON - You are invincible!');
    } else {
        player.color = '#00ffff';
        alert('God Mode: OFF');
    }
}

function clearEnemies() {
    if (!adminAuthenticated) return;
    enemies = [];
}

function setLevel() {
    if (!adminAuthenticated) return;
    const levelInput = document.getElementById('level-adjust');
    const newLevel = parseInt(levelInput.value) || 1;
    gameState.level = Math.max(1, Math.min(4, newLevel));
    gameState.bulletCount = gameState.level;
    gameState.levelPoints = 0;
    gameState.levelTimer = 0;
    updateLevelDisplay();
}

function addLevelPoints() {
    if (!adminAuthenticated) return;
    const pointsInput = document.getElementById('level-points-adjust');
    const points = parseInt(pointsInput.value) || 0;
    gameState.levelPoints += points;
    checkLevelUp();
    updateLevelDisplay();
}

function adminChangeMap() {
    if (!adminAuthenticated) return;
    changeMap();
}

function resetLevelSystem() {
    if (!adminAuthenticated) return;
    gameState.level = 1;
    gameState.levelPoints = 0;
    gameState.levelTimer = 0;
    gameState.place = 1;
    gameState.currentMap = 1;
    gameState.bulletCount = 1;
    updateLevelDisplay();
}

// Cheat Functions
function maxScore() {
    if (!adminAuthenticated) return;
    gameState.score = 99999;
    updateScore();
}

function maxLives() {
    if (!adminAuthenticated) return;
    gameState.lives = 10;
    updateLives();
}

function maxLevel() {
    if (!adminAuthenticated) return;
    gameState.level = 4;
    gameState.bulletCount = 4;
    gameState.levelPoints = 0;
    gameState.levelTimer = 0;
    updateLevelDisplay();
}

function toggleRapidFire() {
    if (!adminAuthenticated) return;
    cheatState.rapidFire = !cheatState.rapidFire;
    alert(`Rapid Fire: ${cheatState.rapidFire ? 'ON' : 'OFF'}`);
}

function toggleBigBullets() {
    if (!adminAuthenticated) return;
    cheatState.bigBullets = !cheatState.bigBullets;
    alert(`Big Bullets: ${cheatState.bigBullets ? 'ON' : 'OFF'}`);
}

function toggleSlowMotion() {
    if (!adminAuthenticated) return;
    cheatState.slowMotion = !cheatState.slowMotion;
    alert(`Slow Motion: ${cheatState.slowMotion ? 'ON' : 'OFF'}`);
}

function toggleInvincible() {
    if (!adminAuthenticated) return;
    cheatState.invincible = !cheatState.invincible;
    player.color = cheatState.invincible ? '#ffff00' : '#00ffff';
    alert(`Invincible: ${cheatState.invincible ? 'ON' : 'OFF'}`);
}

function toggleNoEnemies() {
    if (!adminAuthenticated) return;
    cheatState.noEnemies = !cheatState.noEnemies;
    if (cheatState.noEnemies) {
        enemies = [];
    }
    alert(`No Enemies: ${cheatState.noEnemies ? 'ON' : 'OFF'}`);
}

function toggleAutoShoot() {
    if (!adminAuthenticated) return;
    cheatState.autoShoot = !cheatState.autoShoot;
    alert(`Auto Shoot: ${cheatState.autoShoot ? 'ON' : 'OFF'}`);
}

function updateEnemySpeed() {
    if (!adminAuthenticated) return;
    const speedSlider = document.getElementById('enemy-speed');
    const speedValue = document.getElementById('enemy-speed-value');
    cheatState.enemySpeed = parseFloat(speedSlider.value);
    speedValue.textContent = speedSlider.value;
}

function updateBulletSpeed() {
    if (!adminAuthenticated) return;
    const speedSlider = document.getElementById('bullet-speed');
    const speedValue = document.getElementById('bullet-speed-value');
    cheatState.bulletSpeed = parseFloat(speedSlider.value);
    speedValue.textContent = speedSlider.value;
}

function spawnBoss() {
    if (!adminAuthenticated) return;
    enemies.push({
        x: canvas.width / 2 - 50,
        y: -100,
        width: 100,
        height: 100,
        speed: 1,
        color: '#ff0000',
        isBoss: true
    });
}

function toggleRainbowMode() {
    if (!adminAuthenticated) return;
    cheatState.rainbowMode = !cheatState.rainbowMode;
    alert(`Rainbow Mode: ${cheatState.rainbowMode ? 'ON' : 'OFF'}`);
}

// Initialize the game when page loads
window.addEventListener('load', init);
