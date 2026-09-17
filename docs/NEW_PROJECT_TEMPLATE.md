# New Project Template (Page Standard)

> **How to use this file:** When asking an AI (or a developer) to add a new project/page to this
> repository, copy this entire document into the prompt and tell it what page to build. Every new
> page **must** follow this template so the whole site keeps a consistent look, structure, and code
> style.

---

## 1. Tech Stack (do not change)

- React 19 + TypeScript (strict mode)
- Vite 7 as build tool
- Material-UI (MUI) v7 - `@mui/material`, `@mui/icons-material`, `@emotion/react`, `@emotion/styled`
- React Router v7 for client-side routing
- No CSS files - all styling via MUI theme + `sx` prop
- Global theme already defined in `src/App.tsx` (do not create a new ThemeProvider)

## 2. Files to Create / Modify

| Action                  | File                     | Purpose                                     |
| ----------------------- | ------------------------ | ------------------------------------------- |
| **Create**              | `src/components/Xxx.tsx` | The page component (named export)           |
| Create (if needed)      | `src/types/Xxx.ts`       | TypeScript interfaces for the page's domain |
| **Modify**              | `src/data/projects.ts`   | Register the project for the Home page      |
| **Modify**              | `src/App.tsx`            | Import the component + add a `<Route>`      |
| Create (only if needed) | `src/api/Xxx.ts`         | API wrapper functions                       |
| Create (only if needed) | `api/*.ts`               | Serverless / proxy functions                |

No other files need to change: `HomePage.tsx` auto-discovers projects from `src/data/projects.ts`.

## 3. Naming Conventions

- Component file: `PascalCase.tsx` in `src/components/` (e.g. `Game2048.tsx`, `FlashCards.tsx`).
- Type file: `PascalCase.ts` in `src/types/` (e.g. `Project.ts`, `FlashCard.ts`).
- Component export: **named export** `export const Xxx = () => { ... }`.
- Route path & project `id`: `kebab-case` (e.g. `/flash-cards`).
- localStorage key: `snake/kebab case` string constant at the top of the file
  (e.g. `const STORAGE_KEY = 'flashcard-collections'`).
- Network/API function names: `camelCase`.

## 4. Required Page Template

Every page must start with the JSDoc header block and wrap its content in `ProjectLayout`:

```tsx
/**
 * Xxx Component
 *
 * <One-line description of the page.>
 *
 * OVERVIEW:
 * <2-3 sentence description of what the page does and how it fits the project.>
 *
 * KEY FEATURES:
 * 1. <Feature> - <what it does>
 * 2. <Feature> - <what it does>
 * ...
 *
 * STORAGE:
 * - All data saved to localStorage under key '<storage-key>'
 * - Auto-save on every change, persists across browser sessions
 */

import { useState, useEffect } from 'react';
import { Box, Button, Typography, Dialog, DialogTitle, DialogContent, DialogActions, Snackbar, Alert } from '@mui/material';
import { SomeIcon } from '@mui/icons-material';
import { ProjectLayout } from './ProjectLayout';
import type { SomeType } from '../types/SomeType';

const STORAGE_KEY = 'xxx-data';

export const Xxx = () => {
    // State
    const [items, setItems] = useState<SomeType[]>([]);
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({
        open: false,
        message: '',
        severity: 'info',
    });

    // Load from localStorage on mount
    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                setItems(JSON.parse(stored));
            } catch (error) {
                console.error('Failed to parse stored data:', error);
            }
        }
    }, []);

    // Auto-save on every change
    useEffect(() => {
        if (items.length > 0) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
        }
    }, [items]);

    const showNotification = (message: string, severity: 'success' | 'error' | 'info' = 'info') => {
        setSnackbar({ open: true, message, severity });
    };

    return (
        <ProjectLayout title="Xxx Title" icon={<SomeIcon />}>
            {/* Page content */}

            {/* Snackbar */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={3000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </ProjectLayout>
    );
};
```

## 5. Layout, UI and Behavior Conventions

1. **Wrap everything in `ProjectLayout`** (from `src/components/ProjectLayout.tsx`):
   `<ProjectLayout title="..." icon={<Icon />} actions={...} mobileActions={...}>`.
    - Provide desktop-only actions in `actions` and mobile-only (icon) actions in `mobileActions`.
    - Keep `maxWidth` default (`md`) unless a narrower layout is clearly better (e.g. games use `sm`).
2. **Header JSDoc block** describing the component (`Game2048.tsx` and `FlashCards.tsx` are good
   scale references). Document OVERVIEW, KEY FEATURES, and STORAGE at minimum.
3. **Responsive buttons**: desktop shows a text button, mobile shows a bare `IconButton` (no box),
   matching the Lucky Wheel page. Render both and toggle them with the breakpoint `display`:
    ```tsx
    <Button variant="outlined" startIcon={<Icon />} onClick={handleAction} sx={{ display: { xs: 'none', sm: 'flex' } }}>
        Label
    </Button>
    <IconButton onClick={handleAction} color="primary" sx={{ display: { xs: 'flex', sm: 'none' } }} aria-label="Label">
        <Icon />
    </IconButton>
    ```
    Keep the mobile icon buttons in a centered `Stack direction="row"` with `spacing={{ xs: 2, sm: 1 }}`,
    and always give the `IconButton` an `aria-label`.
4. **Notification feedback**: use a `Snackbar` + `Alert` with `severity: 'success' | 'error' | 'info'`,
   `autoHideDuration={3000}`, anchored `vertical: 'bottom', horizontal: 'center'`. All user actions
   should notify (created / deleted / invalid input, etc.).
5. **Forms & confirmations**: use MUI `Dialog` (`maxWidth="sm" | "md"`, `fullWidth`) with
   `DialogTitle`, `DialogContent`, `DialogActions`. Cancel as text button, primary action as
   `variant="contained"`. Validate input before saving and notify on error.
6. **Empty states**: when there is no data, show a centered empty-state block with an icon,
   `Typography variant="h5"`, helper text and a primary action button. Never render a blank page.
7. **Persistence**: any user data must persist via `localStorage` (load on mount, auto-save via
   `useEffect` keyed on the data). Wrap `JSON.parse` in try/catch and `console.error` on failure.
8. **Immutability**: never mutate state - always spread/copy (`[...items, newItem]`, `items.map(...)`).
9. **Styling**: only `sx` prop with theme values (`primary.main`, `background.default`, `p: 3`,
   responsive objects like `{ xs: 2, sm: 4 }`). Responsive grids: `gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }`. No raw CSS files, no inline `style` except hidden inputs.
10. **Performance**: use `useMemo` for derivations over arrays (filters, category extraction) and
    `useCallback` for handlers re-bound to listeners. Clean up all event listeners in `useEffect`.

## 6. Types Convention

- Define domain types as `interface` in `src/types/Xxx.ts` (e.g. `FlashCard.ts`, `LuckyWheel.ts`).
- Prefer `interface` over `type`; keep names `PascalCase`; one file per feature-domain.
- Keep types small and flat; use `number` for timestamps (`createdAt: number`).

## 7. Registering the Project (Required, 2 edits)

```tsx
// src/data/projects.ts - add an entry to the projects array
import { XxxIcon } from '../components/AppIcons';
// ...
{
    id: 'xxx',                 // matches route path, kebab-case
    name: 'Xxx Name',
    description: 'One-line description shown on the Home page card.',
    categories: ['tool' | 'game', ...], // use existing categories or add a new one
    path: '/xxx',
    icon: XxxIcon,             // logo shown on the Home page card (must exist in ./AppIcons)
}
```

```tsx
// src/App.tsx - import + route
import { Xxx } from './components/Xxx';
// ...
<Route path="/xxx" element={<Xxx />} />;
```

Keep the array's trailing `// Add more projects here as you build them` comment.

## 8. Code Style (enforced by Prettier + ESLint)

- 4-space indent, `printWidth: 170`, single quotes, semicolons, trailing commas (es5), `arrowParens: avoid`.
- Order imports: `react` → third-party (`@mui/material`, `@mui/icons-material`, `@mui/...`) →
  local (`./ProjectLayout`, `../types/...`).
- Do **not** add `eslint-disable` comments unless required; no unused variables/imports (strict TS).
- No `any`, no implicit `any`; if a type is missing define it in `src/types/`.
- Comments: full JSDoc header on the component, short section comments (`// State`) inside.
- No CSS files, no CSS-in-JS besides the `sx` prop.

## 9. Verification (Must Pass Before Done)

Run from the project root:

```bash
npm run check:all    # prettier --check + eslint
npm run build        # tsc -b && vite build (type check + production build)
```

**Browser check (REQUIRED for AI agents):** Playwright MCP is configured in `opencode.json` and
exposes browser tools (`browser_navigate`, `browser_resize`, `browser_emulate_device`,
`browser_screenshot`, ...). With `npm run dev` running, verify the page in a real browser:

- Navigate to `http://localhost:5173/<path>` with a **desktop viewport** (e.g. 1280x720) — controls
  show icon + text, layout fits.
- Emulate a **mobile viewport** (e.g. 375x667 or a device like "iPhone 15") — controls are icon-only
  and touch-friendly, no overflow/horizontal scroll.
- Exercise the main actions and take screenshots of both layouts (`browser_screenshot`; unnamed
  screenshots go to `.playwright/`).

Manually test remaining behavior in `npm run dev` at `http://localhost:5173/<path>`:

- Page renders inside `ProjectLayout` (back button works, title shown).
- Data persists across a page refresh.
- Home page shows the new project card, searchable and filterable.

## 10. Definition of Done - Checklist

- [ ] Component created in `src/components/Xxx.tsx` with named export + JSDoc header block
- [ ] Optional types in `src/types/Xxx.ts`
- [ ] Wrapped in `ProjectLayout` with icon (+ actions for desktop / mobile where relevant)
- [ ] Responsive: mobile icon-only buttons, desktop icon+text
- [ ] localStorage persistence with load + auto-save + error handling
- [ ] Snackbar/Alert feedback for all user actions
- [ ] Empty state UI when no data
- [ ] Dialog form patterns for input (with validation + error notifications)
- [ ] Registered in `src/data/projects.ts` and routed in `src/App.tsx`
- [ ] `npm run check:all` passes
- [ ] `npm run build` passes
- [ ] Browser check done: page verified in a real browser (Playwright MCP) against `npm run dev` on a
      **desktop window** and a **mobile** viewport, with screenshots of both
- [ ] Data persists across a page refresh

---

_Reference components to mimic: `src/components/FlashCards.tsx` (data-heavy tool),
`src/components/Game2048.tsx` (game with localStorage state), `src/components/Sudoku.tsx`
(game with API + persistence), `src/components/LuckyWheel.tsx` (tool with share/export)._
