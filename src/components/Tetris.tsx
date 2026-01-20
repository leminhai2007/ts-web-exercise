/**
 * Tetris Component
 *
 * Classic Tetris block-stacking game with full mobile and desktop support.
 *
 * OVERVIEW:
 * Players control falling tetrominoes (geometric shapes made of four squares), rotating and
 * positioning them to create complete horizontal lines. Features automatic piece dropping,
 * progressive difficulty, and fully responsive interface with overlay controls for mobile.
 *
 * KEY FEATURES:
 * - Classic 7 Tetrominoes: I, O, T, S, Z, J, L pieces with authentic colors
 * - Responsive Controls: Keyboard for desktop, overlay touch controls for mobile
 * - Progressive Difficulty: Speed increases with each level
 * - Score System: Points for line clears and hard drops
 * - Next Piece Preview: Shows upcoming tetromino
 * - Pause Functionality: Game can be paused and resumed
 * - Mobile Overlay UI: All controls overlayed on game board
 * - Material-UI: Modern, accessible components
 *
 * GAME RULES:
 * 1. Falling tetrominoes can be moved left, right, or rotated
 * 2. Use hard drop to instantly place pieces at bottom
 * 3. Complete horizontal lines to clear them and score points
 * 4. Game speeds up every 10 lines cleared (level up)
 * 5. Game Over: New piece spawns with collision (no room)
 *
 * TYPE DEFINITIONS:
 * - Board: number[][] - 2D array (0 = empty, 1 = placed, 2 = current piece)
 * - TetrominoType: 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L'
 * - Piece: { shape, color, x, y } - Current falling piece with position
 *
 * CONSTANTS:
 * - BOARD_WIDTH: 10 - Standard Tetris board width
 * - BOARD_HEIGHT: 20 - Standard Tetris board height
 * - CELL_SIZE: 30 - Pixel size of each cell
 * - TETROMINOS: Definitions of all seven shapes and colors
 *
 * CORE GAME LOGIC:
 *
 * createEmptyBoard(): Creates 20×10 array filled with zeros
 *
 * getRandomTetromino(): Randomly selects one of seven types
 *
 * rotatePiece(): Rotates piece 90° clockwise
 * - Transposes matrix (swap rows/columns)
 * - Reverses each row to complete rotation
 *
 * checkCollision(): Checks if piece would collide
 * - Iterates through piece cells
 * - Calculates board position with offset
 * - Checks boundaries and existing blocks
 * - Used for: validating movement, rotation, game over
 *
 * mergePieceToBoard(): Permanently places piece on board
 * - Creates copy of board
 * - Sets corresponding cells to 1 (placed block)
 * - Called when piece reaches bottom
 *
 * clearLines(): Removes completed lines and adds empty rows
 * - Filters out rows where all cells filled
 * - Counts removed lines
 * - Adds empty rows at top
 * - Returns updated board and line count
 *
 * spawnNewPiece(): Creates new piece at top
 * - Uses next piece from preview
 * - Centers horizontally at top
 * - Generates next preview piece
 * - Checks collision (game over condition)
 *
 * MOVEMENT FUNCTIONS:
 *
 * moveDown(): Moves piece down or locks it
 * - Checks if move down possible
 * - If yes: moves down one row
 * - If no: merges to board, clears lines, spawns new piece
 * - Updates score and level
 * - Called by game loop and hard drop
 *
 * moveLeft/moveRight(): Moves piece horizontally
 * - Checks collision with offset
 * - Updates x position if valid
 *
 * rotate(): Rotates piece if valid
 * - Creates rotated version
 * - Checks collision
 * - Updates shape if valid
 *
 * hardDrop(): Instantly drops piece to bottom
 * - Calculates drop distance
 * - Updates position
 * - Merges and clears lines
 * - Awards bonus points (2 per row)
 * - Spawns next piece
 *
 * GAME LOOP:
 * Automatic falling via useEffect:
 * - Calculates speed based on level: max(100, 1000 - (level - 1) * 100) ms
 * - Sets interval to call moveDown() repeatedly
 * - Clears interval when game over or paused
 * - Speed progression:
 *   - Level 1: 1000ms (1 second)
 *   - Level 2: 900ms
 *   - Level 10+: 100ms (max speed)
 *
 * CONTROL SYSTEMS:
 *
 * Desktop (Keyboard):
 * - ←/→: Move left/right
 * - ↓: Hard drop (instant)
 * - ↑/Space: Rotate clockwise
 * - P: Pause/Resume
 *
 * Mobile (Touch):
 * Overlayed circular buttons:
 * - Top-left: Stats (Score, Level, Lines, Next)
 * - Top-right: Action buttons (New Game, Pause)
 * - Bottom-center: Movement (Rotate, Left, Drop, Right)
 * - Semi-transparent (70% opacity)
 * - 56×56px buttons
 * - Primary color for movement
 * - Secondary color for actions
 * - Reduced opacity (30%) when game over
 *
 * RENDERING:
 *
 * renderBoard(): Renders game board with current piece
 * - Creates copy of board
 * - Overlays current piece position (marked as 2)
 * - Renders each cell as Box with color:
 *   - Empty (0): White
 *   - Placed (1): Gray
 *   - Current piece (2): Piece's color
 *
 * renderNextPiece(): Shows preview of next tetromino
 * - Renders at 20×20px per cell (smaller)
 * - Uses piece's color for filled cells
 * - Transparent for empty cells
 *
 * GAME STATE:
 * - board: Current board state
 * - currentPiece: Active falling piece
 * - nextPiece: Preview piece
 * - score: Current score
 * - level: Current level
 * - lines: Total lines cleared
 * - gameOver: Game over flag
 * - isPaused: Pause flag
 * - gameLoopRef: Reference to game loop interval
 *
 * startNewGame(): Resets to initial state
 * - Creates empty board
 * - Generates first and next pieces
 * - Resets all stats to zero
 * - Clears game over and pause flags
 *
 * togglePause(): Pauses/resumes game
 * - Effects when paused:
 *   - Game loop stops
 *   - Controls disabled
 *   - "PAUSED" overlay shown
 *   - Can only unpause or start new game
 *
 * UI COMPONENTS:
 *
 * Desktop Side Panel (when !isMobile):
 * - Stats Panel: Score, Level, Lines
 * - Next Piece Panel: Preview
 * - Controls Panel: New Game, Pause buttons
 * - Keys Panel: Keyboard controls reference
 *
 * Mobile Overlays (when isMobile):
 * - Stats Overlay (top-left): Compact stats + next
 * - Action Buttons (top-right): New Game, Pause/Resume
 * - Movement Controls (bottom): Rotate, Left, Drop, Right
 * - Semi-transparent backgrounds
 *
 * Overlays (Both):
 * - Game Over: Dark overlay with score and New Game button
 * - Paused: Semi-transparent with "PAUSED" text
 *
 * RESPONSIVE DESIGN:
 * Breakpoint detection:
 * - Uses Material-UI's useMediaQuery
 * - sm breakpoint (600px)
 * - Below 600px: Mobile mode with overlay controls
 * - Above 600px: Desktop mode with side panel
 *
 * Mobile-specific:
 * - Overlay controls on board
 * - Touch buttons
 * - Compact stats
 * - No side panel
 *
 * Desktop-specific:
 * - Keyboard controls
 * - Side panel for stats
 * - Keyboard reference
 *
 * SCORING SYSTEM:
 * Points Awarded:
 * - Line Clear: 100 × level × lines_cleared
 *   - 1 line: 100 points (level 1)
 *   - 2 lines: 200 points (level 1)
 *   - 4 lines: 400 points (level 1)
 * - Hard Drop Bonus: 2 × drop_distance
 *
 * Level Progression:
 * - Increases every 10 lines cleared
 * - Affects fall speed and score multiplier
 *
 * Example:
 * - Level 1, clear 2 lines: 100 × 1 × 2 = 200 points
 * - Level 5, clear 4 lines: 100 × 5 × 4 = 2000 points
 * - Hard drop 10 rows: 2 × 10 = 20 bonus points
 *
 * BEST PRACTICES:
 *
 * 1. UseCallback for Functions
 * All game logic uses useCallback to prevent re-renders
 *
 * 2. Proper State Management
 * State updates use functional updates:
 * setScore(prev => prev + points)
 *
 * 3. Cleanup in Effects
 * Effects properly clean up intervals and event listeners
 *
 * 4. Responsive Design
 * Uses Material-UI breakpoints for responsive behavior
 *
 * 5. Accessibility
 * - Semantic HTML structure
 * - Clear visual feedback
 * - Keyboard navigation support
 * - ARIA-friendly Material-UI components
 *
 * PERFORMANCE:
 *
 * 1. Game Loop Optimization
 * - Uses setInterval with cleanup
 * - Stops when paused/over
 * - Adjustable speed based on level
 *
 * 2. Render Optimization
 * - Only re-renders on state changes
 * - useCallback for memoized functions
 * - Minimal DOM updates
 *
 * 3. Mobile Touch Handling
 * - Large touch targets (56×56px)
 * - Prevents default behaviors
 * - Semi-transparent overlays
 *
 * KNOWN LIMITATIONS:
 * 1. No Wall Kicks: Rotation doesn't attempt wall kicks if blocked
 * 2. No T-Spins: No bonus scoring for T-spin moves
 * 3. No Hold Piece: Cannot hold piece for later use
 * 4. No Ghost Piece: No preview of landing position
 * 5. No Persistence: Game state not saved to localStorage
 *
 * INTEGRATION:
 * Route (src/App.tsx):
 * <Route path="/tetris" element={<Tetris />} />
 *
 * Project Registry (src/data/projects.ts):
 * {
 *   id: 'tetris',
 *   name: 'Tetris',
 *   description: 'Classic Tetris game. Stack blocks and clear lines!',
 *   categories: ['game', 'puzzle'],
 *   path: '/tetris'
 * }
 *
 * TESTING CHECKLIST:
 * Desktop:
 * - Arrow keys move pieces correctly
 * - Space/Up rotates pieces
 * - Down arrow performs hard drop
 * - P key pauses/resumes
 * - Game speeds up with levels
 * - Lines clear correctly
 * - Score calculates properly
 * - Game over detected correctly
 * - New game resets everything
 *
 * Mobile:
 * - Touch buttons work correctly
 * - Buttons easily tappable
 * - Overlays don't block gameplay
 * - Stats visible and readable
 * - Game over shows restart button
 * - Pause button functions
 * - No accidental scrolling
 * - Portrait and landscape work
 *
 * Edge Cases:
 * - Rotation blocked near walls/pieces
 * - Game over when spawn blocked
 * - Multiple lines clear (1, 2, 3, 4)
 * - Level progression at 10-line intervals
 * - Pause prevents all input except unpause
 * - New game during active game works
 */

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
