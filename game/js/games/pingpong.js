window.initPingPong = () => {
        gameScore.style.display = 'none';
        setStatus('Move mouse up/down', 'var(--text-main)');

        const board = document.createElement('div');
        board.className = 'pingpong-board';

        const scoreDisplay = document.createElement('div');
        scoreDisplay.className = 'pingpong-score';
        scoreDisplay.innerHTML = `<span id="p1-score">0</span><span id="p2-score">0</span>`;

        const divider = document.createElement('div');
        divider.className = 'pingpong-divider';

        const p1Paddle = document.createElement('div');
        p1Paddle.className = 'paddle left';

        const p2Paddle = document.createElement('div');
        p2Paddle.className = 'paddle right';

        const ball = document.createElement('div');
        ball.className = 'ball';

        board.appendChild(scoreDisplay);
        board.appendChild(divider);
        board.appendChild(p1Paddle);
        board.appendChild(p2Paddle);
        board.appendChild(ball);
        gameArea.appendChild(board);

        let p1Score = 0;
        let p2Score = 0;

        const state = {
            ballX: 300,
            ballY: 200,
            ballVelocityX: 5,
            ballVelocityY: 5,
            p1Y: 160,
            p2Y: 160,
            boardW: 600,
            boardH: 400,
            paddleH: 80,
            paddleW: 15,
            ballR: 9
        };

        const diff = getDifficulty();
        // Base ai speed
        let aiSpeed = diff === 'easy' ? 0.8 : diff === 'medium' ? 3.5 : 8.0;

        const resetBall = (scorer) => {
            if (scorer === 'p1') {
                state.ballX = 10 + state.paddleW + state.ballR;
                state.ballY = state.p1Y + state.paddleH / 2;
                state.ballVelocityX = 5;
            } else if (scorer === 'p2') {
                state.ballX = state.boardW - 10 - state.paddleW - state.ballR;
                state.ballY = state.p2Y + state.paddleH / 2;
                state.ballVelocityX = -5;
            } else {
                state.ballX = state.boardW / 2;
                state.ballY = state.boardH / 2;
                state.ballVelocityX = (Math.random() > 0.5 ? 1 : -1) * 5;
            }
            state.ballVelocityY = (Math.random() > 0.5 ? 1 : -1) * (3 + Math.random() * 2);
        };

        const updateScoreboard = () => {
            document.getElementById('p1-score').innerText = p1Score;
            document.getElementById('p2-score').innerText = p2Score;
            if (p1Score >= 5 || p2Score >= 5) {
                setStatus(p1Score >= 5 ? 'You Won!' : 'AI Won!', p1Score >= 5 ? 'var(--snake-color)' : 'var(--x-color)');
                cancelAnimationFrame(animationFrameId);
                animationFrameId = null;
            }
        };

        const gameLoop = () => {
            // Move Ball
            state.ballX += state.ballVelocityX;
            state.ballY += state.ballVelocityY;

            // Bounce top/bottom
            if (state.ballY - state.ballR < 0 || state.ballY + state.ballR > state.boardH) {
                state.ballVelocityY *= -1;
                SFX.play('wall-hit');
            }

            // Move AI Paddle (Right)
            const targetY = state.ballY - state.paddleH / 2;
            if (state.p2Y < targetY - 10) state.p2Y += aiSpeed;
            else if (state.p2Y > targetY + 10) state.p2Y -= aiSpeed;

            // Keep paddles in bounds
            state.p1Y = Math.max(0, Math.min(state.boardH - state.paddleH, state.p1Y));
            state.p2Y = Math.max(0, Math.min(state.boardH - state.paddleH, state.p2Y));

            // Collision with left paddle
            if (state.ballX - state.ballR < 10 + state.paddleW &&
                state.ballY > state.p1Y && state.ballY < state.p1Y + state.paddleH) {
                state.ballVelocityX = Math.abs(state.ballVelocityX) * 1.05;
                state.ballX = 10 + state.paddleW + state.ballR;
                SFX.play('paddle-hit');
            }

            // Collision with right paddle
            if (state.ballX + state.ballR > state.boardW - 10 - state.paddleW &&
                state.ballY > state.p2Y && state.ballY < state.p2Y + state.paddleH) {
                state.ballVelocityX = -Math.abs(state.ballVelocityX) * 1.05;
                state.ballX = state.boardW - 10 - state.paddleW - state.ballR;
                SFX.play('paddle-hit');
            }

            // Scoring
            if (state.ballX < 0) {
                p2Score++;
                SFX.play('pp-score');
                updateScoreboard();
                if (p2Score < 5) resetBall('p1');
            } else if (state.ballX > state.boardW) {
                p1Score++;
                SFX.play('pp-score');
                updateScoreboard();
                if (p1Score < 5) resetBall('p2');
            }

            // Render
            ball.style.left = `${state.ballX}px`;
            ball.style.top = `${state.ballY}px`;
            p1Paddle.style.top = `${state.p1Y}px`;
            p2Paddle.style.top = `${state.p2Y}px`;

            if (p1Score < 5 && p2Score < 5) {
                animationFrameId = requestAnimationFrame(gameLoop);
            }
        };

        // Track player mouse
        addListener(board, 'mousemove', (e) => {
            const rect = board.getBoundingClientRect();
            // center paddle on mouse
            state.p1Y = e.clientY - rect.top - state.paddleH / 2;
        });

        // Track touch
        addListener(board, 'touchmove', (e) => {
            e.preventDefault();
            const rect = board.getBoundingClientRect();
            state.p1Y = e.touches[0].clientY - rect.top - state.paddleH / 2;
        });

        resetBall();
        animationFrameId = requestAnimationFrame(gameLoop);
    };