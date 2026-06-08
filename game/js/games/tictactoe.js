window.initTicTacToe = () => {
        gameScore.style.display = 'none';
        setStatus("Your Turn (X)", 'var(--x-color)');
        let boardState = Array(9).fill(null);
        let playerTurn = true;
        let gameOver = false;

        const board = document.createElement('div');
        board.className = 'ttt-board';
        const cells = [];

        const checkWinner = (state) => {
            const lines = [
                [0, 1, 2], [3, 4, 5], [6, 7, 8],
                [0, 3, 6], [1, 4, 7], [2, 5, 8],
                [0, 4, 8], [2, 4, 6]
            ];
            for (let i = 0; i < lines.length; i++) {
                const [a, b, c] = lines[i];
                if (state[a] && state[a] === state[b] && state[a] === state[c]) {
                    return state[a];
                }
            }
            if (!state.includes(null)) return 'draw';
            return null;
        };

        const executeMove = (i, player) => {
            boardState[i] = player;
            cells[i].innerText = player;
            cells[i].classList.add('occupied', player.toLowerCase());
            SFX.play('ttt-place');

            const winner = checkWinner(boardState);
            if (winner) {
                gameOver = true;
                if (winner === 'draw') { setStatus("It's a Draw!", 'var(--text-main)'); SFX.play('draw'); }
                else if (winner === 'X') { setStatus("You Win!", 'var(--snake-color)'); SFX.play('win'); }
                else { setStatus("AI Wins!", 'var(--x-color)'); SFX.play('lose'); }
                return true;
            }
            return false;
        };

        const minimax = (state, depth, isMaximizing) => {
            let result = checkWinner(state);
            if (result === 'O') return 10 - depth;
            if (result === 'X') return depth - 10;
            if (result === 'draw') return 0;

            if (isMaximizing) {
                let bestScore = -Infinity;
                for (let i = 0; i < 9; i++) {
                    if (!state[i]) {
                        state[i] = 'O';
                        let score = minimax(state, depth + 1, false);
                        state[i] = null;
                        bestScore = Math.max(score, bestScore);
                    }
                }
                return bestScore;
            } else {
                let bestScore = Infinity;
                for (let i = 0; i < 9; i++) {
                    if (!state[i]) {
                        state[i] = 'X';
                        let score = minimax(state, depth + 1, true);
                        state[i] = null;
                        bestScore = Math.min(score, bestScore);
                    }
                }
                return bestScore;
            }
        };

        const getAIMove = () => {
            const diff = getDifficulty();
            const available = boardState.map((v, i) => v === null ? i : null).filter(v => v !== null);
            if (available.length === 0) return null;

            if (diff === 'easy') {
                return available[Math.floor(Math.random() * available.length)];
            }

            if (diff === 'medium') {
                // Try to win
                for (let i of available) {
                    boardState[i] = 'O';
                    if (checkWinner(boardState) === 'O') { boardState[i] = null; return i; }
                    boardState[i] = null;
                }
                // Block player
                for (let i of available) {
                    boardState[i] = 'X';
                    if (checkWinner(boardState) === 'X') { boardState[i] = null; return i; }
                    boardState[i] = null;
                }
                // Otherwise random
                return available[Math.floor(Math.random() * available.length)];
            }

            if (diff === 'hard') {
                let bestScore = -Infinity;
                let move;
                for (let i of available) {
                    boardState[i] = 'O';
                    let score = minimax(boardState, 0, false);
                    boardState[i] = null;
                    if (score > bestScore) {
                        bestScore = score;
                        move = i;
                    }
                }
                return move;
            }
        };

        const aiTurn = () => {
            if (gameOver) return;
            setStatus("AI is thinking...", 'var(--text-muted)');
            setTimeout(() => {
                const move = getAIMove();
                if (move !== null) {
                    const ended = executeMove(move, 'O');
                    if (!ended) {
                        playerTurn = true;
                        setStatus("Your Turn (X)", 'var(--x-color)');
                    }
                }
            }, 500);
        };

        const handleClick = (i) => {
            if (boardState[i] || gameOver || !playerTurn) return;
            playerTurn = false;
            const ended = executeMove(i, 'X');
            if (!ended) aiTurn();
        };

        for (let i = 0; i < 9; i++) {
            const cell = document.createElement('div');
            cell.className = 'ttt-cell';
            addListener(cell, 'click', () => handleClick(i));
            cells.push(cell);
            board.appendChild(cell);
        }

        gameArea.appendChild(board);
    };