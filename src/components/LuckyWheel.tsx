/**
 * LuckyWheel Component
 *
 * An interactive decision-making tool with customizable spinning wheels for making random choices.
 *
 * Related docs (update if this component changes): AGENTS.md, docs/NEW_PROJECT_TEMPLATE.md, docs/STYLES.md, docs/LUCKY_WHEEL_KNOWN_ISSUES.md
 *
 * PERFORMANCE MODEL (read before changing the rendering code):
 * The wheel must stay at 60fps even with 60+ slices, and the page behind it (including the
 * always-on animated background) must keep moving. Therefore:
 * 1. The wheel is rasterized ONCE per configuration change into two stacked canvases:
 *    - a rotating layer (slices + labels) and a static layer (rim + hub + pointer).
 *    Rotation is then a pure CSS `transform: rotate()` on the rotating layer, so the
 *    compositor animates it and the browser never repaints pixels or re-rasterizes text.
 * 2. The spin loop writes `canvas.style.transform` directly from a `requestAnimationFrame`
 *    callback. It never calls `setState`, so the component does not re-render while spinning.
 * 3. No CSS `filter` or `backdrop-filter` is allowed on the wheel or any ancestor of it:
 *    filters must be re-rasterized whenever the backdrop or the transform changes, which
 *    stalls the whole page (see docs/LUCKY_WHEEL_KNOWN_ISSUES.md).
 * 4. The backing store is scaled by `devicePixelRatio` so text stays crisp without redrawing.
 *
 * LABEL LEGIBILITY RULES (read before changing the label drawing code):
 * Slice labels are small white text on saturated fills, so every glyph is drawn twice: a hard
 * dark `strokeText` outline underneath, then the white `fillText`. Both the outline width and the
 * blurred halo are scaled with the font size, and the font size itself shrinks as the wheel gets
 * denser (see LABEL_PITCH_FILL) so neighbouring labels stop colliding. Two traps to keep in mind:
 * - `ctx.shadowBlur` is the ONE length that is measured in device pixels and is NOT affected by
 *   the context transform. It must always be multiplied by `devicePixelRatio` here, otherwise the
 *   halo silently loses a factor of dpr and the labels look washed out on HiDPI screens.
 * - Shadow state must be set INSIDE the per-label save/restore, after the slice fills. Setting it
 *   before the loop gives every flat slice fill a drop shadow, which is a visible dark ring.
 *
 * OVERVIEW:
 * Built with Material UI following the project's design system. Users can spin the wheel, customize
 * items, save favorite wheels, and share them via URL.
 *
 * KEY FEATURES:
 * 1. Interactive Wheel Spinning
 *    - Click directly on wheel to spin (no separate button)
 *    - Smooth animated rotation with realistic physics
 *    - Visual pointer at top indicates winning selection
 *    - Result displayed in Dialog with trophy icon
 *    - Automatic deceleration with cubic easing
 *    - 4-second animation with 5-10 full rotations
 *
 * 2. Material UI Design
 *    - Consistent with other project components
 *  - AppBar with dark background, back button
 *    - Responsive layout for mobile and desktop
 *    - Translucent white card (solid fill, no backdrop blur) framing the wheel
 *    - Icon-only buttons on mobile, icon+text on desktop
 *    - Snackbar notifications for user feedback
 *
 * 3. Customizable Items
 *    - Default wheel: "Yes" and "No" options
 *    - Edit button for easy access
 *    - Dialog for item management
 *    - One item per line in multiline TextField
 *    - Automatic whitespace trimming
 *    - Max 50 chars per item with truncation
 *    - Displays min 10 chars on wheel with ellipsis
 *    - Automatic color assignment from 10-color palette
 *    - Requires at least 1 item
 *
 * 4. Save Wheels
 *    - Save current configuration to localStorage
 *    - Required wheel name field with validation
 *    - View all saved wheels in Dialog List
 *    - Load/delete saved wheels
 *    - Displays creation date and item count
 *
 * 5. Share Wheels
 *    - Generate shareable links with a compressed URL parameter
 *    - Items are compacted with lz-string (base64-like URI-safe output) so
 *      even large wheels produce short URLs that chat apps won't truncate
 *    - Automatic clipboard copy with success notification
 *    - Clean URLs after loading (params removed)
 *    - Recipients can spin, edit, and save shared wheels
 *    - Legacy links using the uncompressed ?items= format still load
 *
 * 6. Responsive Design
 *    - Canvas-based wheel rendering
 *    - Touch-friendly controls
 *    - Mobile: Icon-only buttons
 *    - Desktop: Icon+text buttons
 *    - Adaptive wheel size (300px mobile, 450px desktop)
 *
 * CORE FUNCTIONS:
 *
 * fitSliceText(): Label fitting
 * - Returns the label unchanged when it already fits the slice
 * - Otherwise binary-searches the longest prefix + ellipsis that fits (O(log n) measureText calls)
 * - Always keeps at least 10 characters, even when they overflow
 * - Short labels that overflow are shown in full rather than truncated
 *
 * drawWheel(): Canvas rendering engine
 * - Sizes both backing stores to `canvasSize * devicePixelRatio` and pre-scales the contexts
 * - Rotating layer: clears, translates to the centre, draws colored slices with borders and
 *   the fitted labels (plus their drop shadow for legibility)
 * - Static layer: outer rim, inner rim, centre hub and the top pointer triangle
 * - Runs only when items, wheel size, font readiness or theme color change
 *
 * setWheelRotation(): Rotation writer
 * - Stores the current angle in a ref (no re-render)
 * - Applies it as a CSS transform on the rotating canvas layer
 *
 * spinWheel(): Animation controller
 * - Guard conditions prevent multiple spins
 * - Random rotation: 5-10 full rotations + random 0-360°
 * - 4-second duration with cubic ease-out easing
 * - Frame-by-frame requestAnimationFrame loop writing only the CSS transform
 * - Frame id is tracked so the loop is cancelled on unmount
 * - Determines winner when animation completes
 *
 * determineWinner(): Winner calculation algorithm
 * - Calculates slice size (360° / item count)
 * - Normalizes rotation to 0-360 range
 * - Calculates angle at pointer position (270° - rotation)
 * - Finds winning slice index
 * - Displays result in Dialog
 *
 * handleEdit/handleSaveEdit(): Item management
 * - Opens edit dialog with current items
 * - Parses and cleans input (split, trim, filter)
 * - Validates at least one item exists
 * - Creates WheelItem objects with colors
 * - Truncates text to 50 characters
 * - Updates state and triggers redraw
 *
 * handleSaveWheel/handleLoadWheel(): Persistence
 * - Validates wheel name
 * - Creates SavedWheel object with timestamp
 * - Updates localStorage
 * - Loads saved wheels on mount
 * - Reconstructs WheelItems with colors
 *
 * handleShareWheel(): URL sharing
 * - Joins item texts with pipe separator
 * - Compresses the payload with lz-string compressToEncodedURIComponent
 * - Builds URL with ?wheel= query parameter
 * - Copies to clipboard
 * - Shows success notification
 *
 * checkForSharedWheel(): Loading from URL
 * - Parses URL parameters on mount
 * - Decompresses ?wheel= or reads legacy ?items= and splits items
 * - Validates and creates WheelItems
 * - Cleans URL after loading
 * - Error handling for malformed URLs
 *
 * TYPES:
 * - WheelItem: { id, text, color }
 * - SavedWheel: { id, name, items[], createdAt }
 *
 * COLOR PALETTE:
 * 10 Mario-inspired bright colors cycle through items:
 * Cyan, Magenta, Green, Yellow, Orange, Purple, Red, Sky Blue, Hot Pink, Mint
 *
 * TECHNICAL IMPLEMENTATION:
 * - HTML5 Canvas API with 2D context, two stacked layers (rotating + static)
 * - Canvas size: 300x300px (mobile) or 450x450px (desktop)
 * - devicePixelRatio-aware backing store for crisp labels
 * - Polar coordinates for pie segments
 * - Text truncation with pixel-width measurement
 * - CSS transform rotation driven by requestAnimationFrame (compositor-only, no repaints)
 * - localStorage for saving wheels
 * - lz-string compression for compact share URLs (?wheel= param)
 * - Loads legacy uncompressed ?items= param for backward compatibility
 * - Clipboard API for sharing
 *
 * BROWSER COMPATIBILITY:
 * Requires:
 * - HTML5 Canvas API
 * - localStorage API
 * - ES6+ features
 * - URL/URLSearchParams API
 * - Clipboard API (navigator.clipboard)
 * - requestAnimationFrame
 * - React 18+
 * - Material UI v5+
 *
 * ACCESSIBILITY:
 * - Keyboard navigation in dialogs (Escape to close, Enter to submit)
 * - The wheel is a focusable button: Enter/Space spins it
 * - Visual feedback: hover states, pointer cursor on wheel
 * - High contrast text (white on vibrant colors with shadow)
 * - Touch targets: min 48px for mobile
 * - Screen readers: semantic HTML with ARIA from Material UI
 * - Focus management: auto-focus on TextField when dialogs open
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import {
    Box,
    Typography,
    Paper,
    Button,
    IconButton,
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
import { WheelIcon, EditIcon, FolderIcon, ShareIcon, SaveIcon, DeleteIcon, TrophyIcon } from './AppIcons';
import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';
import { ProjectLayout } from './ProjectLayout';
import type { WheelItem, SavedWheel } from '../types/LuckyWheel';

const DEFAULT_COLORS = ['#e52521', '#049cd8', '#f5aa00', '#43b047', '#ff7043', '#a041ff', '#e91e63', '#00a86b', '#7c4dff', '#ff5252'];

const DEFAULT_ITEMS: WheelItem[] = [
    { id: '1', text: 'Yes', color: DEFAULT_COLORS[0] },
    { id: '2', text: 'No', color: DEFAULT_COLORS[1] },
];

const CONTENT_FONT = '"VT323", "Courier New", monospace';
const CONTENT_FONT_READY = '16px "VT323"';
const LABEL_FONT_SIZE = 16;
const MIN_LABEL_FONT_SIZE = 8;
// Fraction of the available arc that one label may occupy before neighbouring labels collide.
const LABEL_PITCH_FILL = 0.8;
const LABEL_FILL = '#ffffff';
const LABEL_OUTLINE = 'rgba(0, 0, 0, 0.85)';
const LABEL_OUTLINE_RATIO = 5;
const LABEL_SHADOW = 'rgba(0, 0, 0, 0.7)';
// IMPORTANT: ctx.shadowBlur is measured in DEVICE pixels and is NOT affected by the context
// transform, unlike every other length below. Because the wheel drawing is pre-scaled by
// devicePixelRatio, this value must be multiplied by that ratio at draw time or the halo
// silently shrinks to 1/dpr of its intended strength and the labels look washed out on HiDPI
// screens. See docs/LUCKY_WHEEL_KNOWN_ISSUES.md.
const LABEL_SHADOW_BLUR = 4;
const MIN_LABEL_CHARS = 10;
const MAX_ITEMS_CHARS = 50;
const SPIN_DURATION_MS = 4000;
const MAX_DEVICE_PIXEL_RATIO = 2;
const LABEL_TEXT_RADIUS_RATIO = 0.55;
const LABEL_MAX_WIDTH_RATIO = 0.75;

/**
 * Returns the longest label that fits `maxWidth`, adding an ellipsis when the text is cut.
 * At least MIN_LABEL_CHARS characters are always kept, and labels that are already short are
 * never truncated (they overflow instead), which matches the previous behaviour.
 */
const fitSliceText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string => {
    if (ctx.measureText(text).width <= maxWidth) return text;

    const minChars = Math.min(MIN_LABEL_CHARS, text.length);
    if (minChars === text.length) return text;

    let low = minChars;
    let high = text.length - 1;
    let best = -1;
    while (low <= high) {
        const mid = (low + high) >> 1;
        if (ctx.measureText(`${text.slice(0, mid)}...`).width <= maxWidth) {
            best = mid;
            low = mid + 1;
        } else {
            high = mid - 1;
        }
    }

    const chars = best === -1 ? minChars : best;
    return `${text.slice(0, chars)}...`;
};

const loadStoredWheels = (): SavedWheel[] => {
    try {
        const saved = localStorage.getItem('luckyWheels');
        return saved ? (JSON.parse(saved) as SavedWheel[]) : [];
    } catch (error) {
        console.error('Failed to parse saved wheels:', error);
        return [];
    }
};

const loadSharedItems = (): WheelItem[] | null => {
    const params = new URLSearchParams(window.location.search);
    const compressed = params.get('wheel');
    const decodedItems = compressed ? decompressFromEncodedURIComponent(compressed) : params.get('items');
    if (!decodedItems) return null;
    const itemsList = decodedItems.split('|').filter(item => item.trim());
    if (itemsList.length === 0) return null;
    return itemsList.map((text, index) => ({
        id: String(index + 1),
        text: text.trim(),
        color: DEFAULT_COLORS[index % DEFAULT_COLORS.length],
    }));
};

export const LuckyWheel = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const canvasSize = isMobile ? 300 : 450;

    const [items, setItems] = useState<WheelItem[]>(() => loadSharedItems() ?? DEFAULT_ITEMS);
    const [isSpinning, setIsSpinning] = useState(false);
    const [result, setResult] = useState<string | null>(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editText, setEditText] = useState('');
    const [savedWheels, setSavedWheels] = useState<SavedWheel[]>(loadStoredWheels);
    const [showSavedWheels, setShowSavedWheels] = useState(false);
    const [wheelName, setWheelName] = useState('');
    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [showCopySnackbar, setShowCopySnackbar] = useState(false);
    const [wheelFontReady, setWheelFontReady] = useState(false);
    const wheelCanvasRef = useRef<HTMLCanvasElement>(null);
    const frameCanvasRef = useRef<HTMLCanvasElement>(null);
    const rotationRef = useRef(0);
    const spinningRef = useRef(false);
    const spinFrameRef = useRef(0);

    useEffect(() => {
        let active = true;
        document.fonts
            .load(CONTENT_FONT_READY)
            .then(() => {
                if (active) setWheelFontReady(true);
            })
            .catch(() => undefined);
        return () => {
            active = false;
        };
    }, []);

    // Stop the animation loop if the page unmounts mid-spin
    useEffect(() => {
        return () => {
            if (spinFrameRef.current) {
                cancelAnimationFrame(spinFrameRef.current);
                spinFrameRef.current = 0;
            }
        };
    }, []);

    const drawWheel = useCallback(() => {
        const wheelCanvas = wheelCanvasRef.current;
        const frameCanvas = frameCanvasRef.current;
        if (!wheelCanvas || !frameCanvas || items.length === 0) return;

        const wheelCtx = wheelCanvas.getContext('2d');
        const frameCtx = frameCanvas.getContext('2d');
        if (!wheelCtx || !frameCtx) return;

        // Scale the backing store by the device pixel ratio so labels stay crisp on HiDPI screens.
        // Layout keeps working in CSS pixels via the pre-scaled context.
        const dpr = Math.min(window.devicePixelRatio || 1, MAX_DEVICE_PIXEL_RATIO);
        const size = canvasSize;
        const center = size / 2;
        const radius = center - 10;

        for (const canvas of [wheelCanvas, frameCanvas]) {
            canvas.width = Math.round(size * dpr);
            canvas.height = Math.round(size * dpr);
        }

        wheelCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
        frameCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
        wheelCtx.clearRect(0, 0, size, size);
        frameCtx.clearRect(0, 0, size, size);

        // Rotating layer: slices and labels, drawn once at 0deg. Rotation is a CSS transform.
        const sliceAngle = (2 * Math.PI) / items.length;
        const labelRadius = radius * LABEL_TEXT_RADIUS_RATIO;
        const maxLabelWidth = radius * LABEL_MAX_WIDTH_RATIO;

        // Labels are drawn radially, so the space one label has is the arc length it covers at
        // labelRadius. Shrink the font when the wheel is dense enough that neighbours would
        // otherwise overlap - a 64 item wheel leaves ~11px per label and cannot keep 16px text.
        const labelPitch = sliceAngle * labelRadius;
        const fontSize = Math.max(MIN_LABEL_FONT_SIZE, Math.min(LABEL_FONT_SIZE, Math.floor(labelPitch * LABEL_PITCH_FILL)));

        wheelCtx.save();
        wheelCtx.translate(center, center);
        wheelCtx.textAlign = 'center';
        wheelCtx.textBaseline = 'alphabetic';
        wheelCtx.font = `bold ${fontSize}px ${wheelFontReady ? CONTENT_FONT : 'monospace'}`;

        items.forEach((item, index) => {
            const startAngle = index * sliceAngle;

            wheelCtx.beginPath();
            wheelCtx.moveTo(0, 0);
            wheelCtx.arc(0, 0, radius, startAngle, startAngle + sliceAngle);
            wheelCtx.closePath();
            wheelCtx.fillStyle = item.color;
            wheelCtx.fill();
            wheelCtx.strokeStyle = '#fff';
            wheelCtx.lineWidth = 3;
            wheelCtx.stroke();

            // Labels are white on saturated colors, so each glyph gets a hard dark outline plus a
            // soft blurred halo, both scaled with the font. They are set inside this save/restore
            // so the flat slice fills above never pick up a shadow.
            wheelCtx.save();
            wheelCtx.rotate(startAngle + sliceAngle / 2);
            wheelCtx.lineJoin = 'round';
            wheelCtx.miterLimit = 2;
            wheelCtx.shadowColor = LABEL_SHADOW;
            wheelCtx.shadowBlur = LABEL_SHADOW_BLUR * (fontSize / LABEL_FONT_SIZE) * dpr;

            const label = fitSliceText(wheelCtx, item.text, maxLabelWidth);

            wheelCtx.strokeStyle = LABEL_OUTLINE;
            wheelCtx.lineWidth = Math.max(1, fontSize / LABEL_OUTLINE_RATIO);
            wheelCtx.strokeText(label, labelRadius, 5);

            wheelCtx.fillStyle = LABEL_FILL;
            wheelCtx.fillText(label, labelRadius, 5);

            wheelCtx.restore();
        });

        wheelCtx.restore();

        // Static layer: rims, hub and pointer stay upright while the slices spin.
        frameCtx.beginPath();
        frameCtx.arc(center, center, radius + 2, 0, 2 * Math.PI);
        frameCtx.lineWidth = 4;
        frameCtx.strokeStyle = '#3a2d1f';
        frameCtx.stroke();
        frameCtx.beginPath();
        frameCtx.arc(center, center, radius - 1, 0, 2 * Math.PI);
        frameCtx.lineWidth = 2;
        frameCtx.strokeStyle = '#3a2d1f';
        frameCtx.stroke();

        frameCtx.beginPath();
        frameCtx.arc(center, center, 20, 0, 2 * Math.PI);
        frameCtx.fillStyle = '#3a2d1f';
        frameCtx.fill();
        frameCtx.strokeStyle = theme.palette.primary.main;
        frameCtx.lineWidth = 4;
        frameCtx.stroke();

        frameCtx.beginPath();
        frameCtx.arc(center, center, 8, 0, 2 * Math.PI);
        frameCtx.fillStyle = theme.palette.primary.main;
        frameCtx.fill();

        frameCtx.beginPath();
        frameCtx.moveTo(center, 10);
        frameCtx.lineTo(center - 15, 40);
        frameCtx.lineTo(center + 15, 40);
        frameCtx.closePath();
        frameCtx.fillStyle = theme.palette.primary.main;
        frameCtx.fill();
        frameCtx.strokeStyle = '#fff';
        frameCtx.lineWidth = 2;
        frameCtx.stroke();
    }, [items, canvasSize, theme.palette.primary.main, wheelFontReady]);

    useEffect(() => {
        if (window.location.search.includes('wheel=') || window.location.search.includes('items=')) {
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }, []);

    // Redraw only when the wheel configuration changes - never while spinning.
    useEffect(() => {
        drawWheel();
    }, [drawWheel]);

    const setWheelRotation = (degrees: number) => {
        rotationRef.current = degrees;
        if (wheelCanvasRef.current) {
            wheelCanvasRef.current.style.transform = `rotate(${degrees}deg)`;
        }
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

    const spinWheel = () => {
        if (spinningRef.current || items.length === 0) return;

        spinningRef.current = true;
        setIsSpinning(true);
        setResult(null);

        // Random values are only produced here, inside the event handler, never during render
        const spins = 5 + Math.random() * 5;
        const extraDegrees = Math.random() * 360;
        const totalRotation = spins * 360 + extraDegrees;

        const currentRotation = rotationRef.current;
        const startTime = performance.now();

        // Only the CSS transform is written per frame, so the browser composites the rotation
        // without repainting the canvas or re-rendering React.
        const animate = (time: number) => {
            const progress = Math.min((time - startTime) / SPIN_DURATION_MS, 1);
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const newRotation = currentRotation + totalRotation * easeOut;

            setWheelRotation(newRotation % 360);

            if (progress < 1) {
                spinFrameRef.current = requestAnimationFrame(animate);
            } else {
                spinFrameRef.current = 0;
                spinningRef.current = false;
                setIsSpinning(false);
                determineWinner(newRotation);
            }
        };

        spinFrameRef.current = requestAnimationFrame(animate);
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
            const truncatedText = text.slice(0, MAX_ITEMS_CHARS);
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
        const compressed = compressToEncodedURIComponent(itemsParam);
        const url = `${window.location.origin}${window.location.pathname}?wheel=${encodeURIComponent(compressed)}`;

        navigator.clipboard.writeText(url);
        setShowCopySnackbar(true);
    };

    return (
        <ProjectLayout
            title="Lucky Wheel"
            icon={<WheelIcon />}
            maxWidth="lg"
            actions={
                <Button startIcon={<ShareIcon />} onClick={handleShareWheel}>
                    Share
                </Button>
            }
            mobileActions={
                <IconButton onClick={handleShareWheel} color="inherit" aria-label="Share wheel">
                    <ShareIcon />
                </IconButton>
            }
        >
            {/* Action Buttons */}
            <Stack direction="row" spacing={2} sx={{ mb: 3, justifyContent: 'center' }}>
                <Button variant="outlined" startIcon={<EditIcon />} onClick={handleEdit} sx={{ display: isMobile ? 'none' : 'flex' }}>
                    Edit
                </Button>
                <IconButton onClick={handleEdit} sx={{ display: isMobile ? 'flex' : 'none' }} color="primary" aria-label="Edit wheel">
                    <EditIcon />
                </IconButton>

                <Button variant="outlined" startIcon={<SaveIcon />} onClick={openSaveDialog} sx={{ display: isMobile ? 'none' : 'flex' }}>
                    Save
                </Button>
                <IconButton onClick={openSaveDialog} sx={{ display: isMobile ? 'flex' : 'none' }} color="primary" aria-label="Save wheel">
                    <SaveIcon />
                </IconButton>

                <Button variant="outlined" startIcon={<FolderIcon />} onClick={() => setShowSavedWheels(true)} sx={{ display: isMobile ? 'none' : 'flex' }}>
                    Load
                </Button>
                <IconButton onClick={() => setShowSavedWheels(true)} sx={{ display: isMobile ? 'flex' : 'none' }} color="primary" aria-label="Load wheel">
                    <FolderIcon />
                </IconButton>
            </Stack>

            {/* Main Content - Wheel */}
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <Paper
                    elevation={0}
                    sx={{
                        p: 3,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        // Translucent on purpose: a backdrop-filter here would force the browser to
                        // re-blur the animating page background on every spin frame.
                        bgcolor: 'rgba(255, 255, 255, 0.55)',
                        borderColor: 'rgba(255, 255, 255, 0.6)',
                    }}
                >
                    {/* Wheel: rotating slice layer + static frame layer */}
                    <Box
                        onClick={spinWheel}
                        onKeyDown={event => {
                            if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault();
                                spinWheel();
                            }
                        }}
                        role="button"
                        tabIndex={0}
                        aria-label="Spin the wheel"
                        sx={{ position: 'relative', lineHeight: 0, cursor: isSpinning ? 'wait' : 'pointer', touchAction: 'manipulation' }}
                    >
                        <Box
                            ref={wheelCanvasRef}
                            component="canvas"
                            role="img"
                            aria-label={`Wheel with ${items.length} options`}
                            sx={{
                                display: 'block',
                                width: canvasSize,
                                maxWidth: '100%',
                                aspectRatio: '1 / 1',
                                transform: 'rotate(0deg)',
                                willChange: 'transform',
                            }}
                        />
                        <Box
                            ref={frameCanvasRef}
                            component="canvas"
                            aria-hidden="true"
                            sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
                        />
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 2 }}>
                        {isSpinning ? 'Spinning...' : 'Click wheel to spin'}
                    </Typography>
                </Paper>
            </Box>

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
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main', fontFamily: CONTENT_FONT, fontSize: '1.5rem' }}>
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
        </ProjectLayout>
    );
};
