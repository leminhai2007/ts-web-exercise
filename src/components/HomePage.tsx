/**
 * HomePage — the landing page with project search, category filters, favorites (starred projects),
 * sorted project grid, and PWA install/online status.
 * New projects are auto-discovered from src/data/projects.ts — do not modify this component to add one.
 *
 * Related docs (update if this component changes): AGENTS.md, docs/PROJECT_OVERVIEW.md, docs/STYLES.md
 */

import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Container,
    Box,
    Typography,
    TextField,
    Chip,
    Card,
    CardContent,
    CardActionArea,
    AppBar,
    Toolbar,
    Button,
    Stack,
    IconButton,
    Snackbar,
    Alert,
    Tooltip,
} from '@mui/material';
import {
    Home as HomeIcon,
    CloudQueue as CloudIcon,
    CloudOff as CloudOffIcon,
    GetApp as GetAppIcon,
    Star as StarIcon,
    StarBorder as StarBorderIcon,
} from '@mui/icons-material';
import { projects } from '../data/projects';

const FAVORITES_KEY = 'favoriteProjects';
const PINNED_BOTTOM_ID = 'data-manager';

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const HomePage = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [isInstallable, setIsInstallable] = useState(false);
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [favorites, setFavorites] = useState<string[]>(() => {
        try {
            const saved = localStorage.getItem(FAVORITES_KEY);
            return saved ? (JSON.parse(saved) as string[]) : [];
        } catch (error) {
            console.error('Failed to load favorites:', error);
            return [];
        }
    });
    const [favSnack, setFavSnack] = useState<{ message: string; severity: 'success' | 'info' } | null>(null);

    // Get all unique categories
    const allCategories = useMemo(() => {
        const categories = new Set<string>();
        projects.forEach(project => {
            project.categories.forEach(cat => categories.add(cat));
        });
        return Array.from(categories).sort();
    }, []);

    // Filter projects based on search and category, then sort: favorites first (by selection order),
    // then by name; Data Manager is always pinned to the bottom
    const filteredProjects = useMemo(() => {
        return projects
            .filter(project => {
                const matchesSearch =
                    project.name.toLowerCase().includes(searchTerm.toLowerCase()) || project.description.toLowerCase().includes(searchTerm.toLowerCase());
                const matchesCategory = selectedCategory === 'all' || project.categories.includes(selectedCategory);
                return matchesSearch && matchesCategory;
            })
            .sort((a, b) => {
                if (a.id === PINNED_BOTTOM_ID) return 1;
                if (b.id === PINNED_BOTTOM_ID) return -1;
                const favA = favorites.indexOf(a.id);
                const favB = favorites.indexOf(b.id);
                const isFavA = favA >= 0;
                const isFavB = favB >= 0;
                if (isFavA !== isFavB) return isFavA ? -1 : 1;
                if (isFavA && isFavB) return favA - favB;
                return a.name.localeCompare(b.name);
            });
    }, [searchTerm, selectedCategory, favorites]);

    // Auto-save favorites in selection order (earliest favorited first)
    useEffect(() => {
        try {
            localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
        } catch (error) {
            console.error('Failed to save favorites:', error);
        }
    }, [favorites]);

    const toggleFavorite = (id: string) => {
        const isFavorite = favorites.includes(id);
        setFavorites(prev => (isFavorite ? prev.filter(favId => favId !== id) : [...prev, id]));
        setFavSnack(isFavorite ? { message: 'Removed from favorites', severity: 'info' } : { message: 'Added to favorites', severity: 'success' });
    };

    // Handle PWA installation
    useEffect(() => {
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            setIsInstallable(true);
        };

        const handleAppInstalled = () => {
            setDeferredPrompt(null);
            setIsInstallable(false);
        };

        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('appinstalled', handleAppInstalled);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            setDeferredPrompt(null);
            setIsInstallable(false);
        }
    };

    return (
        <Box sx={{ flexGrow: 1, minHeight: '100vh', bgcolor: 'background.default' }}>
            <AppBar position="static" elevation={0} sx={{ borderBottom: '4px solid', borderColor: 'primary.dark' }}>
                <Toolbar>
                    <HomeIcon sx={{ mr: 2, color: 'inherit' }} />
                    <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="h6" component="h1" sx={{ color: 'inherit', fontWeight: 400, letterSpacing: 1 }}>
                            My Tools & Games
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'inherit', opacity: 0.85 }}>
                            A collection of interactive projects and games
                        </Typography>
                    </Box>
                    <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                        <Chip
                            icon={isOnline ? <CloudIcon /> : <CloudOffIcon />}
                            label={isOnline ? 'Online' : 'Offline'}
                            color={isOnline ? 'success' : 'default'}
                            size="small"
                        />
                        {isInstallable && (
                            <Button variant="contained" color="secondary" startIcon={<GetAppIcon />} onClick={handleInstallClick} size="small">
                                Install App
                            </Button>
                        )}
                    </Stack>
                </Toolbar>
            </AppBar>

            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Box sx={{ mb: 4 }}>
                    <TextField
                        fullWidth
                        placeholder="Search by name or description..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        variant="outlined"
                        sx={{ mb: 2 }}
                    />

                    <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
                        <Chip label="All" onClick={() => setSelectedCategory('all')} color={selectedCategory === 'all' ? 'primary' : 'default'} clickable />
                        {allCategories.map(category => (
                            <Chip
                                key={category}
                                label={category}
                                onClick={() => setSelectedCategory(category)}
                                color={selectedCategory === category ? 'primary' : 'default'}
                                clickable
                            />
                        ))}
                    </Stack>
                </Box>

                <Box
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
                        gap: 3,
                    }}
                >
                    {filteredProjects.length === 0 ? (
                        <Box sx={{ gridColumn: '1 / -1' }}>
                            <Typography variant="body1" color="text.secondary" align="center" sx={{ py: 4 }}>
                                No projects found matching your criteria.
                            </Typography>
                        </Box>
                    ) : (
                        filteredProjects.map(project => {
                            const isFavorite = favorites.includes(project.id);
                            return (
                                <Card
                                    key={project.id}
                                    elevation={2}
                                    sx={{
                                        position: 'relative',
                                        height: '100%',
                                        transition: 'transform 0.2s, box-shadow 0.2s',
                                        '&:hover': { transform: 'translateY(-4px)', boxShadow: 6 },
                                    }}
                                >
                                    <CardActionArea component={Link} to={project.path} sx={{ height: '100%' }}>
                                        <CardContent>
                                            <Typography
                                                variant="h6"
                                                component="h2"
                                                gutterBottom
                                                sx={{
                                                    fontWeight: 400,
                                                    fontFamily: '"Press Start 2P", "VT323", "Courier New", monospace',
                                                    fontSize: '0.85rem',
                                                    lineHeight: 1.9,
                                                }}
                                            >
                                                {project.name}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary" sx={{ display: 'block' }}>
                                                {project.description}
                                            </Typography>
                                            <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
                                                {project.categories.map(cat => (
                                                    <Chip key={cat} label={cat} size="small" variant="outlined" />
                                                ))}
                                            </Stack>
                                        </CardContent>
                                    </CardActionArea>
                                    <Tooltip title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}>
                                        <IconButton
                                            aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                                            onClick={e => {
                                                e.stopPropagation();
                                                e.preventDefault();
                                                toggleFavorite(project.id);
                                            }}
                                            sx={{ position: 'absolute', top: 8, right: 8, color: isFavorite ? 'warning.main' : 'action.disabled' }}
                                        >
                                            {isFavorite ? <StarIcon /> : <StarBorderIcon />}
                                        </IconButton>
                                    </Tooltip>
                                </Card>
                            );
                        })
                    )}
                </Box>
            </Container>

            <Snackbar open={!!favSnack} autoHideDuration={3000} onClose={() => setFavSnack(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                <Alert onClose={() => setFavSnack(null)} severity={favSnack?.severity ?? 'info'} variant="filled" sx={{ width: '100%' }}>
                    {favSnack?.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};
