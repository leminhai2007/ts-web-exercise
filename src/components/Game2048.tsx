import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import '../styles/Game2048.css';

type Board = number[][];

const GRID_SIZE = 4;

const initializeBoard = (): Board => {
    const board = Array(GRID_SIZE)
        .fill(null)
        .map(() => Array(GRID_SIZE).fill(0));
    addRandomTile(board);
    addRandomTile(board);
    return board;
};

const addRandomTile = (board: Board): void => {
    const emptyCells: [number, number][] = [];
    for (let i = 0; i < GRID_SIZE; i++) {
        for (let j = 0; j < GRID_SIZE; j++) {
            if (board[i][j] === 0) {
                emptyCells.push([i, j]);
            }
        }
    }
    if (emptyCells.length > 0) {
        const [row, col] = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        board[row][col] = Math.random() < 0.9 ? 2 : 4;
    }
};

const moveLeft = (board: Board): { board: Board; changed: boolean; score: number } => {
    const newBoard = board.map(row => [...row]);
    let changed = false;
    let score = 0;

    for (let i = 0; i < GRID_SIZE; i++) {
        const row = newBoard[i].filter(cell => cell !== 0);
        const newRow: number[] = [];

        for (let j = 0; j < row.length; j++) {
            if (j < row.length - 1 && row[j] === row[j + 1]) {
                newRow.push(row[j] * 2);
                score += row[j] * 2;
                j++;
                changed = true;
            } else {
                newRow.push(row[j]);
            }
        }

        while (newRow.length < GRID_SIZE) {
            newRow.push(0);
        }

        if (JSON.stringify(newBoard[i]) !== JSON.stringify(newRow)) {
            changed = true;
        }
        newBoard[i] = newRow;
    }

    return { board: newBoard, changed, score };
};

const rotateBoard = (board: Board): Board => {
    const newBoard = Array(GRID_SIZE)
        .fill(null)
        .map(() => Array(GRID_SIZE).fill(0));
    for (let i = 0; i < GRID_SIZE; i++) {
        for (let j = 0; j < GRID_SIZE; j++) {
            newBoard[j][GRID_SIZE - 1 - i] = board[i][j];
        }
    }
    return newBoard;
};

const move = (board: Board, direction: string): { board: Board; changed: boolean; score: number } => {
    let rotations = 0;
    switch (direction) {
        case 'up':
            rotations = 3;
            break;
        case 'right':
            rotations = 2;
            break;
        case 'down':
            rotations = 1;
            break;
        default:
            rotations = 0;
    }

    let tempBoard = board;
    for (let i = 0; i < rotations; i++) {
        tempBoard = rotateBoard(tempBoard);
    }

    const result = moveLeft(tempBoard);

    for (let i = 0; i < (4 - rotations) % 4; i++) {
        result.board = rotateBoard(result.board);
    }

    return result;
};

const isGameOver = (board: Board): boolean => {
    for (let i = 0; i < GRID_SIZE; i++) {
        for (let j = 0; j < GRID_SIZE; j++) {
            if (board[i][j] === 0) return false;
            if (j < GRID_SIZE - 1 && board[i][j] === board[i][j + 1]) return false;
            if (i < GRID_SIZE - 1 && board[i][j] === board[i + 1][j]) return false;
        }
    }
    return true;
};

export const Game2048 = () => {
    const [board, setBoard] = useState<Board>(initializeBoard());
    const [score, setScore] = useState(0);
    const [gameOver, setGameOver] = useState(false);
    const [won, setWon] = useState(false);

    const handleMove = useCallback(
        (direction: string) => {
            if (gameOver) return;

            const result = move(board, direction);
            if (result.changed) {
                addRandomTile(result.board);
                setBoard(result.board);
                setScore(prev => prev + result.score);

                if (result.board.some(row => row.includes(2048)) && !won) {
                    setWon(true);
                }

                if (isGameOver(result.board)) {
                    setGameOver(true);
                }
            }
        },
        [board, gameOver, won]
    );

    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            const keyMap: { [key: string]: string } = {
                ArrowUp: 'up',
                ArrowDown: 'down',
                ArrowLeft: 'left',
                ArrowRight: 'right',
            };

            if (keyMap[e.key]) {
                e.preventDefault();
                handleMove(keyMap[e.key]);
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [handleMove]);

    const resetGame = () => {
        setBoard(initializeBoard());
        setScore(0);
        setGameOver(false);
        setWon(false);
    };

    const getTileClass = (value: number): string => {
        return value > 0 ? `tile tile-${value}` : 'tile tile-empty';
    };

    return (
        <div className="game-2048">
            <div className="page-title">
                <img src="/2048.svg" alt="2048 Game" className="page-icon" />
                <h1>2048 Game</h1>
            </div>

            <div className="game-header">
                <Link to="/" className="back-button">
                    ← Back to Home
                </Link>
                <div className="score-container">
                    <div className="score">Score: {score}</div>
                    <button onClick={resetGame} className="reset-button">
                        New Game
                    </button>
                </div>
            </div>

            {won && !gameOver && (
                <div className="message-overlay win">
                    <div className="message-box">
                        <h2>You Win! 🎉</h2>
                        <p>You reached 2048!</p>
                        <button onClick={() => setWon(false)}>Continue Playing</button>
                        <button onClick={resetGame}>New Game</button>
                    </div>
                </div>
            )}

            {gameOver && (
                <div className="message-overlay game-over">
                    <div className="message-box">
                        <h2>Game Over!</h2>
                        <p>Final Score: {score}</p>
                        <button onClick={resetGame}>Try Again</button>
                    </div>
                </div>
            )}

            <div className="game-board">
                {board.map((row, i) => (
                    <div key={i} className="board-row">
                        {row.map((cell, j) => (
                            <div key={`${i}-${j}`} className={getTileClass(cell)}>
                                {cell > 0 && cell}
                            </div>
                        ))}
                    </div>
                ))}
            </div>

            <div className="game-instructions">
                <p>Use arrow keys to move tiles. Combine tiles with the same number to create larger numbers!</p>
                <div className="controls-hint">
                    <span>↑ Up</span>
                    <span>↓ Down</span>
                    <span>← Left</span>
                    <span>→ Right</span>
                </div>
            </div>
        </div>
    );
};
