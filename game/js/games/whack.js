window.initWhackAMole = () => {
        gameScore.style.display = 'block';
        setStatus('Whack them fast!', 'var(--text-main)');

        const diff = getDifficulty();
        let minTime = diff === 'easy' ? 900 : diff === 'medium' ? 500 : 250;
        let maxTime = diff === 'easy' ? 1400 : diff === 'medium' ? 900 : 500;

        let timeUp = false;
        let lastHole = null;
        let moles = [];

        const boardArea = document.createElement('div');

        const timeDisplay = document.createElement('h3');
        timeDisplay.style.textAlign = 'center';
        timeDisplay.style.marginBottom = '1rem';
        timeDisplay.innerText = 'Time Left: 20s';

        const board = document.createElement('div');
        board.className = 'whack-board';

        const peep = () => {
            if (timeUp) return;
            const time = Math.random() * (maxTime - minTime) + minTime;
            const idx = Math.floor(Math.random() * 9);
            const holeIdx = (idx === lastHole) ? (idx + 1) % 9 : idx;
            lastHole = holeIdx;

            const mole = moles[holeIdx];
            mole.classList.add('up');
            mole.classList.remove('whacked');

            moleTimeout = setTimeout(() => {
                mole.classList.remove('up');
                if (!timeUp) peep();
            }, time);
        };

        for (let i = 0; i < 9; i++) {
            const hole = document.createElement('div');
            hole.className = 'hole';

            const mole = document.createElement('div');
            mole.className = 'mole';
            moles.push(mole);

            addListener(mole, 'mousedown', (e) => {
                if (!mole.classList.contains('whacked') && mole.classList.contains('up')) {
                    updateScore(score + 10);
                    SFX.play('whack');
                    mole.classList.add('whacked');
                    mole.classList.remove('up');
                }
            });

            hole.appendChild(mole);
            board.appendChild(hole);
        }

        boardArea.appendChild(timeDisplay);
        boardArea.appendChild(board);
        gameArea.appendChild(boardArea);

        let timeLeft = 20;
        whacInterval = setInterval(() => {
            timeLeft--;
            timeDisplay.innerText = `Time Left: ${timeLeft}s`;
            if (timeLeft <= 0) {
                clearInterval(whacInterval);
                timeUp = true;
                setStatus('Time Up!', 'var(--x-color)');
                SFX.play('lose');
                moles.forEach(m => m.classList.remove('up'));
            }
        }, 1000);

        setTimeout(peep, 1000);
    };