# Game2048 Component Documentation

## Overview

The `Game2048` component implements the classic 2048 sliding puzzle game. Players combine numbered tiles to reach the 2048 tile. The game features keyboard controls, score tracking, win/lose detection, and the ability to restart.

## File Location

`src/components/Game2048.tsx`

## Game Rules

1. Use arrow keys to slide all tiles in one direction
2. When two tiles with the same number touch, they merge into one tile with double the value
3. After each move, a new tile (2 or 4) appears in a random empty spot
4. Goal: Create a tile with the value 2048
5. Game Over: No more moves available (board full and no adjacent matching tiles)

## Type Definitions

```tsx
type Board = number[][];
```

A 2D array representing the game board, where each number represents a tile's value (0 = empty).

## Constants

```tsx
const GRID_SIZE = 4;
```

Defines a 4x4 game board (16 tiles total).

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

## Component State

```tsx
const [board, setBoard] = useState<Board>(initializeBoard());
const [score, setScore] = useState(0);
const [gameOver, setGameOver] = useState(false);
const [won, setWon] = useState(false);
```

| State      | Type      | Purpose                             |
| ---------- | --------- | ----------------------------------- |
| `board`    | `Board`   | Current game board state            |
| `score`    | `number`  | Current score (sum of merged tiles) |
| `gameOver` | `boolean` | Whether game is over                |
| `won`      | `boolean` | Whether player reached 2048         |

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

**Purpose**: Resets the game to initial state.

### `getTileColor()` and `getTileTextColor()`

```tsx
const getTileColor = (value: number): string => {
    const colors: { [key: number]: string } = {
        2: '#eee4da',
        4: '#ede0c8',
        8: '#f2b179',
        // ... more colors
    };
    return colors[value] || '#cdc1b4';
};

const getTileTextColor = (value: number): string => {
    return value <= 4 ? '#776e65' : '#f9f6f2';
};
```

**Purpose**: Returns appropriate colors for each tile value dynamically using Material-UI's `sx` prop.

**Implementation**: Uses inline styles with MUI `Paper` components instead of CSS classes.

## UI Structure

### 1. Game Header

```tsx
<div className="game-header">
    <Link to="/" className="back-button">
        ← Back to Home
    </Link>
    <h1>2048</h1>
    <div className="score-container">
        <div className="score">Score: {score}</div>
        <button onClick={resetGame}>New Game</button>
    </div>
</div>
```

Contains:

- Back navigation button
- Game title
- Current score display
- New Game button

### 2. Win Overlay

```tsx
{
    won && !gameOver && (
        <div className="message-overlay win">
            <div className="message-box">
                <h2>You Win! 🎉</h2>
                <p>You reached 2048!</p>
                <button onClick={() => setWon(false)}>Continue Playing</button>
                <button onClick={resetGame}>New Game</button>
            </div>
        </div>
    );
}
```

**Conditional**: Only shows when `won=true` and `gameOver=false`.

Options:

- Continue playing (keep going for higher scores)
- Start new game

### 3. Game Over Overlay

```tsx
{
    gameOver && (
        <div className="message-overlay game-over">
            <div className="message-box">
                <h2>Game Over!</h2>
                <p>Final Score: {score}</p>
                <button onClick={resetGame}>Try Again</button>
            </div>
        </div>
    );
}
```

**Conditional**: Only shows when `gameOver=true`.

### 4. Game Board

```tsx
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
```

**Structure**:

- Material-UI `Paper` components for each tile
- Nested map: Outer for rows, inner for cells
- Each tile shows its value (or empty if 0)
- Dynamic inline styles using `sx` prop based on tile value
- `aspectRatio: '1'` ensures square tiles

### 5. Instructions

```tsx
<Paper elevation={1} sx={{ mt: 3, p: 2, borderRadius: 2 }}>
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
1. Initialize board (2 random tiles)
2. User presses arrow key
3. handleMove() called
4. move() calculates new board state
5. If valid move:
   - Add random tile
   - Update board
   - Update score
   - Check win condition
   - Check game over condition
6. Re-render UI
7. Repeat from step 2
```

## Performance Considerations

1. **useCallback**: Prevents `handleMove` recreation on every render
2. **Board copying**: Always creates new board instead of mutating (immutability)
3. **Event cleanup**: Removes keyboard listener on unmount
4. **Conditional rendering**: Overlays only render when needed

## Algorithm Complexity

| Function            | Time Complexity | Space Complexity           |
| ------------------- | --------------- | -------------------------- |
| `initializeBoard()` | O(n²)           | O(n²)                      |
| `addRandomTile()`   | O(n²)           | O(n²) for emptyCells array |
| `moveLeft()`        | O(n²)           | O(n²)                      |
| `rotateBoard()`     | O(n²)           | O(n²)                      |
| `isGameOver()`      | O(n²)           | O(1)                       |

Where n = GRID_SIZE (4 in this case)

## Future Enhancements

Potential improvements:

- Undo move feature
- Save game state to localStorage
- Animations for tile movements and merges
- Touch/swipe controls for mobile
- High score tracking
- Multiple grid sizes (3x3, 5x5, etc.)
- Sound effects
- Color themes
- Leaderboard
