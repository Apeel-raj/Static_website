document.addEventListener('DOMContentLoaded', () => {
    // --- UI Elements ---
    const mainMenu = document.getElementById('main-menu');
    const gameContainer = document.getElementById('game-container');
    window.gameArea = document.getElementById('game-area');
    const gameTitle = document.getElementById('current-game-title');
    window.gameScore = document.getElementById('game-score');
    window.gameStatus = document.getElementById('game-status');
    const backBtn = document.getElementById('back-btn');
    const restartBtn = document.getElementById('restart-btn');
    const gameCards = document.querySelectorAll('.game-card');
    const difficultySelect = document.getElementById('difficulty');

    let currentGame = '';
    window.score = 0;

    // --- Cookie / LocalStorage Consent (Apeel's arcade requirement) ---
    const cookieModal = document.getElementById('cookie-consent');
    const acceptBtn = document.getElementById('accept-cookies');
    const declineBtn = document.getElementById('decline-cookies');

    let hasConsent = localStorage.getItem('arcade_consent') === 'true';

    if (localStorage.getItem('arcade_consent') === null) {
        cookieModal.classList.remove('hidden');
    }

    acceptBtn.addEventListener('click', () => {
        localStorage.setItem('arcade_consent', 'true');
        hasConsent = true;
        cookieModal.classList.add('hidden');
    });

    declineBtn.addEventListener('click', () => {
        localStorage.setItem('arcade_consent', 'false');
        hasConsent = false;
        cookieModal.classList.add('hidden');
    });

    window.safeStorage = {
        getItem: (key, fallback) => {
            if (!hasConsent) return fallback;
            return localStorage.getItem(key) || fallback;
        },
        setItem: (key, value) => {
            if (!hasConsent) return;
            localStorage.setItem(key, value);
        }
    };

    // --- Global Game Intervals & Listeners ---
    window.gameInterval = null;
    window.whacInterval = null;
    window.moleTimeout = null;
    let activeListeners = [];
    window.animationFrameId = null;

    // --- 🔊 Shared Sound Engine ---
    const _AudioCtx = window.AudioContext || window.webkitAudioContext;
    const _ac = _AudioCtx ? new _AudioCtx() : null;
    window.SFX = {
        play(type) {
            if (!_ac) return;
            const osc = _ac.createOscillator();
            const gain = _ac.createGain();
            osc.connect(gain);
            gain.connect(_ac.destination);
            const t = _ac.currentTime;
            const v = { f: osc.frequency, g: gain.gain };

            const map = {
                // Generic
                'click': () => { osc.type = 'sine'; v.f.setValueAtTime(800, t); v.f.exponentialRampToValueAtTime(400, t + 0.06); v.g.setValueAtTime(0.15, t); v.g.exponentialRampToValueAtTime(0.001, t + 0.07); osc.start(t); osc.stop(t + 0.07); },
                'win': () => { osc.type = 'square'; v.f.setValueAtTime(440, t); v.f.setValueAtTime(523, t + 0.1); v.f.setValueAtTime(659, t + 0.2); v.f.setValueAtTime(880, t + 0.3); v.g.setValueAtTime(0.18, t); v.g.exponentialRampToValueAtTime(0.001, t + 0.5); osc.start(t); osc.stop(t + 0.5); },
                'lose': () => { osc.type = 'sawtooth'; v.f.setValueAtTime(400, t); v.f.exponentialRampToValueAtTime(60, t + 0.5); v.g.setValueAtTime(0.25, t); v.g.exponentialRampToValueAtTime(0.001, t + 0.5); osc.start(t); osc.stop(t + 0.5); },
                'draw': () => { osc.type = 'triangle'; v.f.setValueAtTime(500, t); v.f.setValueAtTime(500, t + 0.1); v.g.setValueAtTime(0.1, t); v.g.exponentialRampToValueAtTime(0.001, t + 0.25); osc.start(t); osc.stop(t + 0.25); },

                // Tic Tac Toe
                'ttt-place': () => { osc.type = 'sine'; v.f.setValueAtTime(600, t); v.g.setValueAtTime(0.1, t); v.g.exponentialRampToValueAtTime(0.001, t + 0.1); osc.start(t); osc.stop(t + 0.1); },

                // Memory
                'card-flip': () => { osc.type = 'sine'; v.f.setValueAtTime(350, t); v.f.linearRampToValueAtTime(700, t + 0.08); v.g.setValueAtTime(0.1, t); v.g.exponentialRampToValueAtTime(0.001, t + 0.12); osc.start(t); osc.stop(t + 0.12); },
                'card-match': () => { osc.type = 'square'; v.f.setValueAtTime(523, t); v.f.setValueAtTime(784, t + 0.1); v.g.setValueAtTime(0.12, t); v.g.exponentialRampToValueAtTime(0.001, t + 0.25); osc.start(t); osc.stop(t + 0.25); },
                'card-miss': () => { osc.type = 'triangle'; v.f.setValueAtTime(250, t); v.f.exponentialRampToValueAtTime(180, t + 0.15); v.g.setValueAtTime(0.08, t); v.g.exponentialRampToValueAtTime(0.001, t + 0.18); osc.start(t); osc.stop(t + 0.18); },

                // RPS
                'rps-pick': () => { osc.type = 'sine'; v.f.setValueAtTime(440, t); v.g.setValueAtTime(0.1, t); v.g.exponentialRampToValueAtTime(0.001, t + 0.08); osc.start(t); osc.stop(t + 0.08); },

                // Snake
                'snake-eat': () => { osc.type = 'square'; v.f.setValueAtTime(660, t); v.f.setValueAtTime(880, t + 0.05); v.g.setValueAtTime(0.1, t); v.g.exponentialRampToValueAtTime(0.001, t + 0.12); osc.start(t); osc.stop(t + 0.12); },

                // Whac
                'whack': () => { osc.type = 'sawtooth'; v.f.setValueAtTime(300, t); v.f.exponentialRampToValueAtTime(80, t + 0.12); v.g.setValueAtTime(0.2, t); v.g.exponentialRampToValueAtTime(0.001, t + 0.15); osc.start(t); osc.stop(t + 0.15); },

                // Ping Pong
                'paddle-hit': () => { osc.type = 'sine'; v.f.setValueAtTime(500, t); v.f.exponentialRampToValueAtTime(300, t + 0.05); v.g.setValueAtTime(0.15, t); v.g.exponentialRampToValueAtTime(0.001, t + 0.08); osc.start(t); osc.stop(t + 0.08); },
                'wall-hit': () => { osc.type = 'triangle'; v.f.setValueAtTime(300, t); v.f.exponentialRampToValueAtTime(200, t + 0.04); v.g.setValueAtTime(0.08, t); v.g.exponentialRampToValueAtTime(0.001, t + 0.06); osc.start(t); osc.stop(t + 0.06); },
                'pp-score': () => { osc.type = 'square'; v.f.setValueAtTime(200, t); v.f.exponentialRampToValueAtTime(80, t + 0.2); v.g.setValueAtTime(0.2, t); v.g.exponentialRampToValueAtTime(0.001, t + 0.25); osc.start(t); osc.stop(t + 0.25); },

                // Runner (kept from local version, now shared)
                'jump': () => { osc.type = 'sine'; v.f.setValueAtTime(300, t); v.f.exponentialRampToValueAtTime(600, t + 0.15); v.g.setValueAtTime(0.2, t); v.g.exponentialRampToValueAtTime(0.001, t + 0.2); osc.start(t); osc.stop(t + 0.2); },
                'runner-score': () => { osc.type = 'square'; v.f.setValueAtTime(880, t); v.f.setValueAtTime(1100, t + 0.07); v.g.setValueAtTime(0.12, t); v.g.exponentialRampToValueAtTime(0.001, t + 0.15); osc.start(t); osc.stop(t + 0.15); },

                // Wordle
                'key-press': () => { osc.type = 'sine'; v.f.setValueAtTime(500, t); v.g.setValueAtTime(0.06, t); v.g.exponentialRampToValueAtTime(0.001, t + 0.05); osc.start(t); osc.stop(t + 0.05); },
                'word-wrong': () => { osc.type = 'triangle'; v.f.setValueAtTime(200, t); v.f.exponentialRampToValueAtTime(150, t + 0.2); v.g.setValueAtTime(0.1, t); v.g.exponentialRampToValueAtTime(0.001, t + 0.22); osc.start(t); osc.stop(t + 0.22); },
            };

            if (map[type]) map[type]();
        }
    };


    // --- State Management ---
    window.updateScore = (points) => {
        score = points;
        gameScore.innerText = `Score: ${score}`;
    };

    window.setStatus = (msg, color = 'var(--text-main)') => {
        gameStatus.innerText = msg;
        gameStatus.style.color = color;
    };

    window.clearGameArea = () => {
        gameArea.innerHTML = '';
        setStatus('');
        if (gameInterval) clearInterval(gameInterval);
        if (whacInterval) clearInterval(whacInterval);
        if (moleTimeout) clearTimeout(moleTimeout);
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        activeListeners.forEach(l => {
            l.element.removeEventListener(l.event, l.handler);
        });
        activeListeners = [];
    };

    window.addListener = (element, event, handler) => {
        element.addEventListener(event, handler, { passive: false });
        activeListeners.push({ element, event, handler });
    };

    // --- Navigation ---
    const showGame = (gameType, title) => {
        currentGame = gameType;
        mainMenu.classList.add('hidden');
        gameContainer.classList.remove('hidden');
        // Handle Featured title vs normal title
        gameTitle.innerText = title.includes(':') ? title.split(':')[0] : title;
        updateScore(0);
        startGame();

        // Ensure game is in view (Feature 11: Visibility)
        setTimeout(() => {
            gameContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    };

    const backToMenu = () => {
        clearGameArea();
        gameContainer.classList.add('hidden');
        mainMenu.classList.remove('hidden');
        currentGame = '';
    };

    gameCards.forEach(card => {
        card.addEventListener('click', () => {
            const gameType = card.getAttribute('data-game');
            const title = card.querySelector('h3').innerText;
            showGame(gameType, title);
        });
    });

    backBtn.addEventListener('click', backToMenu);
    restartBtn.addEventListener('click', () => {
        updateScore(0);
        startGame();
    });

    difficultySelect.addEventListener('change', () => {
        if (currentGame) {
            updateScore(0);
            startGame();
        }
    });

    window.getDifficulty = () => difficultySelect.value;

    const startGame = () => {
        clearGameArea();
        if (currentGame === 'tictactoe') initTicTacToe();
        else if (currentGame === 'memory') initMemoryMatch();
        else if (currentGame === 'rps') initRockPaperScissors();
        else if (currentGame === 'snake') initSnake();
        else if (currentGame === 'whack') initWhackAMole();
        else if (currentGame === 'pingpong') initPingPong();
        else if (currentGame === 'runner') initRunner();
        else if (currentGame === 'wordle') initWordle();
        else if (currentGame === 'pingpong3d') initPingPong3d();
    };


});
