document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const board = document.getElementById('board');
    const cells = document.querySelectorAll('[data-cell]');
    const currentPlayerDisplay = document.getElementById('current-player');
    const scoreX = document.getElementById('score-x');
    const scoreO = document.getElementById('score-o');
    const scoreDraw = document.getElementById('score-draw');
    const restartBtn = document.getElementById('restart-btn');
    const resetScoresBtn = document.getElementById('reset-scores');
    const playAgainBtn = document.getElementById('play-again-btn');
    const modal = document.getElementById('modal');
    const winnerMessage = document.getElementById('winner-message');
    const mode2P = document.querySelector('[data-mode="2p"]');
    const modeAI = document.querySelector('[data-mode="ai"]');
    const difficultyContainer = document.getElementById('difficulty-container');
    
    // Game state
    let gameBoard = ['', '', '', '', '', '', '', '', ''];
    let currentPlayer = 'X';
    let gameActive = true;
    let vsAI = false;
    let aiDifficulty = 'easy'; // easy, medium, hard
    
    // Initialize scores
    let scores = {
        X: 0,
        O: 0,
        draw: 0
    };
    
    // Winning combinations
    const winningCombinations = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
        [0, 4, 8], [2, 4, 6]             // Diagonals
    ];

    // Update the score display
    const updateScoreDisplay = () => {
        if (scoreX) scoreX.textContent = scores.X;
        if (scoreO) scoreO.textContent = scores.O;
        if (scoreDraw) scoreDraw.textContent = scores.draw;
        if (currentPlayerDisplay) {
            currentPlayerDisplay.textContent = currentPlayer;
            currentPlayerDisplay.className = currentPlayer === 'X' ? 'player-x' : 'player-o';
        }
    };

    // Save scores to localStorage
    const saveScores = () => {
        localStorage.setItem('tictactoe-scores', JSON.stringify(scores));
    };

    // Load scores from localStorage
    const loadScores = () => {
        const savedScores = localStorage.getItem('tictactoe-scores');
        if (savedScores) {
            scores = JSON.parse(savedScores);
            updateScoreDisplay();
        }
    };

    // Show modal with winner message
    const showModal = (message) => {
        if (winnerMessage) winnerMessage.innerHTML = message;
        if (modal) {
            modal.style.display = 'flex';
            modal.style.opacity = '1';
            modal.style.visibility = 'visible';
            modal.querySelector('.modal-content').style.transform = 'translateY(0)';
            modal.querySelector('.modal-content').style.opacity = '1';
        }
        
        // Add confetti effect for win (not for draw)
        if (message.includes('wins')) {
            createConfetti();
        }
    };

    // Hide modal
    const hideModal = () => {
        if (modal) {
            modal.style.opacity = '0';
            modal.querySelector('.modal-content').style.transform = 'translateY(-20px)';
            modal.querySelector('.modal-content').style.opacity = '0';
            
            // Hide after animation completes
            setTimeout(() => {
                modal.style.display = 'none';
                modal.style.visibility = 'hidden';
            }, 300);
        }
    };

    // Reset the game board
    const resetBoard = () => {
        gameBoard = ['', '', '', '', '', '', '', '', ''];
        gameActive = true;
        currentPlayer = 'X';
        
        // Clear the board UI
        cells.forEach((cell, index) => {
            cell.textContent = '';
            cell.className = 'cell';
            cell.setAttribute('data-cell-index', index);
            cell.classList.remove('x', 'o', 'winning-cell');
        });
        
        updateScoreDisplay();
        hideModal();
    };

    // Check for a winner
    const checkWinner = () => {
        for (let combo of winningCombinations) {
            const [a, b, c] = combo;
            if (gameBoard[a] && gameBoard[a] === gameBoard[b] && gameBoard[a] === gameBoard[c]) {
                return { winner: gameBoard[a], combo };
            }
        }
        return gameBoard.includes('') ? null : { winner: 'draw' };
    };

    // Handle cell click
    const handleCellClick = (e) => {
        const cell = e.target;
        const index = Array.from(cells).indexOf(cell);

        if (index === -1 || gameBoard[index] !== '' || !gameActive) return;

        // Make the move
        makeMove(index);
    };

    // Make a move
    const makeMove = (index) => {
        gameBoard[index] = currentPlayer;
        const cell = cells[index];
        if (cell) {
            cell.textContent = currentPlayer;
            cell.classList.add(currentPlayer.toLowerCase());
        }

        // Check for win or draw
        const result = checkWinner();
        if (result) {
            handleGameEnd(result);
            return;
        }

        // Switch player
        currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
        updateScoreDisplay();

        // If playing against AI, make AI move
        if (vsAI && currentPlayer === 'O' && gameActive) {
            setTimeout(makeAIMove, 500);
        }
    };

    // Handle game end
    const handleGameEnd = (result) => {
        gameActive = false;
        
        if (result.winner === 'draw') {
            scores.draw++;
            showModal('Game ended in a draw!');
        } else {
            scores[result.winner]++;
            highlightWinningCells(result.combo);
            const winnerText = result.winner === 'X' 
                ? 'Player <span style="color: var(--accent);">X</span> wins!'
                : 'Player <span style="color: var(--secondary);">O</span> wins!';
            showModal(winnerText);
        }
        
        saveScores();
        updateScoreDisplay();
    };

    // Highlight winning cells
    const highlightWinningCells = (combo) => {
        combo.forEach(index => {
            const cell = cells[index];
            if (cell) {
                cell.classList.add('winning-cell');
            }
        });
    };

    // Get a random empty cell index
    const getRandomMove = () => {
        const emptyCells = [];
        gameBoard.forEach((cell, index) => {
            if (cell === '') emptyCells.push(index);
        });
        return emptyCells.length > 0 
            ? emptyCells[Math.floor(Math.random() * emptyCells.length)] 
            : -1;
    };

    // AI move
    const makeAIMove = () => {
        if (!vsAI || currentPlayer !== 'O' || !gameActive) return;
        
        let moveIndex;
        const availableMoves = gameBoard
            .map((cell, index) => cell === '' ? index : null)
            .filter(val => val !== null);

        switch(aiDifficulty) {
            case 'easy':
                // Easy: Completely random moves
                moveIndex = availableMoves[Math.floor(Math.random() * availableMoves.length)];
                break;
                
            case 'medium':
                // Medium: 50% chance to make a smart move, 50% random
                if (Math.random() > 0.5) {
                    moveIndex = getBestMove();
                } else {
                    moveIndex = availableMoves[Math.floor(Math.random() * availableMoves.length)];
                }
                break;
                
            case 'hard':
                // Hard: Always make the best move
                moveIndex = getBestMove();
                break;
                
            default:
                moveIndex = availableMoves[Math.floor(Math.random() * availableMoves.length)];
        }
        
        if (moveIndex !== undefined) {
            setTimeout(() => {
                makeMove(moveIndex);
            }, 500); // Add a small delay for better UX
        }
    };
    
    // Get the best move for AI
    const getBestMove = () => {
        // Check for winning move
        for (let i = 0; i < gameBoard.length; i++) {
            if (gameBoard[i] === '') {
                gameBoard[i] = 'O';
                const winCheck = checkWinner();
                gameBoard[i] = '';
                if (winCheck?.winner === 'O') {
                    return i;
                }
            }
        }
        
        // Block opponent's winning move
        for (let i = 0; i < gameBoard.length; i++) {
            if (gameBoard[i] === '') {
                gameBoard[i] = 'X';
                const winCheck = checkWinner();
                gameBoard[i] = '';
                if (winCheck?.winner === 'X') {
                    return i;
                }
            }
        }
        
        // Take center if available
        if (gameBoard[4] === '') return 4;
        
        // Take a corner if available
        const corners = [0, 2, 6, 8];
        const availableCorners = corners.filter(index => gameBoard[index] === '');
        if (availableCorners.length > 0) {
            return availableCorners[Math.floor(Math.random() * availableCorners.length)];
        }
        
        // Take any available edge
        const edges = [1, 3, 5, 7];
        const availableEdges = edges.filter(index => gameBoard[index] === '');
        if (availableEdges.length > 0) {
            return availableEdges[Math.floor(Math.random() * availableEdges.length)];
        }
        
        // Fallback to random move (shouldn't happen in a standard game)
        const availableMoves = gameBoard
            .map((cell, index) => cell === '' ? index : null)
            .filter(val => val !== null);
        return availableMoves[0];
    };

    // Handle mode button clicks
    const handleModeClick = (e) => {
        e.preventDefault();
        const mode = e.currentTarget.getAttribute('data-mode');
        toggleGameMode(mode);
    };
    
    // Handle difficulty button clicks
    const handleDifficultyClick = (e) => {
        e.preventDefault();
        const buttons = document.querySelectorAll('.difficulty-btn');
        buttons.forEach(btn => btn.classList.remove('active'));
        e.currentTarget.classList.add('active');
        aiDifficulty = e.currentTarget.getAttribute('data-difficulty');
    };
    
    // Toggle game mode
    const toggleGameMode = (mode) => {
        vsAI = mode === 'ai';
        if (mode2P && modeAI) {
            if (mode === '2p') {
                mode2P.classList.add('active');
                modeAI.classList.remove('active');
                if (difficultyContainer) difficultyContainer.style.display = 'none';
            } else {
                mode2P.classList.remove('active');
                modeAI.classList.add('active');
                if (difficultyContainer) difficultyContainer.style.display = 'block';
            }
        }
        resetBoard();
        
        // If it's AI's turn, make a move
        if (vsAI && currentPlayer === 'O') {
            setTimeout(makeAIMove, 500);
        }
    };

    // Reset scores
    const resetScores = () => {
        if (confirm('Are you sure you want to reset all scores?')) {
            scores = { X: 0, O: 0, draw: 0 };
            saveScores();
            updateScoreDisplay();
            resetBoard();
        }
    };

    // Create confetti effect
    const createConfetti = () => {
        const colors = ['#00FFFF', '#FF2D55', '#FFC01E', '#25F4EE', '#FFFFFF'];
        const container = document.querySelector('.game-container');
        
        for (let i = 0; i < 100; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = Math.random() * 100 + 'vw';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.width = Math.random() * 10 + 5 + 'px';
            confetti.style.height = Math.random() * 10 + 5 + 'px';
            confetti.style.animationDuration = Math.random() * 3 + 2 + 's';
            container.appendChild(confetti);
            
            // Remove confetti after animation
            setTimeout(() => {
                confetti.remove();
            }, 3000);
        }
    };

    // Initialize event listeners
    const initEventListeners = () => {
        try {
            // Cell clicks
            cells.forEach((cell) => {
                cell.removeEventListener('click', handleCellClick);
                cell.addEventListener('click', handleCellClick);
            });
            
            // Button clicks
            if (restartBtn) {
                restartBtn.removeEventListener('click', resetBoard);
                restartBtn.addEventListener('click', resetBoard);
            }
            
            if (resetScoresBtn) {
                resetScoresBtn.removeEventListener('click', resetScores);
                resetScoresBtn.addEventListener('click', resetScores);
            }
            
            if (playAgainBtn) {
                playAgainBtn.removeEventListener('click', resetBoard);
                playAgainBtn.addEventListener('click', resetBoard);
            }
            
            // Mode buttons
            if (mode2P) {
                mode2P.removeEventListener('click', handleModeClick);
                mode2P.addEventListener('click', handleModeClick);
            }
            
            if (modeAI) {
                modeAI.removeEventListener('click', handleModeClick);
                modeAI.addEventListener('click', handleModeClick);
            }
            
            // Difficulty buttons
            document.querySelectorAll('.difficulty-btn').forEach(button => {
                button.removeEventListener('click', handleDifficultyClick);
                button.addEventListener('click', handleDifficultyClick);
            });
            
        } catch (error) {
            console.error('Error initializing event listeners:', error);
        }
    };

    // Initialize the game
    const initGame = () => {
        loadScores();
        initEventListeners();
        resetBoard();
        
        // Set initial active mode
        if (mode2P) mode2P.classList.add('active');
    };

    // Start the game
    initGame();
});
