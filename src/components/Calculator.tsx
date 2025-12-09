import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Box, Container, Typography, Paper, Button, IconButton, AppBar, Toolbar } from '@mui/material';
import { ArrowBack as ArrowBackIcon, Calculate as CalculateIcon, Functions as FunctionsIcon, Dialpad as DialpadIcon } from '@mui/icons-material';

type CalculatorMode = 'basic' | 'scientific';

export const Calculator = () => {
    const [display, setDisplay] = useState('0');
    const [mode, setMode] = useState<CalculatorMode>('basic');
    const [previousValue, setPreviousValue] = useState<string | null>(null);
    const [operation, setOperation] = useState<string | null>(null);
    const [waitingForOperand, setWaitingForOperand] = useState(false);

    const clearDisplay = () => {
        setDisplay('0');
        setPreviousValue(null);
        setOperation(null);
        setWaitingForOperand(false);
    };

    const clearEntry = () => {
        setDisplay('0');
        setWaitingForOperand(false);
    };

    const inputDigit = (digit: string) => {
        if (waitingForOperand) {
            setDisplay(digit);
            setWaitingForOperand(false);
        } else {
            setDisplay(display === '0' ? digit : display + digit);
        }
    };

    const inputDecimal = () => {
        if (waitingForOperand) {
            setDisplay('0.');
            setWaitingForOperand(false);
        } else if (display.indexOf('.') === -1) {
            setDisplay(display + '.');
        }
    };

    const performOperation = (nextOperation: string) => {
        const inputValue = parseFloat(display);

        if (previousValue === null) {
            setPreviousValue(String(inputValue));
        } else if (operation) {
            const prevValue = parseFloat(previousValue);
            const result = calculate(prevValue, inputValue, operation);
            setDisplay(String(result));
            setPreviousValue(String(result));
        }

        setWaitingForOperand(true);
        setOperation(nextOperation);
    };

    const calculate = (firstOperand: number, secondOperand: number, operation: string): number => {
        switch (operation) {
            case '+':
                return firstOperand + secondOperand;
            case '-':
                return firstOperand - secondOperand;
            case '*':
                return firstOperand * secondOperand;
            case '/':
                return firstOperand / secondOperand;
            case '^':
                return Math.pow(firstOperand, secondOperand);
            case 'mod':
                return firstOperand % secondOperand;
            default:
                return secondOperand;
        }
    };

    const performEquals = () => {
        const inputValue = parseFloat(display);

        if (previousValue !== null && operation) {
            const prevValue = parseFloat(previousValue);
            const result = calculate(prevValue, inputValue, operation);
            setDisplay(String(result));
            setPreviousValue(null);
            setOperation(null);
            setWaitingForOperand(true);
        }
    };

    const performScientificFunction = (func: string) => {
        const value = parseFloat(display);
        let result: number;

        try {
            switch (func) {
                case 'sin':
                    result = Math.sin(value * (Math.PI / 180));
                    break;
                case 'cos':
                    result = Math.cos(value * (Math.PI / 180));
                    break;
                case 'tan':
                    result = Math.tan(value * (Math.PI / 180));
                    break;
                case 'ln':
                    result = Math.log(value);
                    break;
                case 'log':
                    result = Math.log10(value);
                    break;
                case 'sqrt':
                    result = Math.sqrt(value);
                    break;
                case 'x²':
                    result = value * value;
                    break;
                case '1/x':
                    result = 1 / value;
                    break;
                case 'abs':
                    result = Math.abs(value);
                    break;
                case 'exp':
                    result = Math.exp(value);
                    break;
                case '±':
                    result = -value;
                    break;
                case 'π':
                    result = Math.PI;
                    break;
                case 'e':
                    result = Math.E;
                    break;
                default:
                    result = value;
            }
            setDisplay(String(result));
            setWaitingForOperand(true);
        } catch {
            setDisplay('Error');
        }
    };

    const handleBackspace = () => {
        if (display.length > 1) {
            setDisplay(display.slice(0, -1));
        } else {
            setDisplay('0');
        }
    };

    const toggleMode = () => {
        setMode(mode === 'basic' ? 'scientific' : 'basic');
    };

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
            <AppBar position="static" elevation={0} sx={{ bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider' }}>
                <Toolbar>
                    <IconButton component={Link} to="/" edge="start" sx={{ mr: 2 }}>
                        <ArrowBackIcon />
                    </IconButton>
                    <CalculateIcon sx={{ mr: 2, color: 'primary.main' }} />
                    <Typography variant="h6" component="h1" sx={{ flexGrow: 1, color: 'text.primary', fontWeight: 600 }}>
                        Scientific Calculator
                    </Typography>
                    <Button
                        variant={mode === 'basic' ? 'outlined' : 'contained'}
                        startIcon={mode === 'basic' ? <FunctionsIcon /> : <DialpadIcon />}
                        onClick={toggleMode}
                        size="small"
                    >
                        {mode === 'basic' ? 'Scientific Mode' : 'Basic Mode'}
                    </Button>
                </Toolbar>
            </AppBar>

            <Container maxWidth="sm" sx={{ py: 4 }}>
                <Paper elevation={3} sx={{ p: 3, borderRadius: 3 }}>
                    <Paper
                        elevation={0}
                        sx={{
                            p: 3,
                            mb: 2,
                            bgcolor: 'grey.100',
                            textAlign: 'right',
                            minHeight: 80,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'flex-end',
                            borderRadius: 2,
                        }}
                    >
                        <Typography variant="h3" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                            {display}
                        </Typography>
                    </Paper>

                    {mode === 'scientific' && (
                        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1, mb: 2 }}>
                            {[
                                { label: 'sin', action: () => performScientificFunction('sin') },
                                { label: 'cos', action: () => performScientificFunction('cos') },
                                { label: 'tan', action: () => performScientificFunction('tan') },
                                { label: 'ln', action: () => performScientificFunction('ln') },
                                { label: 'log', action: () => performScientificFunction('log') },
                                { label: '√', action: () => performScientificFunction('sqrt') },
                                { label: 'x²', action: () => performScientificFunction('x²') },
                                { label: 'x^y', action: () => performOperation('^') },
                                { label: '1/x', action: () => performScientificFunction('1/x') },
                                { label: '|x|', action: () => performScientificFunction('abs') },
                                { label: 'exp', action: () => performScientificFunction('exp') },
                                { label: 'mod', action: () => performOperation('mod') },
                                { label: 'π', action: () => performScientificFunction('π') },
                                { label: 'e', action: () => performScientificFunction('e') },
                                { label: '±', action: () => performScientificFunction('±') },
                                { label: '⌫', action: handleBackspace },
                            ].map((btn, idx) => (
                                <Button key={idx} variant="outlined" onClick={btn.action} sx={{ minHeight: 50, fontSize: '0.9rem' }}>
                                    {btn.label}
                                </Button>
                            ))}
                        </Box>
                    )}

                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1 }}>
                        <Button variant="outlined" color="error" onClick={clearDisplay} sx={{ minHeight: 60, fontSize: '1.1rem' }}>
                            AC
                        </Button>
                        <Button variant="outlined" color="warning" onClick={clearEntry} sx={{ minHeight: 60, fontSize: '1.1rem' }}>
                            CE
                        </Button>
                        <Button variant="outlined" onClick={handleBackspace} sx={{ minHeight: 60, fontSize: '1.1rem' }}>
                            ⌫
                        </Button>
                        <Button variant="contained" onClick={() => performOperation('/')} sx={{ minHeight: 60, fontSize: '1.1rem' }}>
                            ÷
                        </Button>

                        <Button variant="outlined" onClick={() => inputDigit('7')} sx={{ minHeight: 60, fontSize: '1.1rem' }}>
                            7
                        </Button>
                        <Button variant="outlined" onClick={() => inputDigit('8')} sx={{ minHeight: 60, fontSize: '1.1rem' }}>
                            8
                        </Button>
                        <Button variant="outlined" onClick={() => inputDigit('9')} sx={{ minHeight: 60, fontSize: '1.1rem' }}>
                            9
                        </Button>
                        <Button variant="contained" onClick={() => performOperation('*')} sx={{ minHeight: 60, fontSize: '1.1rem' }}>
                            ×
                        </Button>

                        <Button variant="outlined" onClick={() => inputDigit('4')} sx={{ minHeight: 60, fontSize: '1.1rem' }}>
                            4
                        </Button>
                        <Button variant="outlined" onClick={() => inputDigit('5')} sx={{ minHeight: 60, fontSize: '1.1rem' }}>
                            5
                        </Button>
                        <Button variant="outlined" onClick={() => inputDigit('6')} sx={{ minHeight: 60, fontSize: '1.1rem' }}>
                            6
                        </Button>
                        <Button variant="contained" onClick={() => performOperation('-')} sx={{ minHeight: 60, fontSize: '1.1rem' }}>
                            −
                        </Button>

                        <Button variant="outlined" onClick={() => inputDigit('1')} sx={{ minHeight: 60, fontSize: '1.1rem' }}>
                            1
                        </Button>
                        <Button variant="outlined" onClick={() => inputDigit('2')} sx={{ minHeight: 60, fontSize: '1.1rem' }}>
                            2
                        </Button>
                        <Button variant="outlined" onClick={() => inputDigit('3')} sx={{ minHeight: 60, fontSize: '1.1rem' }}>
                            3
                        </Button>
                        <Button variant="contained" onClick={() => performOperation('+')} sx={{ minHeight: 60, fontSize: '1.1rem' }}>
                            +
                        </Button>

                        <Button variant="outlined" onClick={() => inputDigit('0')} sx={{ gridColumn: 'span 2', minHeight: 60, fontSize: '1.1rem' }}>
                            0
                        </Button>
                        <Button variant="outlined" onClick={inputDecimal} sx={{ minHeight: 60, fontSize: '1.1rem' }}>
                            .
                        </Button>
                        <Button variant="contained" color="success" onClick={performEquals} sx={{ minHeight: 60, fontSize: '1.1rem' }}>
                            =
                        </Button>
                    </Box>
                </Paper>
            </Container>
        </Box>
    );
};
