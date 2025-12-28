import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { HomePage } from './components/HomePage';
import { Game2048 } from './components/Game2048';
import { Sudoku } from './components/Sudoku';
import { LuckyWheel } from './components/LuckyWheel';
import { Tetris } from './components/Tetris';

const theme = createTheme({
    palette: {
        mode: 'light',
        primary: {
            main: '#6366f1',
        },
        secondary: {
            main: '#ec4899',
        },
        background: {
            default: '#f8fafc',
            paper: '#ffffff',
        },
    },
    typography: {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    },
    shape: {
        borderRadius: 12,
    },
});

function App() {
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <Router>
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/2048" element={<Game2048 />} />
                    <Route path="/sudoku" element={<Sudoku />} />
                    <Route path="/lucky-wheel" element={<LuckyWheel />} />
                    <Route path="/tetris" element={<Tetris />} />
                </Routes>
            </Router>
        </ThemeProvider>
    );
}

export default App;
