# Game2048 Component Documentation

## Overview

The `Game2048` component implements the classic 2048 sliding puzzle game with persistent game state. Players combine numbered tiles to reach the 2048 tile. The game features keyboard controls, touch gestures, score tracking, win/lose detection, auto-save functionality, and Material-UI components for a modern interface.

## File Location

`src/components/Game2048.tsx`

## Key Features

- ✅ **Auto-save**: Game progress automatically saved to localStorage
- ✅ **Auto-restore**: Game state restored on page refresh/revisit
- ✅ **Responsive Design**: Optimized for mobile and desktop
- ✅ **Touch Support**: Swipe gestures for mobile devices
- ✅ **Keyboard Controls**: Arrow keys for desktop
- ✅ **Material-UI**: Modern, accessible UI components
- ✅ **Theme Integration**: Matches website color scheme

## Game Rules

1. Use arrow keys (desktop) or swipe (mobile) to slide all tiles in one direction
2. When two tiles with the same number touch, they merge into one tile with double the value
3. After each move, a new tile (2 or 4) appears in a random empty spot
4. Goal: Create a tile with the value 2048
5. Game Over: No more moves available (board full and no adjacent matching tiles)

## Type Definitions

```tsx
type Board = number[][];

interface GameState {
    board: Board;
    score: number;
    gameOver: boolean;
    won: boolean;
}
```

- **Board**: A 2D array representing the game board (0 = empty cell)
- **GameState**: Complete game state for localStorage persistence

## Constants

```tsx
const GRID_SIZE = 4;
const STORAGE_KEY = 'game2048_state';
```

- **GRID_SIZE**: Defines a 4x4 game board (16 tiles total)
- **STORAGE_KEY**: localStorage key for saving/loading game state

## Core Game Logic Functions

### 1. `initializeBoard()`

```tsx
const initializeBoard = (): Board => {
    const board = Array(GRID_SIZE)
        .fill(null)
        .map(() => Array(GRID_SIZE).fill(0));
    addRandomTile(board);
    addRandomTile(board);
    return board;
};
```

**Purpose**: Creates a new game board with two random starting tiles.

**How it works**:

1. Creates a 4x4 array filled with zeros (empty cells)
2. Adds two random tiles (2 or 4) to the board
3. Returns the initialized board

### 2. `addRandomTile()`

```tsx
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
```

**Purpose**: Adds a new tile (2 or 4) to a random empty position.

**How it works**:

1. Finds all empty cells (value = 0)
2. Randomly selects one empty cell
3. Places a 2 (90% chance) or 4 (10% chance) in that cell
4. Mutates the board directly (modifies the array in place)

### 3. `moveLeft()`

```tsx
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
                j++; // Skip next tile (already merged)
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
```

**Purpose**: Core game mechanic - slides and merges tiles to the left.

**How it works**:

1. Creates a copy of the board
2. For each row:
    - **Remove zeros**: Filter out empty cells
    - **Merge tiles**: If adjacent tiles have same value, merge them
    - **Calculate score**: Add merged value to score
    - **Pad with zeros**: Fill remaining spaces with 0
3. Tracks if board changed (to know if move was valid)
4. Returns new board, change status, and points earned

**Example**:

```
[2, 0, 2, 4] → [4, 4, 0, 0]  (merged 2+2=4, score: 4)
[2, 2, 2, 2] → [4, 4, 0, 0]  (merged first pair, then second pair, score: 8)
```

### 4. `rotateBoard()`

```tsx
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
```

**Purpose**: Rotates the board 90 degrees clockwise.

**How it works**:

- Matrix rotation: `newBoard[j][GRID_SIZE - 1 - i] = board[i][j]`
- Used to convert other directions into "move left" operations

**Why?**: Instead of implementing move logic for all 4 directions, we:

1. Rotate board to convert direction to "left"
2. Apply `moveLeft()` logic
3. Rotate back

### 5. `move()`

```tsx
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
```

**Purpose**: Handles movement in any direction by using rotation.

**Direction Mapping**:
| Direction | Rotations | Logic |
|-----------|-----------|-------|
| Left | 0 | No rotation needed, apply moveLeft directly |
| Down | 1 | Rotate 90° clockwise, moveLeft, rotate back 270° |
| Right | 2 | Rotate 180°, moveLeft, rotate back 180° |
| Up | 3 | Rotate 270° clockwise, moveLeft, rotate back 90° |

### 6. `isGameOver()`

```tsx
const isGameOver = (board: Board): boolean => {
    for (let i = 0; i < GRID_SIZE; i++) {
        for (let j = 0; j < GRID_SIZE; j++) {
            if (board[i][j] === 0) return false; // Empty cell exists
            if (j < GRID_SIZE - 1 && board[i][j] === board[i][j + 1]) return false; // Horizontal match
            if (i < GRID_SIZE - 1 && board[i][j] === board[i + 1][j]) return false; // Vertical match
        }
    }
    return true;
};
```

**Purpose**: Checks if the game is over (no valid moves left).

**Checks**:

1. **Empty cells**: If any cell is 0, game continues
2. **Horizontal matches**: If any adjacent horizontal tiles match
3. **Vertical matches**: If any adjacent vertical tiles match

Returns `true` only if board is full AND no adjacent tiles match.

## LocalStorage Functions

### `loadGameState()`

```tsx
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
```

**Purpose**: Loads saved game state from localStorage.

**Returns**: Saved `GameState` object or `null` if no save exists.

**Error Handling**: Returns `null` if localStorage is unavailable or data is corrupted.

### `saveGameState()`

```tsx
const saveGameState = (state: GameState): void => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
        console.error('Failed to save game state:', error);
    }
};
```

**Purpose**: Saves current game state to localStorage.

**When Called**: Automatically triggered via `useEffect` whenever game state changes.

### `clearGameState()`

```tsx
const clearGameState = (): void => {
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
        console.error('Failed to clear game state:', error);
    }
};
```

**Purpose**: Removes saved game state from localStorage.

**When Called**: When user clicks "New Game" button.

## Component State

```tsx
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
```

| State        | Type                               | Purpose                             |
| ------------ | ---------------------------------- | ----------------------------------- |
| `board`      | `Board`                            | Current game board state            |
| `score`      | `number`                           | Current score (sum of merged tiles) |
| `gameOver`   | `boolean`                          | Whether game is over                |
| `won`        | `boolean`                          | Whether player reached 2048         |
| `touchStart` | `{ x: number; y: number } \| null` | Touch gesture start position        |

**State Initialization**:

1. Attempts to load saved game from localStorage
2. If found, restores previous game state
3. If not found, creates new game

**State Persistence**:

```tsx
useEffect(() => {
    const gameState: GameState = { board, score, gameOver, won };
    saveGameState(gameState);
}, [board, score, gameOver, won]);
```

- Automatically saves to localStorage whenever any state changes
- Ensures no progress is lost on refresh/close

## Component Functions

### `handleMove()`

```tsx
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
```

**Purpose**: Handles a player move in any direction.

**Flow**:

1. Check if game is over (exit if true)
2. Execute move and get result
3. If board changed:
    - Add new random tile
    - Update board state
    - Add points to score
    - Check for win condition (2048 reached)
    - Check for game over condition

**Memoized**: Uses `useCallback` to prevent recreation on every render.

### Keyboard Event Handling

```tsx
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
```

**Purpose**: Listens for arrow key presses and triggers moves.

**How it works**:

1. Maps arrow keys to direction strings
2. Prevents default arrow key behavior (scrolling)
3. Calls `handleMove()` with the direction
4. Cleanup: Removes event listener when component unmounts

### `resetGame()`

```tsx
const resetGame = () => {
    setBoard(initializeBoard());
    setScore(0);
    setGameOver(false);
    setWon(false);
};
```

**Purpose**: Resets the game to initial state and clears saved progress.

**Actions**:

1. Clears localStorage (removes saved game)
2. Creates new board with two random tiles
3. Resets score to 0
4. Resets game over and won states

### `getTileColor()` and `getTileTextColor()`

```tsx
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
```

**Purpose**: Returns appropriate colors for each tile value using the website's theme colors.

**Color Scheme**:

- Low values (2, 4): Light indigo with dark text
- Mid values (8-512): Progressive indigo gradient
- High values (1024): Very dark indigo
- **2048**: Special pink color (secondary theme color)

**Implementation**: Uses inline styles with MUI `Paper` components via `sx` prop.

## UI Structure

### 1. ProjectLayout (Consistent Layout)

```tsx
<ProjectLayout
    title="2048"
    icon={<GameIcon />}
    maxWidth="sm"
    containerPadding={{ xs: 2, sm: 4 }}
>
```

**Features**:

- Uses shared `ProjectLayout` component for consistency
- Back button to navigate home (in AppBar)
- Game icon and title "2048" in AppBar
- No action buttons in AppBar (all controls on main page)
- Responsive container with sm maxWidth

### 2. Score and Controls

```tsx
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
```

**Features**:

- Score displayed prominently at top with h5 Typography
- Score value highlighted in primary color (indigo)
- New Game button with AddCircleOutline icon (not Refresh icon)
- Horizontal Stack layout with space-between
- Button calls `resetGame()` which clears localStorage and starts fresh

### 3. Game Board

```tsx
<Container maxWidth="sm" sx={{ py: { xs: 2, sm: 4 }, px: { xs: 0.5, sm: 3 } }}>
    <Paper elevation={3} sx={{ p: { xs: 0.5, sm: 3 }, bgcolor: 'grey.100' }}>
        <Box
            sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: { xs: 0.5, sm: 2 },
                bgcolor: 'grey.200',
            }}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
        >
            {board.map((row, i) =>
                row.map((cell, j) => (
                    <Paper
                        key={`${i}-${j}`}
                        sx={{
                            aspectRatio: '1',
                            bgcolor: cell > 0 ? getTileColor(cell) : 'grey.300',
                            color: getTileTextColor(cell),
                            fontSize: {
                                xs: cell >= 1000 ? '1rem' : '1.5rem',
                                sm: cell >= 1000 ? '2rem' : '3rem',
                            },
                        }}
                    >
                        {cell > 0 && cell}
                    </Paper>
                ))
            )}
        </Box>
    </Paper>
</Container>
```

**Structure**:

- Material-UI `Paper` components for each tile
- CSS Grid layout (4x4)
- Each tile shows its value (or empty if 0)
- Dynamic inline styles using `sx` prop based on tile value
- `aspectRatio: '1'` ensures square tiles
- Touch event handlers for mobile swipe gestures

**Responsive Features**:

- Smaller gaps and padding on mobile (xs)
- Responsive font sizes that scale with tile value
- Container padding adjusts for small screens

### 4. Win Dialog

```tsx
<Dialog open={won && !gameOver} onClose={() => setWon(false)} maxWidth="xs" fullWidth>
    <DialogTitle>You Win! 🎉</DialogTitle>
    <DialogContent>
        <Typography>You reached 2048!</Typography>
    </DialogContent>
    <DialogActions>
        <Button onClick={() => setWon(false)} variant="outlined">
            Continue Playing
        </Button>
        <Button onClick={resetGame} variant="contained">
            New Game
        </Button>
    </DialogActions>
</Dialog>
```

**Conditional**: Only shows when `won=true` and `gameOver=false`.

**Options**:

- **Continue Playing**: Dismiss dialog and keep playing for higher scores
- **New Game**: Reset game and clear saved progress

### 5. Game Over Dialog

```tsx
<Dialog open={gameOver} maxWidth="xs" fullWidth>
    <DialogTitle>Game Over!</DialogTitle>
    <DialogContent>
        <Typography>Final Score: {score}</Typography>
    </DialogContent>
    <DialogActions>
        <Button onClick={resetGame} variant="contained" fullWidth>
            Try Again
        </Button>
    </DialogActions>
</Dialog>
```

**Conditional**: Only shows when `gameOver=true`.

### 6. Instructions

```tsx
<Paper elevation={1} sx={{ mt: { xs: 2, sm: 3 }, p: { xs: 1.5, sm: 2 } }}>
    <Typography variant="body2" color="text.secondary">
        Use arrow keys or swipe to move tiles...
    </Typography>
    <Stack direction="row" spacing={1} flexWrap="wrap">
        <Chip icon={<ArrowUpward />} label="Up" />
        <Chip icon={<ArrowDownward />} label="Down" />
        <Chip icon={<ArrowBack />} label="Left" />
        <Chip icon={<ArrowForward />} label="Right" />
    </Stack>
</Paper>
```

Shows game instructions and keyboard controls using MUI components.

## Game Flow

```
1. Initialize board (2 random tiles) or load from localStorage
2. User presses arrow key or swipes
3. handleMove() called
4. move() calculates new board state
5. If valid move:
   - Add random tile
   - Update board
   - Update score
   - Save state to localStorage
   - Check win condition
   - Check game over condition
6. Re-render UI
7. Repeat from step 2
```

## Performance Considerations

1. **useCallback**: Prevents `handleMove` recreation on every render
2. **Board copying**: Always creates new board instead of mutating (immutability)
3. **Event cleanup**: Removes keyboard listener on unmount
4. **Conditional rendering**: Dialogs only render when needed
5. **localStorage throttling**: Saves only on state changes via useEffect
6. **Error handling**: Catches localStorage failures gracefully

## LocalStorage Persistence

**Storage Key**: `'game2048_state'`

**Saved Data**:

```json
{
    "board": [[2, 0, 0, 0], [0, 0, 4, 0], ...],
    "score": 128,
    "gameOver": false,
    "won": false
}
```

**Behavior**:

- **On Mount**: Loads saved game if available
- **On Update**: Auto-saves after every move
- **On New Game**: Clears saved data
- **On Error**: Falls back to new game if load fails

## Algorithm Complexity

| Function            | Time Complexity | Space Complexity           |
| ------------------- | --------------- | -------------------------- |
| `initializeBoard()` | O(n²)           | O(n²)                      |
| `addRandomTile()`   | O(n²)           | O(n²) for emptyCells array |
| `moveLeft()`        | O(n²)           | O(n²)                      |
| `rotateBoard()`     | O(n²)           | O(n²)                      |
| `isGameOver()`      | O(n²)           | O(1)                       |
| `loadGameState()`   | O(1)            | O(n²)                      |
| `saveGameState()`   | O(1)            | O(n²)                      |

Where n = GRID_SIZE (4 in this case)

## Mobile Optimizations

**Responsive Breakpoints**:

- **xs (< 600px)**: Ultra-compact layout
    - Minimal padding (0.5)
    - Smaller gaps (0.5)
    - Reduced font sizes (1rem - 1.5rem)
    - Icon-only refresh button
    - Hidden game icon
- **sm+ (≥ 600px)**: Full layout
    - Standard padding (2-3)
    - Normal gaps (2)
    - Full font sizes (2rem - 3rem)
    - Full "New Game" button

**Touch Gestures**:

- Swipe detection with minimum distance threshold (30px)
- Horizontal vs vertical detection
- Touch start/end event handling

## Future Enhancements

Potential improvements:

- Undo move feature
- Animations for tile movements and merges
- High score tracking
- Multiple grid sizes (3x3, 5x5, etc.)
- Sound effects
- Color themes
- Leaderboard
