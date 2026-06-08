window.initMemoryMatch = () => {
        gameScore.style.display = 'block';

        const diff = getDifficulty();
        let timeLimit = diff === 'easy' ? 60 : diff === 'medium' ? 40 : 25;

        setStatus(`Time: ${timeLimit}s`);

        const icons = ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼'];
        const cards = [...icons, ...icons].sort(() => Math.random() - 0.5);

        let flippedCards = [];
        let matchedPairs = 0;
        let isProcessing = false;
        let isGameOver = false;

        const board = document.createElement('div');
        board.className = 'memory-board';

        gameInterval = setInterval(() => {
            if (isGameOver) return;
            timeLimit--;
            setStatus(`Time: ${timeLimit}s`, timeLimit <= 10 ? 'var(--x-color)' : 'var(--text-main)');
            if (timeLimit <= 0) {
                isGameOver = true;
                setStatus('Time Up! You Lost', 'var(--x-color)');
                SFX.play('lose');
                clearInterval(gameInterval);
            }
        }, 1000);

        cards.forEach((icon, index) => {
            const card = document.createElement('div');
            card.className = 'memory-card';
            card.dataset.icon = icon;
            card.dataset.index = index;

            const front = document.createElement('div');
            front.className = 'memory-card-front';

            const back = document.createElement('div');
            back.className = 'memory-card-back';
            back.innerText = icon;

            card.appendChild(front);
            card.appendChild(back);

            addListener(card, 'click', () => handleCardClick(card));
            board.appendChild(card);
        });

        const handleCardClick = (card) => {
            if (isGameOver || isProcessing || card.classList.contains('flipped') || flippedCards.includes(card)) return;

            SFX.play('card-flip');
            card.classList.add('flipped');
            flippedCards.push(card);

            if (flippedCards.length === 2) {
                isProcessing = true;
                const [card1, card2] = flippedCards;
                if (card1.dataset.icon === card2.dataset.icon) {
                    matchedPairs++;
                    updateScore(matchedPairs * 10);
                    SFX.play('card-match');
                    flippedCards = [];
                    isProcessing = false;

                    if (matchedPairs === icons.length) {
                        isGameOver = true;
                        clearInterval(gameInterval);
                        setStatus('You Won!', 'var(--snake-color)');
                        SFX.play('win');
                    }
                } else {
                    SFX.play('card-miss');
                    setTimeout(() => {
                        card1.classList.remove('flipped');
                        card2.classList.remove('flipped');
                        flippedCards = [];
                        isProcessing = false;
                    }, 800);
                }
            }
        };

        gameArea.appendChild(board);
    };