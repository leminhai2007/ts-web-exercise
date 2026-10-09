/**
 * MatchBlocks Component
 *
 * Match 3 puzzle built from solid colored blocks: line up three or more of the same color to
 * clear them, and bigger matches forge super blocks.
 *
 * Related docs (update if this component changes): AGENTS.md, docs/NEW_PROJECT_TEMPLATE.md, docs/STYLES.md
 *
 * OVERVIEW:
 * An 8x8 board of six colored blocks played in endless mode - no move counter, no levels. The
 * run only ends when the board holds no swap left that makes a match, and then the player can
 * reshuffle it or start a new game. Two neighbouring blocks are swapped (drag, swipe, tap-tap or
 * keyboard) and the swap only counts when it forms a line of 3 or more. Matched blocks pop out, the
 * blocks above fall into the gap, fresh blocks drop in from the top and every chain reaction scores a
 * combo multiplier.
 *
 * KEY FEATURES:
 * 1. Animated swap - blocks slide into each other's cell; an illegal swap shakes and stays put.
 * 2. Animated resolution - matched blocks pop out, survivors fall, refills drop in from above.
 * 3. Match 3 - clears the line and scores 30 points per block, multiplied by the cascade step.
 * 4. Match 4 (super block) - forges a striped block on the swapped block. A horizontal match clears a
 *    row, a vertical match a column. Striped blocks fire when swapped or when a match catches them,
 *    and they chain into each other.
 * 5. Match 5 (super block) - forges a color bomb. Swapped with a colored block it clears every block
 *    of that color, with another super block it fires a cross blast, bomb + bomb wipes the board.
 *    Caught in someone else's blast it survives as a normal block.
 * 6. L / T shape - a horizontal and a vertical line crossing on one block forges a wrapped block that
 *    blows up its 3x3 area and keeps chaining.
 * 7. Combo chain - every cascade step multiplies the points and big combos are announced on the board.
 * 8. Endless mode - play as long as matches are possible; on a locked board reshuffle or restart.
 * 9. Super blocks can also be swapped on their own (no match needed) to fire them immediately.
 * 10. Responsive - the board fills the width on phones and stays 8 columns on desktop.
 *
 * STORAGE:
 * - Board and score saved to localStorage under key 'match3-state'
 * - Best score saved to localStorage under key 'match3-records'
 * - Auto-save on every change, persists across browser sessions
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent } from 'react';
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Snackbar, Stack, Typography, alpha, keyframes } from '@mui/material';
import { ProjectLayout } from './ProjectLayout';
import { BlocksIcon, HelpIcon, NewGameIcon, SparkleIcon } from './AppIcons';
import type { Board, ClearStep, ClearedGem, Gem, GemColor, Match3Records, Match3State, MatchGroup, Position, SpecialCreation, SpecialKind } from '../types/Match3';

const STORAGE_KEY = 'match3-state';
const RECORDS_KEY = 'match3-records';

const BOARD_SIZE = 8;
const COLOR_COUNT = 6;
const BASE_GEM_POINTS = 30;

// One beat of the resolution animation, chained by the scheduler: swap, then pop out, then fall.
const SWAP_MS = 190;
const CLEAR_MS = 190;
const FALL_MS = 230;

interface GemPalette {
    name: string;
    base: string;
    light: string;
    dark: string;
}

const GEM_PALETTE: GemPalette[] = [
    { name: 'Red', base: '#e52521', light: '#ff8f78', dark: '#9c1310' },
    { name: 'Green', base: '#2fb35a', light: '#84f2ab', dark: '#146630' },
    { name: 'Blue', base: '#2f7de0', light: '#93c5ff', dark: '#17458f' },
    { name: 'Amber', base: '#f5aa00', light: '#ffdf85', dark: '#a86f00' },
    { name: 'Purple', base: '#9c4ddb', light: '#d8a5fb', dark: '#571c86' },
    { name: 'Cyan', base: '#00b3c9', light: '#85ecf6', dark: '#006a78' },
];

const RAINBOW = 'linear-gradient(135deg, #e52521 0%, #f5aa00 22%, #2fb35a 44%, #00b3c9 66%, #2f7de0 84%, #9c4ddb 100%)';

const dropIn = keyframes`
    from { transform: translateY(-115%) scale(0.9); opacity: 0; }
    60% { opacity: 1; }
    to { transform: translateY(0) scale(1); opacity: 1; }
`;

const popOut = keyframes`
    from { transform: scale(1); opacity: 1; }
    to { transform: scale(0.15); opacity: 0; }
`;

const shake = keyframes`
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-6px); }
    75% { transform: translateX(6px); }
`;

const pop = keyframes`
    0% { transform: scale(0.7); opacity: 0; }
    60% { transform: scale(1.12); opacity: 1; }
    100% { transform: scale(1); opacity: 1; }
`;

// Board helpers

let gemIdCounter = 0;

const createGemId = (): string => {
    gemIdCounter += 1;
    return `gem-${Date.now().toString(36)}-${gemIdCounter}`;
};

const randomColor = (): GemColor => Math.floor(Math.random() * COLOR_COUNT) as GemColor;

const createGem = (color: GemColor = randomColor()): Gem => ({ id: createGemId(), color, special: 'none' });

const createSuperGem = (color: GemColor, special: SpecialKind): Gem => ({ id: createGemId(), color, special });

const cellKey = (position: Position): number => position.row * BOARD_SIZE + position.col;

const keyToPosition = (key: number): Position => ({ row: Math.floor(key / BOARD_SIZE), col: key % BOARD_SIZE });

const samePosition = (a: Position, b: Position): boolean => a.row === b.row && a.col === b.col;

const isAdjacent = (a: Position, b: Position): boolean => Math.abs(a.row - b.row) + Math.abs(a.col - b.col) === 1;

const inBounds = (row: number, col: number): boolean => row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;

const cloneBoard = (board: Board): Board => board.map(row => [...row]);

const gemAt = (board: Board, position: Position): Gem | null => board[position.row]?.[position.col] ?? null;

const swapCells = (board: Board, a: Position, b: Position): void => {
    const gemA = board[a.row][a.col];
    board[a.row][a.col] = board[b.row][b.col];
    board[b.row][b.col] = gemA;
};

const everyCell = (visit: (position: Position) => void): void => {
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            visit({ row, col });
        }
    }
};

// Match detection

const scanLine = (board: Board, direction: 'row' | 'col', line: number): MatchGroup[] => {
    const groups: MatchGroup[] = [];
    const gemAtStep = (step: number): Gem | null => (direction === 'row' ? board[line][step] : board[step][line]) ?? null;
    const positionAtStep = (step: number): Position => (direction === 'row' ? { row: line, col: step } : { row: step, col: line });
    let run: Position[] = [];

    for (let step = 0; step <= BOARD_SIZE; step++) {
        const gem = step < BOARD_SIZE ? gemAtStep(step) : null;
        const color = gem ? gem.color : null;
        const last = run.length > 0 ? run[run.length - 1] : null;
        const lastGem = last ? gemAtStep(direction === 'row' ? last.col : last.row) : null;
        if (color !== null && lastGem !== null && lastGem.color === color) {
            run.push(positionAtStep(step));
            continue;
        }
        if (run.length >= 3) {
            groups.push({ direction, cells: run });
        }
        run = color !== null ? [positionAtStep(step)] : [];
    }
    return groups;
};

const findMatches = (board: Board): MatchGroup[] => {
    const groups: MatchGroup[] = [];
    for (let line = 0; line < BOARD_SIZE; line++) {
        groups.push(...scanLine(board, 'row', line), ...scanLine(board, 'col', line));
    }
    return groups;
};

const hasPossibleMove = (board: Board): boolean => {
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            const from: Position = { row, col };
            const neighbors: Position[] = [
                { row, col: col + 1 },
                { row: row + 1, col },
            ];
            for (const to of neighbors) {
                if (!inBounds(to.row, to.col)) continue;
                const probe = cloneBoard(board);
                swapCells(probe, from, to);
                const matched = findMatches(probe).some(group => group.cells.some(cell => samePosition(cell, from) || samePosition(cell, to)));
                if (matched) return true;
            }
        }
    }
    return false;
};

// Super blocks

const specialTargets = (position: Position, gem: Gem): Position[] => {
    const targets: Position[] = [];
    switch (gem.special) {
        case 'stripedRow':
            for (let col = 0; col < BOARD_SIZE; col++) {
                targets.push({ row: position.row, col });
            }
            break;
        case 'stripedCol':
            for (let row = 0; row < BOARD_SIZE; row++) {
                targets.push({ row, col: position.col });
            }
            break;
        case 'wrapped':
            for (let row = position.row - 1; row <= position.row + 1; row++) {
                for (let col = position.col - 1; col <= position.col + 1; col++) {
                    if (inBounds(row, col)) targets.push({ row, col });
                }
            }
            break;
        default:
            break;
    }
    return targets;
};

/** Seeds the clear set and lets every super block it touches fire, chaining until nothing is left. */
const expandClear = (board: Board, seeds: Set<number>): Set<number> => {
    const target = new Set<number>(seeds);
    const queue: number[] = [...seeds];

    while (queue.length > 0) {
        const key = queue.shift();
        if (key === undefined) break;
        const position = keyToPosition(key);
        const gem = gemAt(board, position);
        if (!gem || gem.special === 'none' || gem.special === 'colorBomb') continue;
        specialTargets(position, gem).forEach(targetPosition => {
            const nextKey = cellKey(targetPosition);
            if (!target.has(nextKey)) {
                target.add(nextKey);
                queue.push(nextKey);
            }
        });
    }
    return target;
};

/** Cells a swap has to clear when a super block is fired without forming a match. */
const activationSeeds = (board: Board, a: Position, b: Position): Set<number> => {
    const seeds = new Set<number>();
    const gemA = gemAt(board, a);
    const gemB = gemAt(board, b);
    if (!gemA || !gemB) return seeds;

    const bombOn = gemA.special === 'colorBomb' ? a : gemB.special === 'colorBomb' ? b : null;
    if (bombOn) {
        const partner = gemA.special === 'colorBomb' ? { position: b, gem: gemB } : { position: a, gem: gemA };
        if (partner.gem.special === 'colorBomb') {
            everyCell(position => seeds.add(cellKey(position)));
            return seeds;
        }
        if (partner.gem.color !== null) {
            everyCell(position => {
                const gem = gemAt(board, position);
                if (gem && gem.color === partner.gem.color) seeds.add(cellKey(position));
            });
        }
        specialTargets(partner.position, partner.gem).forEach(position => seeds.add(cellKey(position)));
        seeds.add(cellKey(partner.position));
        seeds.add(cellKey(bombOn));
        return seeds;
    }

    seeds.add(cellKey(a));
    seeds.add(cellKey(b));
    [gemA, gemB].forEach((gem, index) => {
        const position = index === 0 ? a : b;
        specialTargets(position, gem).forEach(target => seeds.add(cellKey(target)));
    });
    return seeds;
};

// Super block creation

const determineSpecials = (board: Board, groups: MatchGroup[], swapped: Position[]): SpecialCreation[] => {
    const creations = new Map<number, SpecialCreation>();
    const colorAt = (position: Position): GemColor => {
        const gem = gemAt(board, position);
        return gem && gem.color !== null ? gem.color : 0;
    };
    const anchorOf = (cells: Position[]): Position => {
        const swappedCell = cells.find(cell => swapped.some(moved => samePosition(moved, cell)));
        return swappedCell ?? cells[Math.floor(cells.length / 2)];
    };

    const horizontal = groups.filter(group => group.direction === 'row');
    const vertical = groups.filter(group => group.direction === 'col');
    const crossings = new Set<number>();
    horizontal.forEach(rowGroup =>
        vertical.forEach(colGroup => {
            const shared = rowGroup.cells.find(rowCell => colGroup.cells.some(colCell => samePosition(rowCell, colCell)));
            if (shared) crossings.add(cellKey(shared));
        })
    );
    crossings.forEach(key => {
        const position = keyToPosition(key);
        creations.set(key, { position, color: colorAt(position), special: 'wrapped' });
    });

    groups.forEach(group => {
        if (group.cells.length < 4) return;
        if (group.cells.some(cell => crossings.has(cellKey(cell)))) return;
        const position = anchorOf(group.cells);
        const special: SpecialCreation['special'] = group.cells.length >= 5 ? 'colorBomb' : group.direction === 'row' ? 'stripedRow' : 'stripedCol';
        creations.set(cellKey(position), { position, color: colorAt(position), special });
    });

    return [...creations.values()];
};

// Resolution - each step returns the three boards the animation needs, without mutating the board it is given

const dropAndRefill = (board: Board): string[] => {
    const created: string[] = [];
    for (let col = 0; col < BOARD_SIZE; col++) {
        let target = BOARD_SIZE - 1;
        for (let row = BOARD_SIZE - 1; row >= 0; row--) {
            if (board[row][col]) {
                if (target !== row) {
                    board[target][col] = board[row][col];
                    board[row][col] = null;
                }
                target -= 1;
            }
        }
        for (let row = target; row >= 0; row--) {
            const gem = createGem();
            board[row][col] = gem;
            created.push(gem.id);
        }
    }
    return created;
};

const clearStep = (board: Board, seeds: Set<number> | null, swapped: Position[]): ClearStep | null => {
    const groups = findMatches(board);
    const hasSeeds = seeds !== null && seeds.size > 0;
    if (groups.length === 0 && !hasSeeds) return null;

    const creations = groups.length > 0 ? determineSpecials(board, groups, swapped) : [];
    const targets = new Set<number>(seeds ?? []);
    groups.forEach(group => group.cells.forEach(cell => targets.add(cellKey(cell))));
    const clearedKeys = expandClear(board, targets);
    creations.forEach(creation => clearedKeys.delete(cellKey(creation.position)));

    const cleared: ClearedGem[] = [];
    const rescued: number[] = [];
    clearedKeys.forEach(key => {
        const position = keyToPosition(key);
        const gem = gemAt(board, position);
        if (gem) cleared.push({ position, gem });
        if (gem && gem.special === 'colorBomb') rescued.push(key);
    });

    const holes = cloneBoard(board);
    clearedKeys.forEach(key => {
        const position = keyToPosition(key);
        holes[position.row][position.col] = null;
    });
    rescued.forEach(key => {
        const position = keyToPosition(key);
        holes[position.row][position.col] = createGem();
    });
    creations.forEach(creation => {
        holes[creation.position.row][creation.position.col] = createSuperGem(creation.color, creation.special);
    });

    const falling = cloneBoard(holes);
    const newIds = dropAndRefill(falling);

    return { cleared, creations, holes, falling, newIds };
};

const shuffleBoard = (board: Board): boolean => {
    const gems = board.flatMap(row => row).filter((gem): gem is Gem => gem !== null);
    if (gems.length < 4) return false;

    for (let attempt = 0; attempt < 80; attempt++) {
        for (let i = gems.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            const swap = gems[i];
            gems[i] = gems[j];
            gems[j] = swap;
        }
        let index = 0;
        for (let row = 0; row < BOARD_SIZE; row++) {
            for (let col = 0; col < BOARD_SIZE; col++) {
                board[row][col] = gems[index];
                index += 1;
            }
        }
        if (findMatches(board).length === 0 && hasPossibleMove(board)) return true;
    }
    return false;
};

const isPlayable = (board: Board): boolean => findMatches(board).length === 0 && hasPossibleMove(board);

/** Guarantees a playable board: reshuffle first, fall back to fresh gems when a shuffle cannot untangle it. */
const ensurePlayable = (board: Board): void => {
    if (isPlayable(board)) return;
    if (shuffleBoard(board)) return;
    for (let attempt = 0; attempt < 60; attempt++) {
        for (let row = 0; row < BOARD_SIZE; row++) {
            for (let col = 0; col < BOARD_SIZE; col++) {
                board[row][col] = createGem();
            }
        }
        if (isPlayable(board)) return;
    }
};

const createBoard = (): Board => {
    const board: Board = Array.from({ length: BOARD_SIZE }, () => Array.from({ length: BOARD_SIZE }, () => createGem()));
    ensurePlayable(board);
    return board;
};

const reshuffledBoard = (board: Board): Board => {
    const next = cloneBoard(board);
    if (!shuffleBoard(next)) return createBoard();
    return next;
};

// Persistence

const loadState = (): Match3State | null => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return null;
        const parsed = JSON.parse(stored) as Partial<Match3State> | null;
        if (!parsed || typeof parsed.score !== 'number') return null;
        if (!Array.isArray(parsed.board) || parsed.board.length !== BOARD_SIZE) return null;
        if (!parsed.board.every(row => Array.isArray(row) && row.length === BOARD_SIZE)) return null;
        const board: Board = parsed.board.map(row => row.map(gem => (gem ? { ...gem } : null)));
        ensurePlayable(board);
        return { board, score: parsed.score };
    } catch (error) {
        console.error('Failed to load match blocks state:', error);
        return null;
    }
};

const loadRecords = (): Match3Records => {
    try {
        const stored = localStorage.getItem(RECORDS_KEY);
        if (!stored) return { bestScore: 0 };
        const parsed = JSON.parse(stored) as Partial<Match3Records> | null;
        return { bestScore: typeof parsed?.bestScore === 'number' ? parsed.bestScore : 0 };
    } catch (error) {
        console.error('Failed to load match blocks records:', error);
        return { bestScore: 0 };
    }
};

// UI pieces

const CELL_SIZE = 'calc((100% - 7 * var(--gap)) / 8)';
const MOVE_EASING = 'cubic-bezier(0.3, 1.15, 0.4, 1)';

const cellTransform = (position: Position): string => `translate(calc(${position.col} * (100% + var(--gap))), calc(${position.row} * (100% + var(--gap))))`;

interface GemBlockProps {
    gem: Gem;
    size?: number;
    selected?: boolean;
    focused?: boolean;
    shaking?: boolean;
    entering?: boolean;
    dying?: boolean;
}

const GemBlock = ({ gem, size, selected, focused, shaking, entering, dying }: GemBlockProps) => {
    const palette = gem.color !== null ? GEM_PALETTE[gem.color] : null;
    const striped = gem.special === 'stripedRow' || gem.special === 'stripedCol';
    const inset = palette ? alpha(palette.dark, 0.9) : alpha('#ffffff', 0.8);
    const highlight = selected || focused ? `0 0 0 3px #ffd54f, inset 0 0 0 2px ${inset}, inset 0 -6px 10px ${alpha('#000000', 0.28)}` : null;

    return (
        <Box
            aria-hidden
            sx={{
                position: 'relative',
                width: size ?? '100%',
                aspectRatio: '1',
                borderRadius: '8px',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                backgroundImage: palette ? `linear-gradient(140deg, ${palette.light} 0%, ${palette.base} 48%, ${palette.dark} 100%)` : RAINBOW,
                boxShadow: highlight ?? `inset 0 0 0 2px ${inset}, inset 0 -6px 10px ${alpha('#000000', 0.28)}`,
                transform: selected ? 'scale(0.86)' : 'scale(1)',
                transition: 'transform 0.12s ease-in-out',
                animation: dying
                    ? `${popOut} ${CLEAR_MS}ms ease-in forwards`
                    : entering
                      ? `${dropIn} ${FALL_MS}ms ease-out`
                      : shaking
                        ? `${shake} 0.24s ease-in-out`
                        : 'none',
                ...(size ? { flexShrink: 0 } : {}),
            }}
        >
            {striped && (
                <Box
                    sx={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        flexDirection: gem.special === 'stripedRow' ? 'column' : 'row',
                        justifyContent: 'space-evenly',
                        alignItems: 'center',
                    }}
                >
                    <Box
                        sx={{ width: gem.special === 'stripedRow' ? '88%' : '18%', height: gem.special === 'stripedRow' ? '18%' : '88%', bgcolor: alpha('#ffffff', 0.9) }}
                    />
                    <Box
                        sx={{ width: gem.special === 'stripedRow' ? '88%' : '18%', height: gem.special === 'stripedRow' ? '18%' : '88%', bgcolor: alpha('#ffffff', 0.9) }}
                    />
                </Box>
            )}
            {gem.special === 'wrapped' && (
                <Box
                    sx={{
                        position: 'absolute',
                        inset: '6%',
                        border: '3px solid',
                        borderColor: alpha('#ffffff', 0.9),
                        borderRadius: '50%',
                        boxShadow: `0 0 8px ${alpha('#ffffff', 0.8)}`,
                    }}
                />
            )}
            {gem.special === 'colorBomb' && (
                <Box sx={{ position: 'relative', color: '#ffffff', display: 'flex', textShadow: `0 0 4px ${alpha('#000000', 0.6)}` }}>
                    <SparkleIcon fontSize={size ? size * 0.45 : 22} />
                </Box>
            )}
        </Box>
    );
};

const SUPER_BLOCK_SAMPLES: { special: SpecialKind; gem: Gem; label: string }[] = [
    { special: 'stripedRow', gem: { id: 'sample-striped-row', color: 3, special: 'stripedRow' }, label: 'Match 4 in a row - clears a full line' },
    { special: 'stripedCol', gem: { id: 'sample-striped-col', color: 2, special: 'stripedCol' }, label: 'Match 4 in a column - clears a full line' },
    { special: 'wrapped', gem: { id: 'sample-wrapped', color: 4, special: 'wrapped' }, label: 'L or T shape - blows up the 3x3 area' },
    { special: 'colorBomb', gem: { id: 'sample-color-bomb', color: null, special: 'colorBomb' }, label: 'Match 5 - clears every block of one color' },
];

type PlayStatus = 'playing' | 'locked';

export const MatchBlocks = () => {
    // State
    const [game, setGame] = useState<Match3State>(() => loadState() ?? { board: createBoard(), score: 0 });
    const [records, setRecords] = useState<Match3Records>(loadRecords);
    const [status, setStatus] = useState<PlayStatus>('playing');
    const [selected, setSelected] = useState<Position | null>(null);
    const [cursor, setCursor] = useState<Position>({ row: BOARD_SIZE / 2, col: BOARD_SIZE / 2 });
    const [boardFocused, setBoardFocused] = useState(false);
    const [shaking, setShaking] = useState<number[]>([]);
    const [clearedGems, setClearedGems] = useState<ClearedGem[]>([]);
    const [enteringIds, setEnteringIds] = useState<string[]>([]);
    const [combo, setCombo] = useState<{ id: number; value: number } | null>(null);
    const [gain, setGain] = useState<{ id: number; value: number } | null>(null);
    const [helpOpen, setHelpOpen] = useState(false);
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({ open: false, message: '', severity: 'info' });

    const boardRef = useRef<HTMLDivElement | null>(null);
    const dragStart = useRef<{ position: Position; handled: boolean } | null>(null);
    const busyRef = useRef(false);
    const scoreRef = useRef(game.score);
    const timers = useRef<number[]>([]);

    const schedule = useCallback((callback: () => void, delay: number) => {
        timers.current.push(window.setTimeout(callback, delay));
    }, []);

    // Clean up pending timers on unmount
    useEffect(
        () => () => {
            timers.current.forEach(id => window.clearTimeout(id));
        },
        []
    );

    // Auto-save on every change
    useEffect(() => {
        scoreRef.current = game.score;
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(game));
        } catch (error) {
            console.error('Failed to save match blocks state:', error);
        }
    }, [game]);

    useEffect(() => {
        try {
            localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
        } catch (error) {
            console.error('Failed to save match blocks records:', error);
        }
    }, [records]);

    const showNotification = useCallback((message: string, severity: 'success' | 'error' | 'info' = 'info') => {
        setSnackbar({ open: true, message, severity });
    }, []);

    const { score, board } = game;

    const saveRecord = useCallback((reachedScore: number) => {
        setRecords(prev => (prev.bestScore < reachedScore ? { bestScore: reachedScore } : prev));
    }, []);

    /** Plays one clear step (pop out, fall, refill) and schedules the next one until the board settles. */
    const runClearStep = (working: Board, seeds: Set<number> | null, swapped: Position[], comboIndex: number) => {
        const step = clearStep(working, seeds, swapped);
        if (!step) {
            busyRef.current = false;
            if (!hasPossibleMove(working)) {
                saveRecord(scoreRef.current);
                setStatus('locked');
            }
            return;
        }

        const comboValue = comboIndex + 1;
        const points = step.cleared.length * BASE_GEM_POINTS * comboValue;
        scoreRef.current += points;

        setClearedGems(step.cleared);
        setGame(prev => ({ ...prev, board: step.holes, score: scoreRef.current }));
        if (comboValue > 1) {
            setCombo({ id: scoreRef.current, value: comboValue });
            schedule(() => setCombo(null), 900);
        }
        if (comboIndex === 0 && points > 0) {
            setGain({ id: scoreRef.current, value: points });
            schedule(() => setGain(null), 900);
        }
        schedule(() => {
            setEnteringIds(step.newIds);
            setClearedGems([]);
            setGame(prev => ({ ...prev, board: step.falling }));
            schedule(() => {
                setEnteringIds([]);
                runClearStep(step.falling, null, swapped, comboValue);
            }, FALL_MS);
        }, CLEAR_MS);
    };

    const applySwap = (a: Position, b: Position) => {
        if (status !== 'playing' || busyRef.current || !isAdjacent(a, b)) return;
        const gemA = gemAt(board, a);
        const gemB = gemAt(board, b);
        if (!gemA || !gemB) return;

        const swapped = cloneBoard(board);
        swapCells(swapped, a, b);
        const matches = findMatches(swapped).some(group => group.cells.some(cell => samePosition(cell, a) || samePosition(cell, b)));
        const carriesSuperBlock = gemA.special !== 'none' || gemB.special !== 'none';

        if (!matches && !carriesSuperBlock) {
            setShaking([cellKey(a), cellKey(b)]);
            schedule(() => setShaking([]), 260);
            return;
        }

        busyRef.current = true;
        setSelected(null);
        setGame(prev => ({ ...prev, board: swapped }));
        setGain(null);
        schedule(() => runClearStep(swapped, matches ? null : activationSeeds(swapped, a, b), [a, b], 0), SWAP_MS);
    };

    const newGame = useCallback(() => {
        timers.current.forEach(id => window.clearTimeout(id));
        timers.current = [];
        busyRef.current = false;
        scoreRef.current = 0;
        setGame({ board: createBoard(), score: 0 });
        setStatus('playing');
        setSelected(null);
        setShaking([]);
        setClearedGems([]);
        setEnteringIds([]);
        setCombo(null);
        setGain(null);
        showNotification('New game started', 'success');
    }, [showNotification]);

    const reshuffle = useCallback(() => {
        setGame(prev => ({ ...prev, board: reshuffledBoard(prev.board) }));
        setStatus('playing');
        showNotification('Board reshuffled - keep going!', 'info');
    }, [showNotification]);

    // Pointer / keyboard input

    const cellFromPoint = (clientX: number, clientY: number): Position | null => {
        const node = boardRef.current;
        if (!node) return null;
        const rect = node.getBoundingClientRect();
        const col = Math.floor((clientX - rect.left) / (rect.width / BOARD_SIZE));
        const row = Math.floor((clientY - rect.top) / (rect.height / BOARD_SIZE));
        return inBounds(row, col) ? { row, col } : null;
    };

    const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
        if (status !== 'playing' || event.button > 0) return;
        const position = cellFromPoint(event.clientX, event.clientY);
        if (!position) return;

        if (selected && isAdjacent(selected, position)) {
            dragStart.current = { position, handled: true };
            setSelected(null);
            applySwap(selected, position);
            return;
        }

        dragStart.current = { position, handled: false };
        setSelected(prev => (prev && samePosition(prev, position) ? null : position));
        setCursor(position);
    };

    const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
        const start = dragStart.current;
        if (!start || start.handled) return;
        const position = cellFromPoint(event.clientX, event.clientY);
        if (!position || samePosition(position, start.position) || !isAdjacent(start.position, position)) return;
        dragStart.current = { position: start.position, handled: true };
        setSelected(null);
        applySwap(start.position, position);
    };

    const handlePointerUp = () => {
        dragStart.current = null;
    };

    const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
        if (status !== 'playing') return;
        const deltas: Record<string, Position> = {
            ArrowUp: { row: -1, col: 0 },
            ArrowDown: { row: 1, col: 0 },
            ArrowLeft: { row: 0, col: -1 },
            ArrowRight: { row: 0, col: 1 },
        };
        const delta = deltas[event.key];
        if (delta) {
            event.preventDefault();
            const next = { row: cursor.row + delta.row, col: cursor.col + delta.col };
            if (!inBounds(next.row, next.col)) return;
            if (selected) {
                if (isAdjacent(selected, next)) {
                    const from = selected;
                    setSelected(null);
                    applySwap(from, next);
                } else {
                    setCursor(selected);
                }
                return;
            }
            setCursor(next);
            return;
        }
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            setSelected(prev => (prev && samePosition(prev, cursor) ? null : cursor));
        }
    };

    return (
        <ProjectLayout
            title="Match Blocks"
            icon={<BlocksIcon />}
            maxWidth="sm"
            containerPadding={{ xs: 1, sm: 3 }}
            actions={
                <Button variant="outlined" color="inherit" startIcon={<HelpIcon />} onClick={() => setHelpOpen(true)}>
                    How to play
                </Button>
            }
            mobileActions={
                <IconButton color="inherit" onClick={() => setHelpOpen(true)} aria-label="How to play">
                    <HelpIcon />
                </IconButton>
            }
        >
            <Box
                sx={{
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: { xs: 'center', sm: 'flex-start' },
                    minHeight: { xs: 'calc(100vh - 88px)', sm: 'auto' },
                    gap: 1.5,
                }}
            >
                {/* Score and new game */}
                <Stack
                    direction="row"
                    spacing={2}
                    sx={{
                        width: '100%',
                        maxWidth: 480,
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        position: { xs: 'absolute', sm: 'static' },
                        top: 0,
                        left: 0,
                        right: 0,
                    }}
                >
                    <Stack direction="row" spacing={1} sx={{ alignItems: 'baseline' }}>
                        <Typography variant="h5">
                            Score:{' '}
                            <Box component="span" sx={{ color: 'primary.main' }}>
                                {score}
                            </Box>
                        </Typography>
                        {gain && (
                            <Typography key={gain.id} variant="caption" sx={{ color: 'success.dark', animation: `${pop} 0.4s ease-out` }}>
                                +{gain.value}
                            </Typography>
                        )}
                    </Stack>
                    <Button variant="contained" startIcon={<NewGameIcon />} onClick={newGame} sx={{ display: { xs: 'none', sm: 'flex' } }}>
                        New Game
                    </Button>
                    <IconButton onClick={newGame} color="primary" size="medium" sx={{ display: { xs: 'flex', sm: 'none' } }} aria-label="New game">
                        <NewGameIcon />
                    </IconButton>
                </Stack>

                {/* Board */}
                <Box
                    sx={{
                        position: 'relative',
                        width: '100%',
                        maxWidth: 480,
                        p: 1,
                        bgcolor: alpha('#ffffff', 0.55),
                        border: '2px solid',
                        borderColor: alpha('#ffffff', 0.85),
                        boxShadow: '0 10px 26px rgba(46, 36, 24, 0.22)',
                    }}
                >
                    <Box
                        ref={boardRef}
                        role="grid"
                        aria-label="Match blocks board"
                        tabIndex={0}
                        onPointerDown={handlePointerDown}
                        onPointerMove={handlePointerMove}
                        onPointerUp={handlePointerUp}
                        onPointerCancel={handlePointerUp}
                        onKeyDown={handleKeyDown}
                        onFocus={event => setBoardFocused(event.currentTarget.matches(':focus-visible'))}
                        onBlur={() => setBoardFocused(false)}
                        sx={{
                            position: 'relative',
                            width: '100%',
                            aspectRatio: '1',
                            '--gap': { xs: '4px', sm: '6px' },
                            touchAction: 'none',
                            userSelect: 'none',
                            '&:focus-visible': { outline: '3px solid', outlineColor: 'warning.main', outlineOffset: 3 },
                        }}
                    >
                        {/* Slots */}
                        <Box sx={{ position: 'absolute', inset: 0, display: 'grid', gridTemplateColumns: `repeat(${BOARD_SIZE}, 1fr)`, gap: 'var(--gap)' }}>
                            {Array.from({ length: BOARD_SIZE * BOARD_SIZE }, (_, index) => (
                                <Box
                                    key={`slot-${index}`}
                                    sx={{ aspectRatio: '1', borderRadius: '8px', bgcolor: alpha('#2e2418', 0.12), boxShadow: 'inset 0 0 0 1px rgba(46, 36, 24, 0.14)' }}
                                />
                            ))}
                        </Box>

                        {/* Gems */}
                        <Box sx={{ position: 'absolute', inset: 0 }}>
                            {board.map((row, rowIndex) =>
                                row.map((gem, colIndex) => {
                                    if (!gem) return null;
                                    const position: Position = { row: rowIndex, col: colIndex };
                                    return (
                                        <Box
                                            key={gem.id}
                                            sx={{
                                                position: 'absolute',
                                                top: 0,
                                                left: 0,
                                                width: CELL_SIZE,
                                                aspectRatio: '1',
                                                transform: cellTransform(position),
                                                transition: `transform ${FALL_MS}ms ${MOVE_EASING}`,
                                            }}
                                        >
                                            <GemBlock
                                                gem={gem}
                                                selected={selected !== null && samePosition(selected, position)}
                                                focused={boardFocused && status === 'playing' && selected === null && samePosition(cursor, position)}
                                                shaking={shaking.includes(cellKey(position))}
                                                entering={enteringIds.includes(gem.id)}
                                            />
                                        </Box>
                                    );
                                })
                            )}

                            {/* Cleared gems play their pop-out on top of the board */}
                            {clearedGems.map(cleared => (
                                <Box
                                    key={`cleared-${cleared.gem.id}`}
                                    sx={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        width: CELL_SIZE,
                                        aspectRatio: '1',
                                        transform: cellTransform(cleared.position),
                                        zIndex: 2,
                                    }}
                                >
                                    <GemBlock gem={cleared.gem} dying />
                                </Box>
                            ))}
                        </Box>
                    </Box>

                    {combo && (
                        <Box
                            key={combo.id}
                            sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}
                        >
                            <Typography
                                variant="h4"
                                sx={{
                                    px: 2,
                                    py: 1,
                                    bgcolor: alpha('#2e2418', 0.75),
                                    color: 'warning.light',
                                    border: '3px solid',
                                    borderColor: 'warning.main',
                                    animation: `${pop} 0.5s ease-out`,
                                }}
                            >
                                Combo x{combo.value}!
                            </Typography>
                        </Box>
                    )}
                </Box>
            </Box>

            {/* How to play */}
            <Dialog open={helpOpen} onClose={() => setHelpOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ textAlign: 'center' }}>How to play</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                        Drag a block onto one of its neighbours, swipe it, or tap one block and then its neighbour. A swap only counts when it lines up 3 or more blocks
                        of the same color.
                    </Typography>
                    <Stack spacing={1.5}>
                        {SUPER_BLOCK_SAMPLES.map(sample => (
                            <Stack key={sample.special} direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                                <GemBlock gem={sample.gem} size={40} />
                                <Typography variant="body2">{sample.label}</Typography>
                            </Stack>
                        ))}
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
                    <Button variant="contained" onClick={() => setHelpOpen(false)}>
                        Got it
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Board locked */}
            <Dialog open={status === 'locked'} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ textAlign: 'center' }}>No more matches</DialogTitle>
                <DialogContent>
                    <Typography variant="body1" align="center">
                        No swap left on this board makes a match. Final score {score}.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ justifyContent: 'center', pb: 2, gap: 1 }}>
                    <Button variant="outlined" onClick={newGame}>
                        New game
                    </Button>
                    <Button variant="contained" onClick={reshuffle}>
                        Reshuffle board
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={3000}
                onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </ProjectLayout>
    );
};
