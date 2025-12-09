# Multi-Tool Website with Games

A web application built with React, TypeScript, and Vite that hosts multiple tools and games. Features a searchable home page with category filtering.

## Features

- **Home Page**: Browse all available projects with search and category filtering
- **Responsive Design**: Works on desktop and mobile devices
- **Easy to Extend**: Add new projects by updating the projects data file

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- Yarn (v1.22 or higher)

### Installation

```bash
yarn install
```

### Development

Start the development server:

```bash
yarn dev
```

The application will be available at `http://localhost:5173/`

### Build for Production

```bash
yarn build
```

### Serve Production Build

```bash
yarn serve
```

### Available Scripts

#### Development & Build

- `yarn dev` - Start development server
- `yarn build` - Build for production
- `yarn preview` - Preview production build locally
- `yarn serve` - Serve production build
- `yarn clean` - Clean build artifacts

#### Code Quality - All Files

- `yarn check:all:format` - Check formatting of all files
- `yarn check:all:convention` - Check code conventions (ESLint) on all files
- `yarn fix:all:format` - Fix formatting of all files
- `yarn fix:all:convention` - Fix code conventions (ESLint) on all files

#### Code Quality - Staged Files Only

- `yarn check:staged` - Check staged files only (used by pre-commit hook)
- `yarn fix:staged:convention` - Fix issues in staged files only

## Code Quality Tools

This project uses several tools to ensure code quality:

### Prettier

Automatic code formatting for consistent style across the codebase.

- Configuration: `.prettierrc`
- Check: `yarn check:all:format`
- Fix: `yarn fix:all:format`

### ESLint

JavaScript/TypeScript linting to catch potential errors.

- Configuration: `eslint.config.js`
- Check: `yarn check:all:convention`
- Fix: `yarn fix:all:convention`

### Husky

Git hooks to enforce code quality before commits.

- Pre-commit hook checks (doesn't auto-fix) staged files
- Configuration: `.husky/pre-commit`

### Lint-Staged

Runs linters on staged files before commit.

- Configuration: `.lintstagedrc.json` (check only)
- Configuration: `.lintstagedrc.fix.json` (check and fix)
- Pre-commit hook only checks - commit fails if issues found
- Manually fix: `yarn fix:staged:convention`

### Rimraf

Cross-platform tool for cleaning build directories.

- Run: `yarn clean`

## Project Structure

```
src/
├── components/          # React components
│   ├── HomePage.tsx    # Main landing page with search
│   ├── HomePage.css
│   ├── Game2048.tsx    # 2048 game implementation
│   └── Game2048.css
├── data/               # Data files
│   └── projects.ts     # List of all projects
├── types/              # TypeScript type definitions
│   └── Project.ts
├── App.tsx             # Main app with routing
└── main.tsx            # Entry point
```

## Adding New Projects

To add a new project/game:

1. Create a new component in `src/components/`
2. Add a route in `src/App.tsx`
3. Add the project details to `src/data/projects.ts`

Example:

```typescript
// In src/data/projects.ts
{
  id: 'new-game',
  name: 'New Game',
  description: 'Description of your game',
  categories: ['game', 'puzzle'],
  path: '/new-game',
}
```

## Technologies Used

- **React 18**: UI library
- **TypeScript**: Type-safe JavaScript
- **Vite**: Fast build tool and dev server
- **React Router**: Client-side routing
- **CSS3**: Modern styling

## Additional Documentation

- **[Code Quality Guide](docs/CODE_QUALITY.md)** - Code quality tools and workflows
- **[Styles Guide](docs/STYLES.md)** - CSS architecture and design system

## License

This project is open source and available under the MIT License.
