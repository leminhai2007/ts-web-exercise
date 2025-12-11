import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
    Box,
    Container,
    Typography,
    Paper,
    Button,
    IconButton,
    AppBar,
    Toolbar,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Stack,
    useTheme,
    useMediaQuery,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    Snackbar,
    Alert,
} from '@mui/material';
import {
    ArrowBack as ArrowBackIcon,
    Casino as WheelIcon,
    Edit as EditIcon,
    FolderOpen as FolderIcon,
    Share as ShareIcon,
    Save as SaveIcon,
    Delete as DeleteIcon,
    EmojiEvents as TrophyIcon,
} from '@mui/icons-material';
import type { WheelItem, SavedWheel } from '../types/LuckyWheel';

const DEFAULT_COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739', '#52B788'];

export const LuckyWheel = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const [items, setItems] = useState<WheelItem[]>([
        { id: '1', text: 'Yes', color: DEFAULT_COLORS[0] },
        { id: '2', text: 'No', color: DEFAULT_COLORS[1] },
    ]);
    const [isSpinning, setIsSpinning] = useState(false);
    const [rotation, setRotation] = useState(0);
    const [result, setResult] = useState<string | null>(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editText, setEditText] = useState('');
    const [savedWheels, setSavedWheels] = useState<SavedWheel[]>([]);
    const [showSavedWheels, setShowSavedWheels] = useState(false);
    const [wheelName, setWheelName] = useState('');
    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [showCopySnackbar, setShowCopySnackbar] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const loadSavedWheels = useCallback(() => {
        const saved = localStorage.getItem('luckyWheels');
        if (saved) {
            setSavedWheels(JSON.parse(saved));
        }
    }, []);

    const checkForSharedWheel = useCallback(() => {
        const params = new URLSearchParams(window.location.search);
        const sharedItems = params.get('items');

        if (sharedItems) {
            try {
                const decodedItems = decodeURIComponent(sharedItems);
                const itemsList = decodedItems.split('|').filter(item => item.trim());

                if (itemsList.length > 0) {
                    const newItems: WheelItem[] = itemsList.map((text, index) => ({
                        id: String(index + 1),
                        text: text.trim(),
                        color: DEFAULT_COLORS[index % DEFAULT_COLORS.length],
                    }));
                    setItems(newItems);
                }

                window.history.replaceState({}, document.title, window.location.pathname);
            } catch (error) {
                console.error('Error loading shared wheel:', error);
            }
        }
    }, []);

    const drawWheel = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = Math.min(centerX, centerY) - 10;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate((rotation * Math.PI) / 180);

        const sliceAngle = (2 * Math.PI) / items.length;

        items.forEach((item, index) => {
            const startAngle = index * sliceAngle;
            const endAngle = startAngle + sliceAngle;

            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.arc(0, 0, radius, startAngle, endAngle);
            ctx.closePath();
            ctx.fillStyle = item.color;
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 3;
            ctx.stroke();

            ctx.save();
            ctx.rotate(startAngle + sliceAngle / 2);
            ctx.textAlign = 'center';
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 14px Arial';
            ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
            ctx.shadowBlur = 3;

            // Truncate text if too long to fit in the slice
            let displayText = item.text;
            const maxWidth = radius * 0.75; // Increased from 0.6 to 0.75 for more space
            let textWidth = ctx.measureText(displayText).width;

            // Ensure at least 10 characters are shown (or full text if shorter)
            const minChars = Math.min(10, item.text.length);

            if (textWidth > maxWidth) {
                // Truncate and add ellipsis, but keep at least minChars
                displayText = item.text.slice(0, Math.max(minChars, item.text.length));
                textWidth = ctx.measureText(displayText).width;

                while (textWidth > maxWidth && displayText.length > minChars) {
                    displayText = displayText.slice(0, -1);
                    textWidth = ctx.measureText(displayText + '...').width;
                }

                if (displayText.length < item.text.length) {
                    displayText = displayText + '...';
                }
            }

            ctx.fillText(displayText, radius * 0.55, 5);
            ctx.restore();
        });

        ctx.restore();

        ctx.beginPath();
        ctx.arc(centerX, centerY, 20, 0, 2 * Math.PI);
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(centerX, 10);
        ctx.lineTo(centerX - 15, 40);
        ctx.lineTo(centerX + 15, 40);
        ctx.closePath();
        ctx.fillStyle = theme.palette.primary.main;
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
    }, [items, rotation, theme.palette.primary.main]);

    useEffect(() => {
        loadSavedWheels();
        checkForSharedWheel();
    }, [loadSavedWheels, checkForSharedWheel]);

    useEffect(() => {
        drawWheel();
    }, [drawWheel]);

    const spinWheel = () => {
        if (isSpinning || items.length === 0) return;

        setIsSpinning(true);
        setResult(null);

        // These are safe in event handlers (not during render) - suppressing false positive warnings
        // eslint-disable-next-line
        const spins = 5 + Math.random() * 5;
        // eslint-disable-next-line
        const extraDegrees = Math.random() * 360;
        const totalRotation = spins * 360 + extraDegrees;

        const currentRotation = rotation;
        const duration = 4000;
        // eslint-disable-next-line
        const startTime = Date.now();

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            const easeOut = 1 - Math.pow(1 - progress, 3);
            const newRotation = currentRotation + totalRotation * easeOut;

            setRotation(newRotation % 360);

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                setIsSpinning(false);
                determineWinner(newRotation);
            }
        };

        animate();
    };

    const determineWinner = (finalRotation: number) => {
        // The pointer is at the top (pointing down from 0 degrees)
        // Slices are drawn starting from 0 degrees (right side) going counter-clockwise
        // We need to determine which slice the top pointer is pointing at

        const sliceAngle = 360 / items.length;

        // Normalize rotation to 0-360 range
        const normalizedRotation = ((finalRotation % 360) + 360) % 360;

        // The pointer is at top (270 degrees in standard coordinates, or -90 from our 0)
        // We need to find which slice is at 270 degrees (top) after rotation
        // Since wheel rotates clockwise, we subtract the rotation
        const pointerAngle = 270; // Top of the circle
        const angleAtPointer = (pointerAngle - normalizedRotation + 360) % 360;

        // Find which slice this angle falls into
        const winningIndex = Math.floor(angleAtPointer / sliceAngle) % items.length;

        setResult(items[winningIndex].text);
    };

    const handleEdit = () => {
        setEditText(items.map(item => item.text).join('\n'));
        setShowEditModal(true);
    };

    const handleSaveEdit = () => {
        const lines = editText
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);

        if (lines.length === 0) {
            return;
        }

        const newItems: WheelItem[] = lines.map((text, index) => {
            // Limit each item to 50 characters
            const truncatedText = text.slice(0, 50);
            return {
                id: String(index + 1),
                text: truncatedText,
                color: DEFAULT_COLORS[index % DEFAULT_COLORS.length],
            };
        });

        setItems(newItems);
        setShowEditModal(false);
        setResult(null);
    };

    const handleSaveWheel = () => {
        const name = wheelName.trim();

        if (!name) {
            return;
        }

        const newWheel: SavedWheel = {
            id: Date.now().toString(),
            name,
            items: items.map(item => item.text),
            createdAt: Date.now(),
        };

        const updated = [...savedWheels, newWheel];
        setSavedWheels(updated);
        localStorage.setItem('luckyWheels', JSON.stringify(updated));
        setWheelName('');
        setShowSaveDialog(false);
    };

    const openSaveDialog = () => {
        setShowSaveDialog(true);
    };

    const handleLoadWheel = (wheel: SavedWheel) => {
        const newItems: WheelItem[] = wheel.items.map((text, index) => ({
            id: String(index + 1),
            text,
            color: DEFAULT_COLORS[index % DEFAULT_COLORS.length],
        }));

        setItems(newItems);
        setShowSavedWheels(false);
        setResult(null);
    };

    const handleDeleteWheel = (id: string) => {
        const updated = savedWheels.filter(wheel => wheel.id !== id);
        setSavedWheels(updated);
        localStorage.setItem('luckyWheels', JSON.stringify(updated));
    };

    const handleShareWheel = () => {
        const itemsParam = items.map(item => item.text).join('|');
        const url = `${window.location.origin}${window.location.pathname}?items=${encodeURIComponent(itemsParam)}`;

        navigator.clipboard.writeText(url);
        setShowCopySnackbar(true);
    };

    const canvasSize = isMobile ? 300 : 450;

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
            {/* App Bar */}
            <AppBar position="static" elevation={0} sx={{ bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider' }}>
                <Toolbar>
                    <IconButton edge="start" component={Link} to="/" sx={{ mr: 2, color: 'text.primary' }}>
                        <ArrowBackIcon />
                    </IconButton>
                    <WheelIcon sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1, color: 'text.primary' }}>
                        Lucky Wheel
                    </Typography>

                    {/* Share Button Only */}
                    <Button startIcon={<ShareIcon />} onClick={handleShareWheel} sx={{ display: isMobile ? 'none' : 'flex' }}>
                        Share
                    </Button>
                    <IconButton onClick={handleShareWheel} sx={{ display: isMobile ? 'flex' : 'none', color: 'text.primary' }}>
                        <ShareIcon />
                    </IconButton>
                </Toolbar>
            </AppBar>

            <Container maxWidth="lg" sx={{ py: 4 }}>
                {/* Main Content - Wheel with Action Buttons on Top */}
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                    <Paper
                        sx={{
                            p: 3,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                        }}
                    >
                        {/* Action Buttons Above Wheel */}
                        <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
                            <Button variant="outlined" startIcon={<EditIcon />} onClick={handleEdit} sx={{ display: isMobile ? 'none' : 'flex' }}>
                                Edit
                            </Button>
                            <IconButton onClick={handleEdit} sx={{ display: isMobile ? 'flex' : 'none' }} color="primary">
                                <EditIcon />
                            </IconButton>

                            <Button variant="outlined" startIcon={<SaveIcon />} onClick={openSaveDialog} sx={{ display: isMobile ? 'none' : 'flex' }}>
                                Save
                            </Button>
                            <IconButton onClick={openSaveDialog} sx={{ display: isMobile ? 'flex' : 'none' }} color="primary">
                                <SaveIcon />
                            </IconButton>

                            <Button variant="outlined" startIcon={<FolderIcon />} onClick={() => setShowSavedWheels(true)} sx={{ display: isMobile ? 'none' : 'flex' }}>
                                Load
                            </Button>
                            <IconButton onClick={() => setShowSavedWheels(true)} sx={{ display: isMobile ? 'flex' : 'none' }} color="primary">
                                <FolderIcon />
                            </IconButton>
                        </Stack>

                        {/* Wheel Canvas */}
                        <Box onClick={spinWheel} sx={{ cursor: isSpinning ? 'wait' : 'pointer' }}>
                            <canvas
                                ref={canvasRef}
                                width={canvasSize}
                                height={canvasSize}
                                style={{
                                    maxWidth: '100%',
                                    filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))',
                                    transition: 'transform 0.2s',
                                }}
                            />
                        </Box>
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 2 }}>
                            {isSpinning ? 'Spinning...' : 'Click wheel to spin'}
                        </Typography>
                    </Paper>
                </Box>
            </Container>

            {/* Save Wheel Dialog */}
            <Dialog open={showSaveDialog} onClose={() => setShowSaveDialog(false)} maxWidth="xs" fullWidth>
                <DialogTitle>Save Wheel</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        fullWidth
                        label="Wheel Name"
                        placeholder="Enter wheel name"
                        value={wheelName}
                        onChange={e => setWheelName(e.target.value)}
                        sx={{ mt: 1 }}
                        required
                        onKeyPress={e => {
                            if (e.key === 'Enter' && wheelName.trim()) {
                                handleSaveWheel();
                            }
                        }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowSaveDialog(false)}>Cancel</Button>
                    <Button onClick={handleSaveWheel} variant="contained" disabled={!wheelName.trim()}>
                        Save
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Result Dialog */}
            <Dialog open={!!result} onClose={() => setResult(null)} maxWidth="xs" fullWidth>
                <DialogContent sx={{ textAlign: 'center', py: 4 }}>
                    <TrophyIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                        {result}
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setResult(null)} variant="contained" fullWidth>
                        Close
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Edit Modal */}
            <Dialog open={showEditModal} onClose={() => setShowEditModal(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Edit Wheel Items</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                        Enter one item per line (max 50 characters per item):
                    </Typography>
                    <TextField
                        autoFocus
                        multiline
                        rows={10}
                        fullWidth
                        value={editText}
                        onChange={e => setEditText(e.target.value)}
                        placeholder="Yes&#10;No&#10;Maybe&#10;Try Again"
                        sx={{ mt: 1 }}
                        helperText="Items will show at least 10 characters on the wheel"
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowEditModal(false)}>Cancel</Button>
                    <Button
                        onClick={handleSaveEdit}
                        variant="contained"
                        disabled={
                            editText
                                .split('\n')
                                .map(l => l.trim())
                                .filter(l => l.length > 0).length === 0
                        }
                    >
                        Save
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Saved Wheels Modal */}
            <Dialog open={showSavedWheels} onClose={() => setShowSavedWheels(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Saved Wheels</DialogTitle>
                <DialogContent>
                    {savedWheels.length === 0 ? (
                        <Typography color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
                            No saved wheels yet. Save your current wheel to see it here!
                        </Typography>
                    ) : (
                        <List>
                            {savedWheels.map(wheel => (
                                <ListItem
                                    key={wheel.id}
                                    sx={{
                                        border: 1,
                                        borderColor: 'divider',
                                        borderRadius: 1,
                                        mb: 1,
                                    }}
                                >
                                    <ListItemText
                                        primary={wheel.name}
                                        secondary={
                                            <>
                                                {wheel.items.length} items • {new Date(wheel.createdAt).toLocaleDateString()}
                                            </>
                                        }
                                    />
                                    <ListItemSecondaryAction>
                                        <IconButton edge="end" onClick={() => handleLoadWheel(wheel)} sx={{ mr: 1 }}>
                                            <FolderIcon />
                                        </IconButton>
                                        <IconButton edge="end" onClick={() => handleDeleteWheel(wheel.id)} color="error">
                                            <DeleteIcon />
                                        </IconButton>
                                    </ListItemSecondaryAction>
                                </ListItem>
                            ))}
                        </List>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowSavedWheels(false)}>Close</Button>
                </DialogActions>
            </Dialog>

            {/* Copy Snackbar */}
            <Snackbar
                open={showCopySnackbar}
                autoHideDuration={3000}
                onClose={() => setShowCopySnackbar(false)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={() => setShowCopySnackbar(false)} severity="success" sx={{ width: '100%' }}>
                    URL copied to clipboard!
                </Alert>
            </Snackbar>
        </Box>
    );
};
