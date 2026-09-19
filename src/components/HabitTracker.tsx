/**
 * HabitTracker Component
 *
 * Daily habit and avoidance streak tracker that rewards consistent streaks with collectible
 * badge ranks (Bronze, Silver, Gold, Platinum, Diamond).
 *
 * Related docs (update if this component changes): AGENTS.md, docs/NEW_PROJECT_TEMPLATE.md, docs/STYLES.md
 *
 * OVERVIEW:
 * Each habit is a plain card showing its name and a progress bar, with the earned badge overlaid
 * on the right end of the card. A card is CLICKABLE when it still has an action to record today
 * and UNCLICKABLE (dimmed) once that day's action has been handled — no further tapping is needed
 * and no "already marked" messages are shown. In "Count up" mode the card tap marks today as done
 * and grows the streak; in "Count down" mode the card tap deliberately breaks the streak. Reaching
 * the target streak attaches the next badge, and any broken streak clears it back to 0 (badge removed).
 *
 * KEY FEATURES:
 * 1. Add / edit / delete habits - name, target streak (5-99), and mode; validated via Dialog.
 *    While habits exist the toolbar offers Add, Edit and Delete actions.
 * 2. Edit flow - the "Edit" toolbar button opens a picker dialog to choose the one habit to edit,
 *    then the edit form opens prefilled.
 * 3. Delete flow - the "Delete" toolbar button opens a multi-select dialog; checking several
 *    habits and confirming removes them all.
 * 4. Clickable / unclickable cards - a card is clickable while the daily action is still pending;
 *    after it is marked done (count up) or broken (count down) today — or once the top badge is
 *    reached — the card switches to unclickable (dimmed) instead of showing a message.
 * 5. Count up mode - tap the card each day you do the habit (+1 per completed day; a missed day
 *    resets the streak, level and badge).
 * 6. Count down mode - every day you DON'T do the habit adds +1; tapping the card breaks the
 *    streak, resetting the level and removing the badge.
 * 7. Minimal cards - only the habit name and a progress bar; no level or streak numbers are
 *    shown. The badge is a smaller absolute overlay on the right end of the card and does not
 *    affect the card's size.
 * 8. Badge system - reaching the target streak attaches the next badge image to the card (50
 *    badges across 5 ranks). Any broken streak resets the level to 0 and removes the badge.
 * 9. Rollover processing - reverse-mode habits advance automatically on load, on focus, and via
 *    an interval; stale count-up streaks reset after a missed day.
 * 10. Badge art - rendered from the badge_<rank>.png sprite sheets using background-position crops.
 *
 * STORAGE:
 * - All data saved to localStorage under key 'habit-tracker-habits'
 * - Auto-save on every change, persists across browser sessions
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import {
    Alert,
    Box,
    Button,
    Card,
    CardActionArea,
    CardContent,
    Checkbox,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    LinearProgress,
    List,
    ListItem,
    ListItemButton,
    ListItemText,
    Snackbar,
    Stack,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
    Typography,
} from '@mui/material';
import { ProjectLayout } from './ProjectLayout';
import { AddIcon, DeleteIcon, EditIcon, MedalIcon } from './AppIcons';
import { MAX_LEVEL, MAX_TARGET, MIN_TARGET, RANKS, type BadgeRank, type Habit, type HabitMode } from '../types/Habit';
import badgesBronze from '../assets/badges_bronze.png';
import badgesSilver from '../assets/badges_silver.png';
import badgesGold from '../assets/badges_gold.png';
import badgesPlatinum from '../assets/badges_platinum.png';
import badgesDiamond from '../assets/badges_diamond.png';

const STORAGE_KEY = 'habit-tracker-habits';

const BADGE_SHEET_SIZE = 816;
const BADGE_COL_CENTERS = [107, 268, 418, 568, 720];
const BADGE_ROW_TOPS = [156, 417];
const BADGE_WIDTH = 150;
const BADGE_HEIGHT = 210;

const BADGE_SHEETS: Record<BadgeRank, string> = {
    bronze: badgesBronze,
    silver: badgesSilver,
    gold: badgesGold,
    platinum: badgesPlatinum,
    diamond: badgesDiamond,
};

const loadHabits = (): Habit[] => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return [];
        const parsed: unknown = JSON.parse(stored);
        return Array.isArray(parsed) ? (parsed as Habit[]) : [];
    } catch (error) {
        console.error('Failed to parse stored habits:', error);
        return [];
    }
};

const toDateKey = (date: Date): string => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

const todayKey = (): string => toDateKey(new Date());

const keyToDate = (key: string): Date => {
    const [y, m, d] = key.split('-').map(Number);
    return new Date(y, m - 1, d);
};

const addDaysKey = (key: string, days: number): string => {
    const date = keyToDate(key);
    date.setDate(date.getDate() + days);
    return toDateKey(date);
};

const daysBetweenKeys = (from: string, to: string): number => {
    return Math.round((keyToDate(to).getTime() - keyToDate(from).getTime()) / 86400000);
};

const getBadgeCropX = (badgeNumber: number): number => {
    const col = (badgeNumber - 1) % 5;
    return BADGE_COL_CENTERS[col] - BADGE_WIDTH / 2;
};

const getBadgeCropY = (badgeNumber: number): number => {
    const row = Math.floor((badgeNumber - 1) / 5);
    return BADGE_ROW_TOPS[row];
};

const getBadgeStyle = (level: number, size: number): CSSProperties | null => {
    if (level < 1 || level > MAX_LEVEL) return null;
    const rank = RANKS[Math.floor((level - 1) / 10)];
    const badgeNumber = ((level - 1) % 10) + 1;
    const scale = size / BADGE_WIDTH;
    return {
        width: size,
        height: BADGE_HEIGHT * scale,
        backgroundImage: `url(${BADGE_SHEETS[rank]})`,
        backgroundSize: `${BADGE_SHEET_SIZE * scale}px ${BADGE_SHEET_SIZE * scale}px`,
        backgroundPosition: `${-getBadgeCropX(badgeNumber) * scale}px ${-getBadgeCropY(badgeNumber) * scale}px`,
        backgroundRepeat: 'no-repeat',
    };
};

const applyLevelUps = (habit: Habit, nextStreak: number): { habit: Habit; levelUps: number } => {
    let streak = nextStreak;
    let level = habit.level;
    let levelUps = 0;
    while (level < MAX_LEVEL && streak >= habit.targetStreak) {
        streak -= habit.targetStreak;
        level += 1;
        levelUps += 1;
    }
    if (level >= MAX_LEVEL && streak > habit.targetStreak) {
        streak = habit.targetStreak;
    }
    return { habit: { ...habit, streak, level }, levelUps };
};

const rolloverReverse = (habit: Habit): Habit => {
    const today = todayKey();
    if (!habit.lastProcessedDate || habit.lastProcessedDate >= today) return habit;
    const days = daysBetweenKeys(habit.lastProcessedDate, today);
    if (days <= 0) return habit;
    return applyLevelUps({ ...habit, lastProcessedDate: today }, habit.streak + days).habit;
};

const staleDefault = (habit: Habit): Habit => {
    if (!habit.lastDoneDate) return habit;
    const days = daysBetweenKeys(habit.lastDoneDate, todayKey());
    if (days > 1) {
        if (habit.streak === 0 && habit.level === 0) return habit;
        return { ...habit, streak: 0, level: 0 };
    }
    return habit;
};

const tickHabits = (habits: Habit[]): { habits: Habit[]; leveledUp: number; forward: number } => {
    let changed = false;
    let leveledUp = 0;
    let forward = 0;
    const next = habits.map(habit => {
        if (habit.mode === 'reverse') {
            const rolled = rolloverReverse(habit);
            if (rolled !== habit) {
                changed = true;
                if (rolled.streak > habit.streak) forward += rolled.streak - habit.streak;
                if (rolled.level > habit.level) leveledUp += rolled.level - habit.level;
                return rolled;
            }
        } else {
            const stale = staleDefault(habit);
            if (stale !== habit) {
                changed = true;
                return stale;
            }
        }
        return habit;
    });
    return changed ? { habits: next, leveledUp, forward } : { habits, leveledUp, forward };
};

interface BadgeSpriteProps {
    level: number;
    size: number;
}

const isHabitClickable = (habit: Habit): boolean => {
    if (habit.level >= MAX_LEVEL) return false;
    const today = todayKey();
    if (habit.mode === 'default') return habit.lastDoneDate !== today;
    return habit.lastBreakDate !== today;
};

const BadgeSprite = ({ level, size }: BadgeSpriteProps) => {
    const style = getBadgeStyle(level, size);
    if (!style) return null;
    return <Box sx={{ ...style }} />;
};

interface HabitCardProps {
    habit: Habit;
    onMark: (habit: Habit) => void;
}

const HabitCard = ({ habit, onMark }: HabitCardProps) => {
    const progressPct = Math.min(100, Math.round((habit.streak / habit.targetStreak) * 100));
    const clickable = isHabitClickable(habit);
    return (
        <Card
            elevation={2}
            sx={{
                position: 'relative',
                overflow: 'visible',
                ...(clickable ? {} : { opacity: 0.55, filter: 'grayscale(0.9)' }),
            }}
        >
            <CardActionArea disabled={!clickable} onClick={() => onMark(habit)}>
                <CardContent sx={{ pr: habit.level >= 1 ? 7 : 2 }}>
                    <Stack spacing={1.5}>
                        <Typography
                            variant="h6"
                            noWrap
                            sx={{
                                fontFamily: '"VT323", "Courier New", monospace',
                                fontSize: { xs: 22, sm: 26 },
                                fontWeight: 700,
                                lineHeight: 1.15,
                            }}
                        >
                            {habit.name}
                        </Typography>
                        <LinearProgress variant="determinate" value={progressPct} />
                    </Stack>
                </CardContent>
            </CardActionArea>
            {habit.level >= 1 && (
                <Box sx={{ position: 'absolute', top: '50%', right: 8, transform: 'translateY(-50%)', display: 'flex', pointerEvents: 'none', zIndex: 1 }}>
                    <BadgeSprite level={habit.level} size={40} />
                </Box>
            )}
        </Card>
    );
};

const actionLabel = (mode: HabitMode): string => (mode === 'default' ? 'Count up' : 'Count down');

export const HabitTracker = () => {
    const [habits, setHabits] = useState<Habit[]>(loadHabits);
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({
        open: false,
        message: '',
        severity: 'info',
    });
    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState<Habit | null>(null);
    const [formName, setFormName] = useState('');
    const [formTarget, setFormTarget] = useState('10');
    const [formMode, setFormMode] = useState<HabitMode>('default');
    const [breakCandidate, setBreakCandidate] = useState<Habit | null>(null);
    const [editPickerOpen, setEditPickerOpen] = useState(false);
    const [deletePickerOpen, setDeletePickerOpen] = useState(false);
    const [deleteSelection, setDeleteSelection] = useState<string[]>([]);
    const [celebration, setCelebration] = useState<{ habit: Habit; levels: number } | null>(null);

    const habitsRef = useRef<Habit[]>(habits);
    useEffect(() => {
        habitsRef.current = habits;
    }, [habits]);

    const showNotification = useCallback((message: string, severity: 'success' | 'error' | 'info' = 'info') => {
        setSnackbar({ open: true, message, severity });
    }, []);

    // Auto-save on every change
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(habits));
    }, [habits]);

    // Process reverse-mode rollovers and stale count-up streaks on load, focus, and every minute
    useEffect(() => {
        const run = () => {
            const result = tickHabits(habitsRef.current);
            if (result.habits === habitsRef.current) return;
            habitsRef.current = result.habits;
            setHabits(result.habits);
            if (result.leveledUp > 0) {
                showNotification('Target streak reached while you were away — badge earned!', 'success');
            } else if (result.forward > 0) {
                showNotification('New days were counted toward your streaks.', 'info');
            }
        };
        run();
        const interval = setInterval(run, 60000);
        const onVisibility = () => {
            if (!document.hidden) run();
        };
        window.addEventListener('focus', onVisibility);
        document.addEventListener('visibilitychange', onVisibility);
        return () => {
            clearInterval(interval);
            window.removeEventListener('focus', onVisibility);
            document.removeEventListener('visibilitychange', onVisibility);
        };
    }, [showNotification]);

    const openAdd = () => {
        setEditing(null);
        setFormName('');
        setFormTarget('10');
        setFormMode('default');
        setFormOpen(true);
    };

    const openEdit = (habit: Habit) => {
        setEditing(habit);
        setFormName(habit.name);
        setFormTarget(String(habit.targetStreak));
        setFormMode(habit.mode);
        setFormOpen(true);
    };

    const openEditPicker = () => {
        setEditPickerOpen(true);
    };

    const openDeletePicker = () => {
        setDeleteSelection([]);
        setDeletePickerOpen(true);
    };

    const toggleDeleteSelection = (id: string) => {
        setDeleteSelection(prev => (prev.includes(id) ? prev.filter(entry => entry !== id) : [...prev, id]));
    };

    const handleSave = () => {
        const name = formName.trim();
        const target = Number(formTarget);
        if (!name) {
            showNotification('Please enter a habit name.', 'error');
            return;
        }
        if (!Number.isInteger(target) || target < MIN_TARGET || target > MAX_TARGET) {
            showNotification(`Target streak must be a whole number between ${MIN_TARGET} and ${MAX_TARGET}.`, 'error');
            return;
        }
        if (editing) {
            const progressChanged = editing.targetStreak !== target || editing.mode !== formMode;
            const updated: Habit = progressChanged
                ? {
                      ...editing,
                      name,
                      targetStreak: target,
                      mode: formMode,
                      level: 0,
                      streak: 0,
                      lastDoneDate: null,
                      lastProcessedDate: formMode === 'reverse' ? todayKey() : null,
                      lastBreakDate: null,
                  }
                : { ...editing, name };
            setHabits(prev => prev.map(habit => (habit.id === editing.id ? updated : habit)));
            setFormOpen(false);
            showNotification('Habit updated.', 'success');
        } else {
            const habit: Habit = {
                id: crypto.randomUUID(),
                name,
                targetStreak: target,
                mode: formMode,
                level: 0,
                streak: 0,
                lastDoneDate: null,
                lastProcessedDate: formMode === 'reverse' ? todayKey() : null,
                lastBreakDate: null,
                createdAt: Date.now(),
            };
            setHabits(prev => [...prev, habit]);
            setFormOpen(false);
            if (formMode === 'reverse') {
                showNotification(`${name} added. Goal: ${target} clean days in a row.`, 'success');
            } else {
                showNotification(`${name} added. Goal: ${target}-day streak.`, 'success');
            }
        }
    };

    const handleDone = (habit: Habit) => {
        const today = todayKey();
        if (habit.lastDoneDate === today) return;
        const isConsecutive = habit.lastDoneDate === addDaysKey(today, -1);
        const nextStreak = isConsecutive ? habit.streak + 1 : 1;
        const result = applyLevelUps({ ...habit, lastDoneDate: today, streak: nextStreak }, nextStreak);
        setHabits(prev => prev.map(item => (item.id === habit.id ? result.habit : item)));
        if (result.levelUps > 0) {
            setCelebration({ habit: result.habit, levels: result.levelUps });
        } else {
            showNotification(`${habit.name}: done today! Streak is now ${result.habit.streak}.`, 'success');
        }
    };

    const handleBreakRequest = (habit: Habit) => {
        if (habit.lastBreakDate === todayKey()) return;
        setBreakCandidate(habit);
    };

    const confirmBreak = () => {
        if (!breakCandidate) return;
        const today = todayKey();
        const updated: Habit = { ...breakCandidate, level: 0, streak: 0, lastBreakDate: today, lastProcessedDate: today };
        setHabits(prev => prev.map(item => (item.id === breakCandidate.id ? updated : item)));
        setBreakCandidate(null);
        showNotification(`${breakCandidate.name}: streak broken, level reset and badge removed.`, 'error');
    };

    const confirmDeleteSelected = () => {
        if (deleteSelection.length === 0) {
            showNotification('Select at least one habit to delete.', 'error');
            return;
        }
        const count = deleteSelection.length;
        setHabits(prev => prev.filter(habit => !deleteSelection.includes(habit.id)));
        setDeletePickerOpen(false);
        setDeleteSelection([]);
        showNotification(`${count} habit${count === 1 ? '' : 's'} deleted.`, 'info');
    };

    const handleMark = (habit: Habit) => {
        if (habit.mode === 'default') {
            handleDone(habit);
        } else {
            handleBreakRequest(habit);
        }
    };

    return (
        <ProjectLayout title="Habit Tracker" icon={<MedalIcon />}>
            {habits.length === 0 ? (
                <Stack direction="column" spacing={2} sx={{ alignItems: 'center', py: 8, textAlign: 'center' }}>
                    <Box sx={{ color: 'primary.main', display: 'flex' }}>
                        <MedalIcon fontSize={56} />
                    </Box>
                    <Typography variant="h5">No Habits Yet</Typography>
                    <Typography variant="body1" color="text.secondary">
                        Create a habit and tap its card each day to earn badges.
                    </Typography>
                    <Stack direction="row" spacing={2} sx={{ justifyContent: 'center' }}>
                        <Button variant="contained" startIcon={<AddIcon />} onClick={openAdd} sx={{ display: { xs: 'none', sm: 'flex' } }}>
                            Add Habit
                        </Button>
                        <IconButton onClick={openAdd} color="primary" sx={{ display: { xs: 'flex', sm: 'none' } }} aria-label="Add habit">
                            <AddIcon />
                        </IconButton>
                    </Stack>
                </Stack>
            ) : (
                <>
                    <Stack direction="row" spacing={2} sx={{ justifyContent: 'center', mb: 3 }}>
                        <Button variant="contained" startIcon={<AddIcon />} onClick={openAdd} sx={{ display: { xs: 'none', sm: 'flex' } }}>
                            Add Habit
                        </Button>
                        <Button variant="outlined" startIcon={<EditIcon />} onClick={openEditPicker} sx={{ display: { xs: 'none', sm: 'flex' } }}>
                            Edit
                        </Button>
                        <Button variant="outlined" color="error" startIcon={<DeleteIcon />} onClick={openDeletePicker} sx={{ display: { xs: 'none', sm: 'flex' } }}>
                            Delete
                        </Button>
                        <IconButton onClick={openAdd} color="primary" sx={{ display: { xs: 'flex', sm: 'none' } }} aria-label="Add habit">
                            <AddIcon />
                        </IconButton>
                        <IconButton onClick={openEditPicker} sx={{ display: { xs: 'flex', sm: 'none' } }} aria-label="Edit habit">
                            <EditIcon fontSize={20} />
                        </IconButton>
                        <IconButton onClick={openDeletePicker} color="error" sx={{ display: { xs: 'flex', sm: 'none' } }} aria-label="Delete habits">
                            <DeleteIcon fontSize={20} />
                        </IconButton>
                    </Stack>
                    <Box
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
                            gap: 3,
                        }}
                    >
                        {habits.map(habit => (
                            <HabitCard key={habit.id} habit={habit} onMark={handleMark} />
                        ))}
                    </Box>
                </>
            )}

            {/* Add / edit dialog */}
            <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>{editing ? 'Edit Habit' : 'Add Habit'}</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ pt: 1 }}>
                        <TextField label="Habit name" value={formName} onChange={event => setFormName(event.target.value)} fullWidth variant="outlined" autoFocus />
                        <TextField
                            label="Target streak (days)"
                            type="number"
                            value={formTarget}
                            onChange={event => setFormTarget(event.target.value)}
                            helperText={`Goal to reach for a level up — between ${MIN_TARGET} and ${MAX_TARGET} days.`}
                            slotProps={{ htmlInput: { min: MIN_TARGET, max: MAX_TARGET, inputMode: 'numeric' } }}
                            fullWidth
                            variant="outlined"
                        />
                        <ToggleButtonGroup
                            value={formMode}
                            exclusive
                            onChange={(_, value: HabitMode | null) => {
                                if (value) setFormMode(value);
                            }}
                            fullWidth
                        >
                            <ToggleButton value="default" aria-label="Count up mode">
                                Count up
                            </ToggleButton>
                            <ToggleButton value="reverse" aria-label="Count down mode">
                                Count down
                            </ToggleButton>
                        </ToggleButtonGroup>
                        <Typography variant="caption" color="text.secondary">
                            {formMode === 'default'
                                ? 'Count up: tap the card each day you do the habit (a missed day resets the badge).'
                                : "Count down: each day you DON'T do the habit adds +1; tapping the card breaks the streak and removes the badge."}
                        </Typography>
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setFormOpen(false)}>Cancel</Button>
                    <Button onClick={handleSave} variant="contained">
                        {editing ? 'Save' : 'Add Habit'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Pick habit to edit */}
            <Dialog open={editPickerOpen} onClose={() => setEditPickerOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Edit habit</DialogTitle>
                <DialogContent sx={{ p: 0, pt: 1 }}>
                    <List disablePadding>
                        {habits.map(habit => (
                            <ListItemButton
                                key={habit.id}
                                onClick={() => {
                                    openEdit(habit);
                                    setEditPickerOpen(false);
                                }}
                            >
                                <ListItemText primary={habit.name} secondary={`Target: ${habit.targetStreak} days · ${actionLabel(habit.mode)}`} sx={{ mr: 2 }} />
                                {habit.level >= 1 && <BadgeSprite level={habit.level} size={40} />}
                            </ListItemButton>
                        ))}
                    </List>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEditPickerOpen(false)}>Cancel</Button>
                </DialogActions>
            </Dialog>

            {/* Select habits to delete */}
            <Dialog open={deletePickerOpen} onClose={() => setDeletePickerOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Delete habits</DialogTitle>
                <DialogContent sx={{ p: 0, pt: 1 }}>
                    <List disablePadding>
                        {habits.map(habit => (
                            <ListItem
                                key={habit.id}
                                disablePadding
                                secondaryAction={<Checkbox edge="end" checked={deleteSelection.includes(habit.id)} onChange={() => toggleDeleteSelection(habit.id)} />}
                            >
                                <ListItemButton dense onClick={() => toggleDeleteSelection(habit.id)}>
                                    <ListItemText primary={habit.name} secondary={`Stored badge: level ${habit.level}`} sx={{ mr: 2 }} />
                                    {habit.level >= 1 && <BadgeSprite level={habit.level} size={40} />}
                                </ListItemButton>
                            </ListItem>
                        ))}
                    </List>
                    <Typography variant="caption" color="text.secondary" sx={{ px: 3, pt: 1, display: 'block' }}>
                        Select one or more habits to delete. This cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeletePickerOpen(false)}>Cancel</Button>
                    <Button onClick={confirmDeleteSelected} variant="contained" color="error" disabled={deleteSelection.length === 0}>
                        Delete Selected
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Break streak confirm */}
            <Dialog open={breakCandidate !== null} onClose={() => setBreakCandidate(null)} maxWidth="xs" fullWidth>
                <DialogTitle>Break streak?</DialogTitle>
                <DialogContent>
                    <Typography variant="body1">Reset “{breakCandidate?.name}” back to 0? The earned badge will be removed.</Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setBreakCandidate(null)}>Cancel</Button>
                    <Button onClick={confirmBreak} variant="contained" color="error">
                        Break Streak
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Badge celebration */}
            <Dialog open={celebration !== null} onClose={() => setCelebration(null)} maxWidth="xs" fullWidth>
                <DialogTitle>Badge Earned!</DialogTitle>
                <DialogContent>
                    {celebration && (
                        <Stack spacing={2} sx={{ alignItems: 'center', py: 1 }}>
                            <BadgeSprite level={celebration.habit.level} size={120} />
                            <Typography variant="body1" align="center" sx={{ fontFamily: '"VT323", "Courier New", monospace' }}>
                                {celebration.habit.name} reached its target — a new badge is attached!
                            </Typography>
                        </Stack>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setCelebration(null)} variant="contained">
                        Awesome!
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar */}
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
