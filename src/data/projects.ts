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
        id: 'calculator',
        name: 'Scientific Calculator',
        description: 'Advanced calculator with basic and scientific modes for complex calculations',
        categories: ['tool', 'math'],
        path: '/calculator',
    },
    {
        id: 'sudoku',
        name: 'Sudoku Game',
        description: 'Classic Sudoku puzzle game with multiple difficulty levels, note-taking, and validation',
        categories: ['game', 'puzzle'],
        path: '/sudoku',
    },
    // Add more projects here as you build them
];
