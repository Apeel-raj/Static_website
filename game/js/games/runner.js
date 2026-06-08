window.initRunner = () => {
    gameScore.style.display = 'block';
    setStatus('Space/Up=Jump | Shift=Dash | Tap=Jump', 'var(--text-main)');

    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    const ctx = AudioCtx ? new AudioCtx() : null;
    const playSound = (type) => {
        if (!ctx) return;
        const osc = ctx.createOscillator(), gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        const now = ctx.currentTime;
        const map = {
            'jump': () => { osc.type = 'sine'; osc.frequency.setValueAtTime(300, now); osc.frequency.exponentialRampToValueAtTime(600, now + 0.15); gain.gain.setValueAtTime(0.25, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2); osc.start(now); osc.stop(now + 0.2); },
            'flap': () => { osc.type = 'sine'; osc.frequency.setValueAtTime(400, now); osc.frequency.exponentialRampToValueAtTime(800, now + 0.1); gain.gain.setValueAtTime(0.15, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15); osc.start(now); osc.stop(now + 0.15); },
            'score': () => { osc.type = 'square'; osc.frequency.setValueAtTime(880, now); osc.frequency.setValueAtTime(1100, now + 0.07); gain.gain.setValueAtTime(0.15, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15); osc.start(now); osc.stop(now + 0.15); },
            'coin': () => { osc.type = 'sine'; osc.frequency.setValueAtTime(1046, now); osc.frequency.setValueAtTime(1318, now + 0.1); gain.gain.setValueAtTime(0.1, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25); osc.start(now); osc.stop(now + 0.25); },
            'portal': () => { osc.type = 'triangle'; osc.frequency.setValueAtTime(200, now); osc.frequency.linearRampToValueAtTime(800, now + 0.6); gain.gain.setValueAtTime(0.3, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6); osc.start(now); osc.stop(now + 0.6); },
            'gameover': () => { osc.type = 'sawtooth'; osc.frequency.setValueAtTime(400, now); osc.frequency.exponentialRampToValueAtTime(60, now + 0.5); gain.gain.setValueAtTime(0.3, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5); osc.start(now); osc.stop(now + 0.5); },
            'dash': () => { osc.type = 'square'; osc.frequency.setValueAtTime(600, now); osc.frequency.exponentialRampToValueAtTime(1200, now + 0.1); gain.gain.setValueAtTime(0.2, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15); osc.start(now); osc.stop(now + 0.15); },
            'shield': () => { osc.type = 'sine'; osc.frequency.setValueAtTime(800, now); osc.frequency.setValueAtTime(500, now + 0.1); osc.frequency.setValueAtTime(300, now + 0.2); gain.gain.setValueAtTime(0.3, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3); osc.start(now); osc.stop(now + 0.3); },
            'boss': () => { osc.type = 'sawtooth'; osc.frequency.setValueAtTime(100, now); osc.frequency.setValueAtTime(150, now + 0.3); gain.gain.setValueAtTime(0.4, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6); osc.start(now); osc.stop(now + 0.6); },
        };
        if (map[type]) map[type]();
    };

    // --- Character Skins ---
    const skins = {
        default: { name: 'Runner', cost: 0, color: 'var(--primary)' },
        ninja: { name: 'Ninja', cost: 20, color: '#10b981' },
        robot: { name: 'Robot', cost: 50, color: '#ec4899' },
        neon: { name: 'Neon', cost: 100, color: '#06b6d4' },
        phantom: { name: 'Phantom', cost: 150, color: '#ffffff' },
        golden: { name: 'Golden', cost: 300, color: '#fbbf24' },
        ankit: { name: 'Ankit', cost: 1, color: 'transparent' },
    };
    let savedCoins = parseInt(safeStorage.getItem('runner_total_coins', '0'));
    let unlockedSkins = JSON.parse(safeStorage.getItem('runner_unlocked_skins', '["default"]'));
    let activeSkin = safeStorage.getItem('runner_active_skin', 'default');
    let highScore = parseInt(safeStorage.getItem('runner_highscore', '0'));
    let playerName = safeStorage.getItem('runner_player_name', '');

    const getSvgRunner = (color, id) => {
        let filterStr = '';
        let opacityVal = 1;
        let strokeColor = color;
        let cls = 'runner-svg';
        if (id === 'neon') { filterStr = 'url(#neon-glow)'; strokeColor = '#fff'; cls += ' skin-neon'; }
        if (id === 'phantom') { opacityVal = 0.5; cls += ' skin-phantom'; }
        if (id === 'golden') { filterStr = 'url(#gold-shine)'; cls += ' skin-golden'; }

        if (id === 'ankit') {
            return `<div class="runner-ankit"></div>`;
        }

        return `
            <svg viewBox="25 15 50 80" class="${cls}" style="opacity: ${opacityVal}; filter: ${filterStr}">
                <defs>
                    <filter id="neon-glow"><feGaussianBlur stdDeviation="3" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
                    <linearGradient id="gold-shine" x1="0" x2="1" y1="0" y2="1"><stop offset="0%" stop-color="#fbbf24"/><stop offset="50%" stop-color="#fff"/><stop offset="100%" stop-color="#d97706"/></linearGradient>
                </defs>
                <circle cx="50" cy="30" r="15" fill="${id === 'golden' ? 'url(#gold-shine)' : color}" />
                <circle cx="55" cy="27" r="3" fill="#fff" />
                <circle cx="57" cy="27" r="1.5" fill="#000" />
                <line x1="50" y1="45" x2="50" y2="70" stroke="${id === 'golden' ? 'url(#gold-shine)' : strokeColor}" stroke-width="6" stroke-linecap="round" />
                <line x1="50" y1="50" x2="30" y2="60" stroke="${id === 'golden' ? 'url(#gold-shine)' : strokeColor}" stroke-width="6" stroke-linecap="round" class="arm-left" />
                <line x1="50" y1="50" x2="70" y2="60" stroke="${id === 'golden' ? 'url(#gold-shine)' : strokeColor}" stroke-width="6" stroke-linecap="round" class="arm-right" />
                <line x1="50" y1="70" x2="35" y2="95" stroke="${id === 'golden' ? 'url(#gold-shine)' : strokeColor}" stroke-width="6" stroke-linecap="round" class="leg-left" />
                <line x1="50" y1="70" x2="65" y2="95" stroke="${id === 'golden' ? 'url(#gold-shine)' : strokeColor}" stroke-width="6" stroke-linecap="round" class="leg-right" />
            </svg>`;
    };

    const svgBird = `
            <svg viewBox="0 0 100 100" class="runner-svg">
                <ellipse cx="50" cy="50" rx="40" ry="30" fill="#fbbf24"/>
                <circle cx="70" cy="40" r="8" fill="#fff"/><circle cx="73" cy="40" r="3" fill="#000"/>
                <path d="M 80 50 Q 100 50 100 60 Q 80 65 75 55" fill="#f59e0b"/>
                <path d="M 40 50 Q 20 10 10 50 Q 20 80 40 60" fill="#f59e0b" class="wing"/>
            </svg>`;

    const svgRunner = getSvgRunner(skins[activeSkin]?.color || 'var(--primary)', activeSkin);

    // --- Board Setup ---
    const board = document.createElement('div');
    board.className = 'runner-board';

    // Parallax layers (Feature 1)
    const parallaxSpeeds = [0.2, 0.4, 0.7];
    const layerOffsets = [0, 0, 0];
    for (let i = 0; i < 3; i++) {
        const lyr = document.createElement('div');
        lyr.className = `runner-bg-layer layer-${i + 1}`;
        lyr.style.animation = `scrollBg ${20 / (i + 1)}s linear infinite`;
        board.appendChild(lyr);
    }

    const player = document.createElement('div');
    player.className = 'runner-player';
    player.innerHTML = svgRunner;
    board.appendChild(player);

    const weatherOverlay = document.createElement('div');
    weatherOverlay.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;z-index:1;pointer-events:none;transition:background 2s ease-in-out;';
    board.appendChild(weatherOverlay);

    gameArea.appendChild(board);

    const diff = getDifficulty();
    const baseSpeed = diff === 'easy' ? 3 : diff === 'medium' ? 4 : 6;

    // --- HUD ---
    let coinCount = 0;
    const coinDisplay = document.createElement('div');
    coinDisplay.className = 'runner-coin-counter';
    coinDisplay.innerText = '🪙 0';
    board.appendChild(coinDisplay);

    // Combo display (Feature 8)
    const comboDisplay = document.createElement('div');
    comboDisplay.style.cssText = 'position:absolute;top:10px;left:50%;transform:translateX(-50%);z-index:10;background:rgba(0,0,0,0.5);color:#fbbf24;font-size:1.1rem;font-weight:700;padding:0.2rem 0.8rem;border-radius:20px;font-family:Outfit,sans-serif;opacity:0;transition:opacity 0.3s;';
    board.appendChild(comboDisplay);

    const highScoreDisplay = document.createElement('div');
    highScoreDisplay.style.cssText = 'position:absolute;top:50px;right:15px;z-index:10;color:rgba(255,255,255,0.7);font-size:0.9rem;font-weight:600;font-family:Outfit,sans-serif;text-align:right;';
    highScoreDisplay.innerText = `🏆 HI: ${highScore}`;
    board.appendChild(highScoreDisplay);

    // Shop button (Feature 7)
    const shopBtn = document.createElement('button');
    shopBtn.innerText = '👕 Skins';
    shopBtn.style.cssText = 'position:absolute;top:10px;left:15px;z-index:10;background:rgba(139,92,246,0.7);color:white;border:none;border-radius:16px;padding:0.3rem 0.8rem;cursor:pointer;font-family:Outfit,sans-serif;font-size:0.9rem;font-weight:600;';
    board.appendChild(shopBtn);

    const leaderBtn = document.createElement('button');
    leaderBtn.innerText = '🏆 Global';
    leaderBtn.style.cssText = 'position:absolute;top:10px;left:100px;z-index:10;background:rgba(234,179,8,0.7);color:white;border:none;border-radius:16px;padding:0.3rem 0.8rem;cursor:pointer;font-family:Outfit,sans-serif;font-size:0.9rem;font-weight:600;';
    board.appendChild(leaderBtn);

    const leaderModal = document.createElement('div');
    leaderModal.style.cssText = 'display:none;position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);z-index:100;background:rgba(15,23,42,0.98);border:2px solid #eab308;border-radius:16px;padding:1.2rem;width:320px;max-height:350px;text-align:center;color:white;font-family:Outfit,sans-serif;flex-direction:column;box-shadow:0 0 30px rgba(0,0,0,0.8);';
    leaderModal.innerHTML = `<h3 style="margin-bottom:0.5rem;color:#eab308;flex-shrink:0;">🏆 Top Players</h3><div id="leader-items" style="display:flex;flex-direction:column;gap:0.4rem;overflow-y:auto;padding-right:8px;flex-grow:1;margin-bottom:1rem;scrollbar-width:thin;scrollbar-color:#eab308 transparent;text-align:left;">Loading...</div><button id="leader-close" style="background:#eab308;border:none;color:white;padding:0.6rem 1.5rem;border-radius:12px;cursor:pointer;font-family:Outfit,sans-serif;font-weight:600;flex-shrink:0;">Close</button>`;
    board.appendChild(leaderModal);

    const renderLeaderboard = async () => {
        const leaderItems = leaderModal.querySelector('#leader-items');
        leaderItems.innerHTML = 'Loading...';
        if (window.fetchRunnerLeaderboard) {
            const data = await window.fetchRunnerLeaderboard();
            if (data.length === 0) {
                leaderItems.innerHTML = 'No scores yet!';
            } else {
                leaderItems.innerHTML = data.map((entry, index) => 
                    `<div style="display:flex;justify-content:space-between;background:rgba(255,255,255,0.1);padding:0.5rem;border-radius:8px;">
                        <span><strong>#${index + 1}</strong> ${entry.name}</span>
                        <span style="color:#eab308;font-weight:bold;">${entry.score}</span>
                    </div>`
                ).join('');
            }
        } else {
            leaderItems.innerHTML = 'Leaderboard unavailable.';
        }
    };

    leaderBtn.addEventListener('click', () => { 
        leaderModal.style.display = 'flex'; 
        renderLeaderboard(); 
    });
    leaderModal.querySelector('#leader-close').addEventListener('click', () => { 
        leaderModal.style.display = 'none'; 
    });

    // Shop Modal
    const shopModal = document.createElement('div');
    shopModal.style.cssText = 'display:none;position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);z-index:100;background:rgba(15,23,42,0.98);border:2px solid var(--primary);border-radius:16px;padding:1.2rem;width:320px;max-height:320px;text-align:center;color:white;font-family:Outfit,sans-serif;flex-direction:column;box-shadow:0 0 30px rgba(0,0,0,0.8);';
    shopModal.innerHTML = `<h3 style="margin-bottom:0.5rem;color:var(--primary);flex-shrink:0;">🛒 Skin Shop</h3><p style="color:#94a3b8;margin-bottom:0.8rem;font-size:0.9rem;flex-shrink:0;">Lifetime Coins: <span id="shop-coins">${savedCoins}</span></p><div id="shop-items" style="display:grid;grid-template-columns:1fr 1fr;gap:0.8rem;overflow-y:auto;padding-right:8px;flex-grow:1;margin-bottom:1rem;scrollbar-width:thin;scrollbar-color:var(--primary) transparent;"></div><button id="shop-close" style="background:var(--primary);border:none;color:white;padding:0.6rem 1.5rem;border-radius:12px;cursor:pointer;font-family:Outfit,sans-serif;font-weight:600;flex-shrink:0;transition:transform 0.2s;">Close</button>`;
    board.appendChild(shopModal);

    const renderShop = () => {
        const shopItems = shopModal.querySelector('#shop-items');
        shopItems.innerHTML = '';
        Object.entries(skins).forEach(([id, skin]) => {
            const owned = unlockedSkins.includes(id);
            const active = activeSkin === id;
            const btn2 = document.createElement('button');
            btn2.style.cssText = `background:${active ? 'var(--snake-color)' : owned ? 'rgba(255,255,255,0.1)' : 'rgba(251,191,36,0.15)'};border:1px solid ${active ? 'var(--snake-color)' : 'rgba(255,255,255,0.2)'};color:white;padding:0.5rem;border-radius:10px;cursor:pointer;font-family:Outfit,sans-serif;font-size:0.8rem;width:100%;display:flex;flex-direction:column;align-items:center;gap:0.5rem;`;

            const preview = document.createElement('div');
            preview.style.cssText = 'width:40px;height:50px;position:relative;pointer-events:none;';
            preview.innerHTML = getSvgRunner(skin.color, id);
            btn2.appendChild(preview);

            const label = document.createElement('div');
            label.innerText = active ? `✅ ${skin.name}` : owned ? `▶ ${skin.name}` : `🪙 ${skin.cost}`;
            btn2.appendChild(label);
            btn2.addEventListener('click', () => {
                if (owned) {
                    activeSkin = id;
                    safeStorage.setItem('runner_active_skin', id);
                    player.innerHTML = getSvgRunner(skins[id].color, id);
                    renderShop();
                } else if (savedCoins >= skin.cost) {
                    savedCoins -= skin.cost;
                    safeStorage.setItem('runner_total_coins', savedCoins);
                    unlockedSkins.push(id);
                    safeStorage.setItem('runner_unlocked_skins', JSON.stringify(unlockedSkins));
                    shopModal.querySelector('#shop-coins').innerText = savedCoins;
                    renderShop();
                }
            });
            shopItems.appendChild(btn2);
        });
    };
    shopBtn.addEventListener('click', () => { renderShop(); shopModal.style.display = 'flex'; });
    shopModal.querySelector('#shop-close').addEventListener('click', () => { shopModal.style.display = 'none'; });

    // --- Game State ---
    const state = {
        mode: 'runner',
        isJumping: false,
        playerY: 0,
        velocityY: 0,
        gravity: diff === 'easy' ? 0.6 : diff === 'medium' ? 0.65 : 0.8,
        jumpStrength: diff === 'easy' ? 13.5 : diff === 'medium' ? 13.0 : 14.5,
        speed: baseSpeed,
        objects: [],
        spawnTimer: 0,
        internalScore: 0,
        portalSpawned: false,
        flappyPortalSpawned: false,
        flappyScoreSincePortal: 0,
        // Feature 2: Magnet
        magnetTimer: 0,
        // Feature 3: Shield
        hasShield: false,
        shieldHits: 0,
        // Feature 4: Dash
        isDashing: false,
        dashTimer: 0,
        dashCooldown: 0,
        // Feature 5: Day/Night
        timeOfDay: 0, // 0=day, 1=dusk, 2=night
        dayNightTimer: 0,
        // Feature 8: Combo
        comboCount: 0,
        comboTimer: 0,
        // Feature 10: Boss
        bossActive: false,
        bossEl: null,
        bossX: -150, // Boss starts offscreen left
        bossTimer: 0,
        bossHp: 5,
        nextPortalScore: 250,
        bossScoreThreshold: 500,
    };

    let isGameOver = false;

    // --- Feature 6: Weather ---
    let weatherParticles = [];
    let weatherType = 'none';
    let weatherTimer = 0;
    const spawnWeather = () => {
        if (isGameOver) return;

        // Influence weather by dayStage (0: Dawn, 1: Day, 2: Dusk, 3: Night)
        let types = ['none'];
        if (dayStage === 0) types = ['none', 'none', 'rain'];
        else if (dayStage === 1) types = ['none', 'none', 'none'];
        else if (dayStage === 2) types = ['none', 'rain', 'rain'];
        else if (dayStage === 3) types = ['rain', 'snow', 'none', 'snow'];

        weatherType = types[Math.floor(Math.random() * types.length)];
        weatherTimer = 1000 + Math.random() * 2000;
        // Clear old weather
        weatherParticles.forEach(p => p.remove());
        weatherParticles = [];

        // Adjust background for weather (Feature 6: Atmospheric Correlation)
        if (weatherType === 'rain') {
            weatherOverlay.style.background = 'rgba(15, 23, 42, 0.5)'; // Darker/stormy
        } else if (weatherType === 'snow') {
            weatherOverlay.style.background = 'rgba(241, 245, 249, 0.2)'; // Cold/bright
        } else {
            weatherOverlay.style.background = 'transparent'; // Clear
        }

        if (weatherType !== 'none') {
            for (let i = 0; i < (weatherType === 'rain' ? 40 : 20); i++) {
                const p = document.createElement('div');
                const x = Math.random() * 800;
                const speed = weatherType === 'rain' ? (8 + Math.random() * 6) : (2 + Math.random() * 3);
                p.style.cssText = `position:absolute;left:${x}px;top:-10px;z-index:1;pointer-events:none;opacity:0.6;`;
                if (weatherType === 'rain') {
                    p.style.cssText += `width:2px;height:12px;background:rgba(147,210,255,0.7);border-radius:2px;animation:rainFall ${(0.3 + Math.random() * 0.3)}s linear infinite;animation-delay:${Math.random() * 0.5}s;`;
                } else {
                    p.style.cssText += `width:5px;height:5px;background:rgba(255,255,255,0.8);border-radius:50%;animation:snowFall ${(2 + Math.random() * 2)}s linear infinite;animation-delay:${Math.random() * 2}s;`;
                }
                board.appendChild(p);
                weatherParticles.push(p);
            }
        }
    };

    // Inject weather keyframes once
    if (!document.getElementById('runner-weather-styles')) {
        const st = document.createElement('style');
        st.id = 'runner-weather-styles';
        st.textContent = `
                @keyframes rainFall { from { transform: translateY(0); } to { transform: translateY(380px); } }
                @keyframes snowFall { from { transform: translateY(0) translateX(0); } to { transform: translateY(380px) translateX(30px); } }
                @keyframes scrollBg { from { transform: translateX(0); } to { transform: translateX(-50%); } }
                @keyframes boss-float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-15px); } }
                @keyframes projectile-move { from { transform: translateX(0); } to { transform: translateX(-1000px); } }
                @keyframes ankit-run { 0% { background-image: url('images/ankit_walking_1.png'); } 50% { background-image: url('images/ankit_walking_2.png'); } }
                .runner-ankit { width: 100%; height: 100%; background: url('images/ankit_walking_1.png') center 140%/contain no-repeat; transform: scale(2); transform-origin: bottom center; animation: ankit-run 0.4s steps(1) infinite; }
                .runner-player.jumping .runner-ankit { animation: none; background-image: url('images/ankit_walking_2.png'); }
                .runner-player { overflow: visible; }
                .runner-boss { position:absolute;width:90px;height:70px;z-index:5;background:url('images/ankit.png') center/contain no-repeat;animation:boss-float 1.5s ease-in-out infinite;}
                .runner-projectile { position:absolute;font-size:30px;line-height:0.8;z-index:4; }
                .runner-obstacle-trap { background: #523112; border-radius: 5px; border-top-left-radius: 20px; border-top-right-radius: 20px; opacity: 0.9; box-shadow: inset 0 5px 10px rgba(0,0,0,0.5); }
                .runner-powerup-boost { background: radial-gradient(circle, #facc15, #ca8a04); border-radius: 50%; opacity: 0.9; box-shadow: 0 0 10px #facc15; display:flex; justify-content:center; align-items:center; }
                .runner-powerup-boost::after { content: '⚡'; font-size: 20px; }
            `;
        document.head.appendChild(st);
    }

    // --- Helper: Shake screen (Feature 9) ---
    const shakeBoard = () => {
        board.classList.remove('shake');
        void board.offsetWidth; // Reflow
        board.classList.add('shake');
        board.addEventListener('animationend', () => board.classList.remove('shake'), { once: true });
    };

    // --- Helper: Coin Pop particle (Feature 9) ---
    const spawnCoinPop = (x, y, text) => {
        const pop = document.createElement('div');
        pop.innerText = text;
        pop.style.cssText = `position:absolute;left:${x}px;bottom:${y + 30}px;z-index:20;color:#fbbf24;font-weight:700;font-size:1rem;font-family:Outfit,sans-serif;pointer-events:none;transition:all 0.8s ease-out;`;
        board.appendChild(pop);
        requestAnimationFrame(() => {
            pop.style.bottom = `${y + 80}px`;
            pop.style.opacity = '0';
        });
        setTimeout(() => pop.remove(), 850);
    };

    // --- Feature 5: Day/Night cycle ---
    const dayNightColors = [
        { sky1: '#c2410c', sky2: '#ea580c', sky3: '#fb923c' },  // Dawn
        { sky1: '#0ea5e9', sky2: '#38bdf8', sky3: '#7dd3fc' },  // Day
        { sky1: '#7c3c00', sky2: '#b45309', sky3: '#92400e' },  // Dusk
        { sky1: '#1e1b4b', sky2: '#312e81', sky3: '#4c1d95' },  // Night
    ];
    let dayStage = 1; // Start at day
    const applyDayNight = (stage) => {
        const c = dayNightColors[stage % dayNightColors.length];
        board.style.background = `linear-gradient(180deg, ${c.sky1} 0%, ${c.sky2} 70%, ${c.sky3} 100%)`;
    };

    // --- Entity creation ---
    const createEntity = (type, x, y, w, h, cls) => {
        const el = document.createElement('div');
        el.className = `runner-entity ${cls.replace(/\./g, ' ').trim()}`;
        el.style.left = `${x}px`;
        el.style.bottom = `${y}px`;
        el.style.width = `${w}px`;
        el.style.height = `${h}px`;
        board.appendChild(el);
        state.objects.push({ type, x, y, width: w, height: h, el, passed: false });
    };

    // --- Spawn logic ---
    const spawnObject = () => {
        if (state.mode === 'runner') {
            const spawnDelay = state.bossActive ? (diff === 'easy' ? 80 : 60) : (diff === 'easy' ? 90 : diff === 'medium' ? 70 : 45);
            state.spawnTimer = Math.floor(Math.random() * (state.bossActive ? 40 : 60)) + spawnDelay;

            if (score >= state.nextPortalScore && !state.portalSpawned && !state.bossActive) {
                state.portalSpawned = true;
                state.nextPortalScore = score + 400; // Next portal after 400 more points
                createEntity('portal', 850, 4, 60, 100, 'runner-portal');
                return;
            }

            if (state.bossActive) {
                // Chase Sequence Spawns
                if (Math.random() < 0.3) {
                    createEntity('powerup_boost', 850, 40 + Math.random() * 60, 35, 35, 'runner-entity runner-powerup-boost');
                } else {
                    createEntity('trap', 850, 4, 50, 20, 'runner-obstacle-trap');
                }
                return;
            }

            const r = Math.random();
            if (r < 0.02) {
                createEntity('powerup_magnet', 850, 80 + Math.random() * 80, 35, 35, 'runner-entity runner-powerup-magnet');
            } else if (r < 0.04) {
                createEntity('powerup_shield', 850, 80 + Math.random() * 60, 35, 35, 'runner-entity runner-powerup-shield');
            } else if (r < 0.45) {
                const h = Math.random() < 0.5 ? 100 : 20;
                createEntity('coin', 850, h, 30, 30, 'runner-coin');
            } else if (r < 0.6) {
                createEntity('cactus', 850, 4, 45, 60, 'runner-obstacle-cactus');
            } else if (r < 0.75) {
                createEntity('spike', 850, 4, 40, 40, 'runner-obstacle-spike');
            } else {
                createEntity('block', 850, 4, 40, 40, 'runner-obstacle-block');
            }
        } else {
            // Flappy mode
            const flappyDelay = diff === 'easy' ? 120 : diff === 'medium' ? 100 : 75;
            state.spawnTimer = Math.floor(Math.random() * 40) + flappyDelay;
            const gapTop = Math.random() * 80 + 80;
            const gapSize = diff === 'easy' ? 180 : diff === 'medium' ? 160 : 140;

            state.flappyScoreSincePortal += 1;
            if (!state.flappyPortalSpawned && state.flappyScoreSincePortal > 8 && Math.random() < 0.25) {
                state.flappyPortalSpawned = true;
                createEntity('portal', 850, gapTop + gapSize / 2 - 50, 60, 100, 'runner-portal');
                return;
            }

            createEntity('pipe_bottom', 850, 4, 70, gapTop - 4, 'runner-obstacle-pipe bottom');
            const topPipeH = 350 - gapTop - gapSize;
            if (topPipeH > 10) createEntity('pipe_top', 850, gapTop + gapSize, 70, topPipeH, 'runner-obstacle-pipe top');
            if (Math.random() < 0.4) createEntity('coin', 870, gapTop + gapSize / 2 - 15, 30, 30, 'runner-coin');
        }
    };

    // --- Feature 10: Boss ---
    const spawnBoss = () => {
        state.bossActive = true;
        state.bossX = -150; // Start off-screen left
        state.bossTimer = 900; // ~15 seconds at 60fps
        playSound('boss');
        setStatus('⚠️ RUN! BOSS CHASE!', 'var(--x-color)');
        shakeBoard();

        // Clear any existing entities except player
        for (let i = state.objects.length - 1; i >= 0; i--) {
            state.objects[i].el.remove();
            state.objects.splice(i, 1);
        }

        const bossEl = document.createElement('div');
        bossEl.className = 'runner-boss';
        bossEl.style.left = state.bossX + 'px';
        bossEl.style.bottom = '10px'; // Ground level chase
        bossEl.style.width = '120px';
        bossEl.style.height = '100px';
        board.appendChild(bossEl);
        state.bossEl = bossEl;

        // To ensure spawns happen immediately
        state.spawnTimer = 10;
    };

    // --- Main Game Loop ---
    const gameLoop = () => {
        if (isGameOver) return;

        // Feature 5: Day/Night
        state.dayNightTimer++;
        if (state.dayNightTimer >= 2000) {
            state.dayNightTimer = 0;
            dayStage = (dayStage + 1) % dayNightColors.length;
            applyDayNight(dayStage);
        }

        // Feature 6: Weather timer
        weatherTimer--;
        if (weatherTimer <= 0) spawnWeather();

        // Feature 4: Dash timer
        if (state.dashTimer > 0) {
            state.dashTimer--;
            if (state.dashTimer === 0) {
                state.isDashing = false;
                state.speed = (state.mode === 'runner' ? baseSpeed : (diff === 'easy' ? 2.5 : diff === 'medium' ? 3.5 : 5));
                player.style.filter = '';
            }
        }
        if (state.dashCooldown > 0) state.dashCooldown--;

        // Feature 8: Combo timer
        if (state.comboTimer > 0) {
            state.comboTimer--;
            if (state.comboTimer === 0) {
                state.comboCount = 0;
                comboDisplay.style.opacity = '0';
            }
        }

        // Feature 2: Magnet timer
        if (state.magnetTimer > 0) {
            state.magnetTimer--;
            if (state.magnetTimer === 0) player.style.filter = state.hasShield ? '' : '';
        }

        // Player movement
        if (state.mode === 'runner') {
            if (state.isJumping || state.playerY > 0) {
                state.playerY += state.velocityY;
                state.velocityY -= state.gravity;
                player.classList.add('jumping');
                if (state.playerY <= 0) {
                    state.playerY = 0;
                    state.isJumping = false;
                    state.velocityY = 0;
                    player.classList.remove('jumping');
                }
            } else {
                player.classList.remove('jumping');
            }
        } else {
            // Flappy mode
            state.playerY += state.velocityY;
            state.velocityY -= state.gravity;
            if (state.playerY > 350 - 40) { state.playerY = 350 - 40; state.velocityY = 0; }
            if (state.playerY <= 4) {
                gameOver(); return;
            }
        }
        player.style.bottom = `${state.playerY}px`;

        // Spawn timer
        state.spawnTimer--;
        if (state.spawnTimer <= 0) spawnObject();

        // Feature 10: Boss check
        if (!state.bossActive && score >= state.bossScoreThreshold) {
            spawnBoss();
        }

        // --- Boss Chase Logic ---
        if (state.bossActive && state.mode === 'runner') {
            state.bossTimer--;

            // Diff-based boss catchup speed
            const bossSpeed = diff === 'easy' ? 0.3 : diff === 'medium' ? 0.45 : 0.6;
            state.bossX += bossSpeed; // Boss naturally creeps closer

            state.bossEl.style.left = `${state.bossX}px`;

            // Did boss catch player? Player's left is 80. Boss's right is bossX + 100.
            if (state.bossX + 90 > 80 && !state.isDashing) {
                if (state.hasShield) {
                    state.hasShield = false;
                    player.classList.remove('shielded');
                    playSound('shield');
                    shakeBoard();
                    state.bossX -= 80; // Push back boss slightly
                    setStatus('Shield Broken!', '#f59e0b');
                    setTimeout(() => setStatus('', 'var(--text-main)'), 1000);
                } else {
                    gameOver();
                    return; // Stop processing
                }
            }

            if (state.bossTimer <= 0) {
                // Win condition! Boss retreats
                state.bossActive = false;
                state.bossScoreThreshold += 500;

                let retreatInterval = setInterval(() => {
                    state.bossX -= 5;
                    state.bossEl.style.left = `${state.bossX}px`;
                    if (state.bossX < -200) {
                        clearInterval(retreatInterval);
                        state.bossEl.remove();
                    }
                }, 16);

                // Reward 50 coins for survival
                coinCount += 50;
                savedCoins += 50;
                safeStorage.setItem('runner_total_coins', savedCoins);
                coinDisplay.innerText = '🪙 ' + coinCount;

                setStatus('ESCAPED THE BOSS! +50 COINS 🪙', 'var(--snake-color)');
                playSound('win');
                shakeBoard();
                setTimeout(() => setStatus('', 'var(--text-main)'), 2000);
            }
        }

        // Object updates
        for (let i = state.objects.length - 1; i >= 0; i--) {
            const obj = state.objects[i];

            // Feature 2: Magnet - attract coins
            if (state.magnetTimer > 0 && obj.type === 'coin') {
                const dx = 80 - obj.x;
                const dy = state.playerY + 40 - obj.y;
                obj.x += dx * 0.06;
                obj.y += dy * 0.06;
                obj.el.style.left = `${obj.x}px`;
                obj.el.style.bottom = `${obj.y}px`;
            } else {
                obj.x -= state.speed;
                obj.el.style.left = `${obj.x}px`;
            }

            // Collision
            const pw = state.mode === 'runner' ? 45 : 55;
            const ph = state.mode === 'runner' ? 75 : 45;
            let shrinkX = diff === 'easy' ? 15 : diff === 'medium' ? 12 : 8;
            let shrinkY = shrinkX;
            if (['coin', 'portal', 'powerup_magnet', 'powerup_shield', 'powerup_boost'].includes(obj.type)) { shrinkX = 0; shrinkY = 0; }

            const pRect = { left: 80 + shrinkX, right: 80 + pw - shrinkX, bottom: state.playerY + shrinkY, top: state.playerY + ph - shrinkY };
            const oRect = { left: obj.x + shrinkX, right: obj.x + obj.width - shrinkX, bottom: obj.y + shrinkY, top: obj.y + obj.height - shrinkY };
            const isColliding = pRect.right > oRect.left && pRect.left < oRect.right && pRect.bottom < oRect.top && pRect.top > oRect.bottom;

            if (isColliding) {
                if (obj.type === 'powerup_boost') {
                    // Push boss back
                    state.bossX = Math.max(-200, state.bossX - 80);
                    playSound('score');
                    spawnCoinPop(obj.x, obj.y, '⚡ BOOST!');

                    // Give player a short speed boost effect
                    player.style.filter = 'brightness(1.5) drop-shadow(0 0 10px #facc15)';
                    setTimeout(() => player.style.filter = '', 500);

                    obj.el.remove(); state.objects.splice(i, 1); continue;
                } else if (obj.type === 'trap') {
                    if (state.isDashing || state.hasShield) {
                        if (state.hasShield && !state.isDashing) {
                            state.hasShield = false;
                            player.classList.remove('shielded');
                            playSound('shield');
                        }
                        obj.el.remove(); state.objects.splice(i, 1); continue;
                    }
                    // Bring boss closer
                    state.bossX += 60;
                    playSound('word-wrong');
                    spawnCoinPop(obj.x, obj.y, '🛑 SLOWED!');
                    shakeBoard();

                    obj.el.remove(); state.objects.splice(i, 1); continue;
                } else if (obj.type === 'coin') {
                    playSound('coin');
                    coinCount++;
                    savedCoins++;
                    safeStorage.setItem('runner_total_coins', savedCoins);
                    coinDisplay.innerText = '🪙 ' + coinCount;

                    // Feature 8: Combo
                    state.comboCount++;
                    state.comboTimer = 90; // ~1.5s
                    const mult = state.comboCount >= 5 ? 5 : state.comboCount >= 3 ? 3 : state.comboCount >= 2 ? 2 : 1;
                    const pts = 10 * mult;
                    state.internalScore += pts;
                    updateScore(score + pts);

                    if (mult > 1) {
                        comboDisplay.innerText = `🔥 x${mult} COMBO!`;
                        comboDisplay.style.opacity = '1';
                    }
                    spawnCoinPop(obj.x, obj.y, `+${pts}`);

                    obj.el.remove(); state.objects.splice(i, 1); continue;

                } else if (obj.type === 'powerup_magnet') {
                    // Feature 2: Magnet
                    state.magnetTimer = 300;
                    player.style.filter = 'drop-shadow(0 0 10px #ef4444)';
                    setStatus('🧲 MAGNET!', '#ef4444');
                    setTimeout(() => setStatus('', 'var(--text-main)'), 1500);
                    obj.el.remove(); state.objects.splice(i, 1); continue;

                } else if (obj.type === 'powerup_shield') {
                    // Feature 3: Shield
                    state.hasShield = true;
                    player.classList.add('shielded');
                    playSound('score');
                    setStatus('🛡 SHIELD!', '#3b82f6');
                    setTimeout(() => setStatus('', 'var(--text-main)'), 1500);
                    obj.el.remove(); state.objects.splice(i, 1); continue;

                } else if (obj.type === 'portal') {
                    playSound('portal');
                    for (let j = state.objects.length - 1; j >= 0; j--) {
                        if (j !== i) { state.objects[j].el.remove(); state.objects.splice(j, 1); if (j < i) i--; }
                    }
                    if (state.mode === 'runner') {
                        state.mode = 'flappy';
                        state.gravity = diff === 'easy' ? 0.25 : diff === 'medium' ? 0.3 : 0.4;
                        state.jumpStrength = diff === 'easy' ? 6.5 : diff === 'medium' ? 7.0 : 7.5;
                        state.speed = diff === 'easy' ? 2.5 : diff === 'medium' ? 3.5 : 5;
                        player.innerHTML = svgBird;
                        player.classList.add('bird'); player.classList.remove('jumping');
                        state.playerY = 200; state.velocityY = 3;
                        state.flappyPortalSpawned = false; state.flappyScoreSincePortal = 0;
                        setStatus('FLAPPY MODE!', 'var(--primary)');
                    } else {
                        state.mode = 'runner';
                        state.gravity = diff === 'easy' ? 0.6 : diff === 'medium' ? 0.65 : 0.8;
                        state.jumpStrength = diff === 'easy' ? 13.5 : diff === 'medium' ? 13.0 : 14.5;
                        state.speed = baseSpeed;
                        player.innerHTML = svgRunner;
                        player.classList.remove('bird');
                        state.playerY = 0; state.isJumping = false; state.velocityY = 0;
                        state.portalSpawned = false;
                        state.nextPortalScore = score + 350; // Delay next portal after coming back
                        state.internalScore = 0;
                        setStatus('RUNNER MODE!', 'var(--snake-color)');
                    }
                    obj.el.remove(); state.objects.splice(i, 1);
                    setTimeout(() => setStatus('', 'var(--text-main)'), 2000);
                    continue;

                } else {
                    // Obstacle hit
                    if (state.isDashing) { continue; } // Dash makes player invulnerable
                    if (state.hasShield) {
                        // Feature 3: Shield absorbs one hit
                        state.hasShield = false;
                        player.classList.remove('shielded');
                        playSound('shield');
                        shakeBoard(); // Feature 9: Shake on hit
                        obj.el.remove(); state.objects.splice(i, 1);
                        setStatus('Shield Broken!', '#f59e0b');
                        setTimeout(() => setStatus('', 'var(--text-main)'), 1000);
                        continue;
                    }
                    gameOver();
                    return;
                }
            }

            // Passed check
            if (!obj.passed && obj.x < 80 - obj.width && !['coin', 'portal', 'powerup_magnet', 'powerup_shield', 'powerup_boost', 'trap'].includes(obj.type)) {
                obj.passed = true;
                if (obj.type !== 'pipe_top') {
                    state.internalScore += 5;
                    updateScore(score + 5);
                    playSound('score');
                    if (state.speed < 12) state.speed += 0.05;
                }
            }

            // Remove off-screen
            if (obj.x < -150) {
                if (obj.type === 'portal') {
                    if (state.mode === 'runner') { state.portalSpawned = false; state.internalScore = 70; }
                    else { state.flappyPortalSpawned = false; state.flappyScoreSincePortal = 0; }
                }
                obj.el.remove(); state.objects.splice(i, 1);
            }
        }

        animationFrameId = requestAnimationFrame(gameLoop);
    };

    const gameOver = () => {
        isGameOver = true;
        playSound('gameover');
        shakeBoard(); // Feature 9: Shake on death

        if (window.saveRunnerScore) {
            window.saveRunnerScore(playerName || "Anonymous", score);
        }

        if (score > highScore) {
            highScore = score;
            safeStorage.setItem('runner_highscore', highScore);
            setStatus(`NEW HIGH SCORE: ${highScore}! 🎉`, 'var(--snake-color)');
            highScoreDisplay.innerText = `🏆 HI: ${highScore}`;
        } else {
            setStatus('Game Over!', 'var(--x-color)');
        }

        cancelAnimationFrame(animationFrameId);
    };

    // --- Controls ---
    const actionJump = (e) => {
        if (e && e.preventDefault && e.key && [' ', 'ArrowUp'].includes(e.key)) e.preventDefault();
        if (isGameOver) return;
        if (state.mode === 'runner') {
            if (!state.isJumping) { state.isJumping = true; state.velocityY = state.jumpStrength; playSound('jump'); }
        } else {
            state.velocityY = state.jumpStrength; playSound('flap');
        }
    };

    addListener(document, 'keydown', (e) => {
        if ([' ', 'ArrowUp'].includes(e.key)) actionJump(e);
        // Feature 4: Dash on Shift
        if (e.key === 'Shift' && !state.isDashing && state.dashCooldown === 0 && !isGameOver) {
            e.preventDefault();
            state.isDashing = true;
            state.dashTimer = 40;
            state.dashCooldown = 180;
            const prevSpeed = state.speed;
            state.speed = prevSpeed * 2;
            player.style.filter = 'drop-shadow(0 0 12px var(--secondary)) brightness(1.5)';
            playSound('dash');
            setStatus('⚡ DASH!', 'var(--secondary)');
            setTimeout(() => { if (!isGameOver) setStatus('', 'var(--text-main)'); }, 800);
        }
    });

    addListener(board, 'touchstart', (e) => { e.preventDefault(); actionJump(); });

    // --- Start Overlay (Feature 12: Readiness) ---
    const startOverlay = document.createElement('div');
    startOverlay.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;z-index:200;background:rgba(15,23,42,0.8);display:flex;flex-direction:column;justify-content:center;align-items:center;color:white;backdrop-filter:blur(4px);';
    startOverlay.innerHTML = `
            <div style="font-size:3rem;margin-bottom:1rem;">Ready?</div>
            <input type="text" id="runner-name-input" placeholder="Enter your name..." value="${playerName}" style="padding:0.8rem 1.2rem; border-radius:30px; border:2px solid var(--primary); background:rgba(0,0,0,0.5); color:white; font-family:Outfit,sans-serif; font-size:1.2rem; text-align:center; margin-bottom:1.5rem; outline:none; width:80%; max-width:300px;">
            <button id="runner-start-btn" style="padding:0.8rem 2.5rem; background:var(--primary); border:none; border-radius:30px; color:white; font-weight:bold; font-size:1.2rem; cursor:pointer; margin-bottom:1.5rem; font-family:Outfit,sans-serif; text-transform:uppercase; letter-spacing:1px; box-shadow:0 4px 15px rgba(139,92,246,0.4);">Start Run!</button>
            <div style="font-size:0.9rem;color:#94a3b8;display:flex;gap:2rem;">
                <span>⌨️ Space/Up: Jump</span>
                <span>⌨️ Shift: Dash</span>
            </div>
        `;
    board.appendChild(startOverlay);

    const startAction = () => {
        if (isGameOver) return;
        const nameInput = startOverlay.querySelector('#runner-name-input');
        if (nameInput) {
            playerName = nameInput.value.trim() || 'Anonymous';
            safeStorage.setItem('runner_player_name', playerName);
        }
        startOverlay.remove();
        animationFrameId = requestAnimationFrame(gameLoop);
        document.removeEventListener('keydown', startKeyAction);
    };
    
    // Allow start if enter is pressed
    const startKeyAction = (e) => {
        if (e.key === 'Enter') startAction();
    };

    startOverlay.querySelector('#runner-start-btn').addEventListener('click', startAction);
    document.addEventListener('keydown', startKeyAction);

    // Weather timer etc.
    weatherTimer = 400;
    state.spawnTimer = 50;
    applyDayNight(0);
    // We don't call gameLoop here anymore; wait for startAction
};