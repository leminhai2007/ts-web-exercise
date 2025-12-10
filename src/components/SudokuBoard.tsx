import { Box, Paper } from '@mui/material';

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
    const getCellColor = (row: number, col: number): string => {
        const key = `${row}-${col}`;

        // Check if cell is invalid
        if (invalidCells.has(key)) {
            return '#fecaca'; // Light red for invalid cells
        }

        // Check if cell is selected
        if (selectedCell && selectedCell.row === row && selectedCell.col === col) {
            return '#ddd6fe'; // Light indigo
        }

        // Check if cell is in same row, column, or box as selected cell
        if (selectedCell && !gameGivenUp) {
            const sameRow = selectedCell.row === row;
            const sameCol = selectedCell.col === col;
            const sameBox = Math.floor(selectedCell.row / 3) === Math.floor(row / 3) && Math.floor(selectedCell.col / 3) === Math.floor(col / 3);

            if (sameRow || sameCol || sameBox) {
                return '#f3f4f6'; // Light gray
            }
        }

        // Default cell color
        return '#ffffff';
    };

    const getCellTextColor = (row: number, col: number): string => {
        const key = `${row}-${col}`;

        // Red text for invalid cells
        if (invalidCells.has(key)) {
            return '#dc2626'; // Red 600
        }

        if (puzzle[row][col] !== 0) {
            return '#1f2937'; // Dark gray for pre-filled cells
        }
        return '#6366f1'; // Primary indigo for user input
    };

    const getCellBorderStyle = (row: number, col: number) => {
        return {
            borderRight: col % 3 === 2 && col !== 8 ? '2px solid #6366f1' : '1px solid #e5e7eb',
            borderBottom: row % 3 === 2 && row !== 8 ? '2px solid #6366f1' : '1px solid #e5e7eb',
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
                                color: cellNotes.has(num) ? '#6366f1' : 'transparent',
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
                    borderRadius: 2,
                    bgcolor: 'grey.100',
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
                        bgcolor: '#e5e7eb',
                        border: '2px solid #6366f1',
                        borderRadius: 1,
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
                                            puzzle[rowIndex][colIndex] === 0 && !gameGivenUp && invalidCells.size === 0 ? '#e0e7ff' : getCellColor(rowIndex, colIndex),
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
