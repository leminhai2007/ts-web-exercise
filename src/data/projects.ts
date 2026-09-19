// Related docs (update if this file changes): docs/NEW_PROJECT_TEMPLATE.md (project registration)
import type { Project } from '../types/Project';
import { DataManagerIcon, GameIcon, MedalIcon, SchoolIcon, SudokuIcon, WheelIcon } from '../components/AppIcons';

export const projects: Project[] = [
    {
        id: '2048',
        name: '2048 Game',
        description: 'Classic 2048 sliding puzzle game. Combine tiles to reach 2048!',
        categories: ['game', 'puzzle'],
        path: '/2048',
        icon: GameIcon,
    },
    {
        id: 'sudoku',
        name: 'Sudoku Game',
        description: 'Classic Sudoku puzzle game with multiple difficulty levels, note-taking, and validation',
        categories: ['game', 'puzzle'],
        path: '/sudoku',
        icon: SudokuIcon,
    },
    {
        id: 'lucky-wheel',
        name: 'Lucky Wheel',
        description: 'Spin the wheel of fortune! Make decisions with a customizable lucky wheel. Save and share your wheels.',
        categories: ['tool', 'random'],
        path: '/lucky-wheel',
        icon: WheelIcon,
    },
    {
        id: 'flash-cards',
        name: 'Flash Cards',
        description: 'Create and study flash card collections. Shuffle, random pick, and export/import for sharing.',
        categories: ['tool', 'education'],
        path: '/flash-cards',
        icon: SchoolIcon,
    },
    {
        id: 'data-manager',
        name: 'Data Manager',
        description: 'Export and import saved data from every project. Move your progress when the site changes domain.',
        categories: ['tool', 'data'],
        path: '/data-manager',
        icon: DataManagerIcon,
    },
    {
        id: 'habit-tracker',
        name: 'Habit Tracker',
        description: 'Build daily habits or avoidance streaks and level up by earning badges across five ranks.',
        categories: ['tool', 'lifestyle'],
        path: '/habit-tracker',
        icon: MedalIcon,
    },
    // Add more projects here as you build them
];
