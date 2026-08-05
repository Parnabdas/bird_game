const game = document.getElementById('game');
const angryBird = document.getElementById('angry');
const loveBird = document.getElementById('lovebird');
const loveText = document.getElementById('love');
const angerText = document.getElementById('anger');
const message = document.getElementById('message');

let gameWidth = window.innerWidth;
let gameRunning = true;

// Bird positions
let angryX = 120;
let loveX = gameWidth - 180;

// Game values
let love = 50;
let anger = 100;

// Set initial positions
angryBird.style.left = angryX + 'px';
loveBird.style.left = loveX + 'px';

// Keyboard controls
document.addEventListener('keydown', (e) => {
    if (!gameRunning) return;

    // Angry Bird controls
    if (e.key === 'a' || e.key === 'A') {
        angryX -= 25;
    }
    if (e.key === 'd' || e.key === 'D') {
        angryX += 25;
    }

    // Love Bird controls
    if (e.key === 'ArrowLeft') {
        loveX -= 25;
    }
    if (e.key === 'ArrowRight') {
        loveX += 25;
    }

    // Keep birds inside screen
    angryX = Math.max(20, Math.min(gameWidth - 120, angryX));
    loveX = Math.max(20, Math.min(gameWidth - 120, loveX));

    angryBird.style.left = angryX + 'px';
    loveBird.style.left = loveX + 'px';
});

// Update score display
function updateScore() {
    loveText.innerText = love;
    angerText.innerText = anger;
}

// Create fire projectile
function shootFire() {
    if (!gameRunning) return;

    const fire = document.createElement('div');
    fire.innerHTML = '🔥';
    fire.className = 'fire';
    fire.style.position = 'absolute';
    fire.style.fontSize = '35px';
    fire.style.left = (angryX + 40) + 'px';
    fire.style.bottom = '110px';
    game.appendChild(fire);

    let x = angryX + 40;

    const move = setInterval(() => {
        x += 8;
        fire.style.left = x + 'px';

        // Collision with Love Bird
        if (x >= loveX - 10 && x <= loveX + 60) {
            love -= 10;
            if (love < 0) love = 0;
            updateScore();
            clearInterval(move);
            fire.remove();
            checkWin();
        }

        // Remove if outside screen
        if (x > gameWidth) {
            clearInterval(move);
            fire.remove();
        }
    }, 20);
}

// Create heart projectile
function shootHeart() {
    if (!gameRunning) return;

    const heart = document.createElement('div');
    heart.innerHTML = '❤️';
    heart.className = 'heart';
    heart.style.position = 'absolute';
    heart.style.fontSize = '35px';
    heart.style.left = (loveX + 20) + 'px';
    heart.style.bottom = '150px';
    game.appendChild(heart);

    let x = loveX + 20;

    const move = setInterval(() => {
        x -= 8;
        heart.style.left = x + 'px';

        // Collision with Angry Bird
        if (x <= angryX + 60 && x >= angryX - 10) {
            anger -= 10;
            love += 5;

            if (anger < 0) anger = 0;
            if (love > 100) love = 100;

            updateScore();
            clearInterval(move);
            heart.remove();
            checkWin();
        }

        // Remove if outside screen
        if (x < -50) {
            clearInterval(move);
            heart.remove();
        }
    }, 20);
}

// Win condition
function checkWin() {
    if (anger <= 0 && love >= 100) {
        gameRunning = false;
        message.innerHTML = '💋 LOVE WINS ❤️';
        walkTogether();
    }
}

// Final animation
function walkTogether() {
    const walk = setInterval(() => {
        angryX += 2;
        loveX -= 2;

        angryBird.style.left = angryX + 'px';
        loveBird.style.left = loveX + 'px';

        if (loveX - angryX < 80) {
            clearInterval(walk);

            angryBird.innerHTML = '🥰';
            loveBird.innerHTML = '😍';

            message.innerHTML = '💋 They Kiss Forever ❤️';

            heartRain();
        }
    }, 20);
}

// Floating hearts animation
function heartRain() {
    setInterval(() => {
        const h = document.createElement('div');
        h.innerHTML = '❤️';
        h.style.position = 'absolute';
        h.style.left = (window.innerWidth / 2 + (Math.random() * 200 - 100)) + 'px';
        h.style.bottom = '120px';
        h.style.fontSize = '30px';
        game.appendChild(h);

        let y = 120;

        const fly = setInterval(() => {
            y += 3;
            h.style.bottom = y + 'px';

            if (y > window.innerHeight) {
                clearInterval(fly);
                h.remove();
            }
        }, 20);
    }, 300);
}

// Start game loops
updateScore();

setInterval(shootFire, 1200);
setInterval(shootHeart, 1000);

// Resize handling
window.addEventListener('resize', () => {
    gameWidth = window.innerWidth;
});
