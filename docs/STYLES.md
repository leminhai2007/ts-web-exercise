# Styles Documentation

## Overview

This project uses **Material-UI (MUI)** as its primary UI framework. All components are styled using MUI's component library and theming system. **There are no CSS files in this repo** — everything is styled through the global theme and the `sx` prop.

The UI follows a **retro game** style inspired by classic Mario games: a bright sky-blue background, saturated red/green/yellow accents, pixel fonts, and sharp (square) corners. Fonts ("Press Start 2P" for headings/buttons, "VT323" for body text) are loaded from Google Fonts via `<link>` tags in `index.html`.

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

The global theme is defined once in `src/App.tsx` (do not create another `ThemeProvider`). Current retro arcade theme:

```tsx
const theme = createTheme({
    palette: {
        mode: 'light',
        primary: { main: '#e52521' }, // Mario red
        secondary: { main: '#43b047' }, // Pipe green
        background: { default: '#7fc4ff', paper: '#ffffff' }, // sky blue / white
        divider: '#e9dfc8',
    },
    typography: {
        fontFamily: '"VT323", "Courier New", monospace',
        // h1-h6, overline, button use '"Press Start 2P", "VT323", ...'
    },
    shape: { borderRadius: 0 }, // sharp pixel edges
    components: {/* retro overrides: chunky buttons, neon borders, square dialogs */},
});
```

Use the theme tokens (never raw hex values): `primary.main`, `secondary.main`, `background.default`, `background.paper`, `text.primary`, `text.secondary`, `error.main`, `divider`.

### Fonts

- **Press Start 2P** — headings (`h1`–`h6`), buttons, chips, overlines. Never bold it (`fontWeight: 400`); it has a single weight and faux-bold looks wrong.
- **VT323** — body, captions, inputs, lists. Google Fonts link lives in `index.html`; Prettier/ESLint ignore it.

### Theme component overrides (arcade look)

- `MuiAppBar` — dark navy bar with a solid 4px neon-cyan bottom border.
- `MuiButton` — square; `contained` buttons get a NES-style chunky offset shadow that "presses down" on hover/active; `outlined` buttons use 2px neon borders.
- `MuiPaper` / `MuiDialog` / `MuiAlert` / `MuiChip` / `MuiToggleButton` — square corners + border, bordered dialogs use a 3px neon outline.
- `MuiOutlinedInput` — square, neon-cyan focus border.
- In-game colors (2048 tile ramp, Lucky Wheel palette, Sudoku cell states) are custom neon palettes defined in their components using theme tokens wherever possible.

## Retro Palette Reference

| Token                | Hex       | Use                             |
| -------------------- | --------- | ------------------------------- |
| `primary.main`       | `#e52521` | Mario red: AppBar, main buttons |
| `secondary.main`     | `#43b047` | pipe green (flash card backs)   |
| `success.main`       | `#43b047` | success feedback / online chip  |
| `warning.main`       | `#f5aa00` | coin yellow: warnings           |
| `error.main`         | `#d63031` | errors / danger                 |
| `info.main`          | `#049cd8` | overalls blue: info notices     |
| `background.default` | `#7fc4ff` | sky-blue page background        |
| `background.paper`   | `#ffffff` | cards, dialogs, panels          |
| `divider`            | `#e9dfc8` | warm cream borders, grid lines  |

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

### Favorite / star button overlay

Project cards on the Home page have a star (`StarIcon` / `StarBorderIcon`) icon button in the
card's top-right corner. Use the same pattern for any favoritable card:

```tsx
<Card sx={{ position: 'relative' }}>
    <CardActionArea component={Link} to={path} sx={{ height: '100%' }}>
        <CardContent>{/* title, description, chips */}</CardContent>
    </CardActionArea>
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
</Card>
```

Favorites persist in `localStorage` (key `favoriteProjects`, an ordered array of project ids — the
earliest favorited id comes first). Home ordering rule: favorites first (by selection order),
then the remaining projects alphabetically by name, with **Data Manager always pinned last**.

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
