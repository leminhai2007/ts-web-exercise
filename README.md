# Multi-Tool Website with Games

A web application built with React, TypeScript, and Vite that hosts multiple tools and games.

## Prerequisites

- Node.js (v14 or higher)
- npm (ships with Node.js)

## Run Locally (Development)

1. **Install dependencies**

    ```bash
    npm install
    ```

2. **Set up environment variables**

    ```bash
    cp .env.example .env.local
    ```

    Then edit `.env.local` to add your API keys (e.g. `YOUDOSUDOKU_API_KEY`).

    **Note**: `.env.local` is gitignored and should never be committed.

3. **Start the development server**

    ```bash
    npm run dev
    ```

    The app will be available at `http://localhost:5173/`

### Build & Preview Production Locally

```bash
npm run build   # Type-check + production build to dist/
npm run serve   # Serve the built dist/
```

## Deploy

Follow the full **[Deployment Guide](docs/DEPLOYMENT.md)**. The recommended option is **Vercel** (auto-deploys on every push to `main`):

```bash
vercel --prod
```

## Documentation

- **[Project Overview](docs/PROJECT_OVERVIEW.md)** - Features and technologies
- **[New Project Template](docs/NEW_PROJECT_TEMPLATE.md)** - Standard template for creating new pages
- **[Deployment Guide](docs/DEPLOYMENT.md)** - Deploy to Vercel, Netlify, GitHub Pages, and more
- **[Code Quality Guide](docs/CODE_QUALITY.md)** - Prettier, ESLint, Husky, and commands
- **[Styles Guide](docs/STYLES.md)** - Design system, responsive design, and Material-UI usage
- **[Security Guide](docs/SECURITY.md)** - Code obfuscation and environment variables
- **[PWA Guide](docs/PWA.md)** - Progressive web app setup

## License

This project is open source and available under the MIT License.
