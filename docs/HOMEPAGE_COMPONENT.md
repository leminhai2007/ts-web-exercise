# HomePage Component Documentation

## Overview

The `HomePage` component is the landing page of the application that displays all available projects/games with search and filtering capabilities. It provides a user-friendly interface to browse and navigate to different projects.

## File Location

`src/components/HomePage.tsx`

## Component Architecture

### Type Definitions

No custom types are defined in this component. It uses the `Project` type from `src/types/Project.ts`.

### State Management

The component uses React hooks to manage its state:

```tsx
const [searchTerm, setSearchTerm] = useState('');
const [selectedCategory, setSelectedCategory] = useState<string>('all');
```

#### State Variables

| Variable           | Type     | Initial Value | Purpose                                       |
| ------------------ | -------- | ------------- | --------------------------------------------- |
| `searchTerm`       | `string` | `''`          | Stores the user's search input                |
| `selectedCategory` | `string` | `'all'`       | Stores the currently selected category filter |

### Computed Values (useMemo)

#### 1. `allCategories`

```tsx
const allCategories = useMemo(() => {
    const categories = new Set<string>();
    projects.forEach(project => {
        project.categories.forEach(cat => categories.add(cat));
    });
    return Array.from(categories).sort();
}, []);
```

**Purpose**: Extracts all unique categories from the projects list.

**How it works**:

1. Creates a `Set` to automatically handle uniqueness
2. Iterates through all projects
3. Adds each category from each project to the set
4. Converts the set to an array and sorts alphabetically
5. Memoized with empty dependency array (only computed once)

**Returns**: Array of unique, sorted category strings

#### 2. `filteredProjects`

```tsx
const filteredProjects = useMemo(() => {
    return projects.filter(project => {
        const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) || project.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || project.categories.includes(selectedCategory);
        return matchesSearch && matchesCategory;
    });
}, [searchTerm, selectedCategory]);
```

**Purpose**: Filters projects based on search term and selected category.

**How it works**:

1. For each project, checks two conditions:
    - **Search Match**: Project name or description contains the search term (case-insensitive)
    - **Category Match**: Selected category is 'all' or project has the selected category
2. Returns only projects that match both conditions
3. Re-computes when `searchTerm` or `selectedCategory` changes

**Returns**: Array of filtered projects

## UI Structure

### 1. Header Section

```tsx
<header className="home-header">
    <h1>🎮 My Tools & Games</h1>
    <p>A collection of interactive projects and games</p>
</header>
```

Displays the page title and subtitle.

### 2. Search Section

#### Search Input

```tsx
<input type="text" placeholder="Search by name or description..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="search-input" />
```

- Controlled input component
- Updates `searchTerm` state on every keystroke
- Triggers re-filtering through the `filteredProjects` useMemo

#### Category Filters

```tsx
<div className="category-filters">
    <button className={selectedCategory === 'all' ? 'active' : ''} onClick={() => setSelectedCategory('all')}>
        All
    </button>
    {allCategories.map(category => (
        <button key={category} className={selectedCategory === category ? 'active' : ''} onClick={() => setSelectedCategory(category)}>
            {category}
        </button>
    ))}
</div>
```

- "All" button to show all projects
- Dynamically generated buttons for each category
- Active state styling for selected category
- Clicking a button updates `selectedCategory` state

### 3. Projects Grid

```tsx
<div className="projects-grid">
    {filteredProjects.length === 0 ? (
        <p className="no-results">No projects found matching your criteria.</p>
    ) : (
        filteredProjects.map(project => (
            <Link to={project.path} key={project.id} className="project-card">
                {/* Project card content */}
            </Link>
        ))
    )}
</div>
```

**Conditional Rendering**:

- If no projects match filters: Shows "No results" message
- If projects exist: Renders project cards in a grid

#### Project Card Structure

Each card contains:

```tsx
<div className="project-card-content">
    <h2>{project.name}</h2>
    <p>{project.description}</p>
    <div className="project-categories">
        {project.categories.map(cat => (
            <span key={cat} className="category-tag">
                {cat}
            </span>
        ))}
    </div>
</div>
```

- **Name**: Project title
- **Description**: Brief description
- **Categories**: Badges showing all categories the project belongs to
- **Link**: Entire card is clickable and navigates to the project

## Performance Optimizations

### 1. useMemo for Categories

```tsx
useMemo(() => {
    /* ... */
}, []);
```

- Categories only computed once when component mounts
- Prevents unnecessary recalculation on re-renders

### 2. useMemo for Filtering

```tsx
useMemo(() => {
    /* ... */
}, [searchTerm, selectedCategory]);
```

- Filtering only happens when search term or category changes
- Avoids re-filtering on unrelated state updates or re-renders

## User Interactions

| Action                | Effect                               |
| --------------------- | ------------------------------------ |
| Type in search box    | Filters projects by name/description |
| Click category button | Filters projects by category         |
| Click "All" button    | Shows all projects                   |
| Click project card    | Navigates to project page            |

## Data Flow

```
projects (from data/projects.ts)
    ↓
allCategories (extract unique categories)
    ↓
User inputs (searchTerm, selectedCategory)
    ↓
filteredProjects (apply filters)
    ↓
Render project cards
```

## Dependencies

- **React**: `useState`, `useMemo`, `useEffect` hooks
- **React Router**: `Link` component for navigation
- **Material-UI**: UI components (`AppBar`, `Toolbar`, `TextField`, `Chip`, `Card`, etc.)
- **MUI Icons**: Icon components (`Home`, `CloudQueue`, `CloudOff`, `GetApp`)
- **Data**: `projects` array from `src/data/projects`

## Adding New Projects

To add a new project to the HomePage:

1. Add project to `src/data/projects.ts`:

```tsx
{
    id: 'my-project',
    name: 'My Project',
    description: 'Project description',
    categories: ['game', 'puzzle'],
    path: '/my-project',
}
```

2. The HomePage will automatically:
    - Display the new project card
    - Include its categories in the filter buttons
    - Make it searchable by name and description

No changes to the HomePage component are needed!

## Accessibility Considerations

- Semantic HTML (`<header>`, `<input>`, `<button>`)
- Descriptive placeholder text in search input
- Clear button labels
- Keyboard navigation supported (tab through elements)

## Future Enhancements

Potential improvements:

- Debounced search for better performance with many projects
- Multi-category filtering (select multiple categories)
- Sorting options (alphabetical, recently added, etc.)
- View toggle (grid vs. list)
- Project thumbnails/images
- Project statistics (views, ratings, etc.)
