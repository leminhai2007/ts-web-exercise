# Tetris Component Documentation

## Overview

The `Tetris` component implements the classic Tetris block-stacking game with full mobile and desktop support. Players control falling tetrominoes (geometric shapes made of four squares), rotating and positioning them to create complete horizontal lines. The game features automatic piece dropping, progressive difficulty, and a fully responsive interface with overlay controls for mobile devices.

## File Location

`src/components/Tetris.tsx`

## Key Features

- ✅ **Classic 7 Tetrominoes**: I, O, T, S, Z, J, L pieces with authentic colors
- ✅ **Responsive Controls**: Keyboard for desktop, overlay touch controls for mobile
- ✅ **Progressive Difficulty**: Speed increases with each level
- ✅ **Score System**: Points awarded for line clears and hard drops
- ✅ **Next Piece Preview**: Shows upcoming tetromino
- ✅ **Pause Functionality**: Game can be paused and resumed
- ✅ **Mobile Overlay UI**: All controls overlayed on game board for mobile
- ✅ **Material-UI**: Modern, accessible UI components

## Game Rules

1. Falling tetrominoes can be moved left, right, or rotated
2. Use hard drop to instantly place pieces at the bottom
3. Complete horizontal lines to clear them and score points
4. Game speeds up every 10 lines cleared (level up)
5. Game Over: New piece spawns with collision (no room for new pieces)

## Type Definitions

```tsx
type Board = number[][];

type TetrominoType = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L';

interface Piece {
    shape: number[][];
    color: string;
    x: number;
    y: number;
}
```

- **Board**: A 2D array representing the game board (0 = empty, 1 = placed block, 2 = current piece)
- **TetrominoType**: Seven standard Tetris piece types
- **Piece**: Current falling piece with position and appearance

## Constants

```tsx
const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const CELL_SIZE = 30;

const TETROMINOS = {
    I: { shape: [[1, 1, 1, 1]], color: '#00f0f0' },
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
```

- **BOARD_WIDTH/HEIGHT**: Standard Tetris board dimensions (10×20)
- **CELL_SIZE**: Pixel size of each cell for rendering
- **TETROMINOS**: Definitions of all seven tetromino shapes and colors

## Core Game Logic Functions

### 1. `createEmptyBoard()`

```tsx
const createEmptyBoard = (): Board => {
    return Array(BOARD_HEIGHT)
        .fill(null)
        .map(() => Array(BOARD_WIDTH).fill(0));
};
```

**Purpose**: Creates an empty game board.

**How it works**:

1. Creates a 20×10 array filled with zeros (empty cells)
2. Returns the initialized board

### 2. `getRandomTetromino()`

```tsx
const getRandomTetromino = (): { shape: number[][]; color: string } => {
    const types = Object.keys(TETROMINOS) as TetrominoType[];
    const randomType = types[Math.floor(Math.random() * types.length)];
    return TETROMINOS[randomType];
};
```

**Purpose**: Randomly selects one of the seven tetromino types.

**How it works**:

1. Gets all tetromino type keys
2. Randomly selects one type
3. Returns the shape and color from TETROMINOS definition

### 3. `rotatePiece()`

```tsx
const rotatePiece = (piece: number[][]): number[][] => {
    const rotated = piece[0].map((_, i) => piece.map(row => row[i]).reverse());
    return rotated;
};
```

**Purpose**: Rotates a piece 90 degrees clockwise.

**How it works**:

1. Transposes the matrix (swap rows and columns)
2. Reverses each row to complete the 90-degree rotation
3. Returns the rotated piece shape

**Example**:

```
Before:        After:
[1, 0, 0]      [1, 1, 1]
[1, 1, 1]      [1, 0, 0]
               [1, 0, 0]
```

### 4. `checkCollision()`

```tsx
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
```

**Purpose**: Checks if a piece would collide with boundaries or placed blocks.

**How it works**:

1. Iterates through each cell of the piece
2. Calculates the board position with offset
3. Checks if position is out of bounds
4. Checks if position overlaps with an existing block
5. Returns true if collision detected, false otherwise

**Used for**:

- Validating movement (left, right, down)
- Validating rotation
- Detecting game over condition

### 5. `mergePieceToBoard()`

```tsx
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
```

**Purpose**: Permanently places a piece on the board.

**How it works**:

1. Creates a copy of the current board
2. Iterates through the piece's filled cells
3. Sets corresponding board cells to 1 (placed block)
4. Returns the updated board

**Called when**:

- Piece reaches bottom or can't move down
- Hard drop completes

### 6. `clearLines()`

```tsx
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
```

**Purpose**: Removes completed horizontal lines and adds empty rows at top.

**How it works**:

1. Filters out rows where all cells are filled
2. Counts removed lines
3. Adds empty rows at the top to maintain board height
4. Returns updated board and line count

**Scoring**:

- Each line cleared awards `100 * level` points
- Lines counter increments
- Every 10 lines triggers level up

### 7. `spawnNewPiece()`

```tsx
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
```

**Purpose**: Creates and spawns a new piece at the top of the board.

**How it works**:

1. Uses the next piece from preview
2. Centers the piece horizontally at the top
3. Generates the next preview piece
4. Checks for collision (game over condition)
5. Returns the new piece or null if game over

## Movement Functions

### 1. `moveDown()`

```tsx
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
```

**Purpose**: Moves piece down by one row or locks it in place.

**How it works**:

1. Checks if move down is possible
2. If yes: Moves piece down one row
3. If no: Merges piece to board, clears lines, spawns new piece
4. Updates score and level as needed

**Called by**:

- Game loop (automatic falling)
- Player input (hard drop uses this logic)

### 2. `moveLeft()` / `moveRight()`

```tsx
const moveLeft = useCallback(() => {
    if (!currentPiece || gameOver || isPaused) return;
    if (!checkCollision(currentPiece, -1, 0)) {
        setCurrentPiece({ ...currentPiece, x: currentPiece.x - 1 });
    }
}, [currentPiece, gameOver, isPaused, checkCollision]);
```

**Purpose**: Moves piece horizontally if no collision.

**How it works**:

1. Checks collision with offset (-1 for left, +1 for right)
2. Updates piece x position if valid
3. Does nothing if collision detected

### 3. `rotate()`

```tsx
const rotate = useCallback(() => {
    if (!currentPiece || gameOver || isPaused) return;
    const rotated = rotatePiece(currentPiece.shape);
    const rotatedPiece = { ...currentPiece, shape: rotated };

    if (!checkCollision(rotatedPiece)) {
        setCurrentPiece(rotatedPiece);
    }
}, [currentPiece, gameOver, isPaused, checkCollision]);
```

**Purpose**: Rotates piece 90 degrees clockwise if valid.

**How it works**:

1. Creates rotated version of piece
2. Checks if rotation would cause collision
3. Updates piece shape if valid
4. Does nothing if collision detected

### 4. `hardDrop()`

```tsx
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
```

**Purpose**: Instantly drops piece to the lowest valid position.

**How it works**:

1. Calculates how far piece can drop
2. Updates piece position to bottom
3. Merges piece to board and clears lines
4. Awards bonus points (2 points per row dropped)
5. Spawns next piece

**Triggered by**:

- Down arrow key (desktop)
- Down arrow button (mobile)

## Game Loop

### Automatic Falling

```tsx
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
```

**Purpose**: Automatically moves piece down at regular intervals.

**How it works**:

1. Calculates fall speed based on level: `max(100, 1000 - (level - 1) * 100)` ms
2. Sets up interval to call `moveDown()` repeatedly
3. Clears interval when game is over or paused
4. Speed increases with level (faster falling)

**Speed progression**:

- Level 1: 1000ms (1 second)
- Level 2: 900ms
- Level 3: 800ms
- ...
- Level 10+: 100ms (maximum speed)

## Control Systems

### Desktop Controls (Keyboard)

```tsx
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
```

**Keyboard mappings**:

- **←/→**: Move left/right
- **↓**: Hard drop (instant drop)
- **↑/Space**: Rotate clockwise
- **P**: Pause/Resume

### Mobile Controls (Touch)

Mobile controls are overlayed on the game board with semi-transparent circular buttons:

**Layout**:

- **Top-left**: Stats overlay (Score, Level, Lines, Next piece)
- **Top-right**: Action buttons (New Game, Pause/Resume)
- **Bottom-center**: Movement controls (Rotate, Left, Hard Drop, Right)

```tsx
{
    /* Mobile Controls Overlay */
}
{
    isMobile && (
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
            {/* Rotate button on top */}
            <IconButton onClick={rotate} /* ... */>
                <RotateRight />
            </IconButton>
            {/* Left, Hard Drop, Right buttons in a row */}
            <Stack direction="row" spacing={1}>
                <IconButton onClick={moveLeft} /* ... */ />
                <IconButton onClick={hardDrop} /* ... */ />
                <IconButton onClick={moveRight} /* ... */ />
            </Stack>
        </Box>
    );
}
```

**Mobile button styling**:

- Circular shape (56×56px)
- Semi-transparent (70% opacity)
- Primary color for movement (left/right)
- Secondary color for actions (rotate/drop)
- Shadow for visibility over game board
- Reduced opacity (30%) when game over

### Mobile Stats Overlay

```tsx
{
    /* Mobile Stats Overlay - Top Left */
}
{
    isMobile && (
        <Box sx={{ position: 'absolute', top: 16, left: 16 /* ... */ }}>
            <Paper sx={{ bgcolor: 'rgba(255, 255, 255, 0.6)' /* ... */ }}>
                <Typography>Score</Typography>
                <Typography>{score}</Typography>
            </Paper>
            {/* Level, Lines, Next piece similar... */}
        </Box>
    );
}
```

**Features**:

- Compact vertical stack
- Semi-transparent (60% opacity)
- Shows Score, Level, Lines, Next piece
- Positioned top-left to avoid blocking gameplay

### Mobile Action Buttons

```tsx
{
    /* Mobile Action Buttons Overlay - Right Side */
}
{
    isMobile && (
        <Box sx={{ position: 'absolute', top: 16, right: 16 /* ... */ }}>
            <IconButton onClick={startNewGame} /* ... */>
                <NewGameIcon />
            </IconButton>
            <IconButton onClick={togglePause} disabled={gameOver} /* ... */>
                {isPaused ? <PlayIcon /> : <PauseIcon />}
            </IconButton>
        </Box>
    );
}
```

**Features**:

- Stacked vertically on right side
- New Game and Pause/Resume buttons
- 70% opacity
- Circular buttons (48×48px)

## Rendering

### Board Rendering

```tsx
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
```

**Purpose**: Renders the game board with current piece.

**How it works**:

1. Creates a copy of the board
2. Overlays current piece position (marked as 2)
3. Renders each cell as a Box with appropriate color:
    - Empty (0): White
    - Placed block (1): Gray
    - Current piece (2): Piece's color

### Next Piece Preview

```tsx
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
```

**Purpose**: Shows preview of the next tetromino.

**How it works**:

1. Wraps piece rows in a container
2. Renders each cell at 20×20px (smaller than game board)
3. Uses piece's color for filled cells
4. Transparent for empty cells

## Game State Management

### State Variables

```tsx
const [board, setBoard] = useState<Board>(createEmptyBoard());
const [currentPiece, setCurrentPiece] = useState<Piece | null>(null);
const [nextPiece, setNextPiece] = useState<{ shape: number[][]; color: string } | null>(null);
const [score, setScore] = useState(0);
const [level, setLevel] = useState(1);
const [lines, setLines] = useState(0);
const [gameOver, setGameOver] = useState(false);
const [isPaused, setIsPaused] = useState(false);
const gameLoopRef = useRef<number | null>(null);
```

### Start New Game

```tsx
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
```

**Purpose**: Resets game to initial state.

**How it works**:

1. Creates empty board
2. Generates first piece and next piece
3. Resets all stats to zero
4. Clears game over and pause flags
5. Sets up initial pieces

**Note**: Creates first piece directly instead of using `spawnNewPiece()` to avoid async state issues.

### Toggle Pause

```tsx
const togglePause = useCallback(() => {
    if (!gameOver) {
        setIsPaused(prev => !prev);
    }
}, [gameOver]);
```

**Purpose**: Pauses/resumes game.

**Effects when paused**:

- Game loop stops
- Controls disabled
- "PAUSED" overlay shown
- Can only unpause or start new game

## UI Components

### Desktop Side Panel

Shows when `!isMobile`:

- **Stats Panel**: Score, Level, Lines
- **Next Piece Panel**: Preview of next tetromino
- **Controls Panel**: New Game and Pause buttons
- **Keys Panel**: Keyboard controls reference

### Mobile Overlays

Shows when `isMobile`:

- **Stats Overlay** (top-left): Compact stats + next piece
- **Action Buttons** (top-right): New Game, Pause/Resume
- **Movement Controls** (bottom): Rotate, Left, Hard Drop, Right

All overlays use semi-transparent backgrounds to not fully obscure the game board.

### Overlays (Both Desktop and Mobile)

#### Game Over Overlay

```tsx
{
    gameOver && (
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
            <Button variant="contained" onClick={startNewGame}>
                New Game
            </Button>
        </Box>
    );
}
```

#### Paused Overlay

```tsx
{
    isPaused && !gameOver && (
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
    );
}
```

## Responsive Design

### Breakpoint Detection

```tsx
const theme = useTheme();
const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
```

Uses Material-UI's responsive utilities:

- `sm` breakpoint (600px)
- Below 600px: Mobile mode with overlay controls
- Above 600px: Desktop mode with side panel

### Mobile-Specific Features

1. **Overlay Controls**: All UI elements overlayed on board
2. **Touch Buttons**: Large circular buttons for easy tapping
3. **Compact Stats**: Smaller, stacked stat cards
4. **No Side Panel**: Everything on the game board

### Desktop-Specific Features

1. **Keyboard Controls**: Full keyboard support
2. **Side Panel**: Separate panel for stats and controls
3. **Keyboard Reference**: Shows key mappings

## Scoring System

### Points Awarded

- **Line Clear**: `100 × level × lines_cleared`
    - 1 line: 100 points (level 1)
    - 2 lines: 200 points (level 1)
    - 3 lines: 300 points (level 1)
    - 4 lines: 400 points (level 1)
- **Hard Drop Bonus**: `2 × drop_distance`

### Level Progression

- Level increases every 10 lines cleared
- Level affects:
    - Fall speed (faster at higher levels)
    - Score multiplier (more points per line)

### Example Scoring

```
Level 1, clear 2 lines: 100 × 1 × 2 = 200 points
Level 5, clear 4 lines: 100 × 5 × 4 = 2000 points
Hard drop 10 rows: 2 × 10 = 20 bonus points
```

## Component Structure

```tsx
export const Tetris = () => {
    // Responsive detection
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    // State management
    const [board, setBoard] = useState<Board>(createEmptyBoard());
    const [currentPiece, setCurrentPiece] = useState<Piece | null>(null);
    // ... other state

    // Game logic functions
    const checkCollision = useCallback(/* ... */);
    const mergePieceToBoard = useCallback(/* ... */);
    const clearLines = useCallback(/* ... */);
    // ... other game functions

    // Control functions
    const moveDown = useCallback(/* ... */);
    const moveLeft = useCallback(/* ... */);
    const moveRight = useCallback(/* ... */);
    const rotate = useCallback(/* ... */);
    const hardDrop = useCallback(/* ... */);

    // Game management
    const startNewGame = () => {
        /* ... */
    };
    const togglePause = useCallback(/* ... */);

    // Effects
    useEffect(() => {
        /* Keyboard controls */
    });
    useEffect(() => {
        /* Game loop */
    });
    useEffect(() => {
        /* Initialize game */
    });

    // Render functions
    const renderBoard = () => {
        /* ... */
    };
    const renderNextPiece = () => {
        /* ... */
    };

    // JSX return with conditional mobile/desktop UI
    return (
        <ProjectLayout title="Tetris" icon={<GameIcon />}>
            {/* Game board with overlays */}
            {/* Desktop side panel (conditional) */}
            {/* Mobile overlays (conditional) */}
        </ProjectLayout>
    );
};
```

## Integration with Project

### Route Configuration

In `src/App.tsx`:

```tsx
import { Tetris } from './components/Tetris';

// In Routes:
<Route path="/tetris" element={<Tetris />} />;
```

### Project Registry

In `src/data/projects.ts`:

```tsx
{
    id: 'tetris',
    name: 'Tetris',
    description: 'Classic Tetris game. Stack blocks and clear lines! Desktop: arrow keys, Mobile: touch controls.',
    categories: ['game', 'puzzle'],
    path: '/tetris',
}
```

## Best Practices Used

### 1. UseCallback for Functions

All game logic functions use `useCallback` to prevent unnecessary re-renders:

```tsx
const moveDown = useCallback(
    () => {
        // ... implementation
    },
    [
        /* dependencies */
    ]
);
```

### 2. Proper State Management

State updates use functional updates when depending on previous state:

```tsx
setScore(prev => prev + points);
setLines(prev => prev + linesCleared);
```

### 3. Cleanup in Effects

Effects properly clean up intervals and event listeners:

```tsx
useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
}, [dependencies]);
```

### 4. Responsive Design

Uses Material-UI breakpoints for responsive behavior:

```tsx
const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
```

### 5. Accessibility

- Semantic HTML structure
- Clear visual feedback
- Keyboard navigation support
- ARIA-friendly Material-UI components

## Performance Considerations

### 1. Game Loop Optimization

- Uses `setInterval` with cleanup
- Stops when game is paused/over
- Adjustable speed based on level

### 2. Render Optimization

- Only re-renders board when state changes
- Uses `useCallback` for memoized functions
- Minimal DOM updates

### 3. Mobile Touch Handling

- Large touch targets (56×56px buttons)
- Prevents default touch behaviors
- Semi-transparent overlays for visibility

## Known Limitations

1. **No Wall Kicks**: Rotation doesn't attempt wall kicks if blocked
2. **No T-Spins**: No bonus scoring for T-spin moves
3. **No Hold Piece**: Cannot hold a piece for later use
4. **No Ghost Piece**: No preview of where piece will land
5. **No Persistence**: Game state not saved to localStorage

## Future Enhancements

Potential improvements:

1. **Wall Kicks**: Allow rotation near walls with position adjustment
2. **Ghost Piece**: Show preview of piece landing position
3. **Hold Piece**: Allow swapping current piece with held piece
4. **T-Spin Detection**: Bonus points for advanced T-spin moves
5. **Combo System**: Multiplier for consecutive line clears
6. **Persistence**: Save/load game state with localStorage
7. **High Scores**: Track and display best scores
8. **Sound Effects**: Audio feedback for movements and line clears
9. **Animations**: Smooth animations for line clears
10. **Custom Controls**: Allow remapping keyboard controls

## Testing Recommendations

### Manual Testing Checklist

**Desktop:**

- ✅ Arrow keys move pieces correctly
- ✅ Space/Up arrow rotates pieces
- ✅ Down arrow performs hard drop
- ✅ P key pauses/resumes game
- ✅ Game speeds up with levels
- ✅ Lines clear correctly
- ✅ Score calculates properly
- ✅ Game over detected correctly
- ✅ New game resets everything

**Mobile:**

- ✅ Touch buttons work correctly
- ✅ Buttons are easily tappable
- ✅ Overlays don't block gameplay
- ✅ Stats visible and readable
- ✅ Game over shows restart button
- ✅ Pause button functions properly
- ✅ No accidental scrolling
- ✅ Portrait and landscape orientations

**Edge Cases:**

- ✅ Rotation blocked correctly near walls/pieces
- ✅ Game over triggered when spawn blocked
- ✅ Lines clear correctly (1, 2, 3, 4 at once)
- ✅ Level progression at 10-line intervals
- ✅ Pause prevents all input except unpause
- ✅ New game during active game works correctly

## Conclusion

The Tetris component provides a complete, responsive implementation of the classic game with modern UI and mobile support. It demonstrates:

- Complex game state management
- Real-time game loop implementation
- Responsive design with conditional rendering
- Touch and keyboard control systems
- Collision detection and piece manipulation
- Score and progression systems

The overlay control system for mobile ensures a seamless experience without requiring scrolling, while the desktop version maintains traditional keyboard controls with an informative side panel.
