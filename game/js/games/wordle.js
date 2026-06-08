window.initWordle = () => {
        gameScore.style.display = 'none';
        setStatus('Guess the 5-letter word!', 'var(--text-main)');

        const words = ['APPLE', 'BRAVE', 'CHAIR', 'DANCE', 'EAGLE', 'FLAME', 'GRAPE', 'HEART', 'IGLOO', 'JUICE', 'KNIFE', 'LEMON', 'MOUSE', 'NIGHT', 'OCEAN', 'PIZZA', 'QUEEN', 'RIVER', 'SNAKE', 'TRAIN', 'UMBRA', 'VOICE', 'WATER', 'XENON', 'YACHT', 'ZEBRA', 'REACT', 'GHOST', 'BLAME', 'SKILL'];
        const secretWord = words[Math.floor(Math.random() * words.length)];

        const boardArea = document.createElement('div');
        const board = document.createElement('div');
        board.className = 'wordle-board';

        const grid = [];
        for (let i = 0; i < 6; i++) {
            const row = document.createElement('div');
            row.className = 'wordle-row';
            const rowCells = [];
            for (let j = 0; j < 5; j++) {
                const cell = document.createElement('div');
                cell.className = 'wordle-cell';
                rowCells.push(cell);
                row.appendChild(cell);
            }
            grid.push(rowCells);
            board.appendChild(row);
        }

        boardArea.appendChild(board);
        gameArea.appendChild(boardArea);

        let currentRow = 0;
        let currentCol = 0;
        let isGameOver = false;

        const handleKeyPress = (e) => {
            if (isGameOver) return;

            if (e.key === 'Enter') {
                if (currentCol === 5) {
                    checkWord();
                } else {
                    SFX.play('word-wrong');
                    setStatus('Not enough letters', 'var(--text-muted)');
                    setTimeout(() => setStatus('Guess the 5-letter word!', 'var(--text-main)'), 1500);
                }
            } else if (e.key === 'Backspace' || e.key === 'Delete') {
                if (currentCol > 0) {
                    SFX.play('key-press');
                    currentCol--;
                    grid[currentRow][currentCol].innerText = '';
                }
            } else if (/^[a-zA-Z]$/.test(e.key) && e.key.length === 1) {
                if (currentCol < 5) {
                    SFX.play('key-press');
                    grid[currentRow][currentCol].innerText = e.key.toUpperCase();
                    currentCol++;
                }
            }
        };

        const checkWord = () => {
            const guess = grid[currentRow].map(cell => cell.innerText).join('');

            // Validate
            let secretArray = secretWord.split('');
            let guessArray = guess.split('');

            // First pass for correct
            for (let i = 0; i < 5; i++) {
                if (guessArray[i] === secretArray[i]) {
                    grid[currentRow][i].classList.add('correct');
                    secretArray[i] = null;
                    guessArray[i] = null;
                }
            }

            // Second pass for present/absent
            for (let i = 0; i < 5; i++) {
                if (guessArray[i] !== null) {
                    const index = secretArray.indexOf(guessArray[i]);
                    if (index !== -1) {
                        grid[currentRow][i].classList.add('present');
                        secretArray[index] = null;
                    } else {
                        grid[currentRow][i].classList.add('absent');
                    }
                }
            }

            if (guess === secretWord) {
                isGameOver = true;
                setStatus('You Won! 🎉', 'var(--snake-color)');
                SFX.play('win');
            } else {
                currentRow++;
                currentCol = 0;
                if (currentRow === 6) {
                    isGameOver = true;
                    SFX.play('lose');
                    setStatus(`Game Over! Word was ${secretWord}`, 'var(--x-color)');
                }
            }
        };

        addListener(document, 'keydown', handleKeyPress);
    };