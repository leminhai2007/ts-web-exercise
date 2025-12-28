import type { Project } from '../types/Project';

export const projects: Project[] = [
    {
        id: '2048',
        name: '2048 Game',
        description: 'Classic 2048 sliding puzzle game. Combine tiles to reach 2048!',
        categories: ['game', 'puzzle'],
        path: '/2048',
    },
    {
        id: 'sudoku',
        name: 'Sudoku Game',
        description: 'Classic Sudoku puzzle game with multiple difficulty levels, note-taking, and validation',
        categories: ['game', 'puzzle'],
        path: '/sudoku',
    },
    {
        id: 'lucky-wheel',
        name: 'Lucky Wheel',
        description: 'Spin the wheel of fortune! Make decisions with a customizable lucky wheel. Save and share your wheels.',
        categories: ['tool', 'random'],
        path: '/lucky-wheel',
    },
    {
        id: 'tetris',
        name: 'Tetris',
        description: 'Classic Tetris game. Stack blocks and clear lines! Desktop: arrow keys, Mobile: touch controls.',
        categories: ['game', 'puzzle'],
        path: '/tetris',
    },
    // Add more projects here as you build them
];
