window.initRockPaperScissors = () => {
        gameScore.style.display = 'block';
        setStatus('Make your move!');

        const choices = [
            { id: 'rock', icon: '<i class="fa-solid fa-hand-back-fist"></i>', beats: 'scissors' },
            { id: 'paper', icon: '<i class="fa-solid fa-hand"></i>', beats: 'rock' },
            { id: 'scissors', icon: '<i class="fa-solid fa-hand-scissors"></i>', beats: 'paper' }
        ];

        let playHistory = [];

        const container = document.createElement('div');
        container.className = 'rps-container';

        const resultArea = document.createElement('div');
        resultArea.className = 'rps-result';
        resultArea.innerHTML = '<p style="color:var(--text-muted)">Awaiting your choice...</p>';

        const choicesArea = document.createElement('div');
        choicesArea.className = 'rps-choices';

        const getAIChoice = () => {
            const diff = getDifficulty();
            let cheatChance = 0;
            if (diff === 'medium') cheatChance = 0.25;
            else if (diff === 'hard') cheatChance = 0.6;

            if (cheatChance > 0 && playHistory.length > 2) {
                // Cheat by predicting the winning move against the player's most frequent move
                if (Math.random() < cheatChance) {
                    const counts = { rock: 0, paper: 0, scissors: 0 };
                    playHistory.forEach(c => counts[c]++);
                    const mostFrequent = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
                    const winningMove = choices.find(c => c.beats === mostFrequent);
                    return winningMove;
                }
            }
            return choices[Math.floor(Math.random() * choices.length)];
        };

        const playRound = (playerChoiceId) => {
            playHistory.push(playerChoiceId);
            if (playHistory.length > 20) playHistory.shift();

            const aiChoice = getAIChoice();
            const playerObj = choices.find(c => c.id === playerChoiceId);

            let resultTxt = '';
            let color = '';

            if (playerChoiceId === aiChoice.id) {
                resultTxt = 'Tie!';
                color = 'var(--text-main)';
                SFX.play('draw');
            } else if (playerObj.beats === aiChoice.id) {
                resultTxt = 'You Win!';
                color = 'var(--snake-color)';
                updateScore(score + 1);
                SFX.play('win');
            } else {
                resultTxt = 'AI Wins!';
                color = 'var(--x-color)';
                updateScore(Math.max(0, score - 1));
                SFX.play('lose');
            }

            setStatus(resultTxt, color);

            resultArea.innerHTML = `
                <div class="rps-fighter">
                    <h4>You</h4>
                    <div class="rps-fighter-icon" style="color:var(--primary)">${playerObj.icon}</div>
                </div>
                <div class="rps-vs">VS</div>
                <div class="rps-fighter">
                    <h4>AI</h4>
                    <div class="rps-fighter-icon" style="color:var(--secondary)">${aiChoice.icon}</div>
                </div>
            `;
        };

        choices.forEach(c => {
            const btn = document.createElement('div');
            btn.className = 'rps-choice';
            btn.innerHTML = c.icon;
            addListener(btn, 'click', () => { SFX.play('rps-pick'); playRound(c.id); });
            choicesArea.appendChild(btn);
        });

        container.appendChild(resultArea);
        container.appendChild(choicesArea);
        gameArea.appendChild(container);
    };