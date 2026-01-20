/**
 * Sudoku Component
 *
 * A fully-featured implementation of the classic Sudoku puzzle game with API integration.
 *
 * OVERVIEW:
 * Integrates with the You Do Sudoku API (https://www.youdosudoku.com/) to generate puzzles.
 * Provides complete gaming experience with validation, note-taking, difficulty levels, and
 * save/load functionality.
 *
 * KEY FEATURES:
 * 1. Puzzle Generation: Three difficulty levels (Easy, Medium, Hard) via API
 * 2. Number Entry Mode: Click cells to enter numbers with validation
 * 3. Note Mode: Toggle to take notes in cells (up to 9 notes per cell)
 * 4. Validation System: Real-time rule checking with conflict highlighting
 * 5. Save/Load: Save game progress including notes and cell values
 * 6. Give Up: Display solution when stuck
 * 7. Reset: Restart current puzzle without generating new one
 * 8. Remaining Counter: Badge shows how many times each number can still be placed
 *
 * RECENT UPDATES:
 * - Layout uses ProjectLayout component for consistency
 * - Difficulty chip moved from AppBar to main page
 * - Note Mode toggle on same line as difficulty chip
 * - Button reorganization: New Game, Give Up (row 1); Reset, Save, Load (row 2)
 * - New Game icon changed to AddCircleOutline
 * - Loading dialog with spinning animation
 * - All controls disabled during puzzle generation
 * - Save/Load with custom names and timestamps
 * - Starting State auto-created and protected
 * - Saves cleared on completion/give up/new game
 * - Notes properly saved and restored (Set<number> ↔ arrays conversion)
 * - Saved games persist in localStorage (survive browser reload)
 * - Auto-generated default save names with timestamp format
 *
 * FILE STRUCTURE:
 * 1. src/api/sudokuApi.ts: API communication layer
 *    - generateSudoku(): POST request to You Do Sudoku API
 *    - parsePuzzle(): Converts 81-char string to 9x9 array
 *    - stringifyPuzzle(): Converts 9x9 array to string
 *
 * 2. src/components/Sudoku.tsx: Main game component
 *    - State management for puzzle, userInput, solution, notes
 *    - Game logic: validation, note-taking, save/load
 *    - UI controls and dialogs
 *
 * 3. src/components/SudokuBoard.tsx: Visual grid component
 *    - 9x9 grid rendering with borders
 *    - Cell styling (colors, backgrounds, borders)
 *    - Notes display in 3x3 mini-grid
 *    - Click handlers for cell selection
 *
 * STATE MANAGEMENT:
 * Game State:
 * - puzzle: Original puzzle from API (immutable during gameplay)
 * - userInput: Current state with user's entries
 * - solution: Correct solution (hidden until "Give Up")
 * - difficulty: Selected difficulty level
 * - notes: Cell-level notes (Set<number> for each cell)
 * - gameGivenUp: Boolean flag for surrender state
 * - invalidCells: Set of cell keys with validation errors
 *
 * UI State:
 * - noteMode: Toggle between number entry and note-taking
 * - selectedCell: Currently active cell for input
 * - popoverAnchor: Anchor element for number input popover
 * - loading: API request loading state
 * - error: General error messages
 * - validationError: Rule violation messages
 * - confirmDialogOpen: "Give Up" confirmation
 * - difficultyDialogOpen: New game difficulty selection
 *
 * CORE FEATURES:
 *
 * 1. Number Entry Mode
 * - Click cell to open number input popover
 * - Popover positioned below and right of cell (cell visible)
 * - Click number (1-9) to enter value
 * - Validates against Sudoku rules before entry
 * - Invalid cells highlighted in red
 * - Shows error alert if move violates rules
 * - Input blocked when validation errors exist
 * - Automatically clears notes when number entered
 * - Popover closes after entry in number mode
 *
 * 2. Note Mode
 * - Toggle between Number and Note modes
 * - BorderColor icon for number mode, EditNote icon for note mode
 * - Click numbers to toggle notes on/off
 * - Popover stays open for multiple selections
 * - Up to 9 notes per cell
 * - Notes in 3x3 mini-grid within cell
 * - Enhanced mobile visibility: 0.65rem (mobile), 0.75rem (desktop)
 * - Notes cleared when real number entered
 *
 * 3. Validation System
 * isValidMove() checks three Sudoku rules:
 * - No duplicates in row
 * - No duplicates in column
 * - No duplicates in 3x3 box
 * Returns: { valid: boolean, conflicts: string[] }
 * All conflicting cells added to invalidCells Set
 * Invalid cells receive red background and text
 * User must dismiss alert to clear invalid cells
 * Input blocked while invalid cells exist
 *
 * 4. Give Up (Suicide) Feature
 * - Confirmation dialog prevents accidents
 * - Sets gameGivenUp flag
 * - Displays solution by replacing userInput with solution in render
 * - Disables all input controls
 * - Preserves user's attempt (doesn't modify userInput state)
 * - Only "New Game" button remains active
 *
 * 5. Difficulty Selection
 * - Current difficulty displayed as Chip
 * - "New Game" opens dialog with three options
 * - Dialog prevents accidental changes during gameplay
 * - Three buttons: Easy, Medium, Hard with distinct colors
 * - Selected difficulty starts new game immediately
 * - Difficulty saved in localStorage
 *
 * 6. Game Completion Detection
 * isSolved(): Checks if every cell matches solution exactly
 *
 * 7. Remaining Number Counter
 * getRemainingNumbers(): Calculates how many times each number (1-9) can still be placed
 * - Each number appears exactly 9 times in complete puzzle
 * - Badge shows remaining slots: 9 - current count
 * - When remaining reaches 0, button disabled in number mode
 * - Updates real-time as numbers entered/cleared
 * - Helps identify which numbers still need placement
 *
 * 8. Reset Game Feature
 * handleResetGame(): Restarts current puzzle without generating new one
 * - Restores board to original puzzle state
 * - Clears all notes and validation errors
 * - Resets UI state (selected cell, popover, note mode)
 * - Keeps same puzzle and solution (doesn't call API)
 * - Useful when too many mistakes made
 * - Disabled when game over or loading
 *
 * 9. Save/Load Feature
 * SaveGame interface: { id, name, userInput, notes: { [key: string]: number[] }, timestamp }
 *
 * Save Dialog:
 * - Save button opens dialog with auto-generated default name
 * - Default name format: "Save YYYY-MM-DD HH:MM:SS" (e.g., "Save 2026-01-20 14:35:42")
 * - User can accept default or customize the name
 * - Press Enter or click Save to confirm
 *
 * Load Dialog:
 * - Load button shows list of all saved games
 * - Displays save name and timestamp for each
 * - Load icon button: Restores that saved state
 * - Delete icon button: Removes the save (except Starting State)
 *
 * Starting State:
 * - Auto-created when new game starts
 * - Always available as fallback
 * - Protected from deletion (id: 'starting_state')
 *
 * Persistence:
 * - Saved games stored in localStorage key: 'sudoku_saved_games'
 * - Main game state stored in localStorage key: 'sudoku_state'
 * - Both survive browser reload/close
 * - Loaded automatically on component mount
 * - Auto-saved whenever changes occur
 *
 * Data Handling:
 * - Notes properly saved: Set<number> → arrays for JSON serialization
 * - Notes properly loaded: arrays → Set<number> for component use
 * - Includes both user input numbers AND notes in saved state
 * - Deep cloning ensures state isolation
 *
 * Lifecycle:
 * - Saves persist across sessions
 * - Cleared only when: puzzle completed, user gives up, or new game started
 * - Saved games list resets to [Starting State] on new game
 *
 * LOCALSTORAGE:
 * Two storage keys used:
 *
 * 1. 'sudoku_state' - Main game state
 *    Saved Data: { puzzle, userInput, solution, difficulty, notes, gameGivenUp }
 *    - Load: On mount, checks localStorage
 *    - Save: Triggered by useEffect on state changes
 *    - Clear: When generating new game
 *    - Notes Serialization: Sets converted to arrays for JSON
 *
 * 2. 'sudoku_saved_games' - Saved game slots
 *    Saved Data: Array of SaveGame objects
 *    - Each SaveGame: { id, name, userInput, notes (as arrays), timestamp }
 *    - Load: On mount, restores saved games list
 *    - Save: Triggered by useEffect when savedGames changes
 *    - Persists across browser sessions
 *    - User can have multiple save slots per puzzle
 *
 * UI CONTROLS:
 * Top Bar:
 * - Back button to home
 * - Sudoku icon (hidden on mobile)
 * - Title: "Sudoku Game"
 * - Difficulty chip with current level
 *
 * Control Panel:
 * - Action buttons grouped horizontally:
 *   - New Game (opens difficulty dialog)
 *   - Reset (restarts current puzzle)
 *   - Give Up (disabled when game over)
 * - Mobile: Icon-only on xs, icon+text on sm+
 * - Button colors: Primary (New Game), Warning (Reset), Error (Give Up)
 * - Mode toggle (Number/Note) with icons
 *
 * Number Input Popover:
 * - Opens on cell click
 * - Positioned below and right of cell
 * - Mode toggle at top
 * - 3x3 grid with numbers 1-9
 * - Badge showing remaining count:
 *   - Blue (>3 remaining)
 *   - Orange (1-3 remaining)
 *   - Red (0 remaining)
 *   - 20px × 20px with 0.75rem font
 *   - Position: 3px from top-right corner
 *   - Numbers with 0 remaining disabled in number mode
 *   - Updates automatically
 * - Button sizes: 1.5rem font
 * - Clear and Close buttons at bottom
 * - Fixed width (280px) prevents layout shifts
 * - Auto-closes after entry in number mode
 * - Stays open in note mode
 * - Disabled when game over or validation errors
 * - Indigo primary color scheme
 *
 * Alerts:
 * - Error: API failures
 * - Info: Solution displayed
 * - Success: Puzzle solved
 * - Warning: Validation errors (with Clear button)
 * - Dismissing validation alert clears invalid cells
 *
 * SUDOKU BOARD COMPONENT:
 * Props: puzzle, userInput, notes, selectedCell, onCellClick, gameGivenUp, invalidCells
 *
 * Cell Styling:
 * Background Colors:
 * - Invalid: #fee2e2 (light red) - priority
 * - Selected: #ddd6fe (light indigo)
 * - Same row/col/box: #f3f4f6 (light gray)
 * - Default: #ffffff (white)
 *
 * Text Colors:
 * - Invalid: #dc2626 (red) - priority
 * - Pre-filled: #1f2937 (dark gray, bold)
 * - User input: #6366f1 (primary indigo)
 *
 * Border System:
 * - Thick borders every 3 cells (box boundaries)
 * - 2px solid indigo for box edges
 * - 1px solid gray for cell edges
 *
 * Cell Content:
 * 1. Number Display: Large, centered font
 * 2. Notes Display: 3x3 mini-grid with small numbers
 * 3. Empty: No content
 *
 * Responsive Design:
 * Mobile (xs):
 * - Padding: 1, Font: 1.25rem (numbers), 0.65rem (notes)
 * - Note grid: 0.1 gap, 0.25 padding
 * - Full width grid
 * - Icon-only control buttons
 * - Horizontal button grouping
 * - Compact padding (1.5)
 *
 * Desktop (sm+):
 * - Padding: 2, Font: 1.5rem (numbers), 0.75rem (notes)
 * - Note grid: 0.25 gap, 0.5 padding
 * - Max width: 500px
 * - Icon+text control buttons
 * - Normal padding (2)
 *
 * Grid Layout:
 * - CSS Grid with 9 columns
 * - AspectRatio: 1 (perfect square)
 * - Responsive sizing maintains proportions
 * - Touch-friendly tap targets on mobile
 *
 * Interaction States:
 * Hover:
 * - Pre-filled: No change
 * - Empty (not given up): Light indigo highlight
 * - Cursor: pointer only for editable cells
 *
 * Click:
 * - Prevents clicks on pre-filled cells
 * - Prevents clicks when game over
 * - Triggers parent's onCellClick callback
 *
 * COLOR SCHEME:
 * Follows Material-UI theme:
 * Primary: #6366f1 (Indigo 500)
 * Background: #f8fafc (Slate 50), #ffffff (White)
 * Grey tones: #f3f4f6, #e5e7eb
 * Success: Green, Error: Red, Info: Blue
 *
 * CORS AND PROXY:
 * Development (Express + Vite):
 * - server.js: Express proxy on port 3000
 * - vite.config.ts: Proxy /api to localhost:3000
 * - Frontend makes request to /api/youdosudoku
 * - Vite forwards to Express
 * - Express makes request to You Do Sudoku API
 * - No CORS issues (server-to-server)
 *
 * Production (Vercel):
 * - api/youdosudoku.ts: Serverless function
 * - vercel.json: Routes /api/youdosudoku to function
 * - Function adds CORS headers
 * - Function makes request to external API
 * - Frontend receives data without CORS errors
 *
 * API Client (src/api/sudokuApi.ts):
 * - Uses same endpoint in both environments: /api/youdosudoku
 * - No environment-specific code needed
 * - Development: Vite proxy → Express → API
 * - Production: Vercel routes → serverless → API
 *
 * TECHNICAL DECISIONS:
 * - Sets for Notes: Fast O(1) add/remove, natural toggle, easy deduplication
 * - Separate puzzle/userInput: Preserves original, enables "Give Up", allows solution display
 * - String Format from API: Smaller payload, easier storage, standard notation
 * - Local Storage: Persists across sessions, no backend needed, auto state recovery
 *
 * ACCESSIBILITY:
 * - Keyboard navigation supported (click-based, could enhance)
 * - High contrast text colors
 * - Large tap targets on mobile
 * - Clear visual feedback
 * - Descriptive button labels
 * - Alert messages for screen readers
 * - Material-UI built-in accessibility features
 *
 * BROWSER COMPATIBILITY:
 * Requires:
 * - Modern browsers with ES6+ support
 * - LocalStorage API
 * - Fetch API
 * - Responsive design: Mobile and desktop
 * - PWA compatible
 */

import { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Stack,
    Chip,
    ToggleButton,
    ToggleButtonGroup,
    Alert,
    Popover,
    ButtonGroup,
    TextField,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    IconButton,
} from '@mui/material';
import {
    GridOn as SudokuIcon,
    Refresh as RefreshIcon,
    AddCircleOutline as NewGameIcon,
    Flag as SuicideIcon,
    EditNote as NoteIcon,
    BorderColor as NumberIcon,
    RestartAlt as ResetIcon,
    Save as SaveIcon,
    FolderOpen as LoadIcon,
    Delete as DeleteIcon,
} from '@mui/icons-material';
import { ProjectLayout } from './ProjectLayout';
import { generateSudoku, parsePuzzle } from '../api/sudokuApi';
import type { DifficultyLevel } from '../api/sudokuApi';
import { SudokuBoard } from './SudokuBoard';

interface CellNote {
    [key: string]: Set<number>; // key format: "row-col"
}

interface SaveGame {
    id: string;
    name: string;
    userInput: number[][];
    notes: CellNote;
    timestamp: number;
}

interface GameState {
    puzzle: number[][];
    userInput: number[][];
    solution: number[][];
    difficulty: DifficultyLevel;
    notes: CellNote;
    gameGivenUp: boolean;
}

const STORAGE_KEY = 'sudoku_state';

const loadGameState = (): GameState | null => {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            // Convert notes arrays back to Sets
            const notes: CellNote = {};
            Object.keys(parsed.notes || {}).forEach(key => {
                notes[key] = new Set(parsed.notes[key]);
            });
            return { ...parsed, notes };
        }
    } catch (error) {
        console.error('Failed to load game state:', error);
    }
    return null;
};

const saveGameState = (state: GameState): void => {
    try {
        // Convert notes Sets to arrays for JSON serialization
        const notesForStorage: { [key: string]: number[] } = {};
        Object.keys(state.notes).forEach(key => {
            notesForStorage[key] = Array.from(state.notes[key]);
        });
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({
                ...state,
                notes: notesForStorage,
            })
        );
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

export const Sudoku = () => {
    const [puzzle, setPuzzle] = useState<number[][]>([]);
    const [userInput, setUserInput] = useState<number[][]>([]);
    const [solution, setSolution] = useState<number[][]>([]);
    const [difficulty, setDifficulty] = useState<DifficultyLevel>('easy');
    const [notes, setNotes] = useState<CellNote>({});
    const [gameGivenUp, setGameGivenUp] = useState(false);
    const [noteMode, setNoteMode] = useState(false);
    const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [validationError, setValidationError] = useState<string | null>(null);
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
    const [initialized, setInitialized] = useState(false);
    const [popoverAnchor, setPopoverAnchor] = useState<HTMLElement | null>(null);
    const [invalidCells, setInvalidCells] = useState<Set<string>>(new Set());
    const [newGameDialogOpen, setNewGameDialogOpen] = useState(false);
    const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel>('easy');
    const [savedGames, setSavedGames] = useState<SaveGame[]>([]);
    const [saveDialogOpen, setSaveDialogOpen] = useState(false);
    const [loadDialogOpen, setLoadDialogOpen] = useState(false);
    const [saveName, setSaveName] = useState('');

    const generateNewGame = async (selectedDifficulty: DifficultyLevel) => {
        setLoading(true);
        setError(null);
        try {
            console.log('Generating new game with difficulty:', selectedDifficulty);
            const response = await generateSudoku(selectedDifficulty);
            console.log('Parsing puzzle and solution...');
            const parsedPuzzle = parsePuzzle(response.puzzle);
            const parsedSolution = parsePuzzle(response.solution);

            console.log('Setting game state...');
            setPuzzle(parsedPuzzle);
            const initialInput = JSON.parse(JSON.stringify(parsedPuzzle));
            setUserInput(initialInput);
            setSolution(parsedSolution);
            setDifficulty(selectedDifficulty);
            setNotes({});
            setGameGivenUp(false);
            setSelectedCell(null);
            setNoteMode(false);

            // Clear all saves and create starting state
            const startingSave: SaveGame = {
                id: 'starting_state',
                name: 'Starting State',
                userInput: initialInput,
                notes: {},
                timestamp: Date.now(),
            };
            setSavedGames([startingSave]);

            console.log('Game generated successfully');
        } catch (err) {
            console.error('Error in generateNewGame:', err);
            const errorMessage = err instanceof Error ? err.message : 'Failed to generate puzzle';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // Load saved game on mount
    useEffect(() => {
        const initGame = async () => {
            try {
                console.log('Initializing Sudoku game...');
                const saved = loadGameState();
                if (saved && saved.puzzle && saved.puzzle.length === 9) {
                    console.log('Loading saved game');
                    setPuzzle(saved.puzzle);
                    setUserInput(saved.userInput);
                    setSolution(saved.solution);
                    setDifficulty(saved.difficulty);
                    setNotes(saved.notes);
                    setGameGivenUp(saved.gameGivenUp);
                } else {
                    console.log('Generating new game');
                    // Generate initial game
                    await generateNewGame('easy');
                }
            } catch (err) {
                console.error('Failed to initialize game:', err);
                setError('Failed to initialize game. Please try again.');
            } finally {
                setInitialized(true);
            }
        };

        initGame();
    }, []);

    // Save game state whenever it changes
    useEffect(() => {
        if (puzzle.length > 0 && initialized) {
            saveGameState({
                puzzle,
                userInput,
                solution,
                difficulty,
                notes,
                gameGivenUp,
            });
        }
    }, [puzzle, userInput, solution, difficulty, notes, gameGivenUp, initialized]);

    const handleNewGame = () => {
        setSelectedDifficulty(difficulty);
        setNewGameDialogOpen(true);
    };

    const handleConfirmNewGame = () => {
        clearGameState();
        setNewGameDialogOpen(false);
        generateNewGame(selectedDifficulty);
    };

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

    const handleCellClick = (row: number, col: number, event: React.MouseEvent<HTMLElement>) => {
        if (gameGivenUp) return;
        if (puzzle[row][col] !== 0) return; // Can't select pre-filled cells
        if (invalidCells.size > 0) return; // Can't select cells when there are validation errors

        setSelectedCell({ row, col });
        setPopoverAnchor(event.currentTarget);
    };

    const isValidMove = (row: number, col: number, num: number): { valid: boolean; conflicts: string[] } => {
        const conflicts: string[] = [];

        // Check row
        for (let c = 0; c < 9; c++) {
            if (c !== col && userInput[row][c] === num) {
                conflicts.push(`${row}-${c}`);
            }
        }

        // Check column
        for (let r = 0; r < 9; r++) {
            if (r !== row && userInput[r][col] === num) {
                conflicts.push(`${r}-${col}`);
            }
        }

        // Check 3x3 box
        const boxRow = Math.floor(row / 3) * 3;
        const boxCol = Math.floor(col / 3) * 3;
        for (let r = boxRow; r < boxRow + 3; r++) {
            for (let c = boxCol; c < boxCol + 3; c++) {
                if ((r !== row || c !== col) && userInput[r][c] === num) {
                    const key = `${r}-${c}`;
                    if (!conflicts.includes(key)) {
                        conflicts.push(key);
                    }
                }
            }
        }

        return { valid: conflicts.length === 0, conflicts };
    };

    const handleNumberInput = (num: number) => {
        if (!selectedCell || gameGivenUp) return;
        if (invalidCells.size > 0) return; // Prevent input when there are validation errors
        const { row, col } = selectedCell;

        if (puzzle[row][col] !== 0) return; // Can't modify pre-filled cells

        if (noteMode) {
            // Toggle note
            const key = `${row}-${col}`;
            const currentNotes = notes[key] || new Set<number>();
            const newNotes = new Set(currentNotes);

            if (newNotes.has(num)) {
                newNotes.delete(num);
            } else {
                newNotes.add(num);
            }

            setNotes({ ...notes, [key]: newNotes });
        } else {
            // Enter actual value
            const validation = isValidMove(row, col, num);

            const newUserInput = userInput.map(r => [...r]);
            newUserInput[row][col] = num;
            setUserInput(newUserInput);

            // Clear notes for this cell
            const key = `${row}-${col}`;
            const newNotes = { ...notes };
            delete newNotes[key];
            setNotes(newNotes);

            // Track invalid cells
            if (!validation.valid) {
                const newInvalidCells = new Set(invalidCells);
                newInvalidCells.add(key);
                validation.conflicts.forEach(conflict => newInvalidCells.add(conflict));
                setInvalidCells(newInvalidCells);
                setValidationError(`Number ${num} conflicts with existing numbers in the same row, column, or box!`);
            } else {
                // Clear this cell from invalid set if it's now valid
                const newInvalidCells = new Set(invalidCells);
                newInvalidCells.delete(key);
                setInvalidCells(newInvalidCells);

                // Clear error if no invalid cells remain
                if (newInvalidCells.size === 0) {
                    setValidationError(null);
                }
            }
        }
    };

    const handleClearCell = () => {
        if (!selectedCell || gameGivenUp) return;
        const { row, col } = selectedCell;

        if (puzzle[row][col] !== 0) return; // Can't clear pre-filled cells

        const newUserInput = userInput.map(r => [...r]);
        newUserInput[row][col] = 0;
        setUserInput(newUserInput);

        // Also clear notes
        const key = `${row}-${col}`;
        const newNotes = { ...notes };
        delete newNotes[key];
        setNotes(newNotes);

        // Clear from invalid cells
        const newInvalidCells = new Set(invalidCells);
        newInvalidCells.delete(key);
        setInvalidCells(newInvalidCells);

        // Clear error if no invalid cells remain
        if (newInvalidCells.size === 0) {
            setValidationError(null);
        }
    };

    const handleGiveUp = () => {
        setGameGivenUp(true);
        setConfirmDialogOpen(false);
        setSelectedCell(null);
        setNoteMode(false);
        setPopoverAnchor(null);
        // Clear saves when giving up
        setSavedGames([]);
    };

    const handleSaveGame = () => {
        const name = saveName.trim();
        if (!name) return;

        // Convert notes Sets to arrays for storage
        const notesAsArrays: { [key: string]: number[] } = {};
        Object.entries(notes).forEach(([key, value]) => {
            notesAsArrays[key] = Array.from(value);
        });

        const newSave: SaveGame = {
            id: Date.now().toString(),
            name,
            userInput: JSON.parse(JSON.stringify(userInput)),
            notes: notes, // Store the actual Sets
            timestamp: Date.now(),
        };

        setSavedGames([...savedGames, newSave]);
        setSaveName('');
        setSaveDialogOpen(false);
    };

    const handleLoadGame = (save: SaveGame) => {
        setUserInput(JSON.parse(JSON.stringify(save.userInput)));
        setNotes(JSON.parse(JSON.stringify(save.notes)));
        setLoadDialogOpen(false);
        setSelectedCell(null);
        setPopoverAnchor(null);
        setValidationError(null);
        setInvalidCells(new Set());
    };

    const handleDeleteSave = (id: string) => {
        // Prevent deleting the starting state
        if (id === 'starting_state') return;
        setSavedGames(savedGames.filter(save => save.id !== id));
    };

    const handlePopoverClose = () => {
        setPopoverAnchor(null);
    };

    const isSolved = (): boolean => {
        return userInput.every((row, r) => row.every((cell, c) => cell === solution[r][c]));
    };

    // Clear saves when game is completed
    useEffect(() => {
        if (puzzle.length > 0 && !gameGivenUp) {
            const solved = userInput.every((row, r) => row.every((cell, c) => cell === solution[r][c]));
            if (solved) {
                setSavedGames([]);
            }
        }
    }, [userInput, puzzle, solution, gameGivenUp]);

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

    return (
        <ProjectLayout title="Sudoku" icon={<SudokuIcon />} maxWidth="lg" containerPadding={{ xs: 2, sm: 4 }}>
            {/* Difficulty Chip and Note Mode Toggle */}
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                <Chip
                    label={`Difficulty: ${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}`}
                    color="primary"
                    size="medium"
                    sx={{ fontWeight: 600, fontSize: '0.9rem' }}
                />
                <ToggleButtonGroup value={noteMode} exclusive onChange={(_, value) => value !== null && setNoteMode(value)} size="small" disabled={loading}>
                    <ToggleButton value={false}>
                        <NumberIcon sx={{ mr: { xs: 0, sm: 1 } }} />
                        <Box sx={{ display: { xs: 'none', sm: 'block' } }}>Number</Box>
                    </ToggleButton>
                    <ToggleButton value={true}>
                        <NoteIcon sx={{ mr: { xs: 0, sm: 1 } }} />
                        <Box sx={{ display: { xs: 'none', sm: 'block' } }}>Note</Box>
                    </ToggleButton>
                </ToggleButtonGroup>
            </Box>

            {/* Controls */}
            <Stack spacing={2} sx={{ mb: 3 }} alignItems="center">
                {/* First Row: New Game and Give Up */}
                <Stack direction="row" spacing={1} justifyContent="center">
                    <Button
                        variant="contained"
                        startIcon={<NewGameIcon sx={{ display: { xs: 'none', sm: 'inline-flex' } }} />}
                        onClick={handleNewGame}
                        disabled={loading}
                        sx={{
                            bgcolor: 'primary.main',
                            color: 'white',
                            minWidth: { xs: 'auto', sm: 'auto' },
                            px: { xs: 1.5, sm: 2 },
                            '&:hover': {
                                bgcolor: 'primary.dark',
                            },
                        }}
                    >
                        <Box sx={{ display: { xs: 'none', sm: 'block' } }}>New Game</Box>
                        <NewGameIcon sx={{ display: { xs: 'block', sm: 'none' } }} />
                    </Button>

                    <Button
                        variant="outlined"
                        startIcon={<SuicideIcon sx={{ display: { xs: 'none', sm: 'inline-flex' } }} />}
                        onClick={() => setConfirmDialogOpen(true)}
                        disabled={loading || gameGivenUp}
                        color="error"
                        sx={{
                            minWidth: { xs: 'auto', sm: 'auto' },
                            px: { xs: 1.5, sm: 2 },
                        }}
                    >
                        <Box sx={{ display: { xs: 'none', sm: 'block' } }}>Give Up</Box>
                        <SuicideIcon sx={{ display: { xs: 'block', sm: 'none' } }} />
                    </Button>
                </Stack>

                {/* Second Row: Reset, Save, Load */}
                <Stack direction="row" spacing={1} justifyContent="center">
                    <Button
                        variant="outlined"
                        startIcon={<ResetIcon sx={{ display: { xs: 'none', sm: 'inline-flex' } }} />}
                        onClick={handleResetGame}
                        disabled={loading || gameGivenUp}
                        color="warning"
                        sx={{
                            minWidth: { xs: 'auto', sm: 'auto' },
                            px: { xs: 1.5, sm: 2 },
                        }}
                    >
                        <Box sx={{ display: { xs: 'none', sm: 'block' } }}>Reset</Box>
                        <ResetIcon sx={{ display: { xs: 'block', sm: 'none' } }} />
                    </Button>

                    <Button
                        variant="outlined"
                        startIcon={<SaveIcon sx={{ display: { xs: 'none', sm: 'inline-flex' } }} />}
                        onClick={() => setSaveDialogOpen(true)}
                        disabled={loading || gameGivenUp}
                        sx={{
                            minWidth: { xs: 'auto', sm: 'auto' },
                            px: { xs: 1.5, sm: 2 },
                        }}
                    >
                        <Box sx={{ display: { xs: 'none', sm: 'block' } }}>Save</Box>
                        <SaveIcon sx={{ display: { xs: 'block', sm: 'none' } }} />
                    </Button>

                    <Button
                        variant="outlined"
                        startIcon={<LoadIcon sx={{ display: { xs: 'none', sm: 'inline-flex' } }} />}
                        onClick={() => setLoadDialogOpen(true)}
                        disabled={loading || gameGivenUp || savedGames.length === 0}
                        sx={{
                            minWidth: { xs: 'auto', sm: 'auto' },
                            px: { xs: 1.5, sm: 2 },
                        }}
                    >
                        <Box sx={{ display: { xs: 'none', sm: 'block' } }}>Load</Box>
                        <LoadIcon sx={{ display: { xs: 'block', sm: 'none' } }} />
                    </Button>
                </Stack>
            </Stack>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {loading && puzzle.length === 0 ? (
                <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
                    <Typography>Loading puzzle...</Typography>
                </Paper>
            ) : puzzle.length > 0 ? (
                <>
                    {/* Sudoku Board */}
                    <SudokuBoard
                        puzzle={puzzle}
                        userInput={gameGivenUp ? solution : userInput}
                        notes={notes}
                        selectedCell={selectedCell}
                        onCellClick={handleCellClick}
                        gameGivenUp={gameGivenUp}
                        invalidCells={invalidCells}
                    />

                    {/* Number Input Popover */}
                    <Popover
                        open={Boolean(popoverAnchor) && !gameGivenUp && invalidCells.size === 0}
                        anchorEl={popoverAnchor}
                        onClose={handlePopoverClose}
                        anchorOrigin={{
                            vertical: 'bottom',
                            horizontal: 'right',
                        }}
                        transformOrigin={{
                            vertical: 'top',
                            horizontal: 'left',
                        }}
                    >
                        <Paper sx={{ p: 2, width: 280, minWidth: 280 }}>
                            <Stack spacing={1.5}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        {noteMode ? 'Note Mode' : 'Number Mode'}
                                    </Typography>
                                    <ToggleButtonGroup value={noteMode} exclusive onChange={(_, value) => value !== null && setNoteMode(value)} size="small">
                                        <ToggleButton value={false} sx={{ px: 1, py: 0.5 }} title="Number Mode">
                                            <NumberIcon fontSize="small" />
                                        </ToggleButton>
                                        <ToggleButton value={true} sx={{ px: 1, py: 0.5 }} title="Note Mode">
                                            <NoteIcon fontSize="small" />
                                        </ToggleButton>
                                    </ToggleButtonGroup>
                                </Box>
                                <Box
                                    sx={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(3, 1fr)',
                                        gap: 1,
                                    }}
                                >
                                    {(() => {
                                        const remainingNumbers = getRemainingNumbers();
                                        return [1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => {
                                            const remaining = remainingNumbers.get(num) || 0;
                                            const isDisabled = remaining === 0;
                                            return (
                                                <Box key={num} sx={{ position: 'relative' }}>
                                                    <Button
                                                        variant="outlined"
                                                        onClick={() => {
                                                            handleNumberInput(num);
                                                            if (!noteMode) handlePopoverClose();
                                                        }}
                                                        disabled={isDisabled && !noteMode}
                                                        sx={{
                                                            minWidth: 0,
                                                            width: '100%',
                                                            aspectRatio: '1',
                                                            fontSize: '1.5rem',
                                                            fontWeight: 600,
                                                            borderColor: isDisabled && !noteMode ? 'grey.300' : 'primary.main',
                                                            color: isDisabled && !noteMode ? 'grey.400' : 'primary.main',
                                                            '&:hover': {
                                                                bgcolor: isDisabled && !noteMode ? 'transparent' : 'primary.main',
                                                                color: isDisabled && !noteMode ? 'grey.400' : 'white',
                                                                '& + .remaining-badge': {
                                                                    color: isDisabled && !noteMode ? undefined : 'white',
                                                                },
                                                            },
                                                            '&.Mui-disabled': {
                                                                borderColor: 'grey.300',
                                                                color: 'grey.400',
                                                            },
                                                        }}
                                                    >
                                                        {num}
                                                    </Button>
                                                    <Box
                                                        className="remaining-badge"
                                                        sx={{
                                                            position: 'absolute',
                                                            top: '3px',
                                                            right: '3px',
                                                            minWidth: '20px',
                                                            height: '20px',
                                                            borderRadius: '10px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            fontSize: '0.75rem',
                                                            fontWeight: 700,
                                                            padding: '0 5px',
                                                            bgcolor: remaining > 3 ? 'primary.main' : remaining > 0 ? 'warning.main' : 'error.main',
                                                            color: 'white',
                                                            pointerEvents: 'none',
                                                            transition: 'color 0.2s',
                                                        }}
                                                    >
                                                        {remaining}
                                                    </Box>
                                                </Box>
                                            );
                                        });
                                    })()}
                                </Box>
                                <ButtonGroup fullWidth variant="outlined">
                                    <Button
                                        onClick={() => {
                                            handleClearCell();
                                            handlePopoverClose();
                                        }}
                                        color="error"
                                    >
                                        Clear
                                    </Button>
                                    <Button onClick={handlePopoverClose}>Close</Button>
                                </ButtonGroup>
                            </Stack>
                        </Paper>
                    </Popover>

                    {/* Validation Error */}
                    {validationError && (
                        <Alert
                            severity="error"
                            sx={{ mt: 2 }}
                            onClose={() => {
                                // Clear invalid numbers from the board
                                const newUserInput = userInput.map(r => [...r]);
                                invalidCells.forEach(key => {
                                    const [r, c] = key.split('-').map(Number);
                                    if (puzzle[r][c] === 0) {
                                        // Only clear user-entered cells
                                        newUserInput[r][c] = 0;
                                    }
                                });
                                setUserInput(newUserInput);

                                setValidationError(null);
                                setInvalidCells(new Set());
                                setSelectedCell(null);
                                setPopoverAnchor(null);
                            }}
                        >
                            {validationError}
                        </Alert>
                    )}

                    {gameGivenUp && (
                        <Alert severity="info" sx={{ mt: 3 }}>
                            You gave up! The solution is now displayed. Click "New Game" to try again.
                        </Alert>
                    )}

                    {isSolved() && !gameGivenUp && (
                        <Alert severity="success" sx={{ mt: 3 }}>
                            Congratulations! You solved the puzzle! 🎉
                        </Alert>
                    )}
                </>
            ) : (
                <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
                    <Typography variant="h6" gutterBottom>
                        No puzzle loaded
                    </Typography>
                    <Typography color="text.secondary" paragraph>
                        Click "New Game" to start playing
                    </Typography>
                    <Button variant="contained" onClick={() => generateNewGame(difficulty)} startIcon={<RefreshIcon />}>
                        Generate Puzzle
                    </Button>
                </Paper>
            )}

            {/* Loading Dialog */}
            <Dialog open={loading} maxWidth="xs" fullWidth disableEscapeKeyDown>
                <DialogContent sx={{ textAlign: 'center', py: 4 }}>
                    <Box sx={{ mb: 2 }}>
                        <Box
                            sx={{
                                width: 60,
                                height: 60,
                                margin: '0 auto',
                                border: '4px solid',
                                borderColor: 'primary.main',
                                borderTopColor: 'transparent',
                                borderRadius: '50%',
                                animation: 'spin 1s linear infinite',
                                '@keyframes spin': {
                                    '0%': { transform: 'rotate(0deg)' },
                                    '100%': { transform: 'rotate(360deg)' },
                                },
                            }}
                        />
                    </Box>
                    <Typography variant="h6" gutterBottom>
                        Generating Puzzle...
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Please wait while we create your new Sudoku game
                    </Typography>
                </DialogContent>
            </Dialog>

            {/* Save Game Dialog */}
            <Dialog open={saveDialogOpen} onClose={() => setSaveDialogOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle>Save Game Progress</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        fullWidth
                        label="Save Name"
                        placeholder="Enter a name for this save"
                        value={saveName}
                        onChange={e => setSaveName(e.target.value)}
                        sx={{ mt: 1 }}
                        required
                        onKeyPress={e => {
                            if (e.key === 'Enter' && saveName.trim()) {
                                handleSaveGame();
                            }
                        }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setSaveDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleSaveGame} variant="contained" disabled={!saveName.trim()}>
                        Save
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Load Game Dialog */}
            <Dialog open={loadDialogOpen} onClose={() => setLoadDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Load Saved Game</DialogTitle>
                <DialogContent>
                    {savedGames.length === 0 ? (
                        <Typography color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
                            No saved games available
                        </Typography>
                    ) : (
                        <List>
                            {savedGames.map(save => (
                                <ListItem
                                    key={save.id}
                                    sx={{
                                        border: 1,
                                        borderColor: 'divider',
                                        borderRadius: 1,
                                        mb: 1,
                                    }}
                                >
                                    <ListItemText primary={save.name} secondary={new Date(save.timestamp).toLocaleString()} />
                                    <ListItemSecondaryAction>
                                        <IconButton edge="end" onClick={() => handleLoadGame(save)} sx={{ mr: 1 }}>
                                            <LoadIcon />
                                        </IconButton>
                                        {save.id !== 'starting_state' && (
                                            <IconButton edge="end" onClick={() => handleDeleteSave(save.id)} color="error">
                                                <DeleteIcon />
                                            </IconButton>
                                        )}
                                    </ListItemSecondaryAction>
                                </ListItem>
                            ))}
                        </List>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setLoadDialogOpen(false)}>Close</Button>
                </DialogActions>
            </Dialog>

            {/* New Game Dialog */}
            <Dialog open={newGameDialogOpen} onClose={() => setNewGameDialogOpen(false)}>
                <DialogTitle>Select Difficulty</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Choose the difficulty level for your new game:
                    </Typography>
                    <Stack spacing={1}>
                        {(['easy', 'medium', 'hard'] as DifficultyLevel[]).map(level => (
                            <Button
                                key={level}
                                variant={selectedDifficulty === level ? 'contained' : 'outlined'}
                                onClick={() => setSelectedDifficulty(level)}
                                fullWidth
                                sx={{
                                    justifyContent: 'flex-start',
                                    textTransform: 'capitalize',
                                }}
                            >
                                {level}
                            </Button>
                        ))}
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setNewGameDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleConfirmNewGame} variant="contained" color="primary">
                        Start Game
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Confirmation Dialog */}
            <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)}>
                <DialogTitle>Give Up?</DialogTitle>
                <DialogContent>
                    <Typography>Are you sure you want to give up? The solution will be displayed and you won't be able to continue playing this puzzle.</Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleGiveUp} color="error" variant="contained">
                        Give Up
                    </Button>
                </DialogActions>
            </Dialog>
        </ProjectLayout>
    );
};
