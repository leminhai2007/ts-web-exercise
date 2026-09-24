// Related docs (update if this file changes): docs/NEW_PROJECT_TEMPLATE.md (Types Convention)

export interface PomodoroPhase {
    id: string;
    name: string;
    seconds: number;
}

export interface PomodoroCounter {
    id: string;
    name: string;
    rounds: number;
    phases: PomodoroPhase[];
    createdAt: number;
    updatedAt: number;
}

/** Hard cap on the total running time of any counter (all phases x all rounds), in seconds. */
export const MAX_TOTAL_SECONDS = 4 * 60 * 60;

export const phaseTotalSeconds = (phases: PomodoroPhase[]): number => phases.reduce((sum, phase) => sum + phase.seconds, 0);

export const counterTotalSeconds = (counter: PomodoroCounter): number => phaseTotalSeconds(counter.phases) * counter.rounds;

export const formatDuration = (totalSeconds: number): string => {
    const safe = Math.max(0, Math.round(totalSeconds));
    const h = Math.floor(safe / 3600);
    const m = Math.floor((safe % 3600) / 60);
    const s = safe % 60;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
};
