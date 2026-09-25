/**
 * Game2048 — classic 2048 sliding puzzle game.
 *
 * Related docs (update if this component changes): AGENTS.md, docs/NEW_PROJECT_TEMPLATE.md, docs/STYLES.md
 */

import { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Paper, Button, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Stack, Chip } from '@mui/material';
import { GameIcon, NewGameIcon, ArrowUpward, ArrowDownward, ArrowBack, ArrowForward } from './AppIcons';
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
    let rotations: number;
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
        // Bright Mario-inspired tile palette
        const colors: { [key: number]: string } = {
            2: '#fff3c4', // pale sun
            4: '#ffe082', // sunny yellow
            8: '#ffca28', // golden yellow
            16: '#ffb300', // amber
            32: '#ff7043', // orange
            64: '#ff5252', // light red
            128: '#ff2b6d', // pink
            256: '#9c27b0', // purple
            512: '#3f51b5', // indigo
            1024: '#00acc1', // cyan
            2048: '#ffd700', // coin gold (win tile)
        };
        return colors[value] || '#ffe8cc';
    };

    const getTileTextColor = (value: number): string => {
        if (value === 64 || value === 128 || value === 256 || value === 512 || value === 1024) return '#ffffff';
        return '#3a2d1f';
    };

    return (
        <ProjectLayout title="2048" icon={<GameIcon />} maxWidth="sm" containerPadding={{ xs: 2, sm: 4 }}>
            {/* Score and New Game Button */}
            <Stack direction="row" spacing={2} sx={{ mb: 3, alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="h5" sx={{ fontWeight: 400 }}>
                    Score:{' '}
                    <Box component="span" sx={{ color: 'primary.main' }}>
                        {score}
                    </Box>
                </Typography>
                <Button variant="contained" onClick={resetGame} startIcon={<NewGameIcon />} size="medium" sx={{ display: { xs: 'none', sm: 'flex' } }}>
                    New Game
                </Button>
                <IconButton onClick={resetGame} color="primary" size="medium" sx={{ display: { xs: 'flex', sm: 'none' } }} aria-label="New game">
                    <NewGameIcon />
                </IconButton>
            </Stack>
            <Paper elevation={3} sx={{ p: { xs: 0.5, sm: 3 }, borderRadius: 0, bgcolor: 'background.paper', mx: { xs: 0.5, sm: 0 } }}>
                <Box
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(4, 1fr)',
                        gap: { xs: 0.5, sm: 2 },
                        p: { xs: 0.5, sm: 2 },
                        bgcolor: 'divider',
                        borderRadius: 0,
                        maxWidth: '100%',
                        touchAction: 'none',
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
                                    bgcolor: cell > 0 ? getTileColor(cell) : 'background.paper',
                                    color: getTileTextColor(cell),
                                    fontSize: {
                                        xs: cell >= 1000 ? '1rem' : cell >= 100 ? '1.25rem' : '1.5rem',
                                        sm: cell >= 1000 ? '2rem' : cell >= 100 ? '2.5rem' : '3rem',
                                    },
                                    fontWeight: 700,
                                    borderRadius: 0,
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

            <Paper elevation={1} sx={{ mt: { xs: 2, sm: 3 }, p: { xs: 1.5, sm: 2 }, borderRadius: 0 }}>
                <Typography variant="body2" color="text.secondary" align="center" sx={{ display: 'block', mb: 1, fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                    Use arrow keys or swipe to move tiles. Combine tiles with the same number to create larger numbers!
                </Typography>
                <Stack direction="row" spacing={1} useFlexGap sx={{ justifyContent: 'center', flexWrap: 'wrap' }}>
                    <Chip icon={<ArrowUpward />} label="Up" size="small" variant="outlined" sx={{ fontSize: { xs: '0.7rem', sm: '0.8125rem' } }} />
                    <Chip icon={<ArrowDownward />} label="Down" size="small" variant="outlined" sx={{ fontSize: { xs: '0.7rem', sm: '0.8125rem' } }} />
                    <Chip icon={<ArrowBack />} label="Left" size="small" variant="outlined" sx={{ fontSize: { xs: '0.7rem', sm: '0.8125rem' } }} />
                    <Chip icon={<ArrowForward />} label="Right" size="small" variant="outlined" sx={{ fontSize: { xs: '0.7rem', sm: '0.8125rem' } }} />
                </Stack>
            </Paper>

            <Dialog open={won && !gameOver} onClose={() => setWon(false)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ textAlign: 'center', fontSize: '1.25rem', fontWeight: 400, lineHeight: 1.8 }}>You Win! 🎉</DialogTitle>
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
                <DialogTitle sx={{ textAlign: 'center', fontSize: '1.25rem', fontWeight: 400, lineHeight: 1.8 }}>Game Over!</DialogTitle>
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
