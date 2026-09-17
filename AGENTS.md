# AGENTS.md — Guide for AI Agents Working in This Repository

This file tells AI agents how to understand, modify, and verify work in this repo. Read it fully before making changes.

## Project Overview

- **What it is**: A multi-tool website ("My Tools & Games") hosting several interactive projects/games (Home, 2048, Sudoku, Lucky Wheel, Flash Cards).
- **Stack**: React 19 + TypeScript (strict), Vite 8, Material-UI v9 (`@mui/material`, `@mui/icons-material`), React Router v7, Vite PWA.
- **Styling**: No CSS files. All styling via MUI components, the global theme, and the `sx` prop. Global theme + router live in `src/App.tsx`.
- **Package manager**: npm (do not use yarn). Lockfile is `package-lock.json`.

## Common Commands

| Task                                  | Command                                  |
| ------------------------------------- | ---------------------------------------- |
| Install dependencies                  | `npm install`                            |
| Run dev server (app + API proxy)      | `npm run dev` → `http://localhost:5173/` |
| Type-check + production build         | `npm run build` (`tsc -b && vite build`) |
| Check formatting (Prettier)           | `npm run check:all:format`               |
| Fix formatting (Prettier)             | `npm run fix:all:format`                 |
| Check conventions (ESLint)            | `npm run check:all:convention`           |
| Fix conventions (ESLint)              | `npm run fix:all:convention`             |
| Combined format + lint check          | `npm run check:all`                      |
| Fix staged files only (before commit) | `npm run fix:staged`                     |
| Serve production build                | `npm run serve`                          |
| Run Playwright MCP server manually    | `npm run playwright:mcp`                 |

## Codebase Structure

```
src/
├── components/           # React page components (named exports)
│   ├── HomePage.tsx      # Landing page; auto-discovers projects
│   ├── ProjectLayout.tsx # Shared layout template for ALL pages
│   ├── Game2048.tsx / Sudoku.tsx / LuckyWheel.tsx / FlashCards.tsx
├── data/
│   └── projects.ts       # Registry of all projects (drives Home page)
├── types/                # Domain interfaces (Project.ts, FlashCard.ts, ...)
├── api/                  # Frontend API wrappers (e.g. sudokuApi.ts)
├── App.tsx               # MUI theme + React Router routes
└── main.tsx              # Entry point, PWA SW registration
api/                      # Vercel serverless / proxy functions
docs/                     # Documentation (see below)
server.js                 # Local Express proxy for the API
```

## How Pages / Projects Work

Every "project" is one page component wired into 3 places (no more):

1. **`src/components/Xxx.tsx`** — the page component.
2. **`src/App.tsx`** — import it and add `<Route path="/xxx" element={<Xxx />} />`.
3. **`src/data/projects.ts`** — add an entry `{ id, name, description, categories, path }`.

`HomePage.tsx` automatically picks up new projects from `projects.ts` (search + filters). Do NOT modify HomePage when adding a project.

## Rules / Conventions (Mandatory)

- **Must** wrap every page in `ProjectLayout` (`src/components/ProjectLayout.tsx`) with title + icon; use `actions` (desktop) and `mobileActions` (mobile icon-only) where needed.
- Follow the **`docs/NEW_PROJECT_TEMPLATE.md`** exactly when creating a new page — it contains the required JSDoc header block, page skeleton, UI patterns (responsive buttons, dialogs, snackbars, empty states), and the Definition-of-Done checklist.
- **No CSS files, no inline `style` (except hidden inputs).** Use theme values in `sx` (e.g. `primary.main`, `background.default`).
- Components use **named exports** (`export const Xxx = () => {}`), not default.
- **Responsive**: mobile shows icon-only buttons, desktop shows icon + text (`sx={{ display: { xs: 'none', sm: 'flex' } }}` pattern).
- **Persistence**: user data saved to `localStorage` (const `STORAGE_KEY` at top of file; load via lazy `useState` initializer wrapped in try/catch, auto-save via `useEffect`).
- **Feedback**: all user actions notify via `Snackbar` + `Alert` (`severity: 'success' | 'error' | 'info'`, `autoHideDuration={3000}`, anchored bottom-center).
- **Immutability**: never mutate state; always copy/spread.
- **Types**: define domain interfaces in `src/types/Xxx.ts`, prefer `interface`. No `any`.
- **Code style**: 4-space indent, `printWidth: 170`, single quotes, semicolons, trailing commas (es5). Import order: react → third-party → local. Config: `.prettierrc`, `eslint.config.js`.
- **Do not** add comments describing what the code does unless already the project pattern (the big JSDoc header on each component IS the pattern).
- **Doc-sync comments**: every feature file starts with a simple one-line comment `// Related docs (update if this file changes): <docs>` listing which docs must be kept in sync when that file changes. Update the comments AND the linked docs together. Doc mapping: page components → `NEW_PROJECT_TEMPLATE.md`/`STYLES.md`; routes/registration/types → `NEW_PROJECT_TEMPLATE.md`; global theme → `STYLES.md`; API/proxy (`src/api/`, `api/`, `server.js`, `vite.config.ts`) → `BACKEND_API.md`; PWA → `PWA.md`; secrets → `SECURITY.md`.
- **Env/secrets**: never commit `.env.local`; server-side env vars (e.g. `YOUDOSUDOKU_API_KEY`) must not use the `VITE_` prefix.

## Browser Testing (Playwright MCP)

A **Playwright MCP** server (`@playwright/mcp`) is configured in `opencode.json` and is available to
the agent as browser tools (`browser_navigate`, `browser_click`, `browser_resize`,
`browser_emulate_device`, `browser_screenshot`, ...). Chrome/Chromium is already installed for
Playwright via `npx playwright install chromium` (do not reinstall unless asked).

Use browser tools to verify UI work **against the running dev server** (`npm run dev`):

1. Start `npm run dev` in the background, then `browser_navigate` to `http://localhost:5173/<path>`.
2. Check **desktop (windowed)**: resize to a desktop viewport (e.g. 1280x720) — controls must show
   icon + text.
3. Check **mobile**: emulate a device (e.g. via `browser_emulate_device` / a mobile viewport like
   375x667) — controls must be icon-only and usable by touch.
4. Interact with the main actions, and take screenshots to confirm both layouts render correctly.

Screenshots saved without an explicit path go to `.playwright/` (gitignored).

## Verification (Run Before You Finish)

Always run all three, and only claim complete after they pass:

```bash
npm run check:all   # Prettier + ESLint over the whole repo
npm run build       # TypeScript (strict, noUnusedLocals/Parameters) + production build
```

Plus **browser check** (see above): verify the page in the dev server on a desktop viewport AND a
mobile viewport (real-browser screenshots required).

`npm run build` catches TypeScript strict errors (`noUnusedLocals`, `noUnusedParameters`,
`erasableSyntaxOnly`) — new code must be clean under strict TS.

## Git / Commit Workflow

- A Husky pre-commit hook runs lint-staged in **check-only** mode: commit FAILS if staged files have format/lint issues.
- Before committing: run `npm run fix:staged` (or `npm run fix:all`) to auto-fix, then re-stage.
- Commit message style (from history): short imperative one-liners, mostly capitalized verbs — e.g. `Add ...`, `Create ... project`, `Upgrade ...`, `Remove ...`.
- Only commit when the user explicitly asks.

## Reference Documentation

- `docs/NEW_PROJECT_TEMPLATE.md` — standard for creating new pages (read before adding any page)
- `docs/STYLES.md` — design system / MUI patterns
- `docs/CODE_QUALITY.md` — quality tooling details
- `docs/DEPLOYMENT.md` — Vercel/Netlify/etc. deployment
- `docs/PROJECT_OVERVIEW.md` — features & structure overview
- `docs/SECURITY.md`, `docs/PWA.md` — security and PWA details
- `docs/BACKEND_API.md` — proxy/serverless API architecture
- `docs/LUCKY_WHEEL_KNOWN_ISSUES.md` — Lucky Wheel known issues log

Good reference components to mimic: `src/components/FlashCards.tsx` (data-heavy tool with persistence, dialogs, responsive buttons), `src/components/Game2048.tsx` (game state in localStorage).
