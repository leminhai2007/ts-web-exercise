# Styles Documentation

## Overview

This project uses **Material-UI (MUI)** as its primary UI framework. All components are styled using MUI's comprehensive component library and theming system, replacing traditional CSS files with a modern, component-based styling approach.

## Shared Layout Components

### ProjectLayout Component

A consistent layout template used across all project pages (Game2048, Sudoku, Lucky Wheel) to ensure uniform styling.

**Location:** `src/components/ProjectLayout.tsx`

**Features:**

- Standardized AppBar with back button, icon, and title
- Consistent typography (h6 variant, 1.1rem on mobile, 1.25rem on desktop, weight 600)
- Configurable action buttons (separate for desktop/mobile)
- Responsive container with configurable max width and padding
- Primary color AppBar with sticky positioning

**Props:**

- `title`: Page title displayed in AppBar
- `icon`: Icon displayed next to title
- `actions`: Action buttons for desktop
- `mobileActions`: Action buttons for mobile (optional, defaults to `actions`)
- `maxWidth`: Container max width ('xs' | 'sm' | 'md' | 'lg' | 'xl' | false)
- `containerPadding`: Custom padding object
- `backgroundColor`: Background color for container area

**Usage Example:**

```tsx
<ProjectLayout title="Game Title" icon={<GameIcon />} maxWidth="sm" actions={<Button>New Game</Button>}>
    {/* Page content */}
</ProjectLayout>
```

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
- **Game2048**: `Paper`, `Dialog`, `DialogTitle`, `DialogContent`, `DialogActions`, `Button`, `IconButton`
- **Sudoku**: `AppBar`, `Toolbar`, `Container`, `Paper`, `Button`, `Dialog`, `Snackbar`, `Alert`
- **LuckyWheel**: `AppBar`, `Container`, `Paper`, `Button`, `IconButton`, `Dialog`, `TextField`, `Stack`, `List`, `Snackbar`, `Alert`

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

## Component-Specific Styling

### AppBar Pattern (Consistent Across All Components)

```tsx
<AppBar position="static" elevation={0} sx={{ bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider' }}>
    <Toolbar>
        <IconButton component={Link} to="/" sx={{ mr: 2, color: 'text.primary' }}>
            <ArrowBackIcon />
        </IconButton>
        <ComponentIcon sx={{ mr: 1, color: 'primary.main' }} />
        <Typography variant="h6" sx={{ flexGrow: 1, color: 'text.primary' }}>
            Component Name
        </Typography>
    </Toolbar>
</AppBar>
```

### Responsive Button Pattern

```tsx
// Desktop: Icon + Text, Mobile: Icon Only
<Button
  startIcon={<ActionIcon />}
  onClick={handleAction}
  sx={{ display: isMobile ? 'none' : 'flex' }}
>
  Action Text
</Button>
<IconButton
  onClick={handleAction}
  sx={{ display: isMobile ? 'flex' : 'none', color: 'text.primary' }}
>
  <ActionIcon />
</IconButton>
```

### Dialog Pattern

```tsx
<Dialog open={showDialog} onClose={handleClose} maxWidth="sm" fullWidth>
    <DialogTitle>Dialog Title</DialogTitle>
    <DialogContent>
        <Typography variant="body2" color="text.secondary" gutterBottom>
            Instructions or description
        </Typography>
        <TextField /* ... */ />
    </DialogContent>
    <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained">
            Save
        </Button>
    </DialogActions>
</Dialog>
```

### Snackbar Notification Pattern

```tsx
<Snackbar open={showNotification} autoHideDuration={3000} onClose={handleClose} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
    <Alert onClose={handleClose} severity="success" sx={{ width: '100%' }}>
        Action completed successfully!
    </Alert>
</Snackbar>
```
