# Calculator Component Documentation

## Overview

The Calculator component is a fully-featured scientific calculator with two modes: Basic and Scientific. It provides standard arithmetic operations as well as advanced mathematical functions for complex calculations.

## Features

### Basic Mode

- **Standard Operations**: Addition (+), Subtraction (−), Multiplication (×), Division (÷)
- **Decimal Support**: Input decimal numbers with precision
- **Clear Functions**:
    - `AC` (All Clear): Resets the entire calculator state
    - `CE` (Clear Entry): Clears only the current input
    - `⌫` (Backspace): Removes the last digit
- **Memory Operations**: Chains multiple operations together
- **Responsive Grid Layout**: 4x5 button layout for intuitive input

### Scientific Mode

In addition to all basic operations, scientific mode provides:

#### Trigonometric Functions

- `sin`: Sine (input in degrees)
- `cos`: Cosine (input in degrees)
- `tan`: Tangent (input in degrees)

#### Logarithmic Functions

- `ln`: Natural logarithm (base e)
- `log`: Common logarithm (base 10)
- `exp`: Exponential function (e^x)

#### Power Operations

- `x²`: Square the current value
- `x^y`: Raise x to the power of y (binary operation)
- `√`: Square root
- `1/x`: Reciprocal

#### Other Operations

- `|x|`: Absolute value
- `±`: Negate (change sign)
- `mod`: Modulo operation (remainder after division)
- `π`: Insert Pi constant (3.14159...)
- `e`: Insert Euler's number (2.71828...)

## Component Structure

### State Management

The component uses React hooks to manage state:

```typescript
const [display, setDisplay] = useState('0'); // Current display value
const [mode, setMode] = useState<CalculatorMode>('basic'); // Current mode
const [previousValue, setPreviousValue] = useState<string | null>(null); // Stored value for operations
const [operation, setOperation] = useState<string | null>(null); // Current operation
const [waitingForOperand, setWaitingForOperand] = useState(false); // Input state flag
```

### Key Functions

#### `inputDigit(digit: string)`

Handles digit button presses. If waiting for a new operand, replaces the display; otherwise, appends to the current display.

#### `inputDecimal()`

Adds a decimal point to the current number if one doesn't already exist.

#### `performOperation(nextOperation: string)`

Executes the current operation (if any) and sets up for the next operation. Handles operation chaining.

#### `calculate(firstOperand: number, secondOperand: number, operation: string): number`

Core calculation logic for binary operations (+, -, \*, /, ^, mod).

#### `performEquals()`

Completes the current calculation and displays the result.

#### `performScientificFunction(func: string)`

Handles unary scientific operations (sin, cos, tan, ln, log, sqrt, etc.). Includes error handling for invalid operations.

#### `handleBackspace()`

Removes the last character from the display, or resets to '0' if only one character remains.

#### `toggleMode()`

Switches between basic and scientific modes.

## User Interface

### Display

- Large, clear display showing current value or result
- Scrollable for long numbers
- Right-aligned for natural number reading
- Gray background with border for visibility

### Button Layout

The calculator uses a grid layout:

- **Scientific Panel** (when in scientific mode): 4-column grid with 16 function buttons
- **Main Keypad**: 4-column grid with:
    - Row 1: AC, CE, ⌫, ÷
    - Row 2: 7, 8, 9, ×
    - Row 3: 4, 5, 6, −
    - Row 4: 1, 2, 3, +
    - Row 5: 0 (spans 2 columns), ., =

### Button Styling

- **Regular digits**: White background with subtle hover effect
- **Function buttons** (AC, CE): Light gray background
- **Operator buttons** (+, -, ×, ÷): Primary blue color
- **Equals button**: Darker blue for emphasis
- **Scientific functions**: Light blue background when in scientific mode

## Calculation Flow

### Basic Operation Example

1. User enters first number: `5`
2. User presses operator: `+`
    - Stores `5` as `previousValue`
    - Sets `operation` to `+`
    - Flags `waitingForOperand` as true
3. User enters second number: `3`
4. User presses `=`:
    - Calls `calculate(5, 3, '+')`
    - Returns result: `8`
    - Displays `8`
    - Resets operation state

### Chained Operations Example

1. User: `10 + 5` → Intermediate display: `10`
2. User: `×` → Calculates 10+5=15, stores 15, sets operation to `×`
3. User: `2 =` → Calculates 15×2=30, displays `30`

### Scientific Function Example

1. User enters: `90`
2. User presses: `sin`
    - Converts 90° to radians: 90 × (π/180)
    - Calculates sin(90°) = 1
    - Displays: `1`
    - Sets `waitingForOperand` to true

## Error Handling

- **Division by zero**: Handled by JavaScript's Infinity result
- **Invalid mathematical operations**: Wrapped in try-catch, displays "Error"
- **Invalid inputs**: Functions like √ of negative numbers result in NaN, caught and displayed as "Error"

## Responsive Design

The component is fully responsive with breakpoints:

- **Desktop (>640px)**: Full-size buttons and display
- **Tablet (≤640px)**: Adjusted padding and font sizes
- **Mobile (≤400px)**: Compact layout with 3-column scientific grid

## Color Scheme

Matches the project's Facebook-inspired theme:

- **Primary Blue**: `#1877f2` (operators, buttons)
- **Hover Blue**: `#166fe5` (hover states)
- **Background**: `#f0f2f5` (page background)
- **Surface**: `#ffffff` (calculator body, buttons)
- **Text**: `#050505` (primary text)
- **Borders**: `#dddfe2` (subtle borders)

## Styling

- **Component**: `src/components/Calculator.tsx`
- **UI Framework**: Material-UI components with `sx` prop styling
- **Theme**: Inherits from global MUI theme in `App.tsx`
- **Components Used**: `Paper`, `Button`, `IconButton`, `Typography`, `AppBar`, `Toolbar`

## Navigation

- **Back to Home**: Button in the top-left returns to the homepage
- **Mode Toggle**: Button in the top-right switches between Basic and Scientific modes
- **Route**: `/calculator`

## Usage in Project

The Calculator is registered in the projects data:

```typescript
{
    id: 'calculator',
    name: 'Scientific Calculator',
    description: 'Advanced calculator with basic and scientific modes for complex calculations',
    categories: ['tool', 'math'],
    path: '/calculator',
}
```

## Future Enhancements

Potential improvements:

- **Memory functions**: M+, M-, MR, MC
- **Calculation history**: Display previous calculations
- **Keyboard input**: Support keyboard number entry
- **Copy result**: Button to copy result to clipboard
- **Radians/Degrees toggle**: User-selectable angle unit
- **More functions**: Hyperbolic functions, factorial, permutations
- **Expression parsing**: Allow users to enter full expressions like "2 + 3 \* 4"
- **Parentheses support**: For complex nested calculations
