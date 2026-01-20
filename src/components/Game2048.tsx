/**
 * Game2048 Component
 *
 * A fully-featured implementation of the classic 2048 sliding puzzle game.
 *
 * OVERVIEW:
 * Players combine numbered tiles to reach the 2048 tile. The game features keyboard controls,
 * touch gestures, score tracking, win/lose detection, auto-save functionality, and Material-UI
 * components for a modern interface.
 *
 * KEY FEATURES:
 * - Auto-save: Game progress automatically saved to localStorage
 * - Auto-restore: Game state restored on page refresh/revisit
 * - Responsive Design: Optimized for mobile and desktop
 * - Touch Support: Swipe gestures for mobile devices
 * - Keyboard Controls: Arrow keys for desktop
 * - Material-UI: Modern, accessible UI components
 * - Theme Integration: Matches website color scheme
 *
 * GAME RULES:
 * 1. Use arrow keys (desktop) or swipe (mobile) to slide all tiles in one direction
 * 2. When two tiles with the same number touch, they merge into one tile with double the value
 * 3. After each move, a new tile (2 or 4) appears in a random empty spot
 * 4. Goal: Create a tile with the value 2048
 * 5. Game Over: No more moves available (board full and no adjacent matching tiles)
 *
 * TYPE DEFINITIONS:
 * - Board: number[][] - A 2D array representing the game board (0 = empty cell)
 * - GameState: { board, score, gameOver, won } - Complete game state for localStorage persistence
 *
 * CONSTANTS:
 * - GRID_SIZE: 4 - Defines a 4x4 game board (16 tiles total)
 * - STORAGE_KEY: 'game2048_state' - localStorage key for saving/loading game state
 *
 * CORE GAME LOGIC:
 * - initializeBoard(): Creates a new game board with two random starting tiles
 * - addRandomTile(): Adds a new tile (2 or 4) to a random empty position
 * - moveLeft(): Core mechanic - slides and merges tiles to the left
 * - rotateBoard(): Rotates the board 90 degrees clockwise
 * - move(): Handles movement in any direction by using rotation
 * - isGameOver(): Checks if the game is over (no valid moves left)
 *
 * LOCALSTORAGE FUNCTIONS:
 * - loadGameState(): Loads saved game state from localStorage
 * - saveGameState(): Saves current game state to localStorage
 * - clearGameState(): Removes saved game state from localStorage
 *
 * COMPONENT STATE:
 * - board: Current game board state
 * - score: Current score (sum of merged tiles)
 * - gameOver: Whether game is over
 * - won: Whether player reached 2048
 * - touchStart: Touch gesture start position
 *
 * UI STRUCTURE:
 * 1. ProjectLayout: Consistent layout with back button and title
 * 2. Score and Controls: Score display and New Game button
 * 3. Game Board: CSS Grid layout with dynamic tile colors
 * 4. Win Dialog: Shows when 2048 is reached
 * 5. Game Over Dialog: Shows when no moves left
 * 6. Instructions: Keyboard controls and game instructions
 *
 * COLOR SCHEME:
 * Uses theme-based indigo/blue palette:
 * - Low values (2, 4): Light indigo with dark text
 * - Mid values (8-512): Progressive indigo gradient
 * - High values (1024): Very dark indigo
 * - 2048: Special pink color (secondary theme color)
 *
 * PERFORMANCE CONSIDERATIONS:
 * - useCallback prevents handleMove recreation on every render
 * - Board copying ensures immutability (no mutations)
 * - Event cleanup removes keyboard listener on unmount
 * - Conditional rendering for dialogs only when needed
 * - localStorage throttling via useEffect
 * - Error handling catches localStorage failures gracefully
 *
 * MOBILE OPTIMIZATIONS:
 * Responsive breakpoints:
 * - xs (< 600px): Ultra-compact layout with minimal padding, smaller gaps, reduced font sizes
 * - sm+ (≥ 600px): Full layout with standard padding and normal sizes
 * Touch gestures with swipe detection and minimum distance threshold (30px)
 */

import { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Paper, Button, Dialog, DialogTitle, DialogContent, DialogActions, Stack, Chip } from '@mui/material';
import { SportsEsports as GameIcon, AddCircleOutline as NewGameIcon, ArrowUpward, ArrowDownward, ArrowBack, ArrowForward } from '@mui/icons-material';
import { ProjectLayout } from './ProjectLayout';

type Board = number[][];

const GRID_SIZE = 4;
const STORAGE_KEY = 'game2048_state';

interface GameState {
    board: Board;
    score: number;
    gameOver: boolean;
    won: boolean;
}

const initializeBoard = (): Board => {
    const board = Array(GRID_SIZE)
        .fill(null)
        .map(() => Array(GRID_SIZE).fill(0));
    addRandomTile(board);
    addRandomTile(board);
    return board;
};

const loadGameState = (): GameState | null => {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            return JSON.parse(saved);
        }
    } catch (error) {
        console.error('Failed to load game state:', error);
    }
    return null;
};

const saveGameState = (state: GameState): void => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
        console.error('Failed to save game state:', error);
    }
};

const clearGameState = (): void => {
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
        console.error('Failed to clear game state:', error);
    }
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
    // Initialize state from localStorage or create new game
    const initializeGameState = (): GameState => {
        const savedState = loadGameState();
        if (savedState) {
            return savedState;
        }
        return {
            board: initializeBoard(),
            score: 0,
            gameOver: false,
            won: false,
        };
    };

    const initialState = initializeGameState();
    const [board, setBoard] = useState<Board>(initialState.board);
    const [score, setScore] = useState(initialState.score);
    const [gameOver, setGameOver] = useState(initialState.gameOver);
    const [won, setWon] = useState(initialState.won);
    const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);

    // Save game state to localStorage whenever it changes
    useEffect(() => {
        const gameState: GameState = {
            board,
            score,
            gameOver,
            won,
        };
        saveGameState(gameState);
    }, [board, score, gameOver, won]);

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

    const handleTouchStart = (e: React.TouchEvent) => {
        const touch = e.touches[0];
        setTouchStart({ x: touch.clientX, y: touch.clientY });
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        if (!touchStart) return;

        const touch = e.changedTouches[0];
        const deltaX = touch.clientX - touchStart.x;
        const deltaY = touch.clientY - touchStart.y;
        const minSwipeDistance = 30;

        if (Math.abs(deltaX) > minSwipeDistance || Math.abs(deltaY) > minSwipeDistance) {
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                // Horizontal swipe
                handleMove(deltaX > 0 ? 'right' : 'left');
            } else {
                // Vertical swipe
                handleMove(deltaY > 0 ? 'down' : 'up');
            }
        }

        setTouchStart(null);
    };

    const resetGame = () => {
        clearGameState();
        setBoard(initializeBoard());
        setScore(0);
        setGameOver(false);
        setWon(false);
    };

    const getTileColor = (value: number): string => {
        // Using theme-based color scheme with indigo/blue palette
        const colors: { [key: number]: string } = {
            2: '#e0e7ff', // indigo-100
            4: '#c7d2fe', // indigo-200
            8: '#a5b4fc', // indigo-300
            16: '#818cf8', // indigo-400
            32: '#6366f1', // indigo-500 (primary)
            64: '#4f46e5', // indigo-600
            128: '#4338ca', // indigo-700
            256: '#3730a3', // indigo-800
            512: '#312e81', // indigo-900
            1024: '#1e1b4b', // indigo-950
            2048: '#ec4899', // pink (secondary color)
        };
        return colors[value] || '#e5e7eb';
    };

    const getTileTextColor = (value: number): string => {
        return value <= 4 ? '#1e293b' : '#ffffff';
    };

    return (
        <ProjectLayout title="2048" icon={<GameIcon />} maxWidth="sm" containerPadding={{ xs: 2, sm: 4 }}>
            {/* Score and New Game Button */}
            <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 600 }}>
                    Score:{' '}
                    <Box component="span" sx={{ color: 'primary.main' }}>
                        {score}
                    </Box>
                </Typography>
                <Button variant="contained" onClick={resetGame} startIcon={<NewGameIcon />} size="medium">
                    New Game
                </Button>
            </Stack>
            <Paper elevation={3} sx={{ p: { xs: 0.5, sm: 3 }, borderRadius: { xs: 2, sm: 3 }, bgcolor: 'grey.100', mx: { xs: 0.5, sm: 0 } }}>
                <Box
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(4, 1fr)',
                        gap: { xs: 0.5, sm: 2 },
                        p: { xs: 0.5, sm: 2 },
                        bgcolor: 'grey.200',
                        borderRadius: 2,
                        maxWidth: '100%',
                    }}
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                >
                    {board.map((row, i) =>
                        row.map((cell, j) => (
                            <Paper
                                key={`${i}-${j}`}
                                elevation={cell > 0 ? 4 : 0}
                                sx={{
                                    aspectRatio: '1',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    bgcolor: cell > 0 ? getTileColor(cell) : 'grey.300',
                                    color: getTileTextColor(cell),
                                    fontSize: {
                                        xs: cell >= 1000 ? '1rem' : cell >= 100 ? '1.25rem' : '1.5rem',
                                        sm: cell >= 1000 ? '2rem' : cell >= 100 ? '2.5rem' : '3rem',
                                    },
                                    fontWeight: 700,
                                    borderRadius: { xs: 0.5, sm: 1 },
                                    transition: 'all 0.15s ease-in-out',
                                    minWidth: 0,
                                    overflow: 'hidden',
                                }}
                            >
                                {cell > 0 && cell}
                            </Paper>
                        ))
                    )}
                </Box>
            </Paper>

            <Paper elevation={1} sx={{ mt: { xs: 2, sm: 3 }, p: { xs: 1.5, sm: 2 }, borderRadius: 2 }}>
                <Typography variant="body2" color="text.secondary" align="center" paragraph sx={{ mb: 1, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                    Use arrow keys or swipe to move tiles. Combine tiles with the same number to create larger numbers!
                </Typography>
                <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap" useFlexGap>
                    <Chip icon={<ArrowUpward />} label="Up" size="small" variant="outlined" sx={{ fontSize: { xs: '0.7rem', sm: '0.8125rem' } }} />
                    <Chip icon={<ArrowDownward />} label="Down" size="small" variant="outlined" sx={{ fontSize: { xs: '0.7rem', sm: '0.8125rem' } }} />
                    <Chip icon={<ArrowBack />} label="Left" size="small" variant="outlined" sx={{ fontSize: { xs: '0.7rem', sm: '0.8125rem' } }} />
                    <Chip icon={<ArrowForward />} label="Right" size="small" variant="outlined" sx={{ fontSize: { xs: '0.7rem', sm: '0.8125rem' } }} />
                </Stack>
            </Paper>

            <Dialog open={won && !gameOver} onClose={() => setWon(false)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ textAlign: 'center', fontSize: '1.5rem', fontWeight: 600 }}>You Win! 🎉</DialogTitle>
                <DialogContent>
                    <Typography align="center" variant="body1">
                        You reached 2048!
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
                    <Button onClick={() => setWon(false)} variant="outlined">
                        Continue Playing
                    </Button>
                    <Button onClick={resetGame} variant="contained">
                        New Game
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog open={gameOver} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ textAlign: 'center', fontSize: '1.5rem', fontWeight: 600 }}>Game Over!</DialogTitle>
                <DialogContent>
                    <Typography align="center" variant="body1">
                        Final Score: {score}
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
                    <Button onClick={resetGame} variant="contained" fullWidth>
                        Try Again
                    </Button>
                </DialogActions>
            </Dialog>
        </ProjectLayout>
    );
};
