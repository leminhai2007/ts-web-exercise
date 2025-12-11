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

**7. Remaining Number Counter**

The `getRemainingNumbers()` function calculates how many times each number (1-9) can still be placed on the board:

```typescript
const getRemainingNumbers = (): Map<number, number> => {
    const counts = new Map<number, number>();

    // Initialize all numbers 1-9 with count 0
    for (let i = 1; i <= 9; i++) {
        counts.set(i, 0);
    }

    // Count occurrences of each number in userInput
    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            const num = userInput[row][col];
            if (num !== 0) {
                counts.set(num, (counts.get(num) || 0) + 1);
            }
        }
    }

    // Calculate remaining (9 - count)
    const remaining = new Map<number, number>();
    for (let i = 1; i <= 9; i++) {
        remaining.set(i, 9 - (counts.get(i) || 0));
    }

    return remaining;
};
```

**Usage in Number Input:**

- Each number 1-9 appears exactly 9 times in a complete Sudoku puzzle
- Badge shows remaining slots: `9 - current count`
- When remaining reaches 0, the number button is disabled in number mode
- Helps users identify which numbers still need placement
- Updates in real-time as numbers are entered or cleared

**8. Reset Game Feature**

The `handleResetGame()` function allows users to restart their current puzzle without generating a new one:

```typescript
const handleResetGame = () => {
    // Reset userInput to original puzzle state
    setUserInput(JSON.parse(JSON.stringify(puzzle)));
    setNotes({});
    setGameGivenUp(false);
    setSelectedCell(null);
    setNoteMode(false);
    setValidationError(null);
    setInvalidCells(new Set());
    setPopoverAnchor(null);
};
```

**Reset Behavior:**

- Restores the board to the original puzzle state (clears all user entries)
- Clears all notes
- Clears any validation errors and invalid cell markers
- Resets UI state (selected cell, popover, note mode)
- Keeps the same puzzle and solution (doesn't call API)
- Useful when user has made too many mistakes and wants to start over
- Disabled when game is over or loading

#### UI Controls

**Top Bar:**

- Back button to home page
- Sudoku icon (hidden on mobile)
- Title: "Sudoku Game"
- Difficulty chip (shows current difficulty level: Easy/Medium/Hard)

**Control Panel:**

- **Action buttons grouped horizontally:**
    - "New Game" button (opens difficulty selection dialog)
    - "Reset" button (restarts current puzzle without generating a new one)
    - "Give Up" button (disabled when game over)
- **Mobile optimization:** Buttons display icon-only on mobile (xs), icon + text on desktop (sm+)
- **Button colors:** Primary (blue) for New Game, Warning (orange) for Reset, Error (red) for Give Up
- Mode toggle (Number/Note) with icons**Number Input Popover:**

- Opens when clicking an editable cell
- Positioned below and to the right of selected cell (cell remains visible)
- Mode toggle at top (Number/Note icons)
- 3x3 grid with numbers 1-9
- **Badge showing remaining count:** Each number button displays a small colored badge in top-right corner
    - Badge shows how many more times that number can be placed (0-9)
    - Color-coded: Blue (>3 remaining), Orange (1-3 remaining), Red (0 remaining)
    - Numbers with 0 remaining are disabled in number mode (still active in note mode)
    - Badge size: 20px × 20px with 0.75rem font
    - Positioned 3px from top-right corner of button
    - Updates automatically when user enters or clears numbers
- **Number button sizes:** 1.5rem font size for better readability
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
- **Control buttons: Icon-only display** (New Game, Reset, Give Up show only icons)
- **Buttons grouped horizontally** to save vertical space
- Compact padding (1.5) for action buttons

**Desktop (sm+):**

- Padding: 2 units
- Font size: 1.5rem (numbers), 0.75rem (notes)
- Note grid: 0.25 gap, 0.5 padding
- Max width: 500px
- Popover width: 280px
- **Control buttons: Icon + text display**
- Normal padding (2) for action buttons

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
3. **View remaining count badges** for each number (1-9) in top-right corner of buttons
4. Click number to enter/toggle
    - In number mode: Disabled numbers (with 0 remaining) cannot be selected
    - In note mode: All numbers remain active for note-taking
5. Invalid moves are highlighted in red
6. Dismiss error alert to clear invalid cells
7. Click Clear to empty cell, Close to cancel
8. **Click Reset** to restart the current puzzle if you've made too many mistakes
9. Progress auto-saved to localStorage
10. Selected cell remains visible while popover is open
11. **Badge counts update automatically** as you fill in numbers

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

### Resetting a Game

1. Click "Reset" button (orange)
2. Board immediately clears all user entries
3. Returns to original puzzle state
4. All notes are cleared
5. Validation errors are cleared
6. Can continue playing the same puzzle
7. No confirmation dialog (instant reset)

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
8. ~~Highlighting conflicts in real-time~~ ✓ Implemented
9. Tutorial mode
10. Custom puzzle input
11. ~~Visual indicator for remaining numbers~~ ✓ Implemented (badge counter)

## Browser Compatibility

- Modern browsers with ES6+ support
- LocalStorage API required
- Fetch API required
- Responsive design: Mobile and desktop
- PWA compatible

## CORS and Proxy Configuration

### Overview

The [You Do Sudoku API](https://www.youdosudoku.com/api/) does not support CORS (Cross-Origin Resource Sharing) for browser requests. To work around this limitation, the application uses a backend proxy approach that works seamlessly in both development and production environments.

### Architecture

**Current Implementation: Monorepo with Backend/Frontend**

The project uses a unified structure where:

- **Frontend:** React + Vite application in `src/`
- **Backend:** Express server (dev) and Vercel serverless functions (production)
- **Single deployment:** Both parts deploy together to Vercel

### Development Environment

**Express Proxy Server + Vite:**
During local development, we run both an Express server (for API proxy) and Vite (for the frontend) concurrently.

**Start development:**

```bash
yarn dev
```

This runs:

1. **Express Server** (`server.js`) on port 3000 - proxies API requests
2. **Vite** on port 5173 - serves the React app

**File:** `server.js`

```javascript
import express from 'express';
import cors from 'cors';

const app = express();

app.use(cors());
app.use(express.json());

app.post('/api/youdosudoku', async (req, res) => {
    try {
        const response = await fetch('https://www.youdosudoku.com/api/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(req.body),
        });

        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Sudoku API proxy error:', error);
        res.status(500).json({
            error: 'Failed to fetch sudoku puzzle',
            details: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

app.listen(3000, () => {
    console.log('Proxy server running on http://localhost:3000');
});
```

**Configuration in `vite.config.ts`:**

```typescript
server: {
  // Proxy API requests to Express server in development
  proxy: {
    '/api': {
      target: 'http://localhost:3000',
      changeOrigin: true,
    },
  },
}
```

**How it works:**

1. Frontend makes request to `/api/youdosudoku`
2. Vite proxy forwards to Express server at `localhost:3000`
3. Express server makes request to You Do Sudoku API
4. Response is returned to frontend
5. No CORS issues - server-to-server communication

### Production Environment

**Serverless Function Proxy:**
When deployed to Vercel, serverless functions in the `api/` folder automatically handle backend requests.

**File:** `api/youdosudoku.ts`

```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Set CORS headers for all requests
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle OPTIONS preflight request
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const response = await fetch('https://www.youdosudoku.com/api/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(req.body),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API request failed with status ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        return res.status(200).json(data);
    } catch (error) {
        console.error('Sudoku API proxy error:', error);
        return res.status(500).json({
            error: 'Failed to fetch sudoku puzzle',
            details: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}
```

**Vercel Configuration:** `vercel.json`

```json
{
    "rewrites": [
        {
            "source": "/api/youdosudoku",
            "destination": "/api/youdosudoku.ts"
        }
    ]
}
```

**How it works:**

1. Frontend makes request to `/api/youdosudoku`
2. Vercel routes request to serverless function via `vercel.json`
3. Serverless function makes request to You Do Sudoku API
4. Function adds CORS headers to response
5. Frontend receives data without CORS errors

**Deployment:**

- Push to GitHub
- Vercel auto-deploys both frontend and serverless functions
- No additional configuration needed

### API Client Configuration

**File:** `src/api/sudokuApi.ts`

```typescript
// Use same endpoint in both development and production
const apiUrl = '/api/youdosudoku';
```

**Consistent Behavior:**

- Both environments use the same endpoint `/api/youdosudoku`
- Development: Vite proxy → Express server → external API
- Production: Vercel routes → serverless function → external API
- No environment-specific code needed
- Easier to test production behavior locally

### Why This Architecture?

**Benefits:**

1. **No CORS Issues:** Server-side requests bypass browser CORS restrictions
2. **Unified Deployment:** Single repository, single deployment
3. **Environment Parity:** Same endpoint works in dev and production
4. **Security:** API keys/secrets can be hidden in backend
5. **Flexibility:** Easy to add caching, rate limiting, or data transformation

**Trade-offs:**

- Extra backend layer adds slight latency
- Serverless cold starts in production (usually <1s)
- Need to maintain both Express server and serverless function

### File Structure

```
ts-web-exercise/
├── api/                    # Backend serverless functions (production)
│   └── youdosudoku.ts     # Sudoku API proxy
├── src/                    # Frontend React application
│   ├── api/
│   │   └── sudokuApi.ts   # Client-side API wrapper
│   └── components/
│       └── Sudoku.tsx     # Sudoku game component
├── server.js              # Development proxy server (Express)
├── vite.config.ts         # Vite with proxy configuration
├── vercel.json            # Vercel routing configuration
└── package.json           # Scripts and dependencies
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
