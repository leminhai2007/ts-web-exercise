# Lucky Wheel Component

## Overview

The Lucky Wheel is an interactive decision-making tool that allows users to create customizable spinning wheels to help make random choices. Built with Material UI following the project's design system, users can spin the wheel, customize items, save their favorite wheels, and share them with others.

## Features

### 1. **Interactive Wheel Spinning**

- Click directly on the wheel to spin (no separate button needed)
- Smooth, animated wheel rotation with realistic physics
- Visual pointer at the top indicates the winning selection
- Result displayed in a Material UI Dialog with trophy icon
- Automatic deceleration with cubic easing for natural feel
- 4-second animation with 5-10 full rotations

### 2. **Material UI Design**

- Consistent with other project components (Sudoku, Game2048)
- AppBar with white background, indigo icons, and back button
- Responsive layout adapting to mobile and desktop
- Paper component with elevation for wheel container
- Icon-only buttons on mobile, icon+text on desktop
- Snackbar notifications for user feedback

### 3. **Customizable Items**

- Default wheel starts with "Yes" and "No" options
- Edit button above wheel for easy access
- Material UI Dialog for item management
- One item per line in multiline TextField
- Automatic trimming of whitespace from items
- Maximum 50 characters per item with truncation
- Displays minimum 10 characters on wheel with ellipsis
- Automatic color assignment from a vibrant 10-color palette
- Requires at least 1 item (Save button disabled otherwise)

### 4. **Save Wheels**

- Save button above wheel (next to Edit and Load)
- Save current wheel configuration to localStorage
- Required wheel name field with validation
- View all saved wheels in a Material UI Dialog List
- Load any saved wheel with folder icon button
- Delete unwanted saved wheels with delete icon button
- Displays creation date and item count for each saved wheel

### 5. **Share Wheels**

- Share button in AppBar for easy access
- Generate shareable links with URL parameters (pipe-separated)
- Automatic clipboard copy with success Snackbar message
- Clean URLs after loading (parameters removed with history.replaceState)
- Recipients can spin, edit, and save shared wheels

### 6. **Responsive Design**

- Fully responsive canvas-based wheel rendering
- Touch-friendly controls with appropriate target sizes
- Mobile: Icon-only buttons to save space
- Desktop: Icon+text buttons for clarity
- Adaptive wheel size (300px mobile, 450px desktop)
- Horizontal button stack above wheel on all screen sizes

## Component Structure

### Main Component: `LuckyWheel.tsx`

**Material UI Components Used:**

- `AppBar` & `Toolbar` - Top navigation bar with white background
- `Container` - Content wrapper with max-width
- `Paper` - Wheel container with elevation
- `Button` & `IconButton` - Action controls (Edit, Save, Load, Share)
- `TextField` - Input fields for editing items and naming wheels
- `Dialog`, `DialogTitle`, `DialogContent`, `DialogActions` - Modal dialogs
- `List`, `ListItem`, `ListItemText`, `ListItemSecondaryAction` - Saved wheels display
- `Stack` - Horizontal and vertical layout containers
- `Snackbar` & `Alert` - Success notification for URL copy
- `Typography` - Text styling with variants
- `useTheme` & `useMediaQuery` - Responsive design hooks

**Icons Used:**

- `ArrowBackIcon` - Navigation back to home
- `WheelIcon` (Casino) - AppBar icon and branding
- `EditIcon` - Edit items button
- `SaveIcon` - Save wheel button
- `FolderIcon` (FolderOpen) - Load saved wheels
- `ShareIcon` - Share wheel via URL
- `DeleteIcon` - Remove saved wheels
- `TrophyIcon` (EmojiEvents) - Result dialog icon

**State Management:**

- `items`: Array of WheelItem objects with id, text, and color
- `isSpinning`: Boolean to track spinning animation state
- `rotation`: Current rotation angle (0-360 degrees)
- `result`: String of winning item text (null when not shown)
- `showEditModal`: Controls edit dialog visibility
- `editText`: Multiline textarea content for editing items
- `savedWheels`: Array of SavedWheel objects from localStorage
- `showSavedWheels`: Controls saved wheels dialog visibility
- `wheelName`: String for wheel name input (required field)
- `showSaveDialog`: Controls save wheel dialog visibility
- `showCopySnackbar`: Controls success message after URL copy

**Key Functions:**

#### `drawWheel()` - Canvas Rendering Engine

This is the core rendering function that draws the entire wheel on the HTML5 Canvas. It's wrapped in `useCallback` with dependencies `[items, rotation, theme.palette.primary.main]` to prevent unnecessary re-renders.

**Step-by-Step Process:**

1. **Canvas Setup and Validation:**

    ```typescript
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ```

    - Gets the canvas element from the ref
    - Early returns if canvas or context doesn't exist (safety check)
    - The 2D rendering context provides all drawing methods

2. **Calculate Dimensions:**

    ```typescript
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 10;
    ```

    - Centers the wheel by finding the middle point
    - Calculates radius as the minimum of width/height minus 10px padding
    - This ensures the wheel fits perfectly regardless of canvas size

3. **Prepare Canvas for Drawing:**

    ```typescript
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate((rotation * Math.PI) / 180);
    ```

    - `clearRect()` removes previous frame to prevent overlapping
    - `save()` stores the current canvas state (can be restored later)
    - `translate()` moves the origin point to the center of the canvas
    - `rotate()` rotates the entire coordinate system by the rotation angle (converted from degrees to radians)
    - This rotation makes the wheel appear to spin

4. **Calculate Slice Geometry:**

    ```typescript
    const sliceAngle = (2 * Math.PI) / items.length;
    ```

    - Divides the full circle (2π radians) by number of items
    - Each slice gets an equal portion of the wheel
    - Example: 4 items = π/2 radians (90°) per slice

5. **Draw Each Colored Slice:**

    ```typescript
    items.forEach((item, index) => {
      const startAngle = index * sliceAngle;
      const endAngle = startAngle + sliceAngle;

      ctx.beginPath();
      ctx.moveTo(0, 0);  // Start at center
      ctx.arc(0, 0, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = item.color;
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 3;
      ctx.stroke();
    ```

    - **Pie Slice Drawing:**
        - `beginPath()` starts a new drawing path
        - `moveTo(0, 0)` moves to center (origin after translation)
        - `arc()` draws a circular arc from startAngle to endAngle
        - `closePath()` connects the arc back to center, forming a pie slice
        - `fillStyle` sets the background color for the slice
        - `fill()` fills the slice with the color
        - White 3px stroke creates borders between slices

6. **Text Rendering with Truncation:**

    ```typescript
    ctx.save(); // Save state before rotating for text
    ctx.rotate(startAngle + sliceAngle / 2); // Rotate to slice midpoint
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px Arial';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 3;
    ```

    - Save state again for text-specific rotation
    - Rotate to the middle of each slice so text is centered
    - Set text properties: white color, bold 14px Arial font
    - Add shadow for better readability on colored backgrounds

    **Smart Text Truncation Algorithm:**

    ```typescript
    let displayText = item.text;
    const maxWidth = radius * 0.75; // 75% of radius
    let textWidth = ctx.measureText(displayText).width;
    const minChars = Math.min(10, item.text.length);

    if (textWidth > maxWidth) {
        // Start with full text or at least minChars
        displayText = item.text.slice(0, Math.max(minChars, item.text.length));
        textWidth = ctx.measureText(displayText).width;

        // Trim character by character until it fits
        while (textWidth > maxWidth && displayText.length > minChars) {
            displayText = displayText.slice(0, -1);
            textWidth = ctx.measureText(displayText + '...').width;
        }

        // Add ellipsis if text was truncated
        if (displayText.length < item.text.length) {
            displayText = displayText + '...';
        }
    }
    ```

    - **Algorithm Explanation:**
        1. Measure the actual pixel width of the text using `measureText()`
        2. Set maximum allowed width to 75% of the radius
        3. Ensure minimum 10 characters are displayed (or full text if shorter)
        4. If text is too wide:
            - Start with the longer of: minimum 10 chars OR full text
            - Repeatedly remove one character from the end
            - Measure each iteration including "..." suffix
            - Stop when it fits or reaches minimum length
        5. Append "..." if text was shortened

    **Text Positioning:**

    ```typescript
    ctx.fillText(displayText, radius * 0.55, 5);
    ctx.restore(); // Restore rotation state
    ```

    - Position text at 55% of the radius from center
    - Vertical offset of 5px for alignment
    - `restore()` returns to the pre-text rotation state

7. **Draw Center Circle (Hub):**

    ```typescript
    ctx.restore(); // Return to pre-rotation state

    ctx.beginPath();
    ctx.arc(centerX, centerY, 20, 0, 2 * Math.PI);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 3;
    ctx.stroke();
    ```

    - Draw a white circle at the center (20px radius)
    - Dark border (3px) for definition
    - This covers the center point where all slices meet

8. **Draw Pointer (Triangle):**

    ```typescript
    ctx.beginPath();
    ctx.moveTo(centerX, 10); // Top point
    ctx.lineTo(centerX - 15, 40); // Bottom left
    ctx.lineTo(centerX + 15, 40); // Bottom right
    ctx.closePath();
    ctx.fillStyle = theme.palette.primary.main; // Indigo color
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
    ```

    - Creates a triangle pointing downward at the top of the wheel
    - Three points form an isosceles triangle
    - Filled with the theme's primary color (indigo)
    - White 2px outline for contrast
    - This pointer indicates which slice is selected

**Dependencies and Re-rendering:**

- The function is called whenever `items`, `rotation`, or `theme.palette.primary.main` changes
- `useEffect(() => { drawWheel(); }, [drawWheel])` ensures it redraws when needed

#### `spinWheel()` - Animation Controller

This function orchestrates the entire spinning animation sequence. It's called when the user clicks on the wheel.

**Guard Conditions:**

```typescript
if (isSpinning || items.length === 0) return;
```

- Prevents multiple simultaneous spins
- Prevents spinning an empty wheel

**Animation Setup:**

```typescript
setIsSpinning(true); // Lock the wheel
setResult(null); // Clear previous result

const spins = 5 + Math.random() * 5; // Random 5-10 full rotations
const extraDegrees = Math.random() * 360; // Random 0-360° final position
const totalRotation = spins * 360 + extraDegrees; // Total degrees to rotate
```

- **Random Rotation Calculation:**
    - Base: 5 full rotations (5 × 360° = 1800°)
    - Additional: Random 0-5 rotations (0-1800°)
    - Final position: Random 0-360° within last rotation
    - Total: Between 1800° and 3600° plus 0-360°
    - This ensures the wheel always spins at least 5 times before settling

**Animation Parameters:**

```typescript
const currentRotation = rotation; // Starting angle
const duration = 4000; // 4 seconds
const startTime = Date.now(); // Animation start timestamp
```

- Store the current rotation as the starting point
- Fixed 4-second duration for consistency
- Timestamp for calculating elapsed time

**Animation Loop:**

```typescript
const animate = () => {
    const elapsed = Date.now() - startTime; // Time since start
    const progress = Math.min(elapsed / duration, 1); // 0 to 1, capped at 1

    const easeOut = 1 - Math.pow(1 - progress, 3); // Cubic ease-out easing
    const newRotation = currentRotation + totalRotation * easeOut;

    setRotation(newRotation % 360); // Update rotation (normalized to 0-360)

    if (progress < 1) {
        requestAnimationFrame(animate); // Continue animation
    } else {
        setIsSpinning(false); // Unlock wheel
        determineWinner(newRotation); // Calculate result
    }
};

animate(); // Start the animation
```

- **Easing Function Explained:**
    - Linear progress: `0.0 → 0.25 → 0.5 → 0.75 → 1.0`
    - Cubic ease-out: `1 - (1 - progress)³`
    - At progress = 0: easeOut = 0 (no movement)
    - At progress = 0.5: easeOut = 0.875 (87.5% complete)
    - At progress = 1: easeOut = 1 (100% complete)
    - This creates fast initial spin with gradual deceleration
- **Frame-by-Frame Process:**
    1. Calculate elapsed time since animation start
    2. Convert to progress ratio (0 to 1)
    3. Apply cubic easing for natural deceleration
    4. Calculate new rotation: start + (total × easing)
    5. Update state (triggers re-render and `drawWheel`)
    6. If not complete, schedule next frame with `requestAnimationFrame`
    7. If complete, determine winner

- **requestAnimationFrame:**
    - Browser API for smooth 60fps animations
    - Automatically syncs with screen refresh rate
    - Pauses when tab is not visible (performance optimization)

#### `determineWinner(finalRotation)` - Winner Calculation Algorithm

This function calculates which item the pointer is pointing at after the spin completes.

**Coordinate System Understanding:**

```
Standard Canvas Coordinates:
        270° (Top)
         ↑
180° ←  +  → 0° (Right/East)
         ↓
        90° (Bottom)

Our Wheel:
- Pointer: Fixed at 270° (top, pointing down)
- Slices: Start at 0° (right/east), drawn counter-clockwise
- Rotation: Clockwise (positive degrees)
```

**Algorithm Breakdown:**

1. **Calculate Slice Size:**

    ```typescript
    const sliceAngle = 360 / items.length;
    ```

    - Example: 4 items = 90° per slice

2. **Normalize Rotation:**

    ```typescript
    const normalizedRotation = ((finalRotation % 360) + 360) % 360;
    ```

    - Converts any rotation to 0-360 range
    - Handles negative rotations correctly
    - Example: 3725° → 85°

3. **Calculate Angle at Pointer Position:**

    ```typescript
    const pointerAngle = 270; // Top of circle
    const angleAtPointer = (pointerAngle - normalizedRotation + 360) % 360;
    ```

    - **Why subtract rotation?**
        - When wheel rotates 90° clockwise, the slice that was at 0° is now at 90°
        - To find what's at the pointer (270°), we calculate: 270° - 90° = 180°
        - The slice originally at 180° is now at the pointer position
    - Adding 360 and modulo ensures result is positive and in 0-360 range

4. **Find Winning Slice Index:**

    ```typescript
    const winningIndex = Math.floor(angleAtPointer / sliceAngle) % items.length;
    ```

    - Divide angle by slice size to get which slice number
    - `Math.floor()` rounds down to get integer index
    - Modulo by items.length ensures index is valid (safety check)
    - Example: angleAtPointer = 185°, sliceAngle = 90°
        - 185 / 90 = 2.055...
        - floor(2.055) = 2
        - Slice at index 2 is the winner

5. **Display Result:**

    ```typescript
    setResult(items[winningIndex].text);
    ```

    - Sets the result state, triggering the Result Dialog to open

**Example Calculation:**

- Items: ["Pizza", "Sushi", "Burger", "Tacos"]
- Final rotation: 3650°
- Normalized: 3650 % 360 = 130°
- Angle at pointer: (270 - 130 + 360) % 360 = 500 % 360 = 140°
- Slice angle: 360 / 4 = 90°
- Index: floor(140 / 90) = floor(1.55) = 1
- Winner: items[1] = "Sushi"

#### `handleEdit()` and `handleSaveEdit()` - Item Management

These functions work together to manage the wheel item editing workflow.

**handleEdit() - Opening the Edit Dialog:**

```typescript
const handleEdit = () => {
    setEditText(items.map(item => item.text).join('\n'));
    setShowEditModal(true);
};
```

- **Purpose:** Populate the edit dialog with current items
- **Process:**
    1. Extract text from each WheelItem object: `items.map(item => item.text)`
    2. Join array into multiline string with newline separator: `join('\n')`
    3. Set the editText state (populates the TextField)
    4. Show the edit dialog

**handleSaveEdit() - Processing and Saving Changes:**

```typescript
const handleSaveEdit = () => {
    // Step 1: Parse and clean input
    const lines = editText
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);

    // Step 2: Validate at least one item exists
    if (lines.length === 0) {
        return; // Early exit, don't update wheel
    }

    // Step 3: Create WheelItem objects
    const newItems: WheelItem[] = lines.map((text, index) => {
        const truncatedText = text.slice(0, 50); // Max 50 characters
        return {
            id: String(index + 1), // Sequential IDs: "1", "2", "3"...
            text: truncatedText,
            color: DEFAULT_COLORS[index % DEFAULT_COLORS.length], // Cycle through colors
        };
    });

    // Step 4: Update state
    setItems(newItems); // Replace all items
    setShowEditModal(false); // Close dialog
    setResult(null); // Clear any previous result
};
```

**Detailed Breakdown:**

1. **Input Parsing Pipeline:**

    ```typescript
    editText
        .split('\n') // Split by newlines → array of lines
        .map(line => line.trim()) // Remove leading/trailing whitespace from each line
        .filter(line => line.length > 0); // Remove empty lines
    ```

    - **Example Input:**
        ```
        "  Pizza  \nSushi\n\n  Burger\n"
        ```
    - **After split:** `["  Pizza  ", "Sushi", "", "  Burger", ""]`
    - **After trim:** `["Pizza", "Sushi", "", "Burger", ""]`
    - **After filter:** `["Pizza", "Sushi", "Burger"]`

2. **Validation:**
    - If no valid items remain after cleaning, return early
    - This prevents creating an empty wheel
    - The Save button is also disabled in the UI when this condition is true

3. **Item Object Creation:**

    ```typescript
    lines.map((text, index) => { ... })
    ```

    - For each valid line, create a WheelItem object
    - **ID Assignment:** Sequential string IDs ("1", "2", "3"...)
    - **Text Truncation:** `text.slice(0, 50)` ensures max 50 characters
    - **Color Assignment:** `DEFAULT_COLORS[index % 10]`
        - Uses modulo operator for cycling: 0, 1, 2...9, 0, 1, 2...
        - Example: Item 11 gets color[1], same as item 1

4. **State Updates:**
    - `setItems(newItems)` triggers re-render and `drawWheel()`
    - `setShowEditModal(false)` closes the dialog
    - `setResult(null)` ensures old results don't display

#### `handleSaveWheel()` and `openSaveDialog()` - Persistence

These functions handle saving wheel configurations to browser localStorage.

**openSaveDialog() - Show Save Dialog:**

```typescript
const openSaveDialog = () => {
    setShowSaveDialog(true);
};
```

- Simple function to open the save dialog
- Triggered by clicking the Save button above the wheel

**handleSaveWheel() - Save to localStorage:**

```typescript
const handleSaveWheel = () => {
    // Step 1: Validate wheel name
    const name = wheelName.trim();
    if (!name) {
        return; // Don't save if name is empty
    }

    // Step 2: Create SavedWheel object
    const newWheel: SavedWheel = {
        id: Date.now().toString(), // Unique ID from timestamp
        name, // Trimmed wheel name
        items: items.map(item => item.text), // Just the text, not full WheelItem objects
        createdAt: Date.now(), // Timestamp for sorting/display
    };

    // Step 3: Update saved wheels array
    const updated = [...savedWheels, newWheel]; // Spread existing + new wheel
    setSavedWheels(updated); // Update React state

    // Step 4: Persist to localStorage
    localStorage.setItem('luckyWheels', JSON.stringify(updated));

    // Step 5: Reset form
    setWheelName(''); // Clear input field
    setShowSaveDialog(false); // Close dialog
};
```

**Detailed Explanation:**

1. **Validation:**
    - `trim()` removes leading/trailing whitespace
    - Empty string check prevents saving unnamed wheels
    - UI also disables Save button when name is empty

2. **ID Generation:**
    - `Date.now()` returns current timestamp in milliseconds
    - Example: `1702425600000`
    - Converted to string for consistency
    - Virtually guaranteed to be unique (unless two saves occur in same millisecond)

3. **Data Structure:**

    ```typescript
    {
      id: "1702425600000",
      name: "Dinner Options",
      items: ["Pizza", "Sushi", "Burger"],  // Only text, colors regenerated on load
      createdAt: 1702425600000
    }
    ```

4. **State Management:**
    - Spread operator creates new array (React best practice)
    - Updating state triggers re-render of saved wheels list

5. **localStorage:**
    - Key: `'luckyWheels'`
    - Value: JSON stringified array
    - Persists across browser sessions
    - Scoped to domain and protocol

#### `handleLoadWheel(wheel)` and `handleDeleteWheel(id)` - Managing Saved Wheels

**handleLoadWheel() - Load a Saved Wheel:**

```typescript
const handleLoadWheel = (wheel: SavedWheel) => {
    // Step 1: Convert saved items (strings) to WheelItem objects
    const newItems: WheelItem[] = wheel.items.map((text, index) => ({
        id: String(index + 1),
        text,
        color: DEFAULT_COLORS[index % DEFAULT_COLORS.length],
    }));

    // Step 2: Update wheel state
    setItems(newItems); // Replace current items
    setShowSavedWheels(false); // Close the saved wheels dialog
    setResult(null); // Clear any previous result
};
```

**Process:**

1. Receives a SavedWheel object from the saved wheels list
2. Reconstructs WheelItem objects with:
    - Sequential IDs
    - Text from saved items
    - Colors reassigned from DEFAULT_COLORS (same order as when saved)
3. Updates the wheel display
4. Closes dialog
5. Ready to spin immediately

**handleDeleteWheel() - Remove a Saved Wheel:**

```typescript
const handleDeleteWheel = (id: string) => {
    // Step 1: Filter out the wheel with matching id
    const updated = savedWheels.filter(wheel => wheel.id !== id);

    // Step 2: Update React state
    setSavedWheels(updated);

    // Step 3: Update localStorage
    localStorage.setItem('luckyWheels', JSON.stringify(updated));
};
```

**Process:**

1. `filter()` creates new array excluding the deleted wheel
2. Updates state (triggers UI refresh)
3. Persists change to localStorage
4. No confirmation dialog (immediate delete)

**Example:**

- Before: `[{id: "1"}, {id: "2"}, {id: "3"}]`
- Delete id "2": `filter(wheel => wheel.id !== "2")`
- After: `[{id: "1"}, {id: "3"}]`

#### `handleShareWheel()` - URL Sharing

This function generates a shareable URL that encodes the current wheel items.

```typescript
const handleShareWheel = () => {
    // Step 1: Join item texts with pipe separator
    const itemsParam = items.map(item => item.text).join('|');

    // Step 2: Build URL with query parameter
    const url = `${window.location.origin}${window.location.pathname}?items=${encodeURIComponent(itemsParam)}`;

    // Step 3: Copy to clipboard
    navigator.clipboard.writeText(url);

    // Step 4: Show success notification
    setShowCopySnackbar(true);
};
```

**Detailed Breakdown:**

1. **Creating the Parameter String:**

    ```typescript
    items.map(item => item.text).join('|');
    ```

    - Extract text from each item: `["Pizza", "Sushi", "Burger"]`
    - Join with pipe: `"Pizza|Sushi|Burger"`
    - Pipe chosen because it's unlikely in food/choice names

2. **URL Construction:**

    ```typescript
    `${window.location.origin}${window.location.pathname}?items=...`;
    ```

    - **origin:** `https://example.com`
    - **pathname:** `/lucky-wheel`
    - **Result:** `https://example.com/lucky-wheel?items=Pizza|Sushi|Burger`

3. **URL Encoding:**

    ```typescript
    encodeURIComponent(itemsParam);
    ```

    - Handles special characters safely
    - Example: `"Rock & Roll|Pop"` → `"Rock%20%26%20Roll%7CPop"`
    - Spaces become `%20`, `&` becomes `%26`, `|` becomes `%7C`

4. **Clipboard API:**

    ```typescript
    navigator.clipboard.writeText(url);
    ```

    - Modern async API for clipboard access
    - Returns a Promise (not awaited here, fire-and-forget)
    - Requires HTTPS in production (works on localhost)

5. **User Feedback:**
    - Shows Snackbar with "URL copied to clipboard!" message
    - Auto-dismisses after 3 seconds
    - Can be dismissed manually by clicking the close button

**Example Flow:**

1. User has wheel with items: `["Yes", "No", "Maybe"]`
2. Click Share button
3. URL created: `http://localhost:5173/lucky-wheel?items=Yes%7CNo%7CMaybe`
4. URL copied to clipboard
5. Success message appears
6. User pastes URL to share

#### `checkForSharedWheel()` - Loading from URL

This function runs on component mount to check if the user arrived via a shared URL.

```typescript
const checkForSharedWheel = useCallback(() => {
    // Step 1: Parse URL parameters
    const params = new URLSearchParams(window.location.search);
    const sharedItems = params.get('items');

    // Step 2: Check if items parameter exists
    if (sharedItems) {
        try {
            // Step 3: Decode and parse items
            const decodedItems = decodeURIComponent(sharedItems);
            const itemsList = decodedItems.split('|').filter(item => item.trim());

            // Step 4: Validate at least one item
            if (itemsList.length > 0) {
                // Step 5: Create WheelItem objects
                const newItems: WheelItem[] = itemsList.map((text, index) => ({
                    id: String(index + 1),
                    text: text.trim(),
                    color: DEFAULT_COLORS[index % DEFAULT_COLORS.length],
                }));
                setItems(newItems);
            }

            // Step 6: Clean URL (remove parameters)
            window.history.replaceState({}, document.title, window.location.pathname);
        } catch (error) {
            console.error('Error loading shared wheel:', error);
            // Fail silently, keep default wheel
        }
    }
}, []);
```

**Detailed Process:**

1. **URL Parameter Parsing:**

    ```typescript
    const params = new URLSearchParams(window.location.search);
    ```

    - Creates object for easy parameter access
    - Example: `?items=Pizza|Sushi&foo=bar` → Can get individual params

2. **Get Items Parameter:**

    ```typescript
    const sharedItems = params.get('items');
    ```

    - Returns: `"Pizza%7CSushi"` or `null` if not present
    - `null` check prevents unnecessary processing

3. **Decode URL Encoding:**

    ```typescript
    const decodedItems = decodeURIComponent(sharedItems);
    ```

    - Reverses `encodeURIComponent`
    - `"Pizza%7CSushi"` → `"Pizza|Sushi"`

4. **Parse Items:**

    ```typescript
    const itemsList = decodedItems.split('|').filter(item => item.trim());
    ```

    - Split by pipe: `["Pizza", "Sushi"]`
    - Filter out empty items (in case of `"Pizza||Sushi"`)
    - Trim whitespace from each item

5. **Create WheelItems:**
    - Same process as `handleSaveEdit`
    - Assigns sequential IDs and colors

6. **Clean URL:**

    ```typescript
    window.history.replaceState({}, document.title, window.location.pathname);
    ```

    - **Before:** `https://example.com/lucky-wheel?items=Pizza|Sushi`
    - **After:** `https://example.com/lucky-wheel`
    - Uses `replaceState` (not `pushState`) to avoid back button issues
    - Gives user a clean URL to share again

7. **Error Handling:**
    - `try-catch` around parsing prevents crashes from malformed URLs
    - `console.error` logs issue for debugging
    - Falls back to default wheel if parsing fails

**useCallback Wrapper:**

```typescript
const checkForSharedWheel = useCallback(() => { ... }, []);
```

- Memoizes function (doesn't change between renders)
- Empty dependency array `[]` means function never recreates
- Required for `useEffect` dependency array

#### `loadSavedWheels()` - Loading from localStorage

This function loads previously saved wheels from browser storage.

```typescript
const loadSavedWheels = useCallback(() => {
    const saved = localStorage.getItem('luckyWheels');
    if (saved) {
        setSavedWheels(JSON.parse(saved));
    }
}, []);
```

**Process:**

1. **Read from localStorage:**

    ```typescript
    localStorage.getItem('luckyWheels');
    ```

    - Returns: JSON string or `null` if key doesn't exist
    - Example: `'[{"id":"1","name":"Dinner","items":["Pizza"]}]'`

2. **Parse JSON:**

    ```typescript
    JSON.parse(saved);
    ```

    - Converts JSON string to JavaScript array
    - Example: `[{id: "1", name: "Dinner", items: ["Pizza"]}]`

3. **Update State:**
    - `setSavedWheels()` populates the saved wheels list
    - Makes wheels available in the Load dialog

**Error Handling:**

- If localStorage is disabled or corrupted, `JSON.parse` would throw
- Consider adding try-catch in production:
    ```typescript
    try {
        setSavedWheels(JSON.parse(saved));
    } catch (error) {
        console.error('Failed to load saved wheels:', error);
        localStorage.removeItem('luckyWheels'); // Clear corrupted data
    }
    ```

**useEffect Hook:**

```typescript
useEffect(() => {
    loadSavedWheels();
    checkForSharedWheel();
}, [loadSavedWheels, checkForSharedWheel]);
```

- Runs once on component mount
- Loads saved wheels and checks for shared URL
- Dependencies are memoized functions, so this only runs once

## Types

### `WheelItem`

```typescript
{
    id: string;
    text: string;
    color: string;
}
```

### `SavedWheel`

```typescript
{
  id: string;
  name: string;
  items: string[];
  createdAt: number;
}
```

## Styling

The component uses Material UI's theming system exclusively (no CSS files):

**Theme Integration:**

- Follows project's centralized theme in `App.tsx`
- Primary color: `#6366f1` (Indigo) - used for pointer, icons, buttons
- Background: `background.paper` (#ffffff) for AppBar
- Background: `background.default` (#f8fafc) for page
- Text colors: `text.primary` and `text.secondary` from theme

**AppBar Styling:**

```tsx
bgcolor: 'background.paper'; // White background
borderBottom: 1; // Subtle divider
borderColor: 'divider'; // Theme divider color
```

**Responsive Design:**

```tsx
const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
// Buttons show icon-only on mobile, icon+text on desktop
```

**Canvas Styling:**

- Canvas size: 300px (mobile) / 450px (desktop)
- Drop shadow filter for depth
- White center circle with border
- Text: 14px bold Arial, white with shadow
- Text position: 55% of radius from center
- Text max width: 75% of radius with ellipsis truncation

**Dialog Styling:**

- Result dialog: Centered content with trophy icon, large bold text
- Edit dialog: Multiline TextField with 10 rows, helper text
- Save dialog: Single TextField with validation
- All dialogs use Material UI's standard elevation and theming

## Color Palette

Default colors cycle through:

- Red (#FF6B6B)
- Teal (#4ECDC4)
- Blue (#45B7D1)
- Coral (#FFA07A)
- Mint (#98D8C8)
- Yellow (#F7DC6F)
- Purple (#BB8FCE)
- Sky Blue (#85C1E2)
- Orange (#F8B739)
- Green (#52B788)

## Usage Example

### Basic Usage

1. Navigate to `/lucky-wheel`
2. Click directly on the wheel to spin
3. View result in popup dialog with trophy icon
4. Close dialog to spin again

### Customizing Items

1. Click "Edit" button above the wheel
2. Enter items in the multiline TextField (one per line, max 50 chars each):
    ```
    Pizza
    Sushi
    Burgers
    Tacos
    Pasta
    ```
3. Items are automatically trimmed (whitespace removed)
4. Empty lines are ignored
5. Must have at least 1 valid item to save
6. Click "Save" to update the wheel

### Saving a Wheel

1. Click "Save" button above the wheel
2. Enter a required wheel name (e.g., "Dinner Options")
3. Click "Save" in dialog (disabled if name is empty)
4. Wheel is saved to localStorage
5. Access via "Load" button

### Loading a Saved Wheel

1. Click "Load" button above the wheel
2. View list of saved wheels with names, item counts, and dates
3. Click folder icon to load a wheel
4. Click delete icon to remove a wheel
5. Loaded wheel replaces current items

### Sharing a Wheel

1. Set up your wheel with desired items
2. Click "Share" button in AppBar
3. Success message: "URL copied to clipboard!"
4. Paste and share link with others
5. Recipients get the exact same wheel items and can spin/save it

## Technical Implementation

### Canvas Drawing

- Uses HTML5 Canvas API with 2D context
- Canvas size: 300x300px (mobile) or 450x450px (desktop)
- Draws using polar coordinates for pie segments
- Each segment: `arc()` from startAngle to endAngle
- Rotates canvas context for smooth animation
- Text rendering: `fillText()` at 55% radius, max 75% width
- Truncation algorithm: Ensures minimum 10 chars display, adds ellipsis
- Pointer: Triangle at top (270°) using `moveTo()` and `lineTo()`

### Animation System

- Uses `requestAnimationFrame` for smooth 60fps animation
- Random rotation: 5-10 full spins + random 0-360 degrees
- Duration: 4000ms (4 seconds)
- Easing: Cubic ease-out `1 - Math.pow(1 - progress, 3)`
- Updates rotation state continuously during animation
- Calls `determineWinner()` when progress reaches 1.0

### Winner Calculation

- Pointer is at top (270° in standard coordinates)
- Slices drawn starting from 0° (right/east) counter-clockwise
- Algorithm:
    1. Normalize rotation to 0-360 range
    2. Calculate angle at pointer: `(270 - rotation + 360) % 360`
    3. Divide by slice angle to get index
    4. Floor result and modulo by item count

### URL Sharing

- Query parameter format: `?items=Item1|Item2|Item3`
- Encoding: `encodeURIComponent()` for special characters
- Clipboard API: `navigator.clipboard.writeText()`
- Automatic cleanup: `history.replaceState()` removes params after load
- Preserves clean URL for sharing after loading

### Local Storage

- Key: `'luckyWheels'`
- Format: JSON array of SavedWheel objects
- Each saved wheel: `{ id, name, items[], createdAt }`
- ID generation: `Date.now().toString()` for uniqueness
- Persists across browser sessions
- Loaded on component mount via useEffect

## Browser Compatibility

- Modern browsers with Canvas support
- HTML5 Local Storage
- ES6+ JavaScript features
- URL API support

## Validation & Error Handling

**Item Validation:**

- Minimum 1 item required (Save button disabled in edit dialog)
- Maximum 50 characters per item (truncated on save)
- Whitespace trimmed from start and end
- Empty lines filtered out
- At least 10 characters displayed on wheel (with ellipsis if longer)

**Wheel Name Validation:**

- Required field (Save button disabled if empty)
- Trimmed before saving
- No empty string saved

**URL Sharing:**

- Try-catch around URL parsing to handle malformed parameters
- Filters out empty items after splitting
- Graceful fallback to default wheel if parsing fails

## Browser Compatibility

**Required Features:**

- HTML5 Canvas API
- localStorage API
- ES6+ (Arrow functions, template literals, const/let)
- URL/URLSearchParams API
- Clipboard API (navigator.clipboard)
- requestAnimationFrame
- React 18+
- Material UI v5+

**Tested Browsers:**

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile Safari (iOS 14+)
- Chrome Mobile (Android 10+)

## Accessibility

- **Keyboard Navigation**: All dialogs support Escape to close, Enter to submit
- **Visual Feedback**: Clear hover states on buttons, pointer cursor on wheel
- **Color Contrast**: High contrast text (white on vibrant colors with shadow)
- **Touch Targets**: Minimum 48px tap targets for mobile
- **Screen Readers**: Semantic HTML with proper ARIA attributes from Material UI
- **Focus Management**: Auto-focus on TextField when dialogs open
