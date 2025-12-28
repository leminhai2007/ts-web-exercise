import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Box, Container, AppBar, Toolbar, IconButton, Typography } from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';

interface ProjectLayoutProps {
    /** The title to display in the AppBar */
    title: string;
    /** The icon to display next to the title */
    icon?: ReactNode;
    /** Additional action buttons to display in the AppBar (desktop) */
    actions?: ReactNode;
    /** Additional action buttons to display in the AppBar (mobile) */
    mobileActions?: ReactNode;
    /** The main content of the page */
    children: ReactNode;
    /** Maximum width for the container */
    maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | false;
    /** Custom padding for the container */
    containerPadding?: { xs?: number; sm?: number; md?: number };
    /** Background color for the container area */
    backgroundColor?: string;
}

/**
 * ProjectLayout provides a consistent layout template for all project pages.
 * It includes:
 * - AppBar with back button, title, icon, and action buttons
 * - Responsive container with configurable max width
 * - Consistent spacing and styling
 */
export const ProjectLayout = ({ title, icon, actions, mobileActions, children, maxWidth = 'md', containerPadding, backgroundColor }: ProjectLayoutProps) => {
    const defaultPadding = { xs: 2, sm: 4 };
    const padding = containerPadding || defaultPadding;

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: backgroundColor || 'background.default' }}>
            {/* App Bar */}
            <AppBar
                position="sticky"
                elevation={2}
                sx={{
                    bgcolor: 'primary.main',
                }}
            >
                <Toolbar>
                    <IconButton component={Link} to="/" edge="start" color="inherit" aria-label="back to home" sx={{ mr: 2 }}>
                        <ArrowBackIcon />
                    </IconButton>

                    {icon && <Box sx={{ mr: 1.5, display: 'flex', alignItems: 'center' }}>{icon}</Box>}

                    <Typography
                        variant="h6"
                        component="h1"
                        sx={{
                            flexGrow: 1,
                            fontSize: { xs: '1.1rem', sm: '1.25rem' },
                            fontWeight: 600,
                        }}
                    >
                        {title}
                    </Typography>

                    {/* Desktop Actions */}
                    <Box sx={{ display: { xs: 'none', sm: 'flex' }, gap: 1 }}>{actions}</Box>

                    {/* Mobile Actions */}
                    <Box sx={{ display: { xs: 'flex', sm: 'none' }, gap: 0.5 }}>{mobileActions || actions}</Box>
                </Toolbar>
            </AppBar>

            {/* Main Content */}
            <Container
                maxWidth={maxWidth}
                sx={{
                    py: padding,
                    px: { xs: padding.xs || 2, sm: padding.sm || 4 },
                }}
            >
                {children}
            </Container>
        </Box>
    );
};
