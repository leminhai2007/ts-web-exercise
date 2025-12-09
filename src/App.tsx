import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { HomePage } from './components/HomePage';
import { Game2048 } from './components/Game2048';
import { Calculator } from './components/Calculator';

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
                    <Route path="/calculator" element={<Calculator />} />
                </Routes>
            </Router>
        </ThemeProvider>
    );
}

export default App;
