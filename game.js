
class MancalaGame {
    constructor() {
        this.aiDepth = parseInt(document.getElementById('ai-depth').value);
        this.animationSpeed = document.getElementById('animation-speed').value;
        this.thinkingIndicator = document.getElementById('thinking');
        this.gameBoard = document.getElementById('game-board');
        this.marbleColors = [
            '#ff7f50', '#87cefa', '#90ee90', '#ffa07a',
            '#add8e6', '#f08080', '#e0ffff', '#d3d3d3',
            '#ffb6c1', '#fafad2', '#d8bfd8', '#dda0dd'
        ];

        // Map pit indices to their DOM elements
        this.pitElements = {};
        for (let i = 0; i < 14; i++) {
            if (i === 6) {
                this.pitElements[i] = document.getElementById('store-0');
            } else if (i === 13) {
                this.pitElements[i] = document.getElementById('store-1');
            } else {
                this.pitElements[i] = document.getElementById(`pit-${i}`);
            }
        }

        // Get board positions for animation
        this.updatePitPositions();

        // Initialize the game
        this.initGame();
        this.setupEventListeners();
        this.updateBoard();

        // Add window resize event to update pit positions
        window.addEventListener('resize', () => this.updatePitPositions());
    }

    updatePitPositions() {
        this.pitPositions = {};
        const boardRect = this.gameBoard.getBoundingClientRect();

        for (let i = 0; i < 14; i++) {
            const elem = this.pitElements[i];
            if (elem) {
                const rect = elem.getBoundingClientRect();
                this.pitPositions[i] = {
                    x: rect.left - boardRect.left + rect.width / 2,
                    y: rect.top - boardRect.top + rect.height / 2
                };
            }
        }
    }

    initGame() {
        // Initialize board with 4 seeds in each pit
        this.board = Array(14).fill(4);

        // Stores (index 6 for player 1, index 13 for player 2)
        this.board[6] = 0;
        this.board[13] = 0;

        this.currentPlayer = 0; // Human player starts
        this.gameOver = false;
        this.winner = null;
        this.aiThinking = false;
        this.animating = false;
    }

    setupEventListeners() {
        // Add click event to pits
        document.querySelectorAll('.pit').forEach(pit => {
            pit.addEventListener('click', () => {
                if (this.gameOver || this.aiThinking || this.animating) return;

                const index = parseInt(pit.dataset.index);
                if (this.isValidMove(index)) {
                    this.makeMove(index);
                }
            });
        });

        // New game button
        document.getElementById('new-game').addEventListener('click', () => {
            this.aiDepth = parseInt(document.getElementById('ai-depth').value);
            this.animationSpeed = document.getElementById('animation-speed').value;
            this.initGame();
            this.updateBoard();
        });

        // AI depth setting
        document.getElementById('ai-depth').addEventListener('change', () => {
            this.aiDepth = parseInt(document.getElementById('ai-depth').value);
        });

        // Animation speed setting
        document.getElementById('animation-speed').addEventListener('change', () => {
            this.animationSpeed = document.getElementById('animation-speed').value;
        });
    }

    updateBoard() {
        // Update pits with marbles
        for (let i = 0; i < 14; i++) {
            const isStore = i === 6 || i === 13;
            const elementId = isStore ? `store-${i === 6 ? 0 : 1}` : `pit-${i}`;
            const element = document.getElementById(elementId);

            // Clear previous marbles
            element.innerHTML = '';

            // Add count label
            const countLabel = document.createElement('div');
            countLabel.className = 'count-label';
            countLabel.textContent = this.board[i];
            element.appendChild(countLabel);

            // Add marbles
            this.renderMarbles(element, this.board[i], isStore);

            // Disable pits that cannot be played
            if (!isStore) {
                if ((this.currentPlayer === 0 && (i > 5 && i < 13)) ||
                    (this.currentPlayer === 1 && i < 6) ||
                    this.board[i] === 0 || this.gameOver || this.animating) {
                    element.classList.add('disabled');
                } else {
                    element.classList.remove('disabled');
                }
            }
        }

        // Update status
        const statusElement = document.getElementById('status');
        if (this.gameOver) {
            if (this.winner === null) {
                statusElement.textContent = "Game Over! It's a tie!";
            } else if (this.winner === 0) {
                statusElement.textContent = "Game Over! You win!";
            } else {
                statusElement.textContent = "Game Over! AI wins!";
            }
        } else if (this.animating) {
            statusElement.textContent = "Moving...";
        } else {
            if (this.currentPlayer === 0) {
                statusElement.textContent = "Your turn";
            } else {
                statusElement.textContent = "AI's turn";
            }
        }
    }

    renderMarbles(container, count, isStore) {
        const containerWidth = isStore ? 100 : 80;
        const containerHeight = isStore ? 160 : 80;

        // Generate positions for marbles based on count
        const positions = this.generateMarblePositions(count, containerWidth, containerHeight);

        // Create marble elements
        for (let i = 0; i < count; i++) {
            if (i >= positions.length) break; // Safety check

            const marble = document.createElement('div');
            marble.className = 'marble';

            // Assign position
            marble.style.left = positions[i].x + 'px';
            marble.style.top = positions[i].y + 'px';

            // Assign color (cycle through colors)
            const colorIndex = i % this.marbleColors.length;
            marble.style.backgroundColor = this.marbleColors[colorIndex];

            container.appendChild(marble);
        }
    }

    generateMarblePositions(count, containerWidth, containerHeight) {
        const positions = [];
        const marbleSize = 16;
        const margin = 4;
        const effectiveWidth = containerWidth - marbleSize - margin * 2;
        const effectiveHeight = containerHeight - marbleSize - margin * 2;

        // Limit the number of marbles we display
        const maxDisplayMarbles = 36;
        const marblesToRender = Math.min(count, maxDisplayMarbles);

        // Simple positioning algorithm
        if (marblesToRender <= 0) return positions;

        for (let attempt = 0; attempt < 100 && positions.length < marblesToRender; attempt++) {
            const x = margin + Math.random() * effectiveWidth;
            const y = margin + Math.random() * effectiveHeight;

            // Check for overlap with existing marbles
            let overlaps = false;
            for (const pos of positions) {
                const dx = pos.x - x;
                const dy = pos.y - y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < marbleSize) {
                    overlaps = true;
                    break;
                }
            }

            if (!overlaps) {
                positions.push({ x, y });
            }
        }

        return positions;
    }

    isValidMove(index) {
        // Check if the move is valid
        if (this.currentPlayer === 0) {
            return index >= 0 && index < 6 && this.board[index] > 0;
        } else {
            return index >= 7 && index < 13 && this.board[index] > 0;
        }
    }

    async makeMove(index) {
        if (!this.isValidMove(index) || this.gameOver || this.animating) return;

        this.animating = true;
        this.updateBoard(); // Disable all pits during animation

        let seeds = this.board[index];
        const originalBoard = [...this.board]; // Save original board state
        this.board[index] = 0;

        // Create animation path for marbles
        const animationPath = this.createAnimationPath(index, seeds, this.currentPlayer);

        // Perform animation
        await this.animateMarbles(index, animationPath, originalBoard);

        // Handle capture after animation
        const lastIndex = animationPath[animationPath.length - 1].pitIndex;
        const captureHappened = this.handleCapture(lastIndex);

        if (captureHappened) {
            // Animate capture if it happened
            await this.animateCapture(lastIndex);
            this.checkGameOver();
            this.animating = false;
            this.updateBoard();

            // If game is not over and it's AI's turn
            if (!this.gameOver && this.currentPlayer === 1) {
                this.makeAIMove();
            }
            return;
        }

        // Check if last seed landed in player's store
        const gotFreeTurn =
            (this.currentPlayer === 0 && lastIndex === 6) ||
            (this.currentPlayer === 1 && lastIndex === 13);

        // Switch player if the last seed didn't land in the player's store
        if (!gotFreeTurn) {
            this.currentPlayer = 1 - this.currentPlayer;
        }

        this.checkGameOver();
        this.animating = false;
        this.updateBoard();

        // Make AI move if it's AI's turn and game is not over
        if (!this.gameOver && this.currentPlayer === 1) {
            this.makeAIMove();
        }
    }

    createAnimationPath(startIndex, seeds, player) {
        const path = [];
        let currentIndex = startIndex;

        // Create path for animation
        for (let i = 0; i < seeds; i++) {
            currentIndex = (currentIndex + 1) % 14;

            // Skip opponent's store
            if ((player === 0 && currentIndex === 13) ||
                (player === 1 && currentIndex === 6)) {
                i--; // Don't count this as a seed placement
                continue;
            }

            path.push({
                pitIndex: currentIndex,
                position: this.pitPositions[currentIndex]
            });
        }

        return path;
    }

    async animateMarbles(startIndex, path, originalBoard) {
        if (path.length === 0) return;

        // Get animation duration based on speed setting
        const duration = this.getAnimationDuration();
        const pitDelay = duration * 0.8;

        // Create animated marbles
        const marbles = [];
        const marbleContainer = document.createElement('div');
        this.gameBoard.appendChild(marbleContainer);

        // Take all seeds from the starting pit
        const seeds = originalBoard[startIndex];

        // Create a marble for each seed to be moved
        for (let i = 0; i < seeds; i++) {
            const marble = document.createElement('div');
            marble.className = 'animated-marble';
            marble.style.opacity = '0';

            // Assign color (cycle through colors)
            const colorIndex = i % this.marbleColors.length;
            marble.style.backgroundColor = this.marbleColors[colorIndex];

            marbleContainer.appendChild(marble);
            marbles.push(marble);
        }

        // Position marbles at the starting pit
        const startPos = this.pitPositions[startIndex];
        for (let i = 0; i < marbles.length; i++) {
            const offsetX = (Math.random() - 0.5) * 20;
            const offsetY = (Math.random() - 0.5) * 20;

            marbles[i].style.left = (startPos.x - 8 + offsetX) + 'px';
            marbles[i].style.top = (startPos.y - 8 + offsetY) + 'px';
            marbles[i].style.opacity = '1';
        }

        // Wait a moment before starting animation
        await new Promise(resolve => setTimeout(resolve, 200));

        // Distribute marbles to pits
        for (let i = 0; i < path.length; i++) {
            const marble = marbles[i % marbles.length];
            const targetPos = path[i].position;
            const pitIndex = path[i].pitIndex;

            // Move marble to target position
            marble.style.transition = `left ${duration}ms ease-out, top ${duration}ms ease-out`;
            marble.style.left = (targetPos.x - 8) + 'px';
            marble.style.top = (targetPos.y - 8) + 'px';

            // Wait for animation to complete
            await new Promise(resolve => setTimeout(resolve, pitDelay));

            // Update board state
            this.board[pitIndex]++;

            // Update the UI for the target pit
            this.updatePitDisplay(pitIndex);
        }

        // Clean up animated marbles
        await new Promise(resolve => setTimeout(resolve, duration));
        marbleContainer.remove();
    }

    async animateCapture(lastIndex) {
        const oppositeIndex = 12 - lastIndex;
        if (this.board[oppositeIndex] === 0) return; // No seeds to capture

        const playerStore = this.currentPlayer === 0 ? 6 : 13;
        const duration = this.getAnimationDuration();

        // Create container for animated marbles
        const marbleContainer = document.createElement('div');
        this.gameBoard.appendChild(marbleContainer);

        // Create marbles for the last pit and opposite pit
        const marbles = [];
        const totalSeeds = this.board[lastIndex] + this.board[oppositeIndex];

        for (let i = 0; i < totalSeeds; i++) {
            const marble = document.createElement('div');
            marble.className = 'animated-marble';

            // Assign color (cycle through colors)
            const colorIndex = i % this.marbleColors.length;
            marble.style.backgroundColor = this.marbleColors[colorIndex];

            marbleContainer.appendChild(marble);
            marbles.push(marble);
        }

        // Position marbles at their starting pits
        for (let i = 0; i < this.board[lastIndex]; i++) {
            const startPos = this.pitPositions[lastIndex];
            const offsetX = (Math.random() - 0.5) * 20;
            const offsetY = (Math.random() - 0.5) * 20;

            marbles[i].style.left = (startPos.x - 8 + offsetX) + 'px';
            marbles[i].style.top = (startPos.y - 8 + offsetY) + 'px';
        }

        for (let i = 0; i < this.board[oppositeIndex]; i++) {
            const startPos = this.pitPositions[oppositeIndex];
            const offsetX = (Math.random() - 0.5) * 20;
            const offsetY = (Math.random() - 0.5) * 20;

            marbles[this.board[lastIndex] + i].style.left = (startPos.x - 8 + offsetX) + 'px';
            marbles[this.board[lastIndex] + i].style.top = (startPos.y - 8 + offsetY) + 'px';
        }

        // Wait a moment before moving
        await new Promise(resolve => setTimeout(resolve, 300));

        // Move all marbles to the player's store
        const targetPos = this.pitPositions[playerStore];
        for (let i = 0; i < marbles.length; i++) {
            const marble = marbles[i];
            const offsetX = (Math.random() - 0.5) * 30;
            const offsetY = (Math.random() - 0.5) * 60;

            marble.style.transition = `left ${duration}ms ease-out, top ${duration}ms ease-out`;
            marble.style.left = (targetPos.x - 8 + offsetX) + 'px';
            marble.style.top = (targetPos.y - 8 + offsetY) + 'px';
        }

        // Update board state
        this.board[playerStore] += totalSeeds;
        this.board[lastIndex] = 0;
        this.board[oppositeIndex] = 0;

        // Update all affected pits
        this.updatePitDisplay(lastIndex);
        this.updatePitDisplay(oppositeIndex);
        this.updatePitDisplay(playerStore);

        // Switch player after capture
        this.currentPlayer = 1 - this.currentPlayer;

        // Clean up animated marbles
        await new Promise(resolve => setTimeout(resolve, duration));
        marbleContainer.remove();
    }

    updatePitDisplay(index) {
        const isStore = index === 6 || index === 13;
        const elementId = isStore ? `store-${index === 6 ? 0 : 1}` : `pit-${index}`;
        const element = document.getElementById(elementId);

        // Update count label
        const countLabel = element.querySelector('.count-label');
        if (countLabel) {
            countLabel.textContent = this.board[index];
        }
    }

    getAnimationDuration() {
        switch (this.animationSpeed) {
            case 'fast': return 200;
            case 'slow': return 600;
            default: return 400; // normal
        }
    }

    handleCapture(lastIndex) {
        // If the last seed lands in an empty pit on the player's side, capture
        const isPlayerSide =
            (this.currentPlayer === 0 && lastIndex >= 0 && lastIndex < 6) ||
            (this.currentPlayer === 1 && lastIndex >= 7 && lastIndex < 13);

        if (this.board[lastIndex] === 1 && isPlayerSide) {
            const oppositeIndex = 12 - lastIndex;

            if (this.board[oppositeIndex] > 0) {
                return true; // Capture will happen in animation
            }
        }

        return false;
    }

    checkGameOver() {
        // Check if all pits on a side are empty
        let player0Empty = true;
        let player1Empty = true;

        for (let i = 0; i < 6; i++) {
            if (this.board[i] > 0) {
                player0Empty = false;
                break;
            }
        }

        for (let i = 7; i < 13; i++) {
            if (this.board[i] > 0) {
                player1Empty = false;
                break;
            }
        }

        if (player0Empty || player1Empty) {
            this.gameOver = true;

            // Collect remaining seeds
            let player0RemainingSeeds = 0;
            let player1RemainingSeeds = 0;

            for (let i = 0; i < 6; i++) {
                player0RemainingSeeds += this.board[i];
                this.board[i] = 0;
            }

            for (let i = 7; i < 13; i++) {
                player1RemainingSeeds += this.board[i];
                this.board[i] = 0;
            }

            this.board[6] += player0RemainingSeeds;
            this.board[13] += player1RemainingSeeds;

            // Determine winner
            if (this.board[6] > this.board[13]) {
                this.winner = 0;
            } else if (this.board[13] > this.board[6]) {
                this.winner = 1;
            } else {
                this.winner = null; // Tie
            }
        }
    }

    async makeAIMove() {
        if (this.gameOver || this.currentPlayer !== 1 || this.aiThinking || this.animating) return;

        this.aiThinking = true;
        this.thinkingIndicator.style.display = 'block';

        // Small delay to show the thinking indicator
        await new Promise(resolve => setTimeout(resolve, 10));

        // Use minimax with alpha-beta pruning to find the best move
        const bestMove = this.findBestMove();

        // Add a small delay to make the AI seem to be "thinking"
        await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 500));

        this.aiThinking = false;
        this.thinkingIndicator.style.display = 'none';
        if (bestMove !== -1) {
            this.makeMove(bestMove);
        }
    }

    findBestMove() {
        let bestScore = -Infinity;
        let bestMove = -1;

        // Get all valid moves for AI
        for (let i = 7; i < 13; i++) {
            if (this.board[i] > 0) {
                // Create a deep copy of the board for simulation
                const boardCopy = [...this.board];
                const result = this.simulateMove(boardCopy, i, 1);

                // If move gives another turn, evaluate further
                if (result.anotherTurn) {
                    // Simulate the additional turn(s) with minimax
                    const nextPlayerScore = this.minimax(
                        result.newBoard,
                        this.aiDepth - 1,
                        -Infinity,
                        Infinity,
                        true // AI gets another turn
                    );
                    result.score = nextPlayerScore;
                }

                if (result.score > bestScore) {
                    bestScore = result.score;
                    bestMove = i;
                }
            }
        }

        return bestMove;
    }

    minimax(board, depth, alpha, beta, isMaximizingPlayer) {
        // Check for terminal state
        if (depth === 0 || this.isGameOverForBoard(board)) {
            return this.evaluateBoard(board);
        }

        if (isMaximizingPlayer) {
            // AI's turn (maximizing)
            let maxScore = -Infinity;

            // Try all possible moves for AI
            for (let i = 7; i < 13; i++) {
                if (board[i] > 0) {
                    const result = this.simulateMove(board.slice(), i, 1);

                    let moveScore;
                    if (result.anotherTurn) {
                        // If AI gets another turn, continue maximizing
                        moveScore = this.minimax(
                            result.newBoard,
                            depth - 1,
                            alpha,
                            beta,
                            true
                        );
                    } else {
                        // Switch to minimizing player
                        moveScore = this.minimax(
                            result.newBoard,
                            depth - 1,
                            alpha,
                            beta,
                            false
                        );
                    }

                    maxScore = Math.max(maxScore, moveScore);
                    alpha = Math.max(alpha, maxScore);

                    // Alpha-beta pruning
                    if (beta <= alpha) {
                        break;
                    }
                }
            }

            return maxScore;
        } else {
            // Human's turn (minimizing)
            let minScore = Infinity;

            // Try all possible moves for human
            for (let i = 0; i < 6; i++) {
                if (board[i] > 0) {
                    const result = this.simulateMove(board.slice(), i, 0);

                    let moveScore;
                    if (result.anotherTurn) {
                        // If human gets another turn, continue minimizing
                        moveScore = this.minimax(
                            result.newBoard,
                            depth - 1,
                            alpha,
                            beta,
                            false
                        );
                    } else {
                        // Switch to maximizing player
                        moveScore = this.minimax(
                            result.newBoard,
                            depth - 1,
                            alpha,
                            beta,
                            true
                        );
                    }

                    minScore = Math.min(minScore, moveScore);
                    beta = Math.min(beta, minScore);

                    // Alpha-beta pruning
                    if (beta <= alpha) {
                        break;
                    }
                }
            }

            return minScore;
        }
    }

    simulateMove(board, index, player) {
        let seeds = board[index];
        board[index] = 0;

        let currentIndex = index;
        let lastIndex = null;

        // Distribute seeds
        while (seeds > 0) {
            currentIndex = (currentIndex + 1) % 14;

            // Skip opponent's store
            if ((player === 0 && currentIndex === 13) ||
                (player === 1 && currentIndex === 6)) {
                continue;
            }

            board[currentIndex]++;
            seeds--;

            if (seeds === 0) {
                lastIndex = currentIndex;
            }
        }

        // Check for capture
        let playerSideStart = player === 0 ? 0 : 7;
        let playerSideEnd = player === 0 ? 5 : 12;
        let playerStore = player === 0 ? 6 : 13;

        if (lastIndex >= playerSideStart && lastIndex <= playerSideEnd && board[lastIndex] === 1) {
            let oppositeIndex = 12 - lastIndex;

            if (board[oppositeIndex] > 0) {
                // Capture
                let captured = board[oppositeIndex] + board[lastIndex];
                board[oppositeIndex] = 0;
                board[lastIndex] = 0;
                board[playerStore] += captured;
            }
        }

        // Check if player gets another turn
        let anotherTurn = (player === 0 && lastIndex === 6) || (player === 1 && lastIndex === 13);

        // Calculate score based on board state
        let score = this.evaluateBoard(board);

        return {
            newBoard: board,
            anotherTurn: anotherTurn,
            score: score
        };
    }

    evaluateBoard(board) {
        // Simple evaluation: difference between AI's store and player's store
        // Add weight to seeds in pits closer to the store
        let aiScore = board[13] * 2; // AI's store has double weight
        let playerScore = board[6] * 2; // Player's store has double weight

        // Add weight to seeds in AI's pits (closer to store = more valuable)
        for (let i = 7; i < 13; i++) {
            aiScore += board[i] * (1 + (i - 7) * 0.1);
        }

        // Add weight to seeds in player's pits (closer to store = more valuable)
        for (let i = 0; i < 6; i++) {
            playerScore += board[i] * (1 + (5 - i) * 0.1);
        }

        return aiScore - playerScore;
    }

    isGameOverForBoard(board) {
        // Check if all pits on one side are empty
        let player0Empty = true;
        let player1Empty = true;

        for (let i = 0; i < 6; i++) {
            if (board[i] > 0) {
                player0Empty = false;
                break;
            }
        }

        for (let i = 7; i < 13; i++) {
            if (board[i] > 0) {
                player1Empty = false;
                break;
            }
        }

        return player0Empty || player1Empty;
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const game = new MancalaGame();
});
