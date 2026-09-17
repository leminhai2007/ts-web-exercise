# Code Quality Setup Guide

## What's Been Added

### 1. **Prettier** - Code Formatter

- Ensures consistent code style across the project
- Automatically formats code on save and before commits
- Configuration in `.prettierrc`

### 2. **ESLint** - Linter

- Catches potential errors and enforces code quality
- Already configured (was part of Vite setup)
- Enhanced with automatic fixes

### 3. **Husky** - Git Hooks

- Runs quality checks before you commit
- Ensures no bad code gets committed
- Configuration in `.husky/` directory

### 4. **Lint-Staged** - Staged Files Linter

- Only lints files you're about to commit (not the entire codebase)
- Faster pre-commit checks
- Configuration in `.lintstagedrc.json`

### 5. **Rimraf** - Clean Utility

- Cross-platform tool to clean build directories
- Works the same on Windows, Mac, and Linux

## How It Works

### During Development

```bash
# Check formatting without changing files
npm run check:all:format

# Fix formatting
npm run fix:all:format

# Check code conventions (ESLint)
npm run check:all:convention

# Fix code conventions
npm run fix:all:convention
```

### Before Commit (Automatic - CHECK ONLY)

When you run `git commit`, Husky will automatically:

1. Run lint-staged (check mode)
2. Check code formatting with Prettier
3. Check for ESLint issues
4. **STOP commit if issues found** (no auto-fix)
5. You manually fix with `npm run fix:staged` or fix code yourself

### Package Manager

The project uses **npm** as its package manager:

- Cross-platform and included with Node.js
- Lockfile is `package-lock.json`
- Do not use yarn in this repository

## Common Commands

The full command reference (dev, build, serve, quality checks) lives in **AGENTS.md**. The quality-related commands used throughout this guide are:

| Task               | Command                        | Scope       |
| ------------------ | ------------------------------ | ----------- |
| Check formatting   | `npm run check:all:format`     | All files   |
| Fix formatting     | `npm run fix:all:format`       | All files   |
| Check conventions  | `npm run check:all:convention` | All files   |
| Fix conventions    | `npm run fix:all:convention`   | All files   |
| Check staged files | `npm run check:staged`         | Staged only |
| Fix staged files   | `npm run fix:staged`           | Staged only |
| Clean build files  | `npm run clean`                | -           |

## Git Workflow

```bash
# Make your changes
# Stage your changes
git add .

# Pre-commit hook will CHECK staged files (no auto-fix)
git commit -m "Your message"

# If checks FAIL:
# Option 1: Fix staged files automatically
npm run fix:staged

# Option 2: Fix manually and re-stage
# ... make fixes ...
git add .

# Try commit again
git commit -m "Your message"

# If checks PASS: commit succeeds!
```

## Files Added/Modified

### New Files

- `.prettierrc` - Prettier configuration
- `.prettierignore` - Files to skip formatting
- `.lintstagedrc.json` - Lint-staged configuration (check only)
- `.lintstagedrc.fix.json` - Lint-staged configuration (check and fix)
- `.husky/pre-commit` - Pre-commit hook script
- `package-lock.json` - npm dependency lock file

### Modified Files

- `package.json` - Added new scripts and dependencies
- All source files - Formatted with Prettier
- `README.md` - Updated documentation

### Removed Files

- `yarn.lock` - Replaced with package-lock.json

## Benefits

✅ **Consistent Code Style** - Everyone's code looks the same
✅ **Catch Errors Early** - ESLint finds issues before runtime
✅ **No Auto-Fixes on Commit** - You control when fixes are applied
✅ **Manual Fix Option** - `npm run fix:staged` to fix only staged files
✅ **Quality Enforcement** - Can't commit code with issues
✅ **Fast Checks** - Only checks files you changed
✅ **Better Collaboration** - No more style arguments in PRs
✅ **Separate Workflows** - Different scripts for all files vs staged files
✅ **Clear Naming** - Scripts clearly indicate check vs fix, all vs staged
