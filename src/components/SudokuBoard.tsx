// Related docs (update if this file changes): docs/NEW_PROJECT_TEMPLATE.md, docs/STYLES.md (part of the Sudoku page)
import { Box, Paper, alpha, useTheme } from '@mui/material';

interface CellNote {
    [key: string]: Set<number>;
}

interface SudokuBoardProps {
    puzzle: number[][];
    userInput: number[][];
    notes: CellNote;
    selectedCell: { row: number; col: number } | null;
    onCellClick: (row: number, col: number, event: React.MouseEvent<HTMLElement>) => void;
    gameGivenUp: boolean;
    invalidCells: Set<string>;
}

export const SudokuBoard = ({ puzzle, userInput, notes, selectedCell, onCellClick, gameGivenUp, invalidCells }: SudokuBoardProps) => {
    const theme = useTheme();

    const getCellColor = (row: number, col: number): string => {
        const key = `${row}-${col}`;

        // Check if cell is invalid
        if (invalidCells.has(key)) {
            return alpha(theme.palette.error.main, 0.28);
        }

        // Check if cell is selected
        if (selectedCell && selectedCell.row === row && selectedCell.col === col) {
            return alpha(theme.palette.primary.main, 0.3);
        }

        // Check if cell is in same row, column, or box as selected cell
        if (selectedCell && !gameGivenUp) {
            const sameRow = selectedCell.row === row;
            const sameCol = selectedCell.col === col;
            const sameBox = Math.floor(selectedCell.row / 3) === Math.floor(row / 3) && Math.floor(selectedCell.col / 3) === Math.floor(col / 3);

            if (sameRow || sameCol || sameBox) {
                return alpha(theme.palette.primary.main, 0.1);
            }
        }

        // Default cell color
        return theme.palette.background.paper;
    };

    const getCellTextColor = (row: number, col: number): string => {
        const key = `${row}-${col}`;

        // Light red text for invalid cells
        if (invalidCells.has(key)) {
            return theme.palette.error.light;
        }

        if (puzzle[row][col] !== 0) {
            return theme.palette.text.primary; // Light text for pre-filled cells
        }
        return theme.palette.primary.main; // Neon cyan for user input
    };

    const getCellBorderStyle = (row: number, col: number) => {
        return {
            borderRight: col % 3 === 2 && col !== 8 ? `2px solid ${theme.palette.primary.main}` : `1px solid ${theme.palette.divider}`,
            borderBottom: row % 3 === 2 && row !== 8 ? `2px solid ${theme.palette.primary.main}` : `1px solid ${theme.palette.divider}`,
        };
    };

    const renderCellContent = (row: number, col: number) => {
        const cellValue = userInput[row][col];
        const key = `${row}-${col}`;
        const cellNotes = notes[key];

        if (cellValue !== 0) {
            return (
                <Box
                    sx={{
                        fontSize: { xs: '1.25rem', sm: '1.5rem' },
                        fontWeight: puzzle[row][col] !== 0 ? 700 : 600,
                        color: getCellTextColor(row, col),
                    }}
                >
                    {cellValue}
                </Box>
            );
        }

        if (cellNotes && cellNotes.size > 0 && !gameGivenUp) {
            return (
                <Box
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: { xs: 0.1, sm: 0.25 },
                        width: '100%',
                        height: '100%',
                        p: { xs: 0.25, sm: 0.5 },
                    }}
                >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                        <Box
                            key={num}
                            sx={{
                                fontSize: { xs: '0.65rem', sm: '0.75rem' },
                                color: cellNotes.has(num) ? theme.palette.primary.main : 'transparent',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 500,
                                lineHeight: 1,
                            }}
                        >
                            {cellNotes.has(num) ? num : '·'}
                        </Box>
                    ))}
                </Box>
            );
        }

        return null;
    };

    if (!puzzle || puzzle.length === 0) {
        return null;
    }

    return (
        <Box
            sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                px: { xs: 1, sm: 2 },
            }}
        >
            <Paper
                elevation={3}
                sx={{
                    p: { xs: 1, sm: 2 },
                    borderRadius: 0,
                    bgcolor: theme.palette.background.default,
                    display: 'inline-block',
                    width: '100%',
                    maxWidth: { xs: '100%', sm: 500 },
                }}
            >
                <Box
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(9, 1fr)',
                        gap: 0,
                        bgcolor: theme.palette.divider,
                        border: `2px solid ${theme.palette.primary.main}`,
                        borderRadius: 0,
                        overflow: 'hidden',
                        aspectRatio: '1',
                        width: '100%',
                    }}
                >
                    {puzzle.map((row, rowIndex) =>
                        row.map((_, colIndex) => (
                            <Box
                                key={`${rowIndex}-${colIndex}`}
                                onClick={e => onCellClick(rowIndex, colIndex, e)}
                                sx={{
                                    aspectRatio: '1',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    bgcolor: getCellColor(rowIndex, colIndex),
                                    cursor: puzzle[rowIndex][colIndex] === 0 && !gameGivenUp && invalidCells.size === 0 ? 'pointer' : 'default',
                                    transition: 'background-color 0.2s',
                                    userSelect: 'none',
                                    ...getCellBorderStyle(rowIndex, colIndex),
                                    '&:hover': {
                                        bgcolor:
                                            puzzle[rowIndex][colIndex] === 0 && !gameGivenUp && invalidCells.size === 0
                                                ? alpha(theme.palette.primary.main, 0.18)
                                                : getCellColor(rowIndex, colIndex),
                                    },
                                }}
                            >
                                {renderCellContent(rowIndex, colIndex)}
                            </Box>
                        ))
                    )}
                </Box>
            </Paper>
        </Box>
    );
};
