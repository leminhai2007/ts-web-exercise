# Styles Documentation

## Overview

This project uses **Material-UI (MUI)** as its primary UI framework. All components are styled using MUI's component library and theming system. **There are no CSS files in this repo** — everything is styled through the global theme and the `sx` prop.

The UI follows a **retro game** style inspired by classic Mario games: a sky-blue background with an animated background image, saturated red/green/yellow accents, pixel fonts, and sharp (square) corners. Fonts ("Press Start 2P" for headings/buttons, "VT323" for body text) are loaded from Google Fonts via `<link>` tags in `index.html`.

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
- Body text sizes (theme typography): `body1` = `1.1rem`, `body2` = `1rem`, `caption` = `0.95rem`, `overline` = `0.7rem`. Use these variants for normal/secondary text; add `color="text.secondary"` for muted copy.
- **User-generated text must use VT323** (the body stack `'"VT323", "Courier New", monospace'`), never Press Start 2P. Press Start 2P has no Vietnamese glyphs, so Vietnamese diacritics fall back per-glyph and the word renders in mixed fonts ("weird" look). Apply the VT323 stack to any text the user can enter — flash-card collection names/labels/content, wheel item text (including canvas `ctx.font`) and wheel results. Canvas text must also wait for the webfont via `document.fonts.load('16px "VT323"')` and redraw once loaded.

### Theme component overrides (arcade look)

- `MuiAppBar` — dark navy bar with a solid 4px neon-cyan bottom border.
- `MuiButton` — square; `contained` buttons get a NES-style chunky offset shadow that "presses down" on hover/active; `outlined` buttons use 2px neon borders.
- `MuiPaper` / `MuiDialog` / `MuiAlert` / `MuiChip` / `MuiToggleButton` — square corners + border, bordered dialogs use a 3px neon outline.
- `MuiOutlinedInput` — square, neon-cyan focus border.
- In-game colors (2048 tile ramp, Lucky Wheel palette, Sudoku cell states) are custom neon palettes defined in their components using theme tokens wherever possible.

## Retro Palette Reference

| Token                | Hex       | Use                                              |
| -------------------- | --------- | ------------------------------------------------ |
| `primary.main`       | `#e52521` | Mario red: AppBar, main buttons                  |
| `secondary.main`     | `#43b047` | pipe green (flash card backs)                    |
| `success.main`       | `#43b047` | success feedback / online chip                   |
| `warning.main`       | `#f5aa00` | coin yellow: warnings                            |
| `error.main`         | `#d63031` | errors / danger                                  |
| `info.main`          | `#049cd8` | overalls blue: info notices                      |
| `background.default` | `#7fc4ff` | sky-blue fallback behind the animated background |
| `background.paper`   | `#ffffff` | cards, dialogs, panels                           |
| `divider`            | `#e9dfc8` | warm cream borders, grid lines                   |

## Animated Background

`src/components/AnimatedBackground.tsx` renders a fixed, full-viewport background using
`/background.jpg` (kept in `public/`) on **every** page (mounted once in `App.tsx` next to the
`<Router>`). A strip (`left: 0`, `width: calc(100vw + 180vh)`, `height: 100vh`) tiles the image
horizontally (`background-repeat: repeat-x`, `background-size: auto 100vh`), so each tile is the
full 16:9 image scaled to the viewport height (≈ `177.78vh` wide, aspect preserved, never
letterboxed). The scene drifts **left** continuously — the view travels left to right over the
background — via a `requestAnimationFrame` loop that advances the strip by one tile width then
wraps, so the loop is pixel-identical (seamless). Speed: one tile per `40s`. The loop pauses on
`visibilitychange` (`document.hidden`), so switching back from another window resumes in place with
no catch-up freeze; there is **no vertical translation**. Key railings:

- Use `zIndex: -1` so it always sits behind page content; the palette `background.default`
  (`#7fc4ff`) remains as body/browser fallback.
- To avoid the "empty background" flash on refresh, the image lives in `public/` so `index.html`
  can reference it before the JS bundle loads: a `<link rel="preload" as="image">` starts the
  download immediately and a tiny critical `<style>` paints it on `body` from first paint. The
  animated layer later covers the same static background seamlessly.
- Page containers must stay transparent for the image to show through: `ProjectLayout` defaults to
  `bgcolor: 'transparent'` (the `backgroundColor` prop still overrides it) and `HomePage` uses
  `bgcolor: 'transparent'`.
- Opaque surfaces (Cards, Papers, dialogs, the AppBar) still cover the image where needed, so
  text stays readable.
- Keep `vite.config.ts`'s PWA precache glob listing `jpg`/`jpeg` so the background is cached for
  offline use.

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

### Responsive Buttons (icon + text desktop, bare icon mobile)

The standard project control bar renders a text Button on desktop and a plain `IconButton`
(no outline/box, matching the Lucky Wheel page) on mobile. Both actions share the same handler,
disabled state and semantic color:

```tsx
<Button
    variant="outlined"
    startIcon={<ActionIcon />}
    onClick={handleAction}
    disabled={isDisabled}
    color="primary"
    sx={{ display: { xs: 'none', sm: 'flex' } }}
>
    Action
</Button>
<IconButton
    onClick={handleAction}
    disabled={isDisabled}
    color="primary"
    sx={{ display: { xs: 'flex', sm: 'none' } }}
    aria-label="Action"
>
    <ActionIcon />
</IconButton>
```

Always add an `aria-label` to the mobile `IconButton` (the text label is hidden there). Keep the
mobile `IconButton`s in a centered `Stack direction="row"` and use a comfortable spacing
(`spacing={{ xs: 2, sm: 1 }}`).

Connection status on the Home page is a small **status dot** (green when online, gray when offline)
in the AppBar, wrapped in a `Tooltip` for the accessible label:

```tsx
<Tooltip title={isOnline ? 'Online' : 'Offline'}>
    <Box
        aria-label={isOnline ? 'Online' : 'Offline'}
        sx={{
            width: { xs: 10, sm: 14 },
            height: { xs: 10, sm: 14 },
            borderRadius: '50%',
            bgcolor: isOnline ? 'success.main' : 'grey.500',
            boxShadow: isOnline ? t => `0 0 8px 2px ${alpha(t.palette.success.main, 0.55)}` : 'none',
            alignSelf: 'center',
        }}
    />
</Tooltip>
```

The **Install App** action lives in the Home AppBar, shown only while the app is installable: a
text button on desktop (`{ xs: 'none', sm: 'flex' }`) and an icon-only `IconButton` with an
`aria-label` on mobile (`{ xs: 'flex', sm: 'none' }`) — same responsive pattern as project controls.

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

### Home project card (logo + tag footer)

Home page cards render each project's `icon` (from `AppIcons`) in a 44×44 `primary.main` badge
above the title, and the category chips live in a footer pinned to the card's bottom. To pin the
footer, make `CardActionArea` a flex column and give `CardContent` `flex: 1` so `mt: 'auto'` has
space to distribute (a plain `height: '100%'` on CardActionArea resolves to content height):

```tsx
<CardActionArea component={Link} to={path} sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
    <CardContent sx={{ flex: 1, width: '100%', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: 1.5, pr: 6 }}>
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 44,
                    height: 44,
                    flexShrink: 0,
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                }}
            >
                <project.icon fontSize={26} />
            </Box>
            <Typography variant="h6" component="h2" sx={{ fontFamily: '"Press Start 2P", "VT323", "Courier New", monospace', fontSize: '0.85rem', lineHeight: 1.9 }}>
                {project.name}
            </Typography>
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {project.description}
        </Typography>
        <Box sx={{ mt: 'auto', pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
            <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
                {project.categories.map(cat => (
                    <Chip key={cat} label={cat} size="small" variant="outlined" />
                ))}
            </Stack>
        </Box>
    </CardContent>
</CardActionArea>
```

The header keeps `pr: 6` so the absolutely-positioned star button never overlaps the title; the
description keeps `mb: 2` so the tag footer is always separated from it on content-sized rows.

### Favorite / star button overlay

Project cards on the Home page have a star (`StarIcon` / `StarBorderIcon`) icon button in the
card's top-right corner. Use the same pattern for any favoritable card:

```tsx
<Card sx={{ position: 'relative' }}>
    <CardActionArea component={Link} to={path} sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <CardContent sx={{ flex: 1, width: '100%', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>{/* title, description, chips */}</CardContent>
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

### App icons (Font Awesome)

Buttons and page headers use the game-style icon set in `src/components/AppIcons.tsx`, built on
**Font Awesome Solid** (bold, filled, chunky shapes that fit the retro theme). Icons are sized in px
(as vectors, no icon font) so they work inside MUI buttons, icon buttons, chips and snackbars. The
export names mirror the identifiers previously imported from `@mui/icons-material`, so swapping is 1:1:

```tsx
import { SaveIcon, FolderIcon, ShareIcon, DeleteIcon } from './AppIcons';
```

Keep new button icons in this set: pick a solid Font Awesome icon, add it to `AppIcons.tsx` (opts:
`icon` definition + optional pixel size via `fontSize`/`sx`), name the export to match the page's
alias, and import it from `./AppIcons` instead of `@mui/icons-material`. Avoid raw `<img>`/emoji
icons, which break the chunky UI look. Packages: `@fortawesome/fontawesome-svg-core`,
`@fortawesome/free-solid-svg-icons`, `@fortawesome/free-regular-svg-icons`,
`@fortawesome/react-fontawesome`.

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
