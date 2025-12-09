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
yarn check:all:format

# Fix formatting
yarn fix:all:format

# Check code conventions (ESLint)
yarn check:all:convention

# Fix code conventions
yarn fix:all:convention
```

### Before Commit (Automatic - CHECK ONLY)

When you run `git commit`, Husky will automatically:

1. Run lint-staged (check mode)
2. Check code formatting with Prettier
3. Check for ESLint issues
4. **STOP commit if issues found** (no auto-fix)
5. You manually fix with `yarn fix:staged:convention` or fix code yourself

### Package Manager

The project now uses **Yarn** instead of npm:

- Faster installation
- More reliable dependency resolution
- Better workspace support
- Uses `yarn.lock` instead of `package-lock.json`

## Common Commands

| Task                   | Command                      | Scope       |
| ---------------------- | ---------------------------- | ----------- |
| Install dependencies   | `yarn` or `yarn install`     | -           |
| Start dev server       | `yarn dev`                   | -           |
| Build for production   | `yarn build`                 | -           |
| Serve production build | `yarn serve`                 | -           |
| Check formatting       | `yarn check:all:format`      | All files   |
| Fix formatting         | `yarn fix:all:format`        | All files   |
| Check conventions      | `yarn check:all:convention`  | All files   |
| Fix conventions        | `yarn fix:all:convention`    | All files   |
| Check staged files     | `yarn check:staged`          | Staged only |
| Fix staged files       | `yarn fix:staged:convention` | Staged only |
| Clean build files      | `yarn clean`                 | -           |

## Git Workflow

```bash
# Make your changes
# Stage your changes
git add .

# Pre-commit hook will CHECK staged files (no auto-fix)
git commit -m "Your message"

# If checks FAIL:
# Option 1: Fix staged files automatically
yarn fix:staged:convention

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
- `yarn.lock` - Yarn dependency lock file

### Modified Files

- `package.json` - Added new scripts and dependencies
- All source files - Formatted with Prettier
- `README.md` - Updated documentation

### Removed Files

- `package-lock.json` - Replaced with yarn.lock

## Benefits

✅ **Consistent Code Style** - Everyone's code looks the same
✅ **Catch Errors Early** - ESLint finds issues before runtime
✅ **No Auto-Fixes on Commit** - You control when fixes are applied
✅ **Manual Fix Option** - `yarn fix:staged:convention` to fix only staged files
✅ **Quality Enforcement** - Can't commit code with issues
✅ **Fast Checks** - Only checks files you changed
✅ **Better Collaboration** - No more style arguments in PRs
✅ **Separate Workflows** - Different scripts for all files vs staged files
✅ **Clear Naming** - Scripts clearly indicate check vs fix, all vs staged
