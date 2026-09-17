# Styles Documentation

## Overview

This project uses **Material-UI (MUI)** as its primary UI framework. All components are styled using MUI's component library and theming system. **There are no CSS files in this repo** — everything is styled through the global theme and the `sx` prop.

The `sx` prop accepts theme-aware values and responsive breakpoint objects:

```tsx
// Theme color tokens
sx={{ color: 'primary.main', bgcolor: 'background.default' }}

// Theme spacing (8px base): padding 16px, margin 24px
sx={{ p: 2, m: 3 }}

// Responsive values per breakpoint
sx={{ fontSize: { xs: '0.875rem', sm: '1rem', md: '1.125rem' }, p: { xs: 2, md: 4 } }}
```

## Theme Configuration

The global theme is defined once in `src/App.tsx` (do not create another `ThemeProvider`):

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

Use the theme tokens (never raw hex values): `primary.main`, `secondary.main`, `background.default`, `background.paper`, `text.primary`, `text.secondary`, `error.main`, `divider`.

## Shared Layout (ProjectLayout)

All pages are wrapped in `ProjectLayout` (`src/components/ProjectLayout.tsx`). It renders:

- Sticky AppBar with a back-to-home button, title (`h6`, weight 600), and icon
- `actions` (desktop AppBar buttons) and `mobileActions` (mobile icon-only buttons)
- Responsive `Container` with configurable `maxWidth` and `containerPadding`

```tsx
<ProjectLayout title="Game Title" icon={<GameIcon />} maxWidth="sm" actions={desktopActions} mobileActions={mobileActions}>
    {/* Page content */}
</ProjectLayout>
```

## Common UI Patterns

### Responsive Buttons (icon + text desktop, icon-only mobile)

```tsx
<Button variant="contained" startIcon={<ActionIcon sx={{ display: { xs: 'none', sm: 'inline-flex' } }} />} sx={{ minWidth: 'auto', px: { xs: 1.5, sm: 2 } }}>
    <Box sx={{ display: { xs: 'none', sm: 'block' } }}>Action</Box>
    <ActionIcon sx={{ display: { xs: 'block', sm: 'none' } }} />
</Button>
```

### Button Variants

```tsx
<Button variant="contained">Primary Action</Button>
<Button variant="outlined">Secondary Action</Button>
<Button variant="text">Tertiary Action</Button>
```

### Card

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

### Dialog (forms / confirmations)

```tsx
<Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
    <DialogTitle>Title</DialogTitle>
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

### Snackbar + Alert (user feedback)

```tsx
<Snackbar open={open} autoHideDuration={3000} onClose={handleClose} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
    <Alert onClose={handleClose} severity="success" sx={{ width: '100%' }}>
        Action completed successfully!
    </Alert>
</Snackbar>
```

Severity values: `'success' | 'error' | 'info'`.

## Responsive Design

MUI uses a mobile-first breakpoint system:

| Breakpoint | Width   | Target        |
| ---------- | ------- | ------------- |
| `xs`       | 0px     | Phones        |
| `sm`       | 600px   | Tablets       |
| `md`       | 900px   | Small laptops |
| `lg`       | 1200px  | Desktops      |
| `xl`       | 1536px+ | Large screens |

### Responsive Grid

```tsx
<Box
    sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
        gap: 3,
    }}
>
    {/* Grid items */}
</Box>
```

### Responsive Typography

```tsx
<Typography sx={{ fontSize: { xs: '1rem', sm: '1.125rem', md: '1.25rem' } }}>
```

### Conditional Display (hide/show per breakpoint)

```tsx
<Box sx={{ display: { xs: 'none', sm: 'flex' } }}>...</Box>
```

### Responsive Spacing

```tsx
<Stack spacing={{ xs: 1, sm: 2, md: 3 }}>
<Container maxWidth="lg"> {/* Responsive max-width */}
<Container maxWidth={false}> {/* Full width */}
```

### Touch & Accessibility

- MUI components are touch-friendly (ripple, focus states) and keyboard-navigable by default
- Aim for touch targets of at least 44x44px (IconButtons/Buttons meet this by default)
- Keep the viewport meta tag as-is: `width=device-width, initial-scale=1.0` with user scaling allowed
- Test at least: small phone (`xs`), tablet (`sm`/`md`), and desktop (`lg`+); portrait and landscape

## Resources

- [MUI Breakpoints](https://mui.com/material-ui/customization/breakpoints/)
- [MUI sx Prop](https://mui.com/system/getting-started/the-sx-prop/)
- [MUI Accessibility](https://mui.com/material-ui/guides/accessibility/)

For repo-wide conventions, commands, and the browser verification checklist, see **AGENTS.md**. For how to build a new page, see **docs/NEW_PROJECT_TEMPLATE.md**.
