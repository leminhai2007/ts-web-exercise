# Styles Documentation

## Overview

This project uses **Material-UI (MUI)** as its primary UI framework. All components are styled using MUI's comprehensive component library and theming system, replacing traditional CSS files with a modern, component-based styling approach.

## Structure

### Theme Configuration

The application uses a centralized theme defined in `src/App.tsx`:

```tsx
const theme = createTheme({
    palette: {
        mode: 'light',
        primary: {
            main: '#6366f1', // Indigo
        },
        secondary: {
            main: '#ec4899', // Pink
        },
        background: {
            default: '#f8fafc',
            paper: '#ffffff',
        },
    },
    typography: {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    },
    shape: {
        borderRadius: 12,
    },
});
```

### Component Architecture

All components use MUI components:

- **HomePage**: `AppBar`, `Toolbar`, `TextField`, `Chip`, `Card`, `CardContent`, `CardActionArea`
- **Calculator**: `Paper`, `Button`, `IconButton`, `Typography`
- **Game2048**: `Paper`, `Dialog`, `DialogTitle`, `DialogContent`, `DialogActions`

## Design System

### Material-UI Theme System

All design tokens are managed through the MUI theme:

#### Key Theme Properties:

- **Colors**: Defined in `palette` (primary, secondary, error, warning, info, success)
- **Spacing**: MUI's 8px-based spacing system using `theme.spacing()`
- **Typography**: Responsive typography variants (h1-h6, body1, body2, button, etc.)
- **Shape**: Global border radius configuration
- **Breakpoints**: Built-in responsive breakpoints (xs, sm, md, lg, xl)
- **Shadows**: Elevation system (0-24)

### Styling Approaches

#### 1. MUI's `sx` Prop (Recommended)

```tsx
<Box
    sx={{
        bgcolor: 'background.paper',
        p: 3,
        borderRadius: 2,
        boxShadow: 3,
    }}
>
    Content
</Box>
```

#### 2. Theme Access

```tsx
// Colors from theme
sx={{ color: 'primary.main', bgcolor: 'background.default' }}

// Spacing from theme
sx={{ p: 2, m: 3 }} // padding: 16px, margin: 24px

// Responsive styles
sx={{
    fontSize: { xs: '0.875rem', sm: '1rem', md: '1.125rem' },
    p: { xs: 2, md: 4 }
}}
```

## Benefits of Material-UI

✅ **Consistent Design** - Follows Material Design guidelines
✅ **Responsive by Default** - Built-in breakpoint system
✅ **Accessible** - ARIA attributes and keyboard navigation included
✅ **Customizable** - Extensive theming capabilities
✅ **Production Ready** - Battle-tested components
✅ **Type Safe** - Full TypeScript support
✅ **Icon Library** - Comprehensive `@mui/icons-material` package
✅ **No CSS Files** - Component-based styling eliminates CSS conflicts

## Usage

### Importing Components

```tsx
import { Box, Button, Typography, Paper } from '@mui/material';
import { Home as HomeIcon } from '@mui/icons-material';
```

### Using Theme Provider

```tsx
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';

function App() {
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            {/* Your components */}
        </ThemeProvider>
    );
}
```

### Responsive Design

```tsx
// Responsive grid using Box
<Box
    sx={{
        display: 'grid',
        gridTemplateColumns: {
            xs: '1fr', // Mobile: 1 column
            sm: 'repeat(2, 1fr)', // Tablet: 2 columns
            md: 'repeat(3, 1fr)', // Desktop: 3 columns
        },
        gap: 3,
    }}
>
    {/* Grid items */}
</Box>
```

### Common Patterns

#### Card Component

```tsx
<Card elevation={2}>
    <CardContent>
        <Typography variant="h6">Title</Typography>
        <Typography variant="body2" color="text.secondary">
            Description
        </Typography>
    </CardContent>
</Card>
```

#### Button Variants

```tsx
<Button variant="contained">Primary Action</Button>
<Button variant="outlined">Secondary Action</Button>
<Button variant="text">Tertiary Action</Button>
```

## Customization

### Extending the Theme

To add custom theme values, update `App.tsx`:

```tsx
const theme = createTheme({
    palette: {
        primary: {
            main: '#your-color',
        },
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    textTransform: 'none', // Disable uppercase
                },
            },
        },
    },
});
```

## Migration Notes

This project was migrated from custom CSS to Material-UI. The following CSS files were removed:

- ~~`global.css`~~ - Replaced by MUI's `CssBaseline`
- ~~`HomePage.css`~~ - Replaced by MUI components
- ~~`Calculator.css`~~ - Replaced by MUI components
- ~~`Game2048.css`~~ - Replaced by MUI components

All styling is now handled through MUI's component library and theme system.
