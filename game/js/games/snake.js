window.initSnake = () => {
        gameScore.style.display = 'block';
        setStatus('Press Arrow Keys to Start');

        const diff = getDifficulty();
        const speed = diff === 'easy' ? 200 : diff === 'medium' ? 120 : 60;

        const boardSize = 20;
        let snake = [{ x: 10, y: 10 }];
        let velocity = { x: 0, y: 0 };
        let apple = { x: 15, y: 15 };
        let isGameOver = false;
        let gameStarted = false;

        const board = document.createElement('div');
        board.className = 'snake-board';
        gameArea.appendChild(board);

        const placeApple = () => {
            let newX, newY, onSnake;
            do {
                newX = Math.floor(Math.random() * boardSize) + 1;
                newY = Math.floor(Math.random() * boardSize) + 1;
                onSnake = snake.some(segment => segment.x === newX && segment.y === newY);
            } while (onSnake);
            apple = { x: newX, y: newY };
        };

        const draw = () => {
            board.innerHTML = '';

            const app = document.createElement('div');
            app.className = 'snake-apple';
            app.style.setProperty('--x', apple.x);
            app.style.setProperty('--y', apple.y);
            board.appendChild(app);

            snake.forEach((segment, index) => {
                const part = document.createElement('div');
                part.className = index === 0 ? 'snake-part snake-head' : 'snake-part';
                part.style.setProperty('--x', segment.x);
                part.style.setProperty('--y', segment.y);
                board.appendChild(part);
            });

            if (isGameOver) {
                const go = document.createElement('div');
                go.className = 'snake-game-over';
                go.innerText = 'Game Over!';
                board.appendChild(go);
            }
        };

        const step = () => {
            if (isGameOver) return;

            const head = { ...snake[0] };
            head.x += velocity.x;
            head.y += velocity.y;

            if (head.x < 1 || head.x > boardSize || head.y < 1 || head.y > boardSize) {
                isGameOver = true;
                SFX.play('lose');
                setStatus('Crashed into wall!', 'var(--x-color)');
                draw();
                return;
            }

            if (snake.some(segment => segment.x === head.x && segment.y === head.y)) {
                isGameOver = true;
                SFX.play('lose');
                setStatus('Crashed into self!', 'var(--x-color)');
                draw();
                return;
            }

            snake.unshift(head);

            if (head.x === apple.x && head.y === apple.y) {
                updateScore(score + 10);
                SFX.play('snake-eat');
                placeApple();
            } else {
                snake.pop();
            }

            draw();
        };

        const handleInput = (e) => {
            if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " ", "w", "a", "s", "d"].indexOf(e.key) > -1) {
                e.preventDefault();
            }

            if (isGameOver) return;

            if (!gameStarted && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd'].includes(e.key)) {
                gameStarted = true;
                setStatus('Playing...', 'var(--snake-color)');
                gameInterval = setInterval(step, speed);
            }

            switch (e.key) {
                case 'ArrowUp':
                case 'w': if (velocity.y !== 1) velocity = { x: 0, y: -1 }; break;
                case 'ArrowDown':
                case 's': if (velocity.y !== -1) velocity = { x: 0, y: 1 }; break;
                case 'ArrowLeft':
                case 'a': if (velocity.x !== 1) velocity = { x: -1, y: 0 }; break;
                case 'ArrowRight':
                case 'd': if (velocity.x !== -1) velocity = { x: 1, y: 0 }; break;
            }
        };

        addListener(document, 'keydown', handleInput);
        draw();
    };