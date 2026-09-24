/**
 * DataManager Component
 *
 * Backup and restore saved data across all projects, including moving it to a new domain.
 *
 * Related docs (update if this component changes): AGENTS.md, docs/NEW_PROJECT_TEMPLATE.md, docs/STYLES.md
 *
 * OVERVIEW:
 * Central tool that exports each project's localStorage data into a single JSON backup file and
 * imports such files back. Because browser localStorage is bound to the origin (protocol + domain +
 * port) it was created on, a domain change leaves existing data behind - this page is how users
 * carry it over to the new location.
 *
 * KEY FEATURES:
 * 1. Export - pick any subset of projects; each selected project's localStorage keys are collected
 *    into a JSON file that records the exporting site (origin/domain), the export time, and the
 *    format version. The file name also contains the domain, so moved backups stay identifiable.
 * 2. Import - pick a backup file, review its origin and contents, then choose which projects to
 *    restore. The recorded origin is surfaced prominently so users can confirm a domain move.
 * 3. Override on conflict - 2048 and Sudoku replace their saved state; if the target origin already
 *    has data the user is asked to confirm before overwriting (and can skip individual projects).
 * 4. Merge on conflict - Lucky Wheel, Flash Cards and Pomodoro Clock append imported entries to
 *    existing data so nothing is lost; imported ids are regenerated to avoid collisions.
 *
 * STORAGE:
 * - This page keeps no data of its own; it reads and writes the same localStorage keys used by the
 *   other projects (game2048_state, sudoku_state, sudoku_saved_games, luckyWheels,
 *   flashcard-collections, habit-tracker-habits, pomodoro-counters).
 * - Backup files are JSON and record the origin they were exported from.
 */

import { useState, useRef } from 'react';
import type { ChangeEvent } from 'react';
import {
    Box,
    Typography,
    Paper,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Snackbar,
    Alert,
    Checkbox,
    Chip,
    Stack,
    List,
    ListItem,
    ListItemButton,
    ListItemText,
    IconButton,
} from '@mui/material';
import { DataManagerIcon, ExportIcon, ImportIcon, RefreshIcon, LanguageIcon } from './AppIcons';
import { ProjectLayout } from './ProjectLayout';
import { BACKUP_FORMAT, BACKUP_VERSION } from '../types/DataManager';
import type { BackupFile } from '../types/DataManager';
import type { SavedWheel } from '../types/LuckyWheel';
import type { FlashCardCollection } from '../types/FlashCard';
import type { PomodoroCounter } from '../types/Pomodoro';

interface BackupProjectDef {
    id: string;
    name: string;
    description: string;
    behavior: 'override' | 'merge';
    storageKeys: string[];
    summarize: (data: Record<string, unknown>) => string;
}

interface ProjectCurrentData {
    id: string;
    name: string;
    description: string;
    hasData: boolean;
}

const BACKUP_PROJECTS: BackupProjectDef[] = [
    {
        id: '2048',
        name: '2048 Game',
        description: 'Current game board, score and status.',
        behavior: 'override',
        storageKeys: ['game2048_state'],
        summarize: (data: Record<string, unknown>) => {
            const state = data['game2048_state'] as { board?: number[][]; score?: number } | undefined;
            if (!state || !Array.isArray(state.board)) return 'No saved game';
            return `Game in progress (score ${state.score ?? 0})`;
        },
    },
    {
        id: 'sudoku',
        name: 'Sudoku Game',
        description: 'Current puzzle and named save slots.',
        behavior: 'override',
        storageKeys: ['sudoku_state', 'sudoku_saved_games'],
        summarize: (data: Record<string, unknown>) => {
            const saves = data['sudoku_saved_games'] as unknown[] | undefined;
            const parts: string[] = [];
            if (data['sudoku_state'] !== undefined) parts.push('current puzzle');
            if (Array.isArray(saves) && saves.length > 0) parts.push(`${saves.length} save slot(s)`);
            return parts.length > 0 ? parts.join(', ') : 'No saved data';
        },
    },
    {
        id: 'lucky-wheel',
        name: 'Lucky Wheel',
        description: 'Saved wheels list.',
        behavior: 'merge',
        storageKeys: ['luckyWheels'],
        summarize: (data: Record<string, unknown>) => {
            const wheels = data['luckyWheels'] as unknown[] | undefined;
            return Array.isArray(wheels) && wheels.length > 0 ? `${wheels.length} saved wheel(s)` : 'No saved wheels';
        },
    },
    {
        id: 'flash-cards',
        name: 'Flash Cards',
        description: 'Collections and flash cards.',
        behavior: 'merge',
        storageKeys: ['flashcard-collections'],
        summarize: (data: Record<string, unknown>) => {
            const collections = data['flashcard-collections'] as { cards?: unknown[] }[] | undefined;
            if (!Array.isArray(collections)) return 'No saved collections';
            const totalCards = collections.reduce((sum, collection) => sum + (Array.isArray(collection.cards) ? collection.cards.length : 0), 0);
            return `${collections.length} collection(s), ${totalCards} card(s)`;
        },
    },
    {
        id: 'habit-tracker',
        name: 'Habit Tracker',
        description: 'Tracked habits, streaks and earned badges.',
        behavior: 'override',
        storageKeys: ['habit-tracker-habits'],
        summarize: (data: Record<string, unknown>) => {
            const habits = data['habit-tracker-habits'] as unknown[] | undefined;
            if (!Array.isArray(habits)) return 'No saved habits';
            const totalStreaks = habits.reduce<number>((sum, habit) => {
                const streak = (habit as { streak?: number }).streak;
                return sum + (typeof streak === 'number' ? streak : 0);
            }, 0);
            return `${habits.length} habit(s), ${totalStreaks} total day streak`;
        },
    },
    {
        id: 'pomodoro-clock',
        name: 'Pomodoro Clock',
        description: 'Saved timer counters with phases and rounds.',
        behavior: 'merge',
        storageKeys: ['pomodoro-counters'],
        summarize: (data: Record<string, unknown>) => {
            const counters = data['pomodoro-counters'] as unknown[] | undefined;
            return Array.isArray(counters) && counters.length > 0 ? `${counters.length} counter(s)` : 'No saved counters';
        },
    },
];

const readStoredData = (keys: string[]): Record<string, unknown> => {
    const out: Record<string, unknown> = {};
    keys.forEach(key => {
        const raw = localStorage.getItem(key);
        if (raw !== null) {
            try {
                out[key] = JSON.parse(raw);
            } catch {
                out[key] = raw;
            }
        }
    });
    return out;
};

const readStoredArray = (key: string): unknown[] => {
    const raw = localStorage.getItem(key);
    if (raw === null) return [];
    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
};

const computeCurrentData = (): ProjectCurrentData[] => {
    return BACKUP_PROJECTS.map(project => {
        const data = readStoredData(project.storageKeys);
        return {
            id: project.id,
            name: project.name,
            description: Object.keys(data).length > 0 ? project.summarize(data) : 'No saved data',
            hasData: Object.keys(data).length > 0,
        };
    });
};

const hasLocalData = (id: string): boolean => {
    const project = BACKUP_PROJECTS.find(entry => entry.id === id);
    if (!project) return false;
    return project.storageKeys.some(key => localStorage.getItem(key) !== null);
};

const validateBackup = (parsed: unknown): BackupFile | null => {
    if (!parsed || typeof parsed !== 'object') return null;
    const file = parsed as BackupFile;
    if (file.format !== BACKUP_FORMAT) return null;
    if (typeof file.version !== 'number' || file.version < 1 || file.version > BACKUP_VERSION) return null;
    if (typeof file.exportedAt !== 'number') return null;
    if (!file.projects || typeof file.projects !== 'object') return null;
    if (!file.origin || typeof file.origin.origin !== 'string') return null;
    return file;
};

const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const mergeLuckyWheels = (existing: SavedWheel[], imported: SavedWheel[]): SavedWheel[] => {
    const suffix = Date.now().toString(36);
    const newWheels = imported.map((wheel, index) => ({
        ...wheel,
        id: `wheel-${suffix}-${index}`,
    }));
    return [...existing, ...newWheels];
};

const mergeFlashCards = (existing: FlashCardCollection[], imported: FlashCardCollection[]): FlashCardCollection[] => {
    const suffix = Date.now().toString(36);
    const newCollections = imported.map((collection, index) => {
        const id = `collection-${suffix}-${index}`;
        return {
            ...collection,
            id,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            cards: collection.cards.map((card, cardIndex) => ({
                ...card,
                id: `${id}-card-${cardIndex}`,
            })),
        };
    });
    return [...existing, ...newCollections];
};

const mergePomodoroCounters = (existing: PomodoroCounter[], imported: PomodoroCounter[]): PomodoroCounter[] => {
    const suffix = Date.now().toString(36);
    const newCounters = imported.map((counter, index) => {
        const id = `counter-${suffix}-${index}`;
        return {
            ...counter,
            id,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            phases: counter.phases.map((phase, phaseIndex) => ({
                ...phase,
                id: `${id}-phase-${phaseIndex}`,
            })),
        };
    });
    return [...existing, ...newCounters];
};

const downloadBlob = (blob: Blob, fileName: string): void => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

export const DataManager = () => {
    const [selectedForExport, setSelectedForExport] = useState<string[]>(() => BACKUP_PROJECTS.map(project => project.id));
    const [currentData, setCurrentData] = useState<ProjectCurrentData[]>(() => computeCurrentData());
    const [backupFile, setBackupFile] = useState<BackupFile | null>(null);
    const [importSelection, setImportSelection] = useState<Record<string, boolean>>({});
    const [showImportPreview, setShowImportPreview] = useState(false);
    const [pendingOverrideIds, setPendingOverrideIds] = useState<string[]>([]);
    const [replaceChoices, setReplaceChoices] = useState<Record<string, boolean>>({});
    const [showOverrideConfirm, setShowOverrideConfirm] = useState(false);
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({
        open: false,
        message: '',
        severity: 'info',
    });
    const fileInputRef = useRef<HTMLInputElement>(null);

    const showNotification = (message: string, severity: 'success' | 'error' | 'info' = 'info') => {
        setSnackbar({ open: true, message, severity });
    };

    const toggleExportSelection = (id: string) => {
        setSelectedForExport(prev => (prev.includes(id) ? prev.filter(entry => entry !== id) : [...prev, id]));
    };

    const allExportSelected = selectedForExport.length === BACKUP_PROJECTS.length;
    const someExportSelected = selectedForExport.length > 0 && !allExportSelected;

    const toggleAllExport = () => {
        setSelectedForExport(allExportSelected ? [] : BACKUP_PROJECTS.map(project => project.id));
    };

    const toggleImportSelection = (id: string) => {
        setImportSelection(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const availableImportProjects = backupFile ? BACKUP_PROJECTS.filter(project => backupFile.projects[project.id]) : [];
    const selectedImportCount = availableImportProjects.filter(project => importSelection[project.id]).length;
    const allImportSelected = availableImportProjects.length > 0 && selectedImportCount === availableImportProjects.length;
    const someImportSelected = selectedImportCount > 0 && !allImportSelected;

    const toggleAllImport = () => {
        const next: Record<string, boolean> = {};
        availableImportProjects.forEach(project => {
            next[project.id] = !allImportSelected;
        });
        setImportSelection(next);
    };

    const toggleReplaceChoice = (id: string) => {
        setReplaceChoices(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const refreshData = () => {
        setCurrentData(computeCurrentData());
        showNotification('Data status refreshed', 'info');
    };

    const handleExport = () => {
        const domain = window.location.hostname || 'unknown';
        const backup: BackupFile = {
            format: BACKUP_FORMAT,
            version: BACKUP_VERSION,
            exportedAt: Date.now(),
            origin: {
                origin: window.location.origin,
                domain,
                pathname: window.location.pathname,
            },
            projects: {},
        };

        let includedCount = 0;
        BACKUP_PROJECTS.forEach(project => {
            if (!selectedForExport.includes(project.id)) return;
            const data = readStoredData(project.storageKeys);
            if (Object.keys(data).length === 0) return;
            backup.projects[project.id] = data;
            includedCount++;
        });

        if (includedCount === 0) {
            showNotification('No saved data found in the selected projects', 'error');
            return;
        }

        downloadBlob(new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' }), `backup-${domain}-${formatDate(new Date())}.json`);
        showNotification(`Exported ${includedCount} project(s) to file`, 'success');
    };

    const handleFileSelected = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = e => {
            try {
                const backup = validateBackup(JSON.parse(e.target?.result as string));
                if (!backup) {
                    showNotification('Invalid backup file format', 'error');
                    return;
                }

                const initial: Record<string, boolean> = {};
                BACKUP_PROJECTS.forEach(project => {
                    if (backup.projects[project.id]) initial[project.id] = true;
                });

                if (Object.keys(initial).length === 0) {
                    showNotification('No known project data found in this backup file', 'error');
                    return;
                }

                setBackupFile(backup);
                setImportSelection(initial);
                setShowImportPreview(true);
            } catch {
                showNotification('Failed to read the backup file', 'error');
            }
        };
        reader.readAsText(file);

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const closeImportPreview = () => {
        setShowImportPreview(false);
        setBackupFile(null);
        setImportSelection({});
    };

    const applyImport = (replaceIds: string[], mergeIds: string[], chosenReplacements: Record<string, boolean>) => {
        if (!backupFile) return;

        let replacedCount = 0;
        let mergedCount = 0;
        let skippedCount = 0;

        const writeProject = (id: string): boolean => {
            const project = backupFile.projects[id];
            if (!project) return false;
            Object.entries(project).forEach(([key, value]) => {
                localStorage.setItem(key, JSON.stringify(value));
            });
            return true;
        };

        replaceIds.forEach(id => {
            if (writeProject(id)) replacedCount++;
        });

        Object.entries(chosenReplacements).forEach(([id, shouldReplace]) => {
            if (shouldReplace) {
                if (writeProject(id)) replacedCount++;
            } else {
                skippedCount++;
            }
        });

        mergeIds.forEach(id => {
            const project = backupFile.projects[id];
            if (!project) return;
            if (id === 'lucky-wheel') {
                const imported = project['luckyWheels'];
                if (Array.isArray(imported) && imported.length > 0) {
                    const existing = readStoredArray('luckyWheels') as SavedWheel[];
                    localStorage.setItem('luckyWheels', JSON.stringify(mergeLuckyWheels(existing, imported as SavedWheel[])));
                    mergedCount++;
                }
            } else if (id === 'flash-cards') {
                const imported = project['flashcard-collections'];
                if (Array.isArray(imported) && imported.length > 0) {
                    const existing = readStoredArray('flashcard-collections') as FlashCardCollection[];
                    localStorage.setItem('flashcard-collections', JSON.stringify(mergeFlashCards(existing, imported as FlashCardCollection[])));
                    mergedCount++;
                }
            } else if (id === 'pomodoro-clock') {
                const imported = project['pomodoro-counters'];
                if (Array.isArray(imported) && imported.length > 0) {
                    const existing = readStoredArray('pomodoro-counters') as PomodoroCounter[];
                    localStorage.setItem('pomodoro-counters', JSON.stringify(mergePomodoroCounters(existing, imported as PomodoroCounter[])));
                    mergedCount++;
                }
            }
        });

        setCurrentData(computeCurrentData());

        const parts: string[] = [];
        if (replacedCount > 0) parts.push(`${replacedCount} replaced`);
        if (mergedCount > 0) parts.push(`${mergedCount} merged`);
        if (skippedCount > 0) parts.push(`${skippedCount} skipped`);
        const message = parts.length > 0 ? parts.join(', ') : 'No data imported';
        showNotification(`Import complete - ${message}`, 'success');
    };

    const handleImportSelected = () => {
        if (!backupFile) return;

        const selectedIds = BACKUP_PROJECTS.filter(project => importSelection[project.id]).map(project => project.id);
        if (selectedIds.length === 0) {
            showNotification('Select at least one project to import', 'error');
            return;
        }

        const mergeIds: string[] = [];
        const replaceIds: string[] = [];
        const conflicts: string[] = [];

        selectedIds.forEach(id => {
            const project = BACKUP_PROJECTS.find(entry => entry.id === id);
            if (!project) return;
            if (project.behavior === 'merge') {
                mergeIds.push(id);
            } else if (hasLocalData(id)) {
                conflicts.push(id);
            } else {
                replaceIds.push(id);
            }
        });

        if (conflicts.length > 0) {
            const choices: Record<string, boolean> = {};
            conflicts.forEach(id => (choices[id] = true));
            setPendingOverrideIds(conflicts);
            setReplaceChoices(choices);
            setShowOverrideConfirm(true);
        } else {
            applyImport(replaceIds, mergeIds, {});
            closeImportPreview();
        }
    };

    const handleConfirmImport = () => {
        if (!backupFile) return;

        const selectedIds = BACKUP_PROJECTS.filter(project => importSelection[project.id]).map(project => project.id);
        const mergeIds: string[] = [];
        const replaceIds: string[] = [];

        selectedIds.forEach(id => {
            const project = BACKUP_PROJECTS.find(entry => entry.id === id);
            if (!project) return;
            if (project.behavior === 'merge') {
                mergeIds.push(id);
            } else if (!pendingOverrideIds.includes(id)) {
                replaceIds.push(id);
            }
        });

        applyImport(replaceIds, mergeIds, replaceChoices);
        setShowOverrideConfirm(false);
        setPendingOverrideIds([]);
        setReplaceChoices({});
        closeImportPreview();
    };

    const isSameOrigin = backupFile ? backupFile.origin.origin === window.location.origin : false;

    return (
        <ProjectLayout title="Data Manager" icon={<DataManagerIcon />} maxWidth="md">
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Export saved data from these projects into a backup file, then import it on another domain to carry your progress over. Backups record the site they were
                created on, so you can confirm you are moving data between the right places.
            </Typography>

            <Chip icon={<LanguageIcon />} label={`Current site: ${window.location.origin}`} variant="outlined" sx={{ mb: 3 }} />

            <Stack spacing={3}>
                {/* Export card */}
                <Paper elevation={1} sx={{ p: { xs: 2, sm: 3 } }}>
                    <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="h6">
                            <ExportIcon sx={{ color: 'primary.main', mr: 1, verticalAlign: 'middle' }} />
                            Export Data
                        </Typography>
                        <IconButton onClick={refreshData} title="Refresh data status" size="small" aria-label="refresh data status">
                            <RefreshIcon />
                        </IconButton>
                    </Stack>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Select the projects whose saved data you want to include in the backup file. Projects without saved data are skipped.
                    </Typography>
                    <List dense>
                        <ListItem disablePadding divider sx={{ borderRadius: 1 }}>
                            <ListItemButton dense onClick={toggleAllExport}>
                                <Checkbox checked={allExportSelected} indeterminate={someExportSelected} edge="start" tabIndex={-1} disableRipple />
                                <ListItemText primary={allExportSelected ? 'Deselect all' : 'Select all'} />
                            </ListItemButton>
                        </ListItem>
                        {BACKUP_PROJECTS.map(project => {
                            const isSelected = selectedForExport.includes(project.id);
                            const data = currentData.find(entry => entry.id === project.id);
                            return (
                                <ListItem key={project.id} disablePadding divider sx={{ borderRadius: 1 }}>
                                    <ListItemButton dense onClick={() => toggleExportSelection(project.id)}>
                                        <Checkbox checked={isSelected} edge="start" tabIndex={-1} disableRipple />
                                        <ListItemText
                                            primary={project.name}
                                            secondary={
                                                <>
                                                    {data?.description}
                                                    {!data?.hasData && <Box component="span"> (will be skipped - no saved data)</Box>}
                                                </>
                                            }
                                        />
                                    </ListItemButton>
                                </ListItem>
                            );
                        })}
                    </List>
                    <Button variant="contained" startIcon={<ExportIcon />} onClick={handleExport} sx={{ mt: 2 }}>
                        Export Selected
                    </Button>
                </Paper>

                {/* Import card */}
                <Paper elevation={1} sx={{ p: { xs: 2, sm: 3 } }}>
                    <Typography variant="h6">
                        <ImportIcon sx={{ color: 'primary.main', mr: 1, verticalAlign: 'middle' }} />
                        Import Data
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Choose a backup file to restore projects here. Games with existing progress ask before overwriting; list-based projects (Lucky Wheel, Flash Cards)
                        are merged with your current data.
                    </Typography>
                    <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept=".json,application/json" onChange={handleFileSelected} />
                    <Button variant="contained" startIcon={<ImportIcon />} onClick={() => fileInputRef.current?.click()}>
                        Choose Backup File
                    </Button>
                </Paper>
            </Stack>

            {/* Import preview dialog */}
            <Dialog open={showImportPreview} onClose={closeImportPreview} maxWidth="sm" fullWidth>
                <DialogTitle>Import Backup</DialogTitle>
                <DialogContent>
                    {backupFile && (
                        <>
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} useFlexGap sx={{ mb: 2, flexWrap: 'wrap' }}>
                                <Chip label={`Exported ${new Date(backupFile.exportedAt).toLocaleString()}`} size="small" variant="outlined" />
                                <Chip icon={<LanguageIcon />} label={backupFile.origin.origin} size="small" variant="outlined" />
                            </Stack>
                            {isSameOrigin ? (
                                <Alert severity="info" sx={{ mb: 2 }}>
                                    This backup was created on this same site.
                                </Alert>
                            ) : (
                                <Alert severity="warning" sx={{ mb: 2 }}>
                                    This backup was exported from <strong>{backupFile.origin.origin}</strong>. The current site is{' '}
                                    <strong>{window.location.origin}</strong>. Importing will move the data to this site.
                                </Alert>
                            )}
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                Choose which projects to import:
                            </Typography>
                            <List dense>
                                <ListItem disablePadding divider sx={{ borderRadius: 1 }}>
                                    <ListItemButton dense onClick={toggleAllImport}>
                                        <Checkbox checked={allImportSelected} indeterminate={someImportSelected} edge="start" tabIndex={-1} disableRipple />
                                        <ListItemText primary={allImportSelected ? 'Deselect all' : 'Select all'} />
                                    </ListItemButton>
                                </ListItem>
                                {BACKUP_PROJECTS.filter(project => backupFile.projects[project.id]).map(project => {
                                    const isChecked = Boolean(importSelection[project.id]);
                                    const localData = currentData.find(entry => entry.id === project.id);
                                    return (
                                        <ListItem key={project.id} disablePadding divider sx={{ borderRadius: 1 }}>
                                            <ListItemButton dense onClick={() => toggleImportSelection(project.id)}>
                                                <Checkbox checked={isChecked} edge="start" tabIndex={-1} disableRipple />
                                                <ListItemText
                                                    primary={project.name}
                                                    secondary={
                                                        <>
                                                            {project.summarize(backupFile.projects[project.id])}
                                                            {project.behavior === 'merge' && <Box component="span"> (will be merged with current data)</Box>}
                                                            {project.behavior === 'override' && localData?.hasData && (
                                                                <Box component="span" sx={{ color: 'warning.main' }}>
                                                                    {' '}
                                                                    (existing data will be replaced)
                                                                </Box>
                                                            )}
                                                        </>
                                                    }
                                                />
                                            </ListItemButton>
                                        </ListItem>
                                    );
                                })}
                            </List>
                        </>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={closeImportPreview}>Cancel</Button>
                    <Button onClick={handleImportSelected} variant="contained" disabled={Object.values(importSelection).every(checked => !checked)}>
                        Import Selected
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Override confirmation dialog */}
            <Dialog open={showOverrideConfirm} onClose={() => setShowOverrideConfirm(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Existing Data Found</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        The following projects already have saved data. Uncheck any project whose current data you want to keep.
                    </Typography>
                    <List dense>
                        {pendingOverrideIds.map(id => {
                            const project = BACKUP_PROJECTS.find(entry => entry.id === id);
                            const localData = currentData.find(entry => entry.id === id);
                            if (!project) return null;
                            return (
                                <ListItem key={id} disablePadding divider sx={{ borderRadius: 1 }}>
                                    <ListItemButton dense onClick={() => toggleReplaceChoice(id)}>
                                        <Checkbox checked={Boolean(replaceChoices[id])} edge="start" tabIndex={-1} disableRipple />
                                        <ListItemText primary={project.name} secondary={`Current data: ${localData?.description ?? 'No saved data'}`} />
                                    </ListItemButton>
                                </ListItem>
                            );
                        })}
                    </List>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowOverrideConfirm(false)}>Cancel</Button>
                    <Button onClick={handleConfirmImport} variant="contained">
                        Import
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
