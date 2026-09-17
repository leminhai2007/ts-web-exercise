/**
 * FlashCards Component
 *
 * A learning tool for creating and studying flash card collections.
 *
 * Related docs (update if this component changes): AGENTS.md, docs/NEW_PROJECT_TEMPLATE.md, docs/STYLES.md
 *
 * OVERVIEW:
 * Built with Material UI following the project's design system. Users can create collections,
 * add flash cards in bulk, study them with shuffle and random selection, and export/import
 * collections for sharing and backup.
 *
 * KEY FEATURES:
 * 1. Collection Management
 *    - Create new collections with custom names
 *    - Switch between multiple collections
 *    - Delete existing collections
 *    - Automatic saving to localStorage
 *    - Shows card count and last updated date
 *
 * 2. Flash Card Creation
 *    - Batch input via text area for multiple cards
 *    - Format: "Label: Content" (one per line)
 *    - Individual card editing and deletion
 *    - Labels and content validation
 *    - Auto-generated unique IDs
 *
 * 3. Study Mode
 *    - Shuffle all cards in random order
 *    - Pick one random card
 *    - Flip card to reveal content (click on card)
 *    - Navigate through shuffled deck
 *    - Visual card flip animation
 *
 * 4. Export/Import
 *    - Export collection as JSON file
 *    - Import collections from JSON
 *    - Share collections with other users
 *    - Backup and restore functionality
 *
 * 5. Responsive Design
 *    - Desktop and mobile optimized
 *    - Icon-only buttons on mobile
 *    - Icon+text buttons on desktop
 *    - Touch-friendly card flip
 *
 * STORAGE:
 * - All collections saved to localStorage under key 'flashcard-collections'
 * - Auto-save on every change
 * - Persists across browser sessions
 */

import { useState, useEffect, useRef } from 'react';
import {
    Box,
    Button,
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Card,
    CardContent,
    Typography,
    IconButton,
    List,
    ListItem,
    ListItemText,
    ListItemButton,
    Snackbar,
    Alert,
    Paper,
    Divider,
    Stack,
    Chip,
    Tooltip,
} from '@mui/material';
import {
    Add as AddIcon,
    Shuffle as ShuffleIcon,
    Casino as RandomIcon,
    Download as DownloadIcon,
    Upload as UploadIcon,
    Delete as DeleteIcon,
    Edit as EditIcon,
    Collections as CollectionsIcon,
    School as SchoolIcon,
    Close as CloseIcon,
} from '@mui/icons-material';
import { ProjectLayout } from './ProjectLayout';
import type { FlashCard, FlashCardCollection } from '../types/FlashCard';

const STORAGE_KEY = 'flashcard-collections';

const loadStoredCollections = (): FlashCardCollection[] => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return [];
        const parsed = JSON.parse(stored);
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        console.error('Failed to parse stored collections:', error);
        return [];
    }
};

export const FlashCards = () => {
    // State for collections
    const [collections, setCollections] = useState<FlashCardCollection[]>(loadStoredCollections);
    const [currentCollectionId, setCurrentCollectionId] = useState<string | null>(() => {
        const stored = loadStoredCollections();
        return stored.length > 0 ? stored[0].id : null;
    });

    // State for dialogs
    const [showNewCollectionDialog, setShowNewCollectionDialog] = useState(false);
    const [showAddCardsDialog, setShowAddCardsDialog] = useState(false);
    const [showCollectionsDialog, setShowCollectionsDialog] = useState(false);
    const [showEditCardDialog, setShowEditCardDialog] = useState(false);

    // State for input
    const [newCollectionName, setNewCollectionName] = useState('');
    const [bulkCardInput, setBulkCardInput] = useState('');
    const [editingCard, setEditingCard] = useState<FlashCard | null>(null);
    const [editLabel, setEditLabel] = useState('');
    const [editContent, setEditContent] = useState('');

    // State for study mode
    const [isStudyMode, setIsStudyMode] = useState(false);
    const [isRandomMode, setIsRandomMode] = useState(false);
    const [currentCardIndex, setCurrentCardIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [studyCards, setStudyCards] = useState<FlashCard[]>([]);

    // State for notifications
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({
        open: false,
        message: '',
        severity: 'info',
    });

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Save collections to localStorage whenever they change
    useEffect(() => {
        if (collections.length > 0) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(collections));
        }
    }, [collections]);

    // Get current collection
    const currentCollection = collections.find(c => c.id === currentCollectionId);

    // Show snackbar notification
    const showNotification = (message: string, severity: 'success' | 'error' | 'info' = 'info') => {
        setSnackbar({ open: true, message, severity });
    };

    // Create new collection
    const handleCreateCollection = () => {
        if (!newCollectionName.trim()) {
            showNotification('Please enter a collection name', 'error');
            return;
        }

        const newCollection: FlashCardCollection = {
            id: `collection-${Date.now()}`,
            name: newCollectionName.trim(),
            cards: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };

        setCollections([...collections, newCollection]);
        setCurrentCollectionId(newCollection.id);
        setNewCollectionName('');
        setShowNewCollectionDialog(false);
        showNotification('Collection created successfully', 'success');
    };

    // Delete collection
    const handleDeleteCollection = (collectionId: string) => {
        const updatedCollections = collections.filter(c => c.id !== collectionId);
        setCollections(updatedCollections);

        if (currentCollectionId === collectionId) {
            setCurrentCollectionId(updatedCollections.length > 0 ? updatedCollections[0].id : null);
        }

        showNotification('Collection deleted', 'success');
    };

    // Switch collection
    const handleSwitchCollection = (collectionId: string) => {
        setCurrentCollectionId(collectionId);
        setShowCollectionsDialog(false);
        setIsStudyMode(false);
    };

    // Add cards in bulk
    const handleAddCards = () => {
        if (!currentCollection) return;

        const lines = bulkCardInput.split('\n').filter(line => line.trim());
        const newCards: FlashCard[] = [];
        const timestamp = Date.now();

        for (const line of lines) {
            const colonIndex = line.indexOf(':');
            if (colonIndex === -1) continue;

            const label = line.substring(0, colonIndex).trim();
            const content = line.substring(colonIndex + 1).trim();

            if (label && content) {
                const randomId = Math.random();
                newCards.push({
                    id: `card-${timestamp}-${randomId}`,
                    label,
                    content,
                });
            }
        }

        if (newCards.length === 0) {
            showNotification('No valid cards found. Use format: "Label: Content"', 'error');
            return;
        }

        const updatedCollection = {
            ...currentCollection,
            cards: [...currentCollection.cards, ...newCards],
            updatedAt: timestamp,
        };

        setCollections(collections.map(c => (c.id === currentCollectionId ? updatedCollection : c)));
        setBulkCardInput('');
        setShowAddCardsDialog(false);
        showNotification(`Added ${newCards.length} card(s)`, 'success');
    };

    // Edit card
    const handleEditCard = (card: FlashCard) => {
        setEditingCard(card);
        setEditLabel(card.label);
        setEditContent(card.content);
        setShowEditCardDialog(true);
    };

    // Save edited card
    const handleSaveEditCard = () => {
        if (!currentCollection || !editingCard) return;

        if (!editLabel.trim() || !editContent.trim()) {
            showNotification('Label and content are required', 'error');
            return;
        }

        const updatedCards = currentCollection.cards.map(card => (card.id === editingCard.id ? { ...card, label: editLabel.trim(), content: editContent.trim() } : card));

        const timestamp = Date.now();
        const updatedCollection = {
            ...currentCollection,
            cards: updatedCards,
            updatedAt: timestamp,
        };

        setCollections(collections.map(c => (c.id === currentCollectionId ? updatedCollection : c)));
        setShowEditCardDialog(false);
        setEditingCard(null);
        showNotification('Card updated', 'success');
    };

    // Delete card
    const handleDeleteCard = (cardId: string) => {
        if (!currentCollection) return;

        const timestamp = Date.now();
        const updatedCollection = {
            ...currentCollection,
            cards: currentCollection.cards.filter(card => card.id !== cardId),
            updatedAt: timestamp,
        };

        setCollections(collections.map(c => (c.id === currentCollectionId ? updatedCollection : c)));
        showNotification('Card deleted', 'success');
    };

    // Shuffle cards
    const handleShuffle = () => {
        if (!currentCollection || currentCollection.cards.length === 0) {
            showNotification('No cards to shuffle', 'error');
            return;
        }

        const shuffled = [...currentCollection.cards].sort(() => Math.random() - 0.5);
        setStudyCards(shuffled);
        setCurrentCardIndex(0);
        setIsFlipped(false);
        setIsStudyMode(true);
        setIsRandomMode(false);
        showNotification('Cards shuffled', 'success');
    };

    // Pick random card
    const handleRandomCard = () => {
        if (!currentCollection || currentCollection.cards.length === 0) {
            showNotification('No cards available', 'error');
            return;
        }

        const randomIndex = Math.floor(Math.random() * currentCollection.cards.length);
        setStudyCards([currentCollection.cards[randomIndex]]);
        setCurrentCardIndex(0);
        setIsFlipped(false);
        setIsStudyMode(true);
        setIsRandomMode(true);
        showNotification('Random card selected', 'success');
    };

    // Pick another random card (when already in random mode)
    const handlePickAnotherRandom = () => {
        if (!currentCollection || currentCollection.cards.length === 0) return;

        const randomIndex = Math.floor(Math.random() * currentCollection.cards.length);
        setStudyCards([currentCollection.cards[randomIndex]]);
        setCurrentCardIndex(0);
        setIsFlipped(false);
    };

    // Flip card
    const handleFlipCard = () => {
        setIsFlipped(!isFlipped);
    };

    // Navigate to next card
    const handleNextCard = () => {
        if (currentCardIndex < studyCards.length - 1) {
            setCurrentCardIndex(currentCardIndex + 1);
            setIsFlipped(false);
        }
    };

    // Navigate to previous card
    const handlePrevCard = () => {
        if (currentCardIndex > 0) {
            setCurrentCardIndex(currentCardIndex - 1);
            setIsFlipped(false);
        }
    };

    // Exit study mode
    const handleExitStudy = () => {
        setIsStudyMode(false);
        setIsRandomMode(false);
        setStudyCards([]);
        setCurrentCardIndex(0);
        setIsFlipped(false);
    };

    // Export collection
    const handleExport = () => {
        if (!currentCollection) return;

        // Export only the content (name and cards without ids/timestamps)
        const exportData = {
            name: currentCollection.name,
            cards: currentCollection.cards.map(card => ({
                label: card.label,
                content: card.content,
            })),
        };

        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${currentCollection.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        showNotification('Collection exported', 'success');
    };

    // Import collection
    const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = e => {
            try {
                const imported = JSON.parse(e.target?.result as string);

                // Validate structure
                if (!imported.name || !Array.isArray(imported.cards)) {
                    showNotification('Invalid collection file', 'error');
                    return;
                }

                const timestamp = Date.now();

                // Create cards with new IDs
                const importedCards: FlashCard[] = imported.cards.map((card: { label: string; content: string }) => {
                    const randomId = Math.random();
                    return {
                        id: `card-${timestamp}-${randomId}`,
                        label: card.label,
                        content: card.content,
                    };
                });

                // Create new collection with new ID and timestamps
                const newCollection: FlashCardCollection = {
                    id: `collection-${timestamp}`,
                    name: imported.name,
                    cards: importedCards,
                    createdAt: timestamp,
                    updatedAt: timestamp,
                };

                setCollections([...collections, newCollection]);
                setCurrentCollectionId(newCollection.id);
                showNotification('Collection imported successfully', 'success');
            } catch {
                showNotification('Failed to import collection', 'error');
            }
        };
        reader.readAsText(file);

        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Study mode view
    if (isStudyMode && studyCards.length > 0) {
        const currentCard = studyCards[currentCardIndex];

        return (
            <ProjectLayout
                title="Flash Cards"
                icon={<SchoolIcon />}
                actions={
                    <Button color="inherit" onClick={handleExitStudy} startIcon={<CloseIcon />}>
                        Exit Study
                    </Button>
                }
                mobileActions={
                    <IconButton color="inherit" onClick={handleExitStudy}>
                        <CloseIcon />
                    </IconButton>
                }
            >
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, py: 4 }}>
                    {!isRandomMode && (
                        <Typography variant="h6" color="text.secondary">
                            Card {currentCardIndex + 1} of {studyCards.length}
                        </Typography>
                    )}

                    <Paper
                        sx={{
                            width: '100%',
                            maxWidth: 600,
                            minHeight: 300,
                            cursor: 'pointer',
                            perspective: '1000px',
                            '&:hover': {
                                boxShadow: 6,
                            },
                        }}
                        onClick={handleFlipCard}
                    >
                        <Box
                            sx={{
                                position: 'relative',
                                width: '100%',
                                minHeight: 300,
                                transformStyle: 'preserve-3d',
                                transition: 'transform 0.6s',
                                transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                            }}
                        >
                            {/* Front of card (Label) */}
                            <Box
                                sx={{
                                    position: 'absolute',
                                    width: '100%',
                                    height: '100%',
                                    backfaceVisibility: 'hidden',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    p: 4,
                                    bgcolor: 'primary.main',
                                    color: 'white',
                                    borderRadius: 0,
                                }}
                            >
                                <Typography variant="overline" sx={{ mb: 2 }}>
                                    Question
                                </Typography>
                                <Typography variant="h4" align="center">
                                    {currentCard.label}
                                </Typography>
                                <Typography variant="caption" sx={{ mt: 3, opacity: 0.8 }}>
                                    Click to flip
                                </Typography>
                            </Box>

                            {/* Back of card (Content) */}
                            <Box
                                sx={{
                                    position: 'absolute',
                                    width: '100%',
                                    height: '100%',
                                    backfaceVisibility: 'hidden',
                                    transform: 'rotateY(180deg)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    p: 4,
                                    bgcolor: 'secondary.main',
                                    color: 'white',
                                    borderRadius: 0,
                                }}
                            >
                                <Typography variant="overline" sx={{ mb: 2 }}>
                                    Answer
                                </Typography>
                                <Typography variant="h5" align="center">
                                    {currentCard.content}
                                </Typography>
                                <Typography variant="caption" sx={{ mt: 3, opacity: 0.8 }}>
                                    Click to flip back
                                </Typography>
                            </Box>
                        </Box>
                    </Paper>

                    {isRandomMode ? (
                        <Button variant="contained" size="large" onClick={handlePickAnotherRandom} startIcon={<RandomIcon />}>
                            Pick Another Random Card
                        </Button>
                    ) : (
                        <Stack direction="row" spacing={2}>
                            <Button variant="contained" onClick={handlePrevCard} disabled={currentCardIndex === 0}>
                                Previous
                            </Button>
                            <Button variant="contained" onClick={handleNextCard} disabled={currentCardIndex === studyCards.length - 1}>
                                Next
                            </Button>
                        </Stack>
                    )}
                </Box>
            </ProjectLayout>
        );
    }

    // Main view
    return (
        <ProjectLayout title="Flash Cards" icon={<SchoolIcon />}>
            <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept=".json" onChange={handleImport} />

            {/* Control Buttons */}
            {currentCollection && (
                <Stack spacing={2} sx={{ mb: 3, alignItems: 'center' }}>
                    {/* First Row: Collections, Add Cards, Shuffle, Random */}
                    <Stack direction="row" spacing={1} sx={{ justifyContent: 'center', flexWrap: 'wrap', gap: 1 }}>
                        <Button
                            variant="outlined"
                            startIcon={<CollectionsIcon sx={{ display: { xs: 'none', sm: 'inline-flex' } }} />}
                            onClick={() => setShowCollectionsDialog(true)}
                            disabled={collections.length === 0}
                            sx={{
                                minWidth: { xs: 'auto', sm: 'auto' },
                                px: { xs: 1.5, sm: 2 },
                            }}
                        >
                            <Box sx={{ display: { xs: 'none', sm: 'block' } }}>Collections</Box>
                            <CollectionsIcon sx={{ display: { xs: 'block', sm: 'none' } }} />
                        </Button>

                        <Button
                            variant="outlined"
                            startIcon={<AddIcon sx={{ display: { xs: 'none', sm: 'inline-flex' } }} />}
                            onClick={() => setShowAddCardsDialog(true)}
                            disabled={!currentCollection}
                            sx={{
                                minWidth: { xs: 'auto', sm: 'auto' },
                                px: { xs: 1.5, sm: 2 },
                            }}
                        >
                            <Box sx={{ display: { xs: 'none', sm: 'block' } }}>Add Cards</Box>
                            <AddIcon sx={{ display: { xs: 'block', sm: 'none' } }} />
                        </Button>

                        <Button
                            variant="contained"
                            startIcon={<ShuffleIcon sx={{ display: { xs: 'none', sm: 'inline-flex' } }} />}
                            onClick={handleShuffle}
                            disabled={!currentCollection || currentCollection.cards.length === 0}
                            sx={{
                                minWidth: { xs: 'auto', sm: 'auto' },
                                px: { xs: 1.5, sm: 2 },
                            }}
                        >
                            <Box sx={{ display: { xs: 'none', sm: 'block' } }}>Shuffle</Box>
                            <ShuffleIcon sx={{ display: { xs: 'block', sm: 'none' } }} />
                        </Button>

                        <Button
                            variant="contained"
                            startIcon={<RandomIcon sx={{ display: { xs: 'none', sm: 'inline-flex' } }} />}
                            onClick={handleRandomCard}
                            disabled={!currentCollection || currentCollection.cards.length === 0}
                            color="secondary"
                            sx={{
                                minWidth: { xs: 'auto', sm: 'auto' },
                                px: { xs: 1.5, sm: 2 },
                            }}
                        >
                            <Box sx={{ display: { xs: 'none', sm: 'block' } }}>Random</Box>
                            <RandomIcon sx={{ display: { xs: 'block', sm: 'none' } }} />
                        </Button>
                    </Stack>

                    {/* Second Row: Export, Import */}
                    <Stack direction="row" spacing={1} sx={{ justifyContent: 'center' }}>
                        <Button
                            variant="outlined"
                            startIcon={<DownloadIcon sx={{ display: { xs: 'none', sm: 'inline-flex' } }} />}
                            onClick={handleExport}
                            disabled={!currentCollection}
                            sx={{
                                minWidth: { xs: 'auto', sm: 'auto' },
                                px: { xs: 1.5, sm: 2 },
                            }}
                        >
                            <Box sx={{ display: { xs: 'none', sm: 'block' } }}>Export</Box>
                            <DownloadIcon sx={{ display: { xs: 'block', sm: 'none' } }} />
                        </Button>

                        <Button
                            variant="outlined"
                            startIcon={<UploadIcon sx={{ display: { xs: 'none', sm: 'inline-flex' } }} />}
                            onClick={() => fileInputRef.current?.click()}
                            sx={{
                                minWidth: { xs: 'auto', sm: 'auto' },
                                px: { xs: 1.5, sm: 2 },
                            }}
                        >
                            <Box sx={{ display: { xs: 'none', sm: 'block' } }}>Import</Box>
                            <UploadIcon sx={{ display: { xs: 'block', sm: 'none' } }} />
                        </Button>
                    </Stack>
                </Stack>
            )}

            {collections.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                    <SchoolIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h5" gutterBottom>
                        No Collections Yet
                    </Typography>
                    <Typography color="text.secondary" sx={{ mb: 3 }}>
                        Create your first flash card collection or import an existing one
                    </Typography>
                    <Stack direction="row" spacing={2} sx={{ justifyContent: 'center' }}>
                        <Button variant="contained" size="large" startIcon={<AddIcon />} onClick={() => setShowNewCollectionDialog(true)}>
                            Create Collection
                        </Button>
                        <Button variant="outlined" size="large" startIcon={<UploadIcon />} onClick={() => fileInputRef.current?.click()}>
                            Import
                        </Button>
                    </Stack>
                </Box>
            ) : !currentCollection ? (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                    <Typography variant="h6">Select a collection to continue</Typography>
                    <Button variant="contained" sx={{ mt: 2 }} onClick={() => setShowCollectionsDialog(true)}>
                        View Collections
                    </Button>
                </Box>
            ) : (
                <Box>
                    <Paper sx={{ p: 3, mb: 3 }}>
                        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                            <Box>
                                <Typography variant="h5" gutterBottom>
                                    {currentCollection.name}
                                </Typography>
                                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                                    <Chip label={`${currentCollection.cards.length} card(s)`} size="small" color="primary" />
                                    <Typography variant="caption" color="text.secondary">
                                        Updated: {new Date(currentCollection.updatedAt).toLocaleDateString()}
                                    </Typography>
                                </Stack>
                            </Box>
                            <Stack direction="row" spacing={1}>
                                <Button variant="outlined" startIcon={<AddIcon />} onClick={() => setShowAddCardsDialog(true)}>
                                    Add Cards
                                </Button>
                                <Button variant="outlined" onClick={() => setShowNewCollectionDialog(true)}>
                                    New Collection
                                </Button>
                            </Stack>
                        </Stack>
                    </Paper>

                    {currentCollection.cards.length === 0 ? (
                        <Box sx={{ textAlign: 'center', py: 8 }}>
                            <Typography variant="h6" color="text.secondary" gutterBottom>
                                No cards in this collection
                            </Typography>
                            <Typography color="text.secondary" sx={{ mb: 3 }}>
                                Add your first flash card to start learning
                            </Typography>
                            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setShowAddCardsDialog(true)}>
                                Add Cards
                            </Button>
                        </Box>
                    ) : (
                        <Stack spacing={2}>
                            {currentCollection.cards.map(card => (
                                <Card key={card.id}>
                                    <CardContent>
                                        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <Box sx={{ flex: 1 }}>
                                                <Typography variant="h6" gutterBottom>
                                                    {card.label}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    {card.content}
                                                </Typography>
                                            </Box>
                                            <Stack direction="row" spacing={1}>
                                                <Tooltip title="Edit">
                                                    <IconButton size="small" onClick={() => handleEditCard(card)}>
                                                        <EditIcon />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Delete">
                                                    <IconButton size="small" color="error" onClick={() => handleDeleteCard(card.id)}>
                                                        <DeleteIcon />
                                                    </IconButton>
                                                </Tooltip>
                                            </Stack>
                                        </Stack>
                                    </CardContent>
                                </Card>
                            ))}
                        </Stack>
                    )}
                </Box>
            )}

            {/* New Collection Dialog */}
            <Dialog open={showNewCollectionDialog} onClose={() => setShowNewCollectionDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Create New Collection</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Collection Name"
                        fullWidth
                        value={newCollectionName}
                        onChange={e => setNewCollectionName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleCreateCollection()}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowNewCollectionDialog(false)}>Cancel</Button>
                    <Button onClick={handleCreateCollection} variant="contained">
                        Create
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Add Cards Dialog */}
            <Dialog open={showAddCardsDialog} onClose={() => setShowAddCardsDialog(false)} maxWidth="md" fullWidth>
                <DialogTitle>Add Flash Cards</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Enter one card per line in the format: <strong>Label: Content</strong>
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Example:
                        <br />
                        What is the capital of France?: Paris
                        <br />2 + 2 = ?: 4
                    </Typography>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Flash Cards"
                        fullWidth
                        multiline
                        rows={10}
                        value={bulkCardInput}
                        onChange={e => setBulkCardInput(e.target.value)}
                        placeholder="Question 1: Answer 1&#10;Question 2: Answer 2&#10;Question 3: Answer 3"
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowAddCardsDialog(false)}>Cancel</Button>
                    <Button onClick={handleAddCards} variant="contained">
                        Add Cards
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Collections Dialog */}
            <Dialog open={showCollectionsDialog} onClose={() => setShowCollectionsDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>My Collections</DialogTitle>
                <DialogContent sx={{ p: 0 }}>
                    <List>
                        {collections.map(collection => (
                            <Box key={collection.id}>
                                <ListItem
                                    secondaryAction={
                                        <IconButton edge="end" onClick={() => handleDeleteCollection(collection.id)} color="error">
                                            <DeleteIcon />
                                        </IconButton>
                                    }
                                    disablePadding
                                >
                                    <ListItemButton selected={collection.id === currentCollectionId} onClick={() => handleSwitchCollection(collection.id)}>
                                        <ListItemText
                                            primary={collection.name}
                                            secondary={`${collection.cards.length} card(s) • Updated ${new Date(collection.updatedAt).toLocaleDateString()}`}
                                        />
                                    </ListItemButton>
                                </ListItem>
                                <Divider />
                            </Box>
                        ))}
                    </List>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowCollectionsDialog(false)}>Close</Button>
                </DialogActions>
            </Dialog>

            {/* Edit Card Dialog */}
            <Dialog open={showEditCardDialog} onClose={() => setShowEditCardDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Edit Flash Card</DialogTitle>
                <DialogContent>
                    <TextField autoFocus margin="dense" label="Label" fullWidth value={editLabel} onChange={e => setEditLabel(e.target.value)} sx={{ mb: 2 }} />
                    <TextField margin="dense" label="Content" fullWidth multiline rows={4} value={editContent} onChange={e => setEditContent(e.target.value)} />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowEditCardDialog(false)}>Cancel</Button>
                    <Button onClick={handleSaveEditCard} variant="contained">
                        Save
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
