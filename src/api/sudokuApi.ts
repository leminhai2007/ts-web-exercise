export interface SudokuResponse {
    difficulty: string;
    puzzle: string;
    solution: string;
}

export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export const generateSudoku = async (difficulty: DifficultyLevel = 'easy'): Promise<SudokuResponse> => {
    try {
        console.log('Fetching Sudoku puzzle with difficulty:', difficulty);

        // Use serverless function in both development and production
        const apiUrl = '/api/youdosudoku';

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                difficulty,
                solution: true,
                array: false,
            }),
        });

        console.log('Response status:', response.status);

        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }

        const data = await response.json();
        console.log('API Response:', data);

        // Validate response structure
        if (!data.puzzle || !data.solution) {
            console.error('Invalid response structure:', data);
            throw new Error('Invalid response from API');
        }

        return data as SudokuResponse;
    } catch (error) {
        console.error('Failed to generate Sudoku:', error);
        if (error instanceof TypeError && error.message.includes('fetch')) {
            throw new Error('Network error. Please check your internet connection.');
        }
        throw error instanceof Error ? error : new Error('Failed to generate Sudoku puzzle. Please try again.');
    }
};

// Convert string puzzle to 2D array
export const parsePuzzle = (puzzleString: string): number[][] => {
    const puzzle: number[][] = [];
    for (let i = 0; i < 9; i++) {
        const row: number[] = [];
        for (let j = 0; j < 9; j++) {
            const value = parseInt(puzzleString[i * 9 + j]);
            row.push(value);
        }
        puzzle.push(row);
    }
    return puzzle;
};

// Convert 2D array to string
export const stringifyPuzzle = (puzzle: number[][]): string => {
    return puzzle.flat().join('');
};
