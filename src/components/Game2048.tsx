import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Box, Container, Typography, Paper, Button, IconButton, AppBar, Toolbar, Dialog, DialogTitle, DialogContent, DialogActions, Stack, Chip } from '@mui/material';
import { ArrowBack as ArrowBackIcon, SportsEsports as GameIcon, Refresh as RefreshIcon, ArrowUpward, ArrowDownward, ArrowBack, ArrowForward } from '@mui/icons-material';

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
    const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);

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
        <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
            <AppBar position="static" elevation={0} sx={{ bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider' }}>
                <Toolbar>
                    <IconButton component={Link} to="/" edge="start" sx={{ mr: 2 }}>
                        <ArrowBackIcon />
                    </IconButton>
                    <GameIcon sx={{ mr: 2, color: 'primary.main', display: { xs: 'none', sm: 'block' } }} />
                    <Typography variant="h6" component="h1" sx={{ flexGrow: 1, color: 'text.primary', fontWeight: 600, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                        2048 Game
                    </Typography>
                    <Chip label={`Score: ${score}`} color="primary" sx={{ mr: 1, fontSize: { xs: '0.875rem', sm: '1rem' }, fontWeight: 600 }} />
                    <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                        <Button variant="contained" startIcon={<RefreshIcon />} onClick={resetGame} size="small">
                            New Game
                        </Button>
                    </Box>
                    <IconButton
                        onClick={resetGame}
                        size="small"
                        sx={{
                            display: { xs: 'inline-flex', sm: 'none' },
                            bgcolor: 'primary.main',
                            color: 'white',
                            '&:hover': {
                                bgcolor: 'primary.dark',
                            },
                        }}
                    >
                        <RefreshIcon fontSize="small" />
                    </IconButton>
                </Toolbar>
            </AppBar>

            <Container maxWidth="sm" sx={{ py: { xs: 2, sm: 4 }, px: { xs: 0.5, sm: 3 } }}>
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
            </Container>

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
        </Box>
    );
};
