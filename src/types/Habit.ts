// Related docs (update if this file changes): docs/NEW_PROJECT_TEMPLATE.md (types conventions)

export type HabitMode = 'default' | 'reverse';

export interface Habit {
    id: string;
    name: string;
    targetStreak: number;
    mode: HabitMode;
    level: number;
    streak: number;
    lastDoneDate: string | null;
    lastProcessedDate: string | null;
    lastBreakDate: string | null;
    createdAt: number;
}

export const RANKS = ['bronze', 'silver', 'gold', 'platinum', 'diamond'] as const;
export type BadgeRank = (typeof RANKS)[number];

export const RANK_LABELS: Record<BadgeRank, string> = {
    bronze: 'Bronze',
    silver: 'Silver',
    gold: 'Gold',
    platinum: 'Platinum',
    diamond: 'Diamond',
};

export const MAX_LEVEL = 50;
export const MIN_TARGET = 5;
export const MAX_TARGET = 99;
