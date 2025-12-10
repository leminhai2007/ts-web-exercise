# Sudoku Component Documentation

## Overview

The Sudoku component is a fully-featured implementation of the classic Sudoku puzzle game. It integrates with the [You Do Sudoku API](https://www.youdosudoku.com/) to generate puzzles and provides a complete gaming experience with validation, note-taking, difficulty levels, and local storage persistence.

## File Structure

### 1. `src/api/sudokuApi.ts`

The API layer responsible for communicating with the You Do Sudoku API.

**Key Functions:**

- **`generateSudoku(difficulty: DifficultyLevel): Promise<SudokuResponse>`**
    - Makes a POST request to the You Do Sudoku API
    - Uses proxy in development (`/api/sudoku/`) to bypass CORS
    - Uses direct URL in production (`https://www.youdosudoku.com/api/`)
    - Parameters: difficulty level (`'easy'`, `'medium'`, or `'hard'`)
    - Returns: An object containing the puzzle string, solution string, and difficulty
    - Handles API errors gracefully with try-catch and detailed logging

- **`parsePuzzle(puzzleString: string): number[][]`**
    - Converts a 81-character string into a 9x9 2D array
    - Each character represents a cell (0 for empty, 1-9 for filled)
    - Example: `"600780540..."` → `[[6,0,0,7,8,0,5,4,0], ...]`

- **`stringifyPuzzle(puzzle: number[][]): string`**
    - Converts a 9x9 2D array back to an 81-character string
    - Used for storage and comparison operations

**API Configuration:**

Development mode uses Vite proxy to avoid CORS issues:

```typescript
// vite.config.ts
server: {
  proxy: {
    '/api/sudoku': {
      target: 'https://www.youdosudoku.com',
      changeOrigin: true,
      rewrite: () => '/api/',
      secure: false,
      followRedirects: true,
    },
  },
}
```

**API Request Format:**

```typescript
{
  difficulty: "easy" | "medium" | "hard",
  solution: true,    // Always request solution
  array: false       // Get string format, not array
}
```

**API Response Format:**

```typescript
{
  difficulty: "medium",
  puzzle: "600780540000500300450036000...",
  solution: "613789542829541367457236918..."
}
```

### 2. `src/components/Sudoku.tsx`

The main game component managing all game logic and state.

#### State Management

**Game State:**

- `puzzle`: Original puzzle from API (immutable during gameplay)
- `userInput`: Current state with user's entries
- `solution`: Correct solution (hidden until "Give Up")
- `difficulty`: Selected difficulty level
- `notes`: Cell-level notes (Set<number> for each cell)
- `gameGivenUp`: Boolean flag for surrender state
- `invalidCells`: Set of cell keys with validation errors

**UI State:**

- `noteMode`: Toggle between number entry and note-taking
- `selectedCell`: Currently active cell for input
- `popoverAnchor`: Anchor element for number input popover
- `loading`: API request loading state
- `error`: General error messages
- `validationError`: Rule violation messages
- `confirmDialogOpen`: "Give Up" confirmation dialog
- `difficultyDialogOpen`: New game difficulty selection dialog

#### Local Storage

**Storage Key:** `'sudoku_state'`

**Saved Data:**

```typescript
{
  puzzle: number[][],
  userInput: number[][],
  solution: number[][],
  difficulty: DifficultyLevel,
  notes: { [key: string]: number[] },  // Sets converted to arrays
  gameGivenUp: boolean
}
```

**Storage Operations:**

- **Load:** On component mount, checks localStorage for saved game
- **Save:** Triggered by useEffect whenever game state changes
- **Clear:** When generating a new game
- **Notes Serialization:** Sets are converted to arrays for JSON compatibility

#### Core Features

**1. Number Entry Mode**

- Click a cell to open number input popover
- Popover appears below and to the right of selected cell (doesn't cover the cell)
- Click a number (1-9) to enter value
- Validates against Sudoku rules before entry
- Invalid cells are highlighted in red
- Shows error alert if move violates rules
- Input is blocked when validation errors exist
- Automatically clears notes when number is entered
- Popover closes after number entry in number mode

**2. Note Mode**

- Toggle between Number and Note modes using button with icons
- BorderColor icon for number mode, EditNote icon for note mode
- Click numbers in popover to toggle notes on/off
- Popover stays open in note mode for multiple selections
- Up to 9 notes per cell
- Notes displayed in 3x3 mini-grid within cell
- Enhanced mobile visibility: font-size 0.65rem (mobile), 0.75rem (desktop)
- Notes automatically cleared when real number entered

**3. Validation System**

The `isValidMove()` function checks three Sudoku rules and tracks conflicts:

```typescript
const isValidMove = (row: number, col: number, num: number): { valid: boolean; conflicts: string[] } => {
    const conflicts: string[] = [];

    // Rule 1: No duplicates in row
    for (let c = 0; c < 9; c++) {
        if (c !== col && userInput[row][c] === num) {
            conflicts.push(`${row}-${c}`);
        }
    }

    // Rule 2: No duplicates in column
    for (let r = 0; r < 9; r++) {
        if (r !== row && userInput[r][col] === num) {
            conflicts.push(`${r}-${col}`);
        }
    }

    // Rule 3: No duplicates in 3x3 box
    const boxRow = Math.floor(row / 3) * 3;
    const boxCol = Math.floor(col / 3) * 3;
    for (let r = boxRow; r < boxRow + 3; r++) {
        for (let c = boxCol; c < boxCol + 3; c++) {
            if ((r !== row || c !== col) && userInput[r][c] === num) {
                conflicts.push(`${r}-${c}`);
            }
        }
    }

    return { valid: conflicts.length === 0, conflicts };
};
```

**Conflict Tracking:**

- Returns both validation result and array of conflicting cell keys
- All conflicting cells are added to `invalidCells` Set
- Invalid cells receive red background and text styling
- User must dismiss error alert to clear invalid cells
- Input is blocked while invalid cells exist

**4. Give Up (Suicide) Feature**

- Confirmation dialog prevents accidental surrenders
- Sets `gameGivenUp` flag to true
- Displays solution by replacing `userInput` with `solution` in render
- Disables all input controls
- Preserves user's attempt (doesn't modify userInput state)
- Only "New Game" button remains active

**5. Difficulty Selection**

- Current difficulty displayed as a Chip (e.g., "Difficulty: Medium")
- Clicking "New Game" opens a dialog with three difficulty options
- Dialog prevents accidental difficulty changes during gameplay
- Three buttons: Easy, Medium, Hard with distinct colors
- Selected difficulty starts a new game immediately
- Difficulty saved in localStorage

**6. Game Completion Detection**

```typescript
const isSolved = (): boolean => {
    return userInput.every((row, r) => row.every((cell, c) => cell === solution[r][c]));
};
```

Checks if every cell matches the solution exactly.

#### UI Controls

**Top Bar:**

- Back button to home page
- Sudoku icon (hidden on mobile)
- Game status chip (Playing/Solved/Game Over)

**Control Panel:**

- Difficulty display chip (shows current difficulty)
- "New Game" button (opens difficulty selection dialog)
- "Give Up" button (disabled when game over)

**Number Input Popover:**

- Opens when clicking an editable cell
- Positioned below and to the right of selected cell (cell remains visible)
- Mode toggle at top (Number/Note icons)
- 3x3 grid with numbers 1-9
- Clear and Close buttons at bottom
- Fixed width (280px) prevents layout shifts
- Auto-closes after number entry in number mode
- Stays open in note mode for multiple note selections
- Disabled when game is over or validation errors exist
- Follows site color scheme (indigo primary)

**Alerts:**

- Error alert for API failures
- Info alert when solution displayed
- Success alert when puzzle solved
- Warning alert for validation errors (with Clear Invalid Numbers button)
- Dismissing validation alert clears all invalid cells

### 3. `src/components/SudokuBoard.tsx`

The visual representation of the Sudoku grid.

#### Props Interface

```typescript
interface SudokuBoardProps {
    puzzle: number[][]; // Original puzzle
    userInput: number[][]; // Current state
    notes: CellNote; // Notes for each cell
    selectedCell: { row: number; col: number } | null;
    onCellClick: (row: number, col: number, event: React.MouseEvent) => void;
    gameGivenUp: boolean; // Display solution flag
    invalidCells: Set<string>; // Set of cell keys with validation errors
}
```

#### Styling Logic

**Cell Background Colors:**

- **Invalid cell:** `#fee2e2` (light red) - takes precedence
- **Selected cell:** `#ddd6fe` (light indigo)
- **Same row/col/box:** `#f3f4f6` (light gray)
- **Default:** `#ffffff` (white)

**Cell Text Colors:**

- **Invalid cell:** `#dc2626` (red) - takes precedence
- **Pre-filled (puzzle):** `#1f2937` (dark gray, bold)
- **User input:** `#6366f1` (primary indigo)

**Border System:**

```typescript
// Thick borders every 3 cells (box boundaries)
borderRight: col % 3 === 2 && col !== 8
  ? '2px solid #6366f1'   // Thick indigo
  : '1px solid #e5e7eb',  // Thin gray

borderBottom: row % 3 === 2 && row !== 8
  ? '2px solid #6366f1'
  : '1px solid #e5e7eb'
```

**Cell Content Rendering:**

1. **Number Display:** Large, centered font
2. **Notes Display:** 3x3 mini-grid with small numbers
3. **Empty:** No content

```typescript
const renderCellContent = (row: number, col: number) => {
  const cellValue = userInput[row][col];

  // Show number if present
  if (cellValue !== 0) return <Box>{cellValue}</Box>;

  // Show notes if present
  const cellNotes = notes[`${row}-${col}`];
  if (cellNotes && cellNotes.size > 0) {
    return <3x3 grid with numbers>;
  }

  return null; // Empty cell
};
```

#### Responsive Design

**Mobile (xs):**

- Padding: 1 unit
- Font size: 1.25rem (numbers), 0.65rem (notes)
- Note grid: 0.1 gap, 0.25 padding
- Full width grid
- Popover width: 280px

**Desktop (sm+):**

- Padding: 2 units
- Font size: 1.5rem (numbers), 0.75rem (notes)
- Note grid: 0.25 gap, 0.5 padding
- Max width: 500px
- Popover width: 280px

**Grid Layout:**

- CSS Grid with 9 columns
- AspectRatio: 1 (perfect square)
- Responsive sizing maintains proportions
- Touch-friendly tap targets on mobile

#### Interaction States

**Hover Effect:**

- Pre-filled cells: No change
- Empty cells (not given up): Light indigo highlight
- Cursor changes to pointer only for editable cells

**Click Handler:**

- Prevents clicks on pre-filled cells
- Prevents clicks when game is over
- Triggers parent's `onCellClick` callback

## Color Scheme Integration

The Sudoku component follows the site-wide Material-UI theme:

**Primary Colors:**

- Main: `#6366f1` (Indigo 500)
- Dark: Darker indigo on hover
- Light: `#ddd6fe` (Indigo 200) for highlights

**Background:**

- Default: `#f8fafc` (Slate 50)
- Paper: `#ffffff` (White)
- Grey tones: `#f3f4f6`, `#e5e7eb`

**Status Colors:**

- Success: Green (puzzle solved)
- Error: Red (violations, give up)
- Info: Blue (game over notification)

## User Workflows

### Starting a New Game

1. Click "New Game" button
2. Difficulty selection dialog appears
3. Choose Easy, Medium, or Hard
4. API fetches puzzle and solution
5. Board initializes with puzzle
6. User can start playing immediately

### Playing the Game

1. Click an editable cell to open popover
2. Choose Number or Note mode from toggle
3. Click number to enter/toggle
4. Invalid moves are highlighted in red
5. Dismiss error alert to clear invalid cells
6. Click Clear to empty cell, Close to cancel
7. Progress auto-saved to localStorage
8. Selected cell remains visible while popover is open

### Completing the Game

1. Fill all cells correctly
2. Success message appears
3. Can generate new game

### Giving Up

1. Click "Give Up" button
2. Confirm in dialog
3. Solution appears on board
4. User's entries preserved but locked
5. Only "New Game" available

### Resuming a Game

1. Close browser / navigate away
2. Return to /sudoku
3. Game auto-loads from localStorage
4. Continue from exact state

## Technical Decisions

### Why Sets for Notes?

- Fast add/remove operations O(1)
- Natural toggle behavior
- Easy duplicate prevention
- Array conversion for storage

### Why Separate puzzle and userInput?

- Preserves original puzzle
- Enables "Give Up" feature
- Allows showing solution without losing user data
- Simplifies validation logic

### Why String Format from API?

- Smaller payload size
- Easier to store
- Standard Sudoku notation
- Convert to array for easier manipulation

### Why Local Storage?

- Persists across sessions
- No backend required
- Automatic state recovery
- Simple implementation

## Accessibility Considerations

- Keyboard navigation supported (click-based, could enhance)
- High contrast text colors
- Large tap targets on mobile
- Clear visual feedback
- Descriptive button labels
- Alert messages for screen readers

## Future Enhancements

Potential improvements:

1. Keyboard number entry (1-9 keys)
2. Undo/Redo functionality
3. Timer and statistics
4. Hint system
5. Multiple save slots
6. Dark mode support
7. Animation for completion
8. Highlighting conflicts in real-time
9. Tutorial mode
10. Custom puzzle input

## Browser Compatibility

- Modern browsers with ES6+ support
- LocalStorage API required
- Fetch API required
- Responsive design: Mobile and desktop
- PWA compatible

## CORS and Proxy Configuration

**Development:**
The application uses Vite's proxy feature to bypass CORS restrictions during local development. The proxy forwards requests from `/api/sudoku/` to `https://www.youdosudoku.com/api/`.

**Production:**
In production builds, the app makes direct requests to `https://www.youdosudoku.com/api/`. Note that CORS must be properly configured on the deployment server or the API must allow requests from your production domain.

**Configuration in `vite.config.ts`:**

```typescript
server: {
  proxy: {
    '/api/sudoku': {
      target: 'https://www.youdosudoku.com',
      changeOrigin: true,
      rewrite: () => '/api/',
      secure: false,
      followRedirects: true,
    },
  },
}
```

## Performance Notes

- Efficient re-renders with React hooks
- Minimal state updates
- No unnecessary API calls
- Optimized grid rendering
- Debounced localStorage writes (via useEffect)
- Console logging for debugging (removed in production builds)

---

**Created:** December 11, 2025  
**API Provider:** [You Do Sudoku](https://www.youdosudoku.com/)  
**Framework:** React + TypeScript + Material-UI
