/**
 * PomodoroClock Component
 *
 * A customizable countdown timer that runs multi-phase, multi-round "counters".
 *
 * Related docs (update if this component changes): AGENTS.md, docs/NEW_PROJECT_TEMPLATE.md, docs/STYLES.md
 *
 * OVERVIEW:
 * Users define named counters made of rounds, where each round runs the same ordered list of
 * phases (e.g. Focus 25m -> Short Break 5m). Running a counter counts down through every phase of
 * every round. Each finished phase plays a short chime and (when allowed) a push notification;
 * when the whole counter finishes the alarm keeps ringing until it is dismissed.
 *
 * KEY FEATURES:
 * 1. Counter Editor
 *    - Set a name, the number of rounds, and an ordered list of phases (name, minutes, seconds)
 *    - Phases can be copied (duplicate), moved up/down, and deleted while editing
 *    - Live total duration shown; saving is blocked when the counter exceeds 4 hours total
 * 2. Timer Engine
 *    - Drift-free countdown computed from an end timestamp (survives tab throttling)
 *    - Start / pause / resume / reset, plus stop-and-exit
 *    - Shows round, current phase, and remaining time inside concentric progress rings:
 *      the outer ring is a clock-face dial of 60 uniform ticks that fill in as the current
 *      round progresses, the inner ring is one arc segment per round, and the digital clock
 *      fits inside the center.
 * 3. Alerts
 *    - Short chime + push notification at every phase boundary
 *    - Longer alarm when all rounds complete; it stops on its own after a while or when dismissed
 *    - OS notifications use the Web Notifications API and can be toggled off/on (the button asks
 *      again when re-enabling); in-app snackbar and sounds always play
 *    - Sound is generated with the Web Audio API (no audio files)
 * 4. Persistence
 *    - Saved counters persist in localStorage and can be started, edited, copied and deleted
 *
 * STORAGE:
 * - All counters saved to localStorage under key 'pomodoro-counters'
 * - Auto-save on every change, persists across browser sessions
 */

import { useState, useEffect, useMemo, useRef } from 'react';
import {
    Box,
    Button,
    useTheme,
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Snackbar,
    Alert,
    Typography,
    IconButton,
    Paper,
    Stack,
    Divider,
    Tooltip,
} from '@mui/material';
import { TimerIcon, AddIcon, DeleteIcon, EditIcon, CopyIcon, PlayIcon, PauseIcon, StopIcon, RefreshIcon, BellIcon, ArrowUpward, ArrowDownward } from './AppIcons';
import { ProjectLayout } from './ProjectLayout';
import { MAX_TOTAL_SECONDS, counterTotalSeconds, formatDuration } from '../types/Pomodoro';
import type { PomodoroCounter, PomodoroPhase } from '../types/Pomodoro';

const STORAGE_KEY = 'pomodoro-counters';
const NOTIFICATIONS_KEY = 'pomodoro-notifications';

const loadNotificationsPref = (): boolean => {
    try {
        return localStorage.getItem(NOTIFICATIONS_KEY) !== 'off';
    } catch {
        return true;
    }
};

const makeId = (): string => (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`);

const clampInt = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, Math.floor(value)));

const parseNumber = (raw: string): number => {
    const n = Number(raw);
    return Number.isFinite(n) ? n : 0;
};

const loadCounters = (): PomodoroCounter[] => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return [];
        const parsed = JSON.parse(stored);
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        console.error('Failed to parse stored counters:', error);
        return [];
    }
};

/**
 * --- Audio helpers (Web Audio API, no audio files) ---
 */
let audioContext: AudioContext | null = null;

const getAudioContext = (): AudioContext | null => {
    if (typeof window === 'undefined') return null;
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    if (!audioContext) {
        try {
            audioContext = new Ctor();
        } catch {
            audioContext = null;
        }
    }
    if (audioContext && audioContext.state === 'suspended') {
        void audioContext.resume();
    }
    return audioContext;
};

const playTone = (frequency: number, durationMs: number, delayMs = 0, type: OscillatorType = 'square', volume = 0.2) => {
    const ctx = getAudioContext();
    if (!ctx) return;
    try {
        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();
        oscillator.type = type;
        oscillator.frequency.value = frequency;
        const start = ctx.currentTime + delayMs / 1000;
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(volume, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + durationMs / 1000);
        oscillator.connect(gain);
        gain.connect(ctx.destination);
        oscillator.start(start);
        oscillator.stop(start + durationMs / 1000 + 0.05);
    } catch (error) {
        console.error('Failed to play tone:', error);
    }
};

/** Short "phase finished" chime. */
const playPhaseChime = () => {
    playTone(880, 180, 0);
    playTone(880, 180, 220);
    playTone(1320, 260, 440);
};

/**
 * Completion alarm: a chime pattern that repeats, longer than the phase chime, but stops on its
 * own after ~16 seconds. Returns the interval id to clear (or null when audio is unavailable).
 */
const playCompletionAlarm = (): number | null => {
    if (!getAudioContext()) return null;
    const beep = () => {
        playTone(1046, 160, 0);
        playTone(1046, 160, 200);
        playTone(784, 220, 400);
    };
    beep();
    const intervalId = window.setInterval(beep, 2200);
    window.setTimeout(() => window.clearInterval(intervalId), 16000);
    return intervalId;
};

const clearAlarm = (intervalId: number | null): void => {
    if (intervalId !== null) {
        window.clearInterval(intervalId);
    }
};

const notify = (title: string, body: string): void => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        try {
            const notification = new Notification(title, { body, icon: '/icon.svg' });
            notification.onclick = () => window.focus();
        } catch (error) {
            console.error('Failed to show notification:', error);
        }
    }
};

const requestNotificationPermission = async (): Promise<boolean> => {
    if (typeof window === 'undefined' || !('Notification' in window)) return false;
    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied') return false;
    try {
        const result = await Notification.requestPermission();
        return result === 'granted';
    } catch {
        return false;
    }
};

interface PhaseDraft {
    id: string;
    name: string;
    minutes: number;
    seconds: number;
}

interface RunStep {
    round: number;
    phaseId: string;
    phaseName: string;
    seconds: number;
}

interface RunState {
    counter: PomodoroCounter;
    counterName: string;
    steps: RunStep[];
    currentIndex: number;
    remainingMs: number;
    endAt: number | null;
    isPaused: boolean;
    finished: boolean;
}

const buildSteps = (counter: PomodoroCounter): RunStep[] => {
    const steps: RunStep[] = [];
    for (let round = 1; round <= counter.rounds; round++) {
        counter.phases.forEach(phase => {
            steps.push({ round, phaseId: phase.id, phaseName: phase.name, seconds: phase.seconds });
        });
    }
    return steps;
};

const formatCountdown = (ms: number): string => {
    const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    const mm = String(m).padStart(2, '0');
    const ss = String(s).padStart(2, '0');
    return h > 0 ? `${String(h).padStart(2, '0')}:${mm}:${ss}` : `${mm}:${ss}`;
};

interface SegmentedRingProps {
    size: number;
    radius: number;
    total: number;
    values: number[];
    stroke: number;
    gapDeg: number;
    color: string;
    trackColor: string;
}

const polarToPoint = (cx: number, cy: number, radius: number, angleDeg: number): { x: number; y: number } => {
    const radians = ((angleDeg - 90) * Math.PI) / 180;
    return { x: cx + radius * Math.cos(radians), y: cy + radius * Math.sin(radians) };
};

const describeArc = (cx: number, cy: number, radius: number, startDeg: number, endDeg: number): string => {
    const start = polarToPoint(cx, cy, radius, startDeg);
    const end = polarToPoint(cx, cy, radius, endDeg);
    const largeArcFlag = endDeg - startDeg <= 180 ? 0 : 1;
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
};

/** A ring broken into `total` arc segments (one per step); each segment fills 0..1. */
export const SegmentedRing = ({ size, radius, total, values, stroke, gapDeg, color, trackColor }: SegmentedRingProps) => {
    if (total <= 0) return null;
    const center = size / 2;
    const per = 360 / total;
    const span = per - gapDeg;
    return (
        <svg viewBox={`0 0 ${size} ${size}`} width="100%" height="100%">
            {Array.from({ length: total }, (_, i) => {
                const start = i * per + gapDeg / 2;
                const end = start + span;
                const d = describeArc(center, center, radius, start, end);
                const value = Math.min(1, Math.max(0, values[i] ?? 0));
                return (
                    <g key={i}>
                        <path d={d} fill="none" stroke={trackColor} strokeWidth={stroke} strokeLinecap="butt" pathLength={100} />
                        {value > 0 && (
                            <path
                                d={d}
                                fill="none"
                                stroke={color}
                                strokeWidth={stroke}
                                strokeLinecap="butt"
                                pathLength={100}
                                strokeDasharray={`${value * 100} 100`}
                                style={{ transition: 'stroke-dasharray 250ms linear' }}
                            />
                        )}
                    </g>
                );
            })}
        </svg>
    );
};

interface TickDialProps {
    size: number;
    radius: number;
    progress: number;
    color: string;
    trackColor: string;
}

/**
 * A clock-face dial of 60 uniform ticks (like the minute marks on a clock). The first tick sits
 * at 0 degrees (top); the ticks fill in with the accent color as the round's elapsed time passes.
 */
export const TickDial = ({ size, radius, progress, color, trackColor }: TickDialProps) => {
    const center = size / 2;
    const numTicks = 60;
    const tickLength = Math.round(size * 0.035);
    const ticks = Array.from({ length: numTicks }, (_, k) => {
        const frac = k / numTicks;
        const filled = k < progress * numTicks;
        const angle = frac * Math.PI * 2 - Math.PI / 2;
        const x1 = center + radius * Math.cos(angle);
        const y1 = center + radius * Math.sin(angle);
        const x2 = center + (radius - tickLength) * Math.cos(angle);
        const y2 = center + (radius - tickLength) * Math.sin(angle);
        return (
            <line
                key={k}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={filled ? color : trackColor}
                strokeWidth={2}
                strokeLinecap="round"
                style={{ transition: 'stroke 250ms linear' }}
            />
        );
    });
    return (
        <svg viewBox={`0 0 ${size} ${size}`} width="100%" height="100%">
            {ticks}
        </svg>
    );
};

interface ProgressClockProps {
    size: number;
    roundProgress: number;
    roundTotal: number;
    roundValues: number[];
    innerStroke: number;
}

/**
 * Progress clock: concentric rings around the countdown. The outer ring is a clock-face dial of
 * uniform ticks that fill in as the current round progresses; the inner ring is broken into one
 * arc segment per round (completed segments filled, the active segment filling up). The center
 * keeps the digital clock.
 */
export const ProgressClock = ({ size, roundProgress, roundTotal, roundValues, innerStroke }: ProgressClockProps) => {
    const theme = useTheme();
    const outerRadius = size / 2 - 18;
    const innerRadius = size * 0.335;
    return (
        <Box role="img" aria-label={`Phase and round progress`} sx={{ width: '100%', height: '100%' }}>
            <svg viewBox={`0 0 ${size} ${size}`} width="100%" height="100%">
                <TickDial size={size} radius={outerRadius} progress={roundProgress} color={theme.palette.primary.main} trackColor={theme.palette.divider} />
                {roundTotal > 0 && (
                    <SegmentedRing
                        size={size}
                        radius={innerRadius}
                        total={roundTotal}
                        values={roundValues}
                        stroke={innerStroke}
                        gapDeg={6}
                        color={theme.palette.primary.main}
                        trackColor={theme.palette.divider}
                    />
                )}
            </svg>
        </Box>
    );
};

export const PomodoroClock = () => {
    const [counters, setCounters] = useState<PomodoroCounter[]>(loadCounters);
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({
        open: false,
        message: '',
        severity: 'info',
    });
    const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(loadNotificationsPref);

    // Editor state
    const [editorOpen, setEditorOpen] = useState(false);
    const [editingCounterId, setEditingCounterId] = useState<string | null>(null);
    const [draftName, setDraftName] = useState('');
    const [draftRounds, setDraftRounds] = useState(1);
    const [draftPhases, setDraftPhases] = useState<PhaseDraft[]>([]);

    // Running state
    const [run, setRun] = useState<RunState | null>(null);
    const [completionOpen, setCompletionOpen] = useState(false);
    const alarmIntervalRef = useRef<number | null>(null);
    const runRef = useRef<RunState | null>(null);
    const notificationsRef = useRef<boolean>(notificationsEnabled);

    useEffect(() => {
        runRef.current = run;
    });

    useEffect(() => {
        notificationsRef.current = notificationsEnabled;
    });

    const showNotification = (message: string, severity: 'success' | 'error' | 'info' = 'info') => {
        setSnackbar({ open: true, message, severity });
    };

    const maybeNotify = (title: string, body: string): void => {
        if (notificationsRef.current) notify(title, body);
    };

    // Persist counters
    useEffect(() => {
        if (counters.length > 0) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(counters));
        } else {
            localStorage.removeItem(STORAGE_KEY);
        }
    }, [counters]);

    // Stop any sound + timers on unmount
    useEffect(() => {
        return () => {
            clearAlarm(alarmIntervalRef.current);
        };
    }, []);

    const isTicking = run !== null && run.endAt !== null;

    // Tick loop: recompute remaining time against the end timestamp and detect step boundaries.
    useEffect(() => {
        if (!isTicking) return;
        const interval = window.setInterval(() => {
            const current = runRef.current;
            if (!current || current.endAt === null) return;
            const remaining = current.endAt - Date.now();
            if (remaining > 0) {
                setRun({ ...current, remainingMs: remaining });
                return;
            }

            // Current step finished -> advance or finish the whole run.
            const nextIndex = current.currentIndex + 1;
            if (nextIndex < current.steps.length) {
                const next = current.steps[nextIndex];
                playPhaseChime();
                maybeNotify('Phase finished', `"${current.steps[current.currentIndex].phaseName}" done - now "${next.phaseName}"`);
                showNotification(`"${current.steps[current.currentIndex].phaseName}" done - now "${next.phaseName}"`, 'info');
                setRun({
                    ...current,
                    currentIndex: nextIndex,
                    remainingMs: next.seconds * 1000,
                    endAt: Date.now() + next.seconds * 1000,
                });
            } else {
                alarmIntervalRef.current = playCompletionAlarm();
                maybeNotify('Counter complete', `${current.counterName} finished all rounds`);
                setCompletionOpen(true);
                setRun({ ...current, remainingMs: 0, endAt: null, finished: true });
            }
        }, 250);
        return () => window.clearInterval(interval);
    }, [isTicking]);

    // --- Timer controls ---

    const handleStartCounter = (counter: PomodoroCounter) => {
        const steps = buildSteps(counter);
        setRun(() => ({
            counter,
            counterName: counter.name,
            steps,
            currentIndex: 0,
            remainingMs: steps[0].seconds * 1000,
            endAt: Date.now() + steps[0].seconds * 1000,
            isPaused: false,
            finished: false,
        }));
        if (notificationsEnabled && 'Notification' in window && Notification.permission === 'default') {
            void requestNotificationPermission().then(granted => {
                if (!granted) showNotification('OS notifications are blocked - toggle the Notifications button to retry', 'info');
            });
        }
    };

    const handlePause = () => {
        setRun(current => {
            if (!current || current.endAt === null) return current;
            return { ...current, remainingMs: Math.max(0, current.endAt - Date.now()), endAt: null, isPaused: true };
        });
    };

    const handleResume = () => {
        setRun(current => {
            if (!current || !current.isPaused) return current;
            return { ...current, endAt: Date.now() + current.remainingMs, isPaused: false };
        });
    };

    const handleReset = () => {
        setRun(current => {
            if (!current) return current;
            const first = current.steps[0];
            return { ...current, currentIndex: 0, remainingMs: first.seconds * 1000, endAt: Date.now() + first.seconds * 1000, isPaused: false };
        });
    };

    const stopRun = () => {
        clearAlarm(alarmIntervalRef.current);
        alarmIntervalRef.current = null;
        setRun(null);
        setCompletionOpen(false);
        showNotification('Timer stopped', 'info');
    };

    const handleRunAgain = () => {
        const current = runRef.current;
        if (current) handleStartCounter(current.counter);
    };

    const handleDismissAlarm = () => {
        clearAlarm(alarmIntervalRef.current);
        alarmIntervalRef.current = null;
        setCompletionOpen(false);
    };

    const handleToggleNotifications = async () => {
        if (notificationsEnabled) {
            setNotificationsEnabled(false);
            localStorage.setItem(NOTIFICATIONS_KEY, 'off');
            showNotification('OS notifications off - in-app messages and sounds still play', 'info');
            return;
        }
        const granted = await requestNotificationPermission();
        setNotificationsEnabled(granted);
        localStorage.setItem(NOTIFICATIONS_KEY, granted ? 'on' : 'off');
        showNotification(granted ? 'OS notifications enabled' : 'Notifications are blocked or unavailable', granted ? 'success' : 'error');
    };

    // --- Draft helpers ---

    const updateDraftPhase = (id: string, patch: Partial<PhaseDraft>) => {
        setDraftPhases(prev => prev.map(phase => (phase.id === id ? { ...phase, ...patch } : phase)));
    };

    const removeDraftPhase = (id: string) => {
        setDraftPhases(prev => prev.filter(phase => phase.id !== id));
    };

    const duplicateDraftPhase = (id: string) => {
        setDraftPhases(prev => {
            const index = prev.findIndex(phase => phase.id === id);
            if (index < 0) return prev;
            const copy = { ...prev[index], id: makeId(), name: prev[index].name };
            return [...prev.slice(0, index + 1), copy, ...prev.slice(index + 1)];
        });
    };

    const moveDraftPhase = (id: string, delta: number) => {
        setDraftPhases(prev => {
            const index = prev.findIndex(phase => phase.id === id);
            const target = index + delta;
            if (index < 0 || target < 0 || target >= prev.length) return prev;
            const next = [...prev];
            [next[index], next[target]] = [next[target], next[index]];
            return next;
        });
    };

    const addDraftPhase = () => {
        setDraftPhases(prev => [...prev, { id: makeId(), name: `Phase ${prev.length + 1}`, minutes: 5, seconds: 0 }]);
    };

    const openNewCounter = () => {
        setEditingCounterId(null);
        setDraftName('');
        setDraftRounds(1);
        setDraftPhases([{ id: makeId(), name: 'Focus', minutes: 25, seconds: 0 }]);
        setEditorOpen(true);
    };

    const openEditCounter = (counter: PomodoroCounter) => {
        setEditingCounterId(counter.id);
        setDraftName(counter.name);
        setDraftRounds(counter.rounds);
        setDraftPhases(
            counter.phases.map(phase => ({
                id: phase.id,
                name: phase.name,
                minutes: Math.floor(phase.seconds / 60),
                seconds: phase.seconds % 60,
            }))
        );
        setEditorOpen(true);
    };

    const draftTotalSeconds = useMemo(() => {
        const perRound = draftPhases.reduce((sum, phase) => sum + Math.max(0, phase.minutes) * 60 + Math.max(0, phase.seconds), 0);
        return perRound * Math.max(0, draftRounds);
    }, [draftPhases, draftRounds]);

    const draftValid =
        draftName.trim().length > 0 &&
        draftRounds >= 1 &&
        draftPhases.length > 0 &&
        draftPhases.every(phase => phase.minutes >= 0 && phase.seconds >= 0 && phase.minutes * 60 + phase.seconds > 0) &&
        draftTotalSeconds > 0 &&
        draftTotalSeconds <= MAX_TOTAL_SECONDS;

    const handleSaveCounter = () => {
        if (!draftValid) {
            showNotification(draftTotalSeconds > MAX_TOTAL_SECONDS ? 'Total time exceeds 4 hours' : 'Fix the counter details to save', 'error');
            return;
        }
        const phases: PomodoroPhase[] = draftPhases.map(phase => ({
            id: phase.id,
            name: phase.name.trim() || 'Phase',
            seconds: phase.minutes * 60 + phase.seconds,
        }));
        const now = Date.now();
        if (editingCounterId) {
            setCounters(prev =>
                prev.map(counter =>
                    counter.id === editingCounterId ? { ...counter, name: draftName.trim(), rounds: clampInt(draftRounds, 1, 500), phases, updatedAt: now } : counter
                )
            );
            showNotification('Counter updated', 'success');
        } else {
            const newCounter: PomodoroCounter = {
                id: makeId(),
                name: draftName.trim(),
                rounds: clampInt(draftRounds, 1, 500),
                phases,
                createdAt: now,
                updatedAt: now,
            };
            setCounters(prev => [...prev, newCounter]);
            showNotification('Counter saved', 'success');
        }
        setEditorOpen(false);
    };

    const deleteCounter = (counter: PomodoroCounter) => {
        setCounters(prev => prev.filter(entry => entry.id !== counter.id));
        showNotification('Counter deleted', 'success');
    };

    const duplicateCounter = (counter: PomodoroCounter) => {
        const now = Date.now();
        const copy: PomodoroCounter = {
            ...counter,
            id: makeId(),
            name: counter.name,
            createdAt: now,
            updatedAt: now,
            phases: counter.phases.map(phase => ({ ...phase, id: makeId() })),
        };
        setCounters(prev => [...prev, copy]);
        showNotification('Counter copied', 'success');
    };

    // --- Run view ---

    if (run) {
        const step = run.steps[run.currentIndex];
        const totalRounds = run.steps[run.steps.length - 1].round;
        const phasesPerRound = Math.floor(run.steps.length / totalRounds);
        const phaseIndexInRound = run.currentIndex % phasesPerRound;
        const currentPhaseFill = Math.min(1, Math.max(0, 1 - run.remainingMs / (step.seconds * 1000)));
        const roundStart = (step.round - 1) * phasesPerRound;
        const currentRoundPhases = run.steps.slice(roundStart, roundStart + phasesPerRound);
        const completedSeconds = currentRoundPhases.slice(0, phaseIndexInRound).reduce((sum, entry) => sum + entry.seconds, 0);
        const roundTotalSeconds = currentRoundPhases.reduce((sum, entry) => sum + entry.seconds, 0);
        const roundProgress = completedSeconds + currentPhaseFill * step.seconds;
        const displayProgress = run.finished ? 0 : roundProgress / roundTotalSeconds;
        const roundValues = Array.from({ length: totalRounds }, (_, index) => {
            const number = index + 1;
            if (run.finished) return 0;
            if (number < step.round) return 1;
            if (number === step.round) return roundProgress / roundTotalSeconds;
            return 0;
        });

        return (
            <ProjectLayout title="Pomodoro Clock" icon={<TimerIcon />}>
                <Paper sx={{ p: { xs: 3, sm: 5 }, mt: 2, textAlign: 'center' }}>
                    <Typography variant="overline" color="text.secondary">
                        {run.counterName}
                    </Typography>

                    <Box sx={{ display: 'flex', justifyContent: 'center', my: 1 }}>
                        <Box sx={{ position: 'relative', width: { xs: 340, sm: 470 }, height: { xs: 340, sm: 470 } }}>
                            <ProgressClock size={470} roundProgress={displayProgress} roundTotal={totalRounds} roundValues={roundValues} innerStroke={14} />
                            <Box
                                sx={{
                                    position: 'absolute',
                                    inset: 0,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    textAlign: 'center',
                                    px: 1,
                                }}
                            >
                                <Typography variant="overline" color="text.secondary">
                                    Round {step.round} / {totalRounds}
                                </Typography>
                                <Typography variant="h2" sx={{ fontSize: { xs: '1.95rem', sm: '2.9rem' }, lineHeight: 1.1, my: 0.5 }}>
                                    {formatCountdown(run.remainingMs)}
                                </Typography>
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{ maxWidth: '80%', whiteSpace: 'normal', overflowWrap: 'anywhere', lineHeight: 1.15, fontSize: '0.78rem' }}
                                >
                                    {step.phaseName}
                                </Typography>
                            </Box>
                        </Box>
                    </Box>

                    <Stack direction="row" spacing={2} sx={{ justifyContent: 'center', flexWrap: 'wrap', mt: 1 }}>
                        {run.finished ? (
                            <>
                                <Button variant="contained" startIcon={<RefreshIcon />} onClick={handleRunAgain} sx={{ display: { xs: 'none', sm: 'flex' } }}>
                                    Run Again
                                </Button>
                                <IconButton onClick={handleRunAgain} color="primary" aria-label="Run again" sx={{ display: { xs: 'flex', sm: 'none' } }}>
                                    <RefreshIcon />
                                </IconButton>
                            </>
                        ) : (
                            <>
                                <Button
                                    variant="contained"
                                    startIcon={run.isPaused ? <PlayIcon /> : <PauseIcon />}
                                    onClick={run.isPaused ? handleResume : handlePause}
                                    sx={{ display: { xs: 'none', sm: 'flex' } }}
                                >
                                    {run.isPaused ? 'Resume' : 'Pause'}
                                </Button>
                                <IconButton
                                    onClick={run.isPaused ? handleResume : handlePause}
                                    color="primary"
                                    aria-label={run.isPaused ? 'Resume' : 'Pause'}
                                    sx={{ display: { xs: 'flex', sm: 'none' } }}
                                >
                                    {run.isPaused ? <PlayIcon /> : <PauseIcon />}
                                </IconButton>

                                <Button variant="outlined" startIcon={<RefreshIcon />} onClick={handleReset} sx={{ display: { xs: 'none', sm: 'flex' } }}>
                                    Reset
                                </Button>
                                <IconButton onClick={handleReset} color="primary" aria-label="Reset" sx={{ display: { xs: 'flex', sm: 'none' } }}>
                                    <RefreshIcon />
                                </IconButton>
                            </>
                        )}

                        <Button variant="outlined" color="error" startIcon={<StopIcon />} onClick={stopRun} sx={{ display: { xs: 'none', sm: 'flex' } }}>
                            Stop & Exit
                        </Button>
                        <IconButton onClick={stopRun} color="error" aria-label="Stop and exit" sx={{ display: { xs: 'flex', sm: 'none' } }}>
                            <StopIcon />
                        </IconButton>
                    </Stack>
                </Paper>

                <Snackbar
                    open={snackbar.open}
                    autoHideDuration={3000}
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                >
                    <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
                        {snackbar.message}
                    </Alert>
                </Snackbar>
            </ProjectLayout>
        );
    }

    // --- Counter list view ---

    return (
        <ProjectLayout title="Pomodoro Clock" icon={<TimerIcon />}>
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap', mb: 3 }}>
                <Button variant="outlined" startIcon={<BellIcon />} onClick={handleToggleNotifications} sx={{ display: { xs: 'none', sm: 'flex' } }}>
                    Notifications: {notificationsEnabled ? 'On' : 'Off'}
                </Button>
                <Button variant="outlined" startIcon={<BellIcon />} onClick={handleToggleNotifications} sx={{ display: { xs: 'flex', sm: 'none' } }}>
                    {notificationsEnabled ? 'On' : 'Off'}
                </Button>
                <Button variant="contained" startIcon={<AddIcon />} onClick={openNewCounter} sx={{ display: { xs: 'none', sm: 'flex' } }}>
                    New Counter
                </Button>
                <IconButton onClick={openNewCounter} color="primary" aria-label="New counter" sx={{ display: { xs: 'flex', sm: 'none' } }}>
                    <AddIcon />
                </IconButton>
            </Box>
            {counters.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                    <TimerIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h5" gutterBottom>
                        No Counters Yet
                    </Typography>
                    <Typography color="text.secondary" sx={{ mb: 3 }}>
                        Create a counter with phases and rounds to start your Pomodoro routine
                    </Typography>
                    <Button variant="contained" size="large" startIcon={<AddIcon />} onClick={openNewCounter}>
                        Create Counter
                    </Button>
                </Box>
            ) : (
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', md: 'repeat(3, minmax(0, 1fr))' }, gap: 2 }}>
                    {counters.map(counter => (
                        <Paper key={counter.id} sx={{ p: 2, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                            <Typography variant="h5" noWrap title={counter.name}>
                                {counter.name}
                            </Typography>
                            <Typography variant="body2" noWrap>
                                {counter.phases.length} phases · {counter.rounds} rounds · {formatDuration(counterTotalSeconds(counter))}
                            </Typography>
                            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                                <Button
                                    variant="contained"
                                    size="small"
                                    startIcon={<PlayIcon />}
                                    onClick={() => handleStartCounter(counter)}
                                    sx={{ display: { xs: 'none', sm: 'flex' } }}
                                >
                                    Start
                                </Button>
                                <IconButton
                                    onClick={() => handleStartCounter(counter)}
                                    color="primary"
                                    aria-label={`Start ${counter.name}`}
                                    sx={{ display: { xs: 'flex', sm: 'none' } }}
                                >
                                    <PlayIcon />
                                </IconButton>
                                <Box sx={{ flexGrow: 1 }} />
                                <Tooltip title="Edit">
                                    <IconButton onClick={() => openEditCounter(counter)} aria-label={`Edit ${counter.name}`} size="small">
                                        <EditIcon />
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title="Copy">
                                    <IconButton onClick={() => duplicateCounter(counter)} aria-label={`Copy ${counter.name}`} size="small">
                                        <CopyIcon />
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title="Delete">
                                    <IconButton onClick={() => deleteCounter(counter)} aria-label={`Delete ${counter.name}`} size="small">
                                        <DeleteIcon />
                                    </IconButton>
                                </Tooltip>
                            </Stack>
                        </Paper>
                    ))}
                </Box>
            )}

            {/* Editor dialog */}
            <Dialog open={editorOpen} onClose={() => setEditorOpen(false)} fullWidth maxWidth="md">
                <DialogTitle>{editingCounterId ? 'Edit Counter' : 'New Counter'}</DialogTitle>
                <DialogContent dividers>
                    <Stack spacing={2}>
                        <TextField
                            label="Counter name"
                            value={draftName}
                            onChange={event => setDraftName(event.target.value)}
                            fullWidth
                            required
                            slotProps={{ htmlInput: { maxLength: 50 } }}
                        />
                        <TextField
                            label="Rounds"
                            type="number"
                            value={draftRounds}
                            onChange={event => setDraftRounds(clampInt(parseNumber(event.target.value), 1, 500))}
                            slotProps={{ htmlInput: { min: 1, max: 500 } }}
                            sx={{ width: { xs: '100%', sm: 160 } }}
                        />
                        <Typography variant="overline" color="text.secondary">
                            Phases
                        </Typography>
                        {draftPhases.map((phase, index) => (
                            <Paper key={phase.id} variant="outlined" sx={{ p: 1.5 }}>
                                <Stack spacing={1}>
                                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                                        <Typography variant="h6" sx={{ minWidth: 28, textAlign: 'center' }}>
                                            {index + 1}
                                        </Typography>
                                        <TextField
                                            label="Phase name"
                                            value={phase.name}
                                            size="small"
                                            fullWidth
                                            onChange={event => updateDraftPhase(phase.id, { name: event.target.value })}
                                            slotProps={{ htmlInput: { maxLength: 30 } }}
                                        />
                                    </Stack>
                                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
                                        <TextField
                                            label="Min"
                                            type="number"
                                            size="small"
                                            value={phase.minutes}
                                            onChange={event => updateDraftPhase(phase.id, { minutes: clampInt(parseNumber(event.target.value), 0, 240) })}
                                            slotProps={{ htmlInput: { min: 0, max: 240 } }}
                                            sx={{ width: 92 }}
                                        />
                                        <TextField
                                            label="Sec"
                                            type="number"
                                            size="small"
                                            value={phase.seconds}
                                            onChange={event => updateDraftPhase(phase.id, { seconds: clampInt(parseNumber(event.target.value), 0, 59) })}
                                            slotProps={{ htmlInput: { min: 0, max: 59 } }}
                                            sx={{ width: 92 }}
                                        />
                                        <IconButton onClick={() => duplicateDraftPhase(phase.id)} aria-label={`Copy phase ${index + 1}`} size="small">
                                            <CopyIcon />
                                        </IconButton>
                                        <IconButton
                                            onClick={() => moveDraftPhase(phase.id, -1)}
                                            disabled={index === 0}
                                            aria-label={`Move phase ${index + 1} up`}
                                            size="small"
                                        >
                                            <ArrowUpward />
                                        </IconButton>
                                        <IconButton
                                            onClick={() => moveDraftPhase(phase.id, 1)}
                                            disabled={index === draftPhases.length - 1}
                                            aria-label={`Move phase ${index + 1} down`}
                                            size="small"
                                        >
                                            <ArrowDownward />
                                        </IconButton>
                                        <IconButton onClick={() => removeDraftPhase(phase.id)} aria-label={`Delete phase ${index + 1}`} size="small">
                                            <DeleteIcon />
                                        </IconButton>
                                    </Stack>
                                </Stack>
                            </Paper>
                        ))}
                        <Button variant="outlined" startIcon={<AddIcon />} onClick={addDraftPhase} sx={{ alignSelf: 'flex-start' }}>
                            Add Phase
                        </Button>
                        <Divider />
                        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                            <Typography variant="body2">
                                Total: <strong>{formatDuration(draftTotalSeconds)}</strong>
                                {draftTotalSeconds > MAX_TOTAL_SECONDS && (
                                    <Typography component="span" color="error">
                                        {' '}
                                        - exceeds the 4 hour limit
                                    </Typography>
                                )}
                            </Typography>
                        </Stack>
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEditorOpen(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleSaveCounter} disabled={!draftValid}>
                        Save
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Completion dialog */}
            <Dialog open={completionOpen} fullWidth maxWidth="xs">
                <DialogTitle>All Rounds Complete</DialogTitle>
                <DialogContent>
                    <Typography color="text.secondary">The counter is finished. The alarm will stop on its own; dismiss it to keep the clock on screen.</Typography>
                </DialogContent>
                <DialogActions>
                    <Button variant="contained" startIcon={<StopIcon />} onClick={handleDismissAlarm}>
                        Dismiss Alarm
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={3000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </ProjectLayout>
    );
};
