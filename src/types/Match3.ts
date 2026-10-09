// Related docs (update if this file changes): docs/NEW_PROJECT_TEMPLATE.md (Types Convention)

/** Index of a gem color in `GEM_PALETTE`. Color bombs carry `null` so they never match by color. */
export type GemColor = 0 | 1 | 2 | 3 | 4 | 5;

/** Super block a match can create, or that a gem already carries from an earlier match. */
export type SpecialKind = 'none' | 'stripedRow' | 'stripedCol' | 'wrapped' | 'colorBomb';

export interface Gem {
    id: string;
    color: GemColor | null;
    special: SpecialKind;
}

/** `null` marks an empty cell created while gems fall or are cleared. */
export type Board = (Gem | null)[][];

export interface Position {
    row: number;
    col: number;
}

export interface MatchGroup {
    direction: 'row' | 'col';
    cells: Position[];
}

export interface SpecialCreation {
    position: Position;
    color: GemColor;
    special: Exclude<SpecialKind, 'none'>;
}

/** A gem removed by a clear step, kept around for one beat so it can play its pop-out animation. */
export interface ClearedGem {
    position: Position;
    gem: Gem;
}

/** One animation frame group of the resolution: what pops out, what stays, where everything lands. */
export interface ClearStep {
    cleared: ClearedGem[];
    creations: SpecialCreation[];
    holes: Board;
    falling: Board;
    newIds: string[];
}

export interface Match3State {
    board: Board;
    score: number;
}

export interface Match3Records {
    bestScore: number;
}
