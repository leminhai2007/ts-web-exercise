# Styles Directory

All CSS files are centralized in this directory for better organization and maintainability.

## Structure

```
styles/
├── global.css       # Global styles, CSS variables, and reusable utilities
├── HomePage.css     # HomePage component specific overrides
└── Game2048.css     # Game2048 component specific overrides
```

## Design System

### CSS Variables (defined in `global.css`)

All colors, spacing, typography, and other design tokens are defined as CSS variables in `global.css`. This ensures consistency across the entire application.

#### Key Variables:

- **Colors**: `--color-primary`, `--color-background`, `--color-text-primary`, etc.
- **Spacing**: `--spacing-xs` to `--spacing-2xl`
- **Border Radius**: `--radius-sm` to `--radius-full`
- **Shadows**: `--shadow-sm` to `--shadow-lg`
- **Typography**: `--font-size-xs` to `--font-size-4xl`
- **Transitions**: `--transition-fast`, `--transition-base`, `--transition-slow`

### Global Styles

The `global.css` file includes:

- CSS variable definitions (design tokens)
- Reset and base styles
- Typography defaults
- Button, input, and form element defaults
- Reusable utility classes (`.card`, `.container`, `.flex`, `.grid`, etc.)

### Component Styles

Component-specific CSS files (e.g., `HomePage.css`, `Game2048.css`) should:

- **Only override** what's necessary for that component
- **Use CSS variables** instead of hardcoded values
- **Keep specificity low** to maintain maintainability
- **Avoid duplicating** styles already defined in global.css

## Usage

### In Components

```tsx
// Import global styles once in main.tsx
import './styles/global.css';

// Import component-specific styles
import '../styles/HomePage.css';
```

### Using CSS Variables

```css
/* Good - uses CSS variables */
.my-element {
    color: var(--color-primary);
    padding: var(--spacing-md);
    border-radius: var(--radius-md);
}

/* Avoid - hardcoded values */
.my-element {
    color: #1877f2;
    padding: 1rem;
    border-radius: 8px;
}
```

### Adding New Styles

1. **Check global.css first** - See if there's already a utility class or variable
2. **Use CSS variables** - Always prefer variables over hardcoded values
3. **Component-specific only** - Only add component-specific overrides to component CSS
4. **New variables?** - Add new design tokens to `global.css` if needed

## Benefits

✅ **Centralized** - All styles in one location
✅ **Consistent** - CSS variables ensure design consistency
✅ **Maintainable** - Easy to update colors, spacing, etc. globally
✅ **DRY** - No duplicated styles across components
✅ **Scalable** - Easy to add new components with minimal CSS
✅ **Themeable** - Can easily support dark mode or other themes by updating variables
