/**
 * HomePage Component
 *
 * The landing page of the application that displays all available projects/games with
 * search and filtering capabilities.
 *
 * OVERVIEW:
 * Provides a user-friendly interface to browse and navigate to different projects. Features
 * include project search, category filtering, PWA installation support, and online/offline status.
 *
 * COMPONENT ARCHITECTURE:
 * Uses React hooks for state management:
 * - searchTerm: Stores the user's search input
 * - selectedCategory: Stores the currently selected category filter
 * - deferredPrompt: PWA installation prompt event
 * - isInstallable: Whether PWA can be installed
 * - isOnline: Online/offline status
 *
 * COMPUTED VALUES (useMemo):
 * 1. allCategories: Extracts all unique categories from projects list
 *    - Creates a Set to handle uniqueness automatically
 *    - Converts to array and sorts alphabetically
 *    - Memoized with empty dependency array (only computed once)
 *
 * 2. filteredProjects: Filters projects based on search term and selected category
 *    - Search Match: Project name or description contains search term (case-insensitive)
 *    - Category Match: Selected category is 'all' or project has the selected category
 *    - Re-computes when searchTerm or selectedCategory changes
 *
 * UI STRUCTURE:
 * 1. AppBar: Top navigation with app title, online status, and install button
 * 2. Search Section: Search input and category filter buttons
 * 3. Projects Grid: Card layout showing filtered projects
 *
 * PERFORMANCE OPTIMIZATIONS:
 * - useMemo for categories: Only computed once on mount
 * - useMemo for filtering: Only happens when search term or category changes
 * - Avoids re-filtering on unrelated state updates or re-renders
 *
 * USER INTERACTIONS:
 * - Type in search box: Filters projects by name/description
 * - Click category button: Filters projects by category
 * - Click "All" button: Shows all projects
 * - Click project card: Navigates to project page
 * - Click Install button: Triggers PWA installation
 *
 * DATA FLOW:
 * projects (from data/projects.ts)
 *   ↓
 * allCategories (extract unique categories)
 *   ↓
 * User inputs (searchTerm, selectedCategory)
 *   ↓
 * filteredProjects (apply filters)
 *   ↓
 * Render project cards
 *
 * PWA FEATURES:
 * - Detects if app can be installed
 * - Shows install button when available
 * - Handles beforeinstallprompt event
 * - Shows online/offline status
 * - Displays cloud icon with status indicator
 *
 * ADDING NEW PROJECTS:
 * To add a new project to HomePage:
 * 1. Add project to src/data/projects.ts with id, name, description, categories, and path
 * 2. HomePage automatically displays it, includes categories in filters, and makes it searchable
 * No changes to HomePage component needed!
 *
 * ACCESSIBILITY CONSIDERATIONS:
 * - Semantic HTML (AppBar, TextField, Chip, Card)
 * - Descriptive placeholder text in search input
 * - Clear button labels
 * - Keyboard navigation supported (tab through elements)
 * - Material-UI components with built-in accessibility
 */

import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Container, Box, Typography, TextField, Chip, Card, CardContent, CardActionArea, AppBar, Toolbar, Button, Stack } from '@mui/material';
import { Home as HomeIcon, CloudQueue as CloudIcon, CloudOff as CloudOffIcon, GetApp as GetAppIcon } from '@mui/icons-material';
import { projects } from '../data/projects';

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

    // Get all unique categories
    const allCategories = useMemo(() => {
        const categories = new Set<string>();
        projects.forEach(project => {
            project.categories.forEach(cat => categories.add(cat));
        });
        return Array.from(categories).sort();
    }, []);

    // Filter projects based on search and category
    const filteredProjects = useMemo(() => {
        return projects.filter(project => {
            const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) || project.description.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = selectedCategory === 'all' || project.categories.includes(selectedCategory);
            return matchesSearch && matchesCategory;
        });
    }, [searchTerm, selectedCategory]);

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
            <AppBar position="static" elevation={0} sx={{ bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider' }}>
                <Toolbar>
                    <HomeIcon sx={{ mr: 2, color: 'primary.main' }} />
                    <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="h6" component="h1" sx={{ color: 'text.primary', fontWeight: 600 }}>
                            My Tools & Games
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            A collection of interactive projects and games
                        </Typography>
                    </Box>
                    <Stack direction="row" spacing={2} alignItems="center">
                        <Chip
                            icon={isOnline ? <CloudIcon /> : <CloudOffIcon />}
                            label={isOnline ? 'Online' : 'Offline'}
                            color={isOnline ? 'success' : 'default'}
                            size="small"
                        />
                        {isInstallable && (
                            <Button variant="contained" startIcon={<GetAppIcon />} onClick={handleInstallClick} size="small">
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

                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
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
                        filteredProjects.map(project => (
                            <Card
                                key={project.id}
                                elevation={2}
                                sx={{ height: '100%', transition: 'transform 0.2s, box-shadow 0.2s', '&:hover': { transform: 'translateY(-4px)', boxShadow: 6 } }}
                            >
                                <CardActionArea component={Link} to={project.path} sx={{ height: '100%' }}>
                                    <CardContent>
                                        <Typography variant="h6" component="h2" gutterBottom sx={{ fontWeight: 600 }}>
                                            {project.name}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" paragraph>
                                            {project.description}
                                        </Typography>
                                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                            {project.categories.map(cat => (
                                                <Chip key={cat} label={cat} size="small" variant="outlined" />
                                            ))}
                                        </Stack>
                                    </CardContent>
                                </CardActionArea>
                            </Card>
                        ))
                    )}
                </Box>
            </Container>
        </Box>
    );
};
