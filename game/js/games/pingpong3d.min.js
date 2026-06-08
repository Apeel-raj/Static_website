window.initPingPong3d = () => {
    gameScore.style.display = 'none';
    setStatus('Hover bat over ball to hit!', 'var(--primary)');

    // 1. Setup DOM Elements
    const container = document.createElement('div');
    container.className = 'pp3d-container';

    // SVG Overlay
    const svgOverlay = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svgOverlay.className = 'pp3d-svg';
    container.appendChild(svgOverlay);

    // Scoreboard
    const scoreboard = document.createElement('div');
    scoreboard.className = 'pp3d-score';
    scoreboard.innerHTML = `<span id="p1-3d-score" style="color:#10b981">0</span><span style="color:#ffffff55">-</span><span id="p2-3d-score" style="color:#ef4444">0</span>`;
    container.appendChild(scoreboard);

    gameArea.appendChild(container);

    // 2. Three.js Setup (Wider dimensions)
    const W = 1000, H = 600;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050510);
    scene.fog = new THREE.FogExp2(0x050510, 0.002);

    const camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 1000);
    camera.position.set(0, 100, 260);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(W, H);
    renderer.domElement.className = 'pp3d-canvas';
    container.appendChild(renderer.domElement);

    // 3. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    const pointLight = new THREE.PointLight(0x8b5cf6, 1.2, 500);
    pointLight.position.set(0, 100, 0);
    scene.add(pointLight);

    // 4. Game Objects
    const tableGroup = new THREE.Group();
    const tableW = 200, tableD = 300, tableH = 4;
    
    const tableTopGeo = new THREE.BoxGeometry(tableW, tableH, tableD);
    const tableMat = new THREE.MeshPhongMaterial({ color: 0x0f172a, specular: 0x8b5cf6, shininess: 80 });
    const tableTop = new THREE.Mesh(tableTopGeo, tableMat);
    tableTop.position.y = 0;
    tableGroup.add(tableTop);

    const gridGeo = new THREE.EdgesGeometry(new THREE.PlaneGeometry(tableW, tableD, 10, 15));
    const gridMat = new THREE.LineBasicMaterial({ color: 0x8b5cf6, transparent: true, opacity: 0.3 });
    const grid = new THREE.LineSegments(gridGeo, gridMat);
    grid.rotation.x = -Math.PI / 2;
    grid.position.y = 2.1;
    tableGroup.add(grid);

    const legGeo = new THREE.CylinderGeometry(4, 3, 60);
    const legMat = new THREE.MeshPhongMaterial({ color: 0x1e293b });
    [[-90, -30, -140], [90, -30, -140], [-90, -30, 140], [90, -30, 140]].forEach(pos => {
        const leg = new THREE.Mesh(legGeo, legMat);
        leg.position.set(...pos);
        tableGroup.add(leg);
    });

    const netGeo = new THREE.PlaneGeometry(tableW, 15);
    const netMat = new THREE.MeshBasicMaterial({ color: 0xec4899, transparent: true, opacity: 0.4, wireframe: true });
    const net = new THREE.Mesh(netGeo, netMat);
    net.position.y = 9.5;
    tableGroup.add(net);
    scene.add(tableGroup);

    const createBat = (colorHex) => {
        const group = new THREE.Group();
        const faceGeo = new THREE.CylinderGeometry(15, 15, 2, 32);
        faceGeo.rotateX(Math.PI / 2);
        const faceMat = new THREE.MeshPhongMaterial({ color: colorHex, emissive: colorHex, emissiveIntensity: 0.2 });
        group.add(new THREE.Mesh(faceGeo, faceMat));
        const handle = new THREE.Mesh(new THREE.CylinderGeometry(2, 2, 20), new THREE.MeshPhongMaterial({ color: 0x8b5cf6 }));
        handle.position.y = -15;
        group.add(handle);
        return group;
    };

    const p1Bat = createBat(0x10b981);
    p1Bat.position.set(0, 20, 140);
    scene.add(p1Bat);

    const p2Bat = createBat(0xef4444);
    p2Bat.position.set(0, 20, -140);
    scene.add(p2Bat);

    const ball = new THREE.Mesh(
        new THREE.SphereGeometry(3, 16, 16),
        new THREE.MeshPhongMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.8 })
    );
    scene.add(ball);
    const ballLight = new THREE.PointLight(0xffffff, 0.8, 100);
    scene.add(ballLight);

    const floor = new THREE.Mesh(new THREE.PlaneGeometry(2000, 2000), new THREE.MeshBasicMaterial({ color: 0x050510 }));
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -60;
    scene.add(floor);

    // 5. Game State
    let p1Score = 0, p2Score = 0;
    const diff = getDifficulty();
    let baseSpeed = diff === 'easy' ? 2.5 : diff === 'medium' ? 3.5 : 4.5;
    let aiSpeed = diff === 'easy' ? 0.8 : diff === 'medium' ? 1.6 : 2.6;

    const Gravity = -0.06;
    const Restitution = -0.7;

    const state = {
        gameState: 'P1_SERVE', // 'PLAYING', 'P1_SERVE', 'P2_SERVE', 'SCORED'
        ballVX: 0, ballVY: 0, ballVZ: 0,
        p1TargetX: 0, p1TargetY: 20, p1TargetZ: 140, mouseX: 0, mouseY: 0, aiServeTimer: 0
    };

    const turnState = {
        hitter: null, // 'p1' or 'p2'
        isServe: false,
        bouncesOnP1: 0, bouncesOnP2: 0
    };

    // SVG Utility
    const createSVGEffect = (type, screenX, screenY, color, textContent) => {
        if (type === 'trail') {
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', screenX); circle.setAttribute('cy', screenY); circle.setAttribute('r', 3);
            circle.setAttribute('fill', color); circle.setAttribute('class', 'svg-trail');
            svgOverlay.appendChild(circle);
            setTimeout(() => { if (svgOverlay.contains(circle)) svgOverlay.removeChild(circle); }, 400);
        } else if (type === 'hit') {
            const shock = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
            shock.setAttribute('cx', screenX); shock.setAttribute('cy', screenY);
            shock.setAttribute('fill', 'none'); shock.setAttribute('stroke', color);
            shock.setAttribute('class', 'svg-spark');
            svgOverlay.appendChild(shock);
            setTimeout(() => { if (svgOverlay.contains(shock)) svgOverlay.removeChild(shock); }, 400);
        } else if (type === 'bounce') {
            const shock = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
            shock.setAttribute('cx', screenX); shock.setAttribute('cy', screenY);
            shock.setAttribute('fill', 'none'); shock.setAttribute('stroke', color);
            shock.setAttribute('class', 'svg-bounce');
            svgOverlay.appendChild(shock);
            setTimeout(() => { if (svgOverlay.contains(shock)) svgOverlay.removeChild(shock); }, 600);
        } else if (type === 'text') {
            const txt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            txt.setAttribute('x', screenX); txt.setAttribute('y', screenY);
            txt.setAttribute('fill', color); txt.setAttribute('class', 'svg-text-announce');
            txt.textContent = textContent;
            svgOverlay.appendChild(txt);
            setTimeout(() => { if (svgOverlay.contains(txt)) svgOverlay.removeChild(txt); }, 1000);
        }
    };

    const getScreenCoord = (object) => {
        const vec = object.position.clone();
        vec.project(camera);
        return { x: Math.round((vec.x * 0.5 + 0.5) * W), y: Math.round((-(vec.y * 0.5) + 0.5) * H) };
    };

    const startServe = (server) => {
        state.ballVX = 0; state.ballVY = 0; state.ballVZ = 0;
        turnState.hitter = server;
        turnState.isServe = true;
        turnState.bouncesOnP1 = 0; turnState.bouncesOnP2 = 0;

        if (server === 'p2') {
            state.gameState = 'P2_SERVE';
            state.aiServeTimer = 90; 
            ball.position.set(0, 25, -135);
            setStatus('AI is serving...', 'var(--x-color)');
        } else {
            state.gameState = 'P1_SERVE';
            ball.position.set(0, 30, 140);  // Spawn directly over bat line
            setStatus('Hover Bat over Ball to Serve!', 'var(--snake-color)');
        }
    };

    const scorePoint = (scorer, reason) => {
        if (state.gameState === 'SCORED') return;
        state.gameState = 'SCORED';
        if (scorer === 'p1') p1Score++; else p2Score++;
        
        createSVGEffect('text', W/2, H/2 - 50, scorer === 'p1' ? '#10b981' : '#ef4444', reason);
        SFX.play(scorer === 'p1' ? 'win' : 'lose');

        const scoreElem = document.getElementById(scorer + '-3d-score');
        scoreElem.innerText = scorer === 'p1' ? p1Score : p2Score;
        scoreElem.classList.remove('score-flash');
        void scoreElem.offsetWidth; 
        scoreElem.classList.add('score-flash');

        if (p1Score >= 5 || p2Score >= 5) {
            setStatus(p1Score >= 5 ? 'You Won!' : 'AI Won!', p1Score >= 5 ? 'var(--snake-color)' : 'var(--x-color)');
            cancelAnimationFrame(animationFrameId); animationFrameId = null;
        } else {
            setTimeout(() => startServe(scorer === 'p1' ? 'p2' : 'p1'), 1500); 
        }
    };

    // 6. Game Loop
    const gameLoop = () => {
        camera.position.x += (state.mouseX * 30 - camera.position.x) * 0.05;
        camera.position.y += (100 + state.mouseY * -20 - camera.position.y) * 0.05;
        camera.lookAt(0, 0, 0);

        // Player Bat Control (X and Y axis)
        p1Bat.position.x += (state.p1TargetX - p1Bat.position.x) * 0.3;
        p1Bat.position.y += (state.p1TargetY - p1Bat.position.y) * 0.3; 
        p1Bat.position.x = Math.max(-95, Math.min(95, p1Bat.position.x));
        p1Bat.position.y = Math.max(5, Math.min(45, p1Bat.position.y));
        p1Bat.position.z = 140; // Fixed Z

        if (state.gameState === 'PLAYING') {
            state.ballVY += Gravity;
            ball.position.x += state.ballVX;
            ball.position.y += state.ballVY;
            ball.position.z += state.ballVZ;

            // Table Bounce
            if (ball.position.y - 3 < 2 && state.ballVY < 0) { 
                if (Math.abs(ball.position.x) < 100 && Math.abs(ball.position.z) < 150) {
                    ball.position.y = 5;
                    state.ballVY *= Restitution;
                    SFX.play('wall-hit'); 
                    
                    const sc = getScreenCoord(ball);
                    const color = ball.position.z > 0 ? '#10b981' : '#ef4444';
                    createSVGEffect('bounce', sc.x, sc.y, color);

                    if (ball.position.z > 0) turnState.bouncesOnP1++;
                    else turnState.bouncesOnP2++;
                }
            }

            // Net Collision
            if (Math.abs(ball.position.z) < 3 && ball.position.y < 17 && Math.abs(ball.position.x) < 100) {
                if (ball.position.z * state.ballVZ < 0) { 
                    state.ballVZ *= -0.3; 
                    state.ballVX *= 0.5;
                    SFX.play('wall-hit');
                }
            }

            const scrCoords = getScreenCoord(ball);
            createSVGEffect('trail', scrCoords.x, Math.max(0, scrCoords.y), '#8b5cf6');

            // Rules Checking
            if (turnState.bouncesOnP1 >= 2) scorePoint('p2', 'Double Bounce');
            else if (turnState.bouncesOnP2 >= 2) scorePoint('p1', 'Double Bounce');
            
            if (!turnState.isServe) {
                if (turnState.hitter === 'p1' && turnState.bouncesOnP1 > 0) scorePoint('p2', 'Fault (Own Side)');
                if (turnState.hitter === 'p2' && turnState.bouncesOnP2 > 0) scorePoint('p1', 'Fault (Own Side)');
            }

            if (ball.position.y < -30) {
                if (turnState.hitter === 'p1') {
                    if (turnState.isServe && (turnState.bouncesOnP1 < 1 || turnState.bouncesOnP2 < 1)) scorePoint('p2', 'Service Fault');
                    else if (!turnState.isServe && turnState.bouncesOnP2 < 1) scorePoint('p2', 'Out');
                    else scorePoint('p1', 'Winner!');
                } else if (turnState.hitter === 'p2') {
                    if (turnState.isServe && (turnState.bouncesOnP2 < 1 || turnState.bouncesOnP1 < 1)) scorePoint('p1', 'Service Fault');
                    else if (!turnState.isServe && turnState.bouncesOnP1 < 1) scorePoint('p1', 'Out');
                    else scorePoint('p2', 'Winner!');
                }
            }

            // AI Paddle 
            const targetX = ball.position.x;
            const targetY = ball.position.y > 5 ? ball.position.y : 15;
            if (p2Bat.position.x < targetX - 5) p2Bat.position.x += aiSpeed;
            else if (p2Bat.position.x > targetX + 5) p2Bat.position.x -= aiSpeed;
            p2Bat.position.y += (targetY - p2Bat.position.y) * 0.1;
            
            // AI steps forward to hit
            let targetZ = -140;
            if (state.ballVZ < 0 && ball.position.z < -100) targetZ = -120; // Swing!
            p2Bat.position.z += (targetZ - p2Bat.position.z) * 0.1;

            p2Bat.position.x = Math.max(-95, Math.min(95, p2Bat.position.x));

            // Paddle Collision - P1
            if (state.ballVZ > 0 && ball.position.z > 100 && ball.position.z < 165) {
                if (Math.abs(ball.position.z - p1Bat.position.z) < 15) {
                    const dist = Math.hypot(ball.position.x - p1Bat.position.x, ball.position.y - p1Bat.position.y);
                    if (dist <= 25) {
                        if (!turnState.isServe && turnState.hitter !== 'p1') {
                            if (turnState.bouncesOnP1 !== 1) {
                                scorePoint('p2', 'Volley Fault');
                                return;
                            }
                        }
                        turnState.hitter = 'p1';
                        if (state.gameState === 'P1_SERVE') turnState.isServe = true;
                        else turnState.isServe = false;
                        turnState.bouncesOnP1 = 0; turnState.bouncesOnP2 = 0;

                        // Swing speed mapped to mouseY (-0.5 push means faster)
                        let swingMult = 1 - (state.mouseY * 2); // 0 to 2 multiplier
                        state.ballVZ = (-baseSpeed * 0.9) - (1.0 * swingMult); 
                        state.ballVY = 1.3 + Math.random() * 0.5; 
                        state.ballVX = (ball.position.x - p1Bat.position.x) * 0.15;
                        
                        SFX.play('paddle-hit');
                        createSVGEffect('hit', scrCoords.x, scrCoords.y, '#10b981');
                        
                        p1Bat.rotation.x = -0.5;
                        setTimeout(() => { p1Bat.rotation.x = 0; }, 200);
                        camera.position.x += (Math.random()-0.5)*5;
                    }
                }
            }

            // Paddle Collision - P2
            if (state.ballVZ < 0 && ball.position.z < -100 && ball.position.z > -165) {
                if (Math.abs(ball.position.z - p2Bat.position.z) < 15) {
                    const dist = Math.hypot(ball.position.x - p2Bat.position.x, ball.position.y - p2Bat.position.y);
                    if (dist <= 25) {
                        if (!turnState.isServe && turnState.hitter !== 'p2') {
                            if (turnState.bouncesOnP2 !== 1) {
                                scorePoint('p1', 'Volley Fault');
                                return;
                            }
                        }
                        turnState.hitter = 'p2';
                        turnState.isServe = false;
                        turnState.bouncesOnP1 = 0; turnState.bouncesOnP2 = 0;

                        state.ballVZ = (baseSpeed * 0.9) + 1.0;
                        state.ballVY = 1.3 + Math.random() * 0.5;
                        state.ballVX = (ball.position.x - p2Bat.position.x) * 0.15;
                        
                        SFX.play('paddle-hit');
                        createSVGEffect('hit', scrCoords.x, scrCoords.y, '#ef4444');
                        
                        p2Bat.rotation.x = 0.5;
                        setTimeout(() => { p2Bat.rotation.x = 0; }, 200);
                    }
                }
            }

        } else if (state.gameState === 'P1_SERVE') {
            const dist = Math.hypot(ball.position.x - p1Bat.position.x, ball.position.y - p1Bat.position.y);
            if (dist <= 25) { // Match only X and Y distance since Z is locked
                state.gameState = 'PLAYING';
                let swingMult = 1 - (state.mouseY * 2);
                state.ballVZ = -baseSpeed - (0.5 * swingMult);
                state.ballVY = 1.5;
                state.ballVX = (ball.position.x - p1Bat.position.x) * 0.1;
                SFX.play('paddle-hit');
                setStatus('');
                p1Bat.rotation.x = -0.3;
                setTimeout(() => { p1Bat.rotation.x = 0; }, 150);
            }
        } else if (state.gameState === 'P2_SERVE') {
            p2Bat.position.x += (ball.position.x - p2Bat.position.x) * 0.1;
            p2Bat.position.z += (-140 - p2Bat.position.z) * 0.1; // reset pos
            
            state.aiServeTimer--;
            if (state.aiServeTimer <= 0) {
                state.gameState = 'PLAYING';
                state.ballVZ = baseSpeed * 0.9;
                state.ballVY = 1.8;
                state.ballVX = (Math.random() - 0.5) * 2;
                SFX.play('paddle-hit');
                setStatus('');
                p2Bat.rotation.x = 0.3;
                setTimeout(() => { p2Bat.rotation.x = 0; }, 150);
            }
        }

        ballLight.position.copy(ball.position);
        renderer.render(scene, camera);

        if (animationFrameId) {
            animationFrameId = requestAnimationFrame(gameLoop);
        }
    };

    addListener(container, 'mousemove', (e) => {
        const rect = container.getBoundingClientRect();
        const normY = (e.clientY - rect.top) / rect.height; 
        state.mouseX = (e.clientX - rect.left) / rect.width - 0.5;
        state.mouseY = normY - 0.5;
        state.p1TargetX = state.mouseX * 200;
        state.p1TargetY = 5 + (1 - normY) * 40; // Height mapped
    });

    addListener(container, 'touchmove', (e) => {
        e.preventDefault();
        const rect = container.getBoundingClientRect();
        const normY = (e.touches[0].clientY - rect.top) / rect.height;
        state.mouseX = (e.touches[0].clientX - rect.left) / rect.width - 0.5;
        state.mouseY = normY - 0.5;
        state.p1TargetX = state.mouseX * 200;
        state.p1TargetY = 5 + (1 - normY) * 40;
    });

    startServe('p2'); 
    animationFrameId = requestAnimationFrame(gameLoop);
};
