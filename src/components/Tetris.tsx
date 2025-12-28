import { useState, useEffect, useCallback, useRef } from 'react';
import { Box, Typography, Paper, Button, Stack, IconButton, useMediaQuery, useTheme } from '@mui/material';
import {
    SportsEsports as GameIcon,
    AddCircleOutline as NewGameIcon,
    Pause as PauseIcon,
    PlayArrow as PlayIcon,
    ArrowDownward,
    ArrowBack,
    ArrowForward,
    RotateRight,
} from '@mui/icons-material';
import { ProjectLayout } from './ProjectLayout';

type Board = number[][];

const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const CELL_SIZE = 30;

// Tetromino shapes
const TETROMINOS = {
    I: {
        shape: [[1, 1, 1, 1]],
        color: '#00f0f0',
    },
    O: {
        shape: [
            [1, 1],
            [1, 1],
        ],
        color: '#f0f000',
    },
    T: {
        shape: [
            [0, 1, 0],
            [1, 1, 1],
        ],
        color: '#a000f0',
    },
    S: {
        shape: [
            [0, 1, 1],
            [1, 1, 0],
        ],
        color: '#00f000',
    },
    Z: {
        shape: [
            [1, 1, 0],
            [0, 1, 1],
        ],
        color: '#f00000',
    },
    J: {
        shape: [
            [1, 0, 0],
            [1, 1, 1],
        ],
        color: '#0000f0',
    },
    L: {
        shape: [
            [0, 0, 1],
            [1, 1, 1],
        ],
        color: '#f0a000',
    },
};

type TetrominoType = keyof typeof TETROMINOS;

interface Piece {
    shape: number[][];
    color: string;
    x: number;
    y: number;
}

const createEmptyBoard = (): Board => {
    return Array(BOARD_HEIGHT)
        .fill(null)
        .map(() => Array(BOARD_WIDTH).fill(0));
};

const getRandomTetromino = (): { shape: number[][]; color: string } => {
    const types = Object.keys(TETROMINOS) as TetrominoType[];
    const randomType = types[Math.floor(Math.random() * types.length)];
    return TETROMINOS[randomType];
};

const rotatePiece = (piece: number[][]): number[][] => {
    const rotated = piece[0].map((_, i) => piece.map(row => row[i]).reverse());
    return rotated;
};

export const Tetris = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const [board, setBoard] = useState<Board>(createEmptyBoard());
    const [currentPiece, setCurrentPiece] = useState<Piece | null>(null);
    const [nextPiece, setNextPiece] = useState<{ shape: number[][]; color: string } | null>(null);
    const [score, setScore] = useState(0);
    const [level, setLevel] = useState(1);
    const [lines, setLines] = useState(0);
    const [gameOver, setGameOver] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const gameLoopRef = useRef<number | null>(null);

    const checkCollision = useCallback(
        (piece: Piece, offsetX = 0, offsetY = 0): boolean => {
            for (let y = 0; y < piece.shape.length; y++) {
                for (let x = 0; x < piece.shape[y].length; x++) {
                    if (piece.shape[y][x]) {
                        const newX = piece.x + x + offsetX;
                        const newY = piece.y + y + offsetY;

                        if (newX < 0 || newX >= BOARD_WIDTH || newY >= BOARD_HEIGHT) {
                            return true;
                        }

                        if (newY >= 0 && board[newY][newX]) {
                            return true;
                        }
                    }
                }
            }
            return false;
        },
        [board]
    );

    const mergePieceToBoard = useCallback(
        (piece: Piece): Board => {
            const newBoard = board.map(row => [...row]);
            piece.shape.forEach((row, y) => {
                row.forEach((value, x) => {
                    if (value) {
                        const boardY = piece.y + y;
                        const boardX = piece.x + x;
                        if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
                            newBoard[boardY][boardX] = 1;
                        }
                    }
                });
            });
            return newBoard;
        },
        [board]
    );

    const clearLines = useCallback((boardToClear: Board): { newBoard: Board; linesCleared: number } => {
        let linesCleared = 0;
        const newBoard = boardToClear.filter(row => {
            if (row.every(cell => cell !== 0)) {
                linesCleared++;
                return false;
            }
            return true;
        });

        while (newBoard.length < BOARD_HEIGHT) {
            newBoard.unshift(Array(BOARD_WIDTH).fill(0));
        }

        return { newBoard, linesCleared };
    }, []);

    const spawnNewPiece = useCallback(() => {
        const tetromino = nextPiece || getRandomTetromino();
        const newPiece: Piece = {
            shape: tetromino.shape,
            color: tetromino.color,
            x: Math.floor(BOARD_WIDTH / 2) - Math.floor(tetromino.shape[0].length / 2),
            y: 0,
        };

        setNextPiece(getRandomTetromino());

        if (checkCollision(newPiece)) {
            setGameOver(true);
            return null;
        }

        return newPiece;
    }, [nextPiece, checkCollision]);

    const moveDown = useCallback(() => {
        if (!currentPiece || gameOver || isPaused) return;

        if (!checkCollision(currentPiece, 0, 1)) {
            setCurrentPiece({ ...currentPiece, y: currentPiece.y + 1 });
        } else {
            const mergedBoard = mergePieceToBoard(currentPiece);
            const { newBoard, linesCleared } = clearLines(mergedBoard);

            setBoard(newBoard);
            setLines(prev => prev + linesCleared);
            setScore(prev => prev + linesCleared * 100 * level);

            if (linesCleared > 0 && (lines + linesCleared) % 10 === 0) {
                setLevel(prev => prev + 1);
            }

            const newPiece = spawnNewPiece();
            setCurrentPiece(newPiece);
        }
    }, [currentPiece, gameOver, isPaused, checkCollision, mergePieceToBoard, clearLines, spawnNewPiece, level, lines]);

    const moveLeft = useCallback(() => {
        if (!currentPiece || gameOver || isPaused) return;
        if (!checkCollision(currentPiece, -1, 0)) {
            setCurrentPiece({ ...currentPiece, x: currentPiece.x - 1 });
        }
    }, [currentPiece, gameOver, isPaused, checkCollision]);

    const moveRight = useCallback(() => {
        if (!currentPiece || gameOver || isPaused) return;
        if (!checkCollision(currentPiece, 1, 0)) {
            setCurrentPiece({ ...currentPiece, x: currentPiece.x + 1 });
        }
    }, [currentPiece, gameOver, isPaused, checkCollision]);

    const rotate = useCallback(() => {
        if (!currentPiece || gameOver || isPaused) return;
        const rotated = rotatePiece(currentPiece.shape);
        const rotatedPiece = { ...currentPiece, shape: rotated };

        if (!checkCollision(rotatedPiece)) {
            setCurrentPiece(rotatedPiece);
        }
    }, [currentPiece, gameOver, isPaused, checkCollision]);

    const hardDrop = useCallback(() => {
        if (!currentPiece || gameOver || isPaused) return;

        let dropDistance = 0;
        while (!checkCollision(currentPiece, 0, dropDistance + 1)) {
            dropDistance++;
        }

        const droppedPiece = { ...currentPiece, y: currentPiece.y + dropDistance };
        const mergedBoard = mergePieceToBoard(droppedPiece);
        const { newBoard, linesCleared } = clearLines(mergedBoard);

        setBoard(newBoard);
        setLines(prev => prev + linesCleared);
        setScore(prev => prev + linesCleared * 100 * level + dropDistance * 2);

        if (linesCleared > 0 && (lines + linesCleared) % 10 === 0) {
            setLevel(prev => prev + 1);
        }

        const newPiece = spawnNewPiece();
        setCurrentPiece(newPiece);
    }, [currentPiece, gameOver, isPaused, checkCollision, mergePieceToBoard, clearLines, spawnNewPiece, level, lines]);

    const startNewGame = () => {
        const newBoard = createEmptyBoard();
        const firstNextPiece = getRandomTetromino();
        const firstPiece: Piece = {
            shape: firstNextPiece.shape,
            color: firstNextPiece.color,
            x: Math.floor(BOARD_WIDTH / 2) - Math.floor(firstNextPiece.shape[0].length / 2),
            y: 0,
        };

        setBoard(newBoard);
        setScore(0);
        setLevel(1);
        setLines(0);
        setGameOver(false);
        setIsPaused(false);
        setNextPiece(getRandomTetromino());
        setCurrentPiece(firstPiece);
    };

    const togglePause = useCallback(() => {
        if (!gameOver) {
            setIsPaused(prev => !prev);
        }
    }, [gameOver]);

    // Keyboard controls
    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            if (gameOver) return;

            switch (e.key) {
                case 'ArrowLeft':
                    e.preventDefault();
                    moveLeft();
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    moveRight();
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    hardDrop();
                    break;
                case 'ArrowUp':
                case ' ':
                    e.preventDefault();
                    rotate();
                    break;
                case 'p':
                case 'P':
                    e.preventDefault();
                    togglePause();
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [gameOver, moveLeft, moveRight, moveDown, rotate, hardDrop, togglePause]);

    // Game loop
    useEffect(() => {
        if (gameOver || isPaused) {
            if (gameLoopRef.current) {
                clearInterval(gameLoopRef.current);
                gameLoopRef.current = null;
            }
            return;
        }

        const speed = Math.max(100, 1000 - (level - 1) * 100);
        gameLoopRef.current = setInterval(() => {
            moveDown();
        }, speed);

        return () => {
            if (gameLoopRef.current) {
                clearInterval(gameLoopRef.current);
            }
        };
    }, [gameOver, isPaused, level, moveDown]);

    // Initialize game
    useEffect(() => {
        startNewGame();
    }, []);

    // Render board with current piece
    const renderBoard = () => {
        const displayBoard = board.map(row => [...row]);

        if (currentPiece) {
            currentPiece.shape.forEach((row, y) => {
                row.forEach((value, x) => {
                    if (value) {
                        const boardY = currentPiece.y + y;
                        const boardX = currentPiece.x + x;
                        if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
                            displayBoard[boardY][boardX] = 2;
                        }
                    }
                });
            });
        }

        return displayBoard.map((row, y) => (
            <Box key={y} sx={{ display: 'flex' }}>
                {row.map((cell, x) => (
                    <Box
                        key={x}
                        sx={{
                            width: CELL_SIZE,
                            height: CELL_SIZE,
                            border: '1px solid #ddd',
                            bgcolor: cell === 2 && currentPiece ? currentPiece.color : cell === 1 ? '#666' : '#fff',
                            transition: 'background-color 0.1s',
                        }}
                    />
                ))}
            </Box>
        ));
    };

    // Render next piece preview
    const renderNextPiece = () => {
        if (!nextPiece) return null;

        return (
            <Box sx={{ display: 'inline-block' }}>
                {nextPiece.shape.map((row, y) => (
                    <Box key={y} sx={{ display: 'flex' }}>
                        {row.map((cell, x) => (
                            <Box
                                key={x}
                                sx={{
                                    width: 20,
                                    height: 20,
                                    border: '1px solid #ddd',
                                    bgcolor: cell ? nextPiece.color : 'transparent',
                                }}
                            />
                        ))}
                    </Box>
                ))}
            </Box>
        );
    };

    return (
        <ProjectLayout title="Tetris" icon={<GameIcon />}>
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: isMobile ? 'column' : 'row',
                    gap: 3,
                    justifyContent: 'center',
                    alignItems: 'center',
                    p: 2,
                    position: 'relative',
                }}
            >
                {/* Game Board */}
                <Paper elevation={3} sx={{ p: 2, position: 'relative' }}>
                    <Box sx={{ position: 'relative' }}>
                        {renderBoard()}

                        {/* Mobile Stats Overlay - Top Left */}
                        {isMobile && (
                            <Box
                                sx={{
                                    position: 'absolute',
                                    top: 16,
                                    left: 16,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 0.5,
                                    zIndex: 10,
                                }}
                            >
                                <Paper elevation={3} sx={{ p: 1, bgcolor: 'rgba(255, 255, 255, 0.6)', minWidth: 80 }}>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                                        Score
                                    </Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 'bold', lineHeight: 1.2 }}>
                                        {score}
                                    </Typography>
                                </Paper>
                                <Paper elevation={3} sx={{ p: 1, bgcolor: 'rgba(255, 255, 255, 0.6)', minWidth: 80 }}>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                                        Level
                                    </Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 'bold', lineHeight: 1.2 }}>
                                        {level}
                                    </Typography>
                                </Paper>
                                <Paper elevation={3} sx={{ p: 1, bgcolor: 'rgba(255, 255, 255, 0.6)', minWidth: 80 }}>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                                        Lines
                                    </Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 'bold', lineHeight: 1.2 }}>
                                        {lines}
                                    </Typography>
                                </Paper>
                                <Paper elevation={3} sx={{ p: 1, bgcolor: 'rgba(255, 255, 255, 0.6)', minWidth: 80 }}>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', mb: 0.5 }}>
                                        Next
                                    </Typography>
                                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>{renderNextPiece()}</Box>
                                </Paper>
                            </Box>
                        )}

                        {/* Mobile Action Buttons Overlay - Right Side */}
                        {isMobile && (
                            <Box
                                sx={{
                                    position: 'absolute',
                                    top: 16,
                                    right: 16,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 1,
                                    zIndex: 10,
                                }}
                            >
                                <IconButton
                                    size="medium"
                                    onClick={startNewGame}
                                    sx={{
                                        width: 48,
                                        height: 48,
                                        bgcolor: 'primary.main',
                                        color: 'white',
                                        opacity: 0.7,
                                        '&:hover': { bgcolor: 'primary.dark', opacity: 0.9 },
                                        boxShadow: 3,
                                    }}
                                >
                                    <NewGameIcon />
                                </IconButton>
                                <IconButton
                                    size="medium"
                                    onClick={togglePause}
                                    disabled={gameOver}
                                    sx={{
                                        width: 48,
                                        height: 48,
                                        bgcolor: 'secondary.main',
                                        color: 'white',
                                        opacity: 0.7,
                                        '&:hover': { bgcolor: 'secondary.dark', opacity: 0.9 },
                                        '&:disabled': { bgcolor: 'grey.300', opacity: 0.5 },
                                        boxShadow: 3,
                                    }}
                                >
                                    {isPaused ? <PlayIcon /> : <PauseIcon />}
                                </IconButton>
                            </Box>
                        )}

                        {/* Mobile Controls Overlay */}
                        {isMobile && (
                            <Box
                                sx={{
                                    position: 'absolute',
                                    bottom: 16,
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: 1,
                                    opacity: gameOver ? 0.3 : 0.7,
                                    pointerEvents: gameOver ? 'none' : 'auto',
                                    zIndex: 10,
                                }}
                            >
                                <IconButton
                                    size="large"
                                    onClick={rotate}
                                    disabled={gameOver || isPaused}
                                    sx={{
                                        width: 56,
                                        height: 56,
                                        bgcolor: 'secondary.main',
                                        color: 'white',
                                        '&:hover': { bgcolor: 'secondary.dark' },
                                        '&:disabled': { bgcolor: 'grey.300' },
                                        boxShadow: 3,
                                    }}
                                >
                                    <RotateRight />
                                </IconButton>
                                <Stack direction="row" spacing={1} alignItems="center">
                                    <IconButton
                                        size="large"
                                        onClick={moveLeft}
                                        disabled={gameOver || isPaused}
                                        sx={{
                                            width: 56,
                                            height: 56,
                                            bgcolor: 'primary.main',
                                            color: 'white',
                                            '&:hover': { bgcolor: 'primary.dark' },
                                            '&:disabled': { bgcolor: 'grey.300' },
                                            boxShadow: 3,
                                        }}
                                    >
                                        <ArrowBack />
                                    </IconButton>
                                    <IconButton
                                        size="large"
                                        onClick={hardDrop}
                                        disabled={gameOver || isPaused}
                                        sx={{
                                            width: 56,
                                            height: 56,
                                            bgcolor: 'secondary.main',
                                            color: 'white',
                                            '&:hover': { bgcolor: 'secondary.dark' },
                                            '&:disabled': { bgcolor: 'grey.300' },
                                            boxShadow: 3,
                                        }}
                                    >
                                        <ArrowDownward />
                                    </IconButton>
                                    <IconButton
                                        size="large"
                                        onClick={moveRight}
                                        disabled={gameOver || isPaused}
                                        sx={{
                                            width: 56,
                                            height: 56,
                                            bgcolor: 'primary.main',
                                            color: 'white',
                                            '&:hover': { bgcolor: 'primary.dark' },
                                            '&:disabled': { bgcolor: 'grey.300' },
                                            boxShadow: 3,
                                        }}
                                    >
                                        <ArrowForward />
                                    </IconButton>
                                </Stack>
                            </Box>
                        )}

                        {/* Game Over Overlay */}
                        {gameOver && (
                            <Box
                                sx={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    bgcolor: 'rgba(0, 0, 0, 0.8)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 2,
                                }}
                            >
                                <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
                                    Game Over
                                </Typography>
                                <Typography variant="h6" sx={{ color: 'white' }}>
                                    Score: {score}
                                </Typography>
                                <Button variant="contained" onClick={startNewGame} startIcon={<NewGameIcon />}>
                                    New Game
                                </Button>
                            </Box>
                        )}

                        {/* Paused Overlay */}
                        {isPaused && !gameOver && (
                            <Box
                                sx={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    bgcolor: 'rgba(0, 0, 0, 0.5)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
                                    PAUSED
                                </Typography>
                            </Box>
                        )}
                    </Box>
                </Paper>

                {/* Side Panel - Desktop Only */}
                {!isMobile && (
                    <Stack spacing={2} sx={{ minWidth: 200 }}>
                        {/* Stats */}
                        <Paper elevation={2} sx={{ p: 2 }}>
                            <Typography variant="h6" gutterBottom>
                                Stats
                            </Typography>
                            <Stack spacing={1}>
                                <Typography>Score: {score}</Typography>
                                <Typography>Level: {level}</Typography>
                                <Typography>Lines: {lines}</Typography>
                            </Stack>
                        </Paper>

                        {/* Next Piece */}
                        <Paper elevation={2} sx={{ p: 2 }}>
                            <Typography variant="h6" gutterBottom>
                                Next
                            </Typography>
                            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>{renderNextPiece()}</Box>
                        </Paper>

                        {/* Controls */}
                        <Paper elevation={2} sx={{ p: 2 }}>
                            <Typography variant="h6" gutterBottom>
                                Controls
                            </Typography>
                            <Stack spacing={1}>
                                <Button variant="contained" onClick={startNewGame} startIcon={<NewGameIcon />} fullWidth>
                                    New Game
                                </Button>
                                <Button variant="outlined" onClick={togglePause} startIcon={isPaused ? <PlayIcon /> : <PauseIcon />} fullWidth disabled={gameOver}>
                                    {isPaused ? 'Resume' : 'Pause'}
                                </Button>
                            </Stack>
                        </Paper>

                        {/* Desktop Instructions */}
                        <Paper elevation={2} sx={{ p: 2 }}>
                            <Typography variant="h6" gutterBottom>
                                Keys
                            </Typography>
                            <Stack spacing={0.5} sx={{ fontSize: '0.875rem' }}>
                                <Typography variant="body2">← → : Move</Typography>
                                <Typography variant="body2">↓ : Hard Drop</Typography>
                                <Typography variant="body2">↑ / Space : Rotate</Typography>
                                <Typography variant="body2">P : Pause</Typography>
                            </Stack>
                        </Paper>
                    </Stack>
                )}
            </Box>
        </ProjectLayout>
    );
};
