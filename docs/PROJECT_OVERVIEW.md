# Project Overview

## About

A web application built with React, TypeScript, and Vite that hosts multiple tools and games. Features a searchable home page with category filtering.

## Features

- **Home Page**: Browse all available projects with search and category filtering
- **2048 Game**: Classic sliding puzzle game
- **Sudoku**: Sudoku puzzle game with multiple difficulty levels
- **Lucky Wheel**: Interactive decision-making wheel with sharing capabilities
- **Flash Cards**: Create and study flash card collections with export/import
- **Responsive Design**: Works on desktop and mobile devices
- **Progressive Web App**: Install on your device for offline access
- **Easy to Extend**: Add new projects by updating the projects data file

## Project Structure

See the **AGENTS.md** file at the repo root for the authoritative project structure and how pages
are registered (component → route → `src/data/projects.ts`). Pages are auto-discovered by the Home
page from `projects.ts`.

## Technologies Used

- **React 19**: UI library
- **TypeScript**: Type-safe JavaScript (strict mode)
- **Vite 7**: Fast build tool and dev server
- **Material-UI (MUI) v7**: Component library + theming system
- **React Router v7**: Client-side routing
- **Vite PWA**: Progressive web app (offline support)

## Related Documentation

- **[Dev & Deploy Guide](../README.md)** - How to run this repo locally and deploy it
- **[New Project Template](NEW_PROJECT_TEMPLATE.md)** - Standard template for creating new pages
- **[Deployment Guide](DEPLOYMENT.md)** - Detailed deployment instructions for all platforms
- **[Code Quality Guide](CODE_QUALITY.md)** - Code quality tools and workflows
- **[Styles Guide](STYLES.md)** - Design system, responsive design, and Material-UI usage
