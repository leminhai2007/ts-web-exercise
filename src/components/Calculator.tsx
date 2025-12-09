import { useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/Calculator.css';

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
        <div className="calculator-page">
            <div className="calculator-container">
                <div className="page-title">
                    <img src="/calculator.svg" alt="Calculator" className="page-icon" />
                    <h1>Scientific Calculator</h1>
                </div>

                <div className="calculator-header">
                    <Link to="/" className="back-button">
                        ← Back to Home
                    </Link>
                    <button className="mode-toggle" onClick={toggleMode}>
                        {mode === 'basic' ? '🔬 Scientific Mode' : '🔢 Basic Mode'}
                    </button>
                </div>

                <div className="calculator">
                    <div className="calculator-display">{display}</div>

                    {mode === 'scientific' && (
                        <div className="scientific-functions">
                            <button onClick={() => performScientificFunction('sin')}>sin</button>
                            <button onClick={() => performScientificFunction('cos')}>cos</button>
                            <button onClick={() => performScientificFunction('tan')}>tan</button>
                            <button onClick={() => performScientificFunction('ln')}>ln</button>
                            <button onClick={() => performScientificFunction('log')}>log</button>
                            <button onClick={() => performScientificFunction('sqrt')}>√</button>
                            <button onClick={() => performScientificFunction('x²')}>x²</button>
                            <button onClick={() => performOperation('^')}>x^y</button>
                            <button onClick={() => performScientificFunction('1/x')}>1/x</button>
                            <button onClick={() => performScientificFunction('abs')}>|x|</button>
                            <button onClick={() => performScientificFunction('exp')}>exp</button>
                            <button onClick={() => performOperation('mod')}>mod</button>
                            <button onClick={() => performScientificFunction('π')}>π</button>
                            <button onClick={() => performScientificFunction('e')}>e</button>
                            <button onClick={() => performScientificFunction('±')}>±</button>
                            <button onClick={handleBackspace}>⌫</button>
                        </div>
                    )}

                    <div className="calculator-keypad">
                        <button className="function-btn" onClick={clearDisplay}>
                            AC
                        </button>
                        <button className="function-btn" onClick={clearEntry}>
                            CE
                        </button>
                        <button className="function-btn" onClick={handleBackspace}>
                            ⌫
                        </button>
                        <button className="operator-btn" onClick={() => performOperation('/')}>
                            ÷
                        </button>

                        <button onClick={() => inputDigit('7')}>7</button>
                        <button onClick={() => inputDigit('8')}>8</button>
                        <button onClick={() => inputDigit('9')}>9</button>
                        <button className="operator-btn" onClick={() => performOperation('*')}>
                            ×
                        </button>

                        <button onClick={() => inputDigit('4')}>4</button>
                        <button onClick={() => inputDigit('5')}>5</button>
                        <button onClick={() => inputDigit('6')}>6</button>
                        <button className="operator-btn" onClick={() => performOperation('-')}>
                            −
                        </button>

                        <button onClick={() => inputDigit('1')}>1</button>
                        <button onClick={() => inputDigit('2')}>2</button>
                        <button onClick={() => inputDigit('3')}>3</button>
                        <button className="operator-btn" onClick={() => performOperation('+')}>
                            +
                        </button>

                        <button className="zero-btn" onClick={() => inputDigit('0')}>
                            0
                        </button>
                        <button onClick={inputDecimal}>.</button>
                        <button className="equals-btn" onClick={performEquals}>
                            =
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
