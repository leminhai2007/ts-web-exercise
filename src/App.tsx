// Related docs (update if this file changes): docs/NEW_PROJECT_TEMPLATE.md (routes), docs/STYLES.md (theme)
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme, alpha, CssBaseline } from '@mui/material';
import { HomePage } from './components/HomePage';
import { Game2048 } from './components/Game2048';
import { Sudoku } from './components/Sudoku';
import { LuckyWheel } from './components/LuckyWheel';
import { FlashCards } from './components/FlashCards';
import { DataManager } from './components/DataManager';

const fontPixel = '"Press Start 2P", "VT323", "Courier New", monospace';
const fontBody = '"VT323", "Courier New", monospace';

const theme = createTheme({
    palette: {
        mode: 'light',
        primary: {
            main: '#e52521', // Mario red
            light: '#ff6b4a',
            dark: '#b81218',
            contrastText: '#ffffff',
        },
        secondary: {
            main: '#43b047', // Mario pipe green
            light: '#6fcf6f',
            dark: '#2b7a2f',
            contrastText: '#ffffff',
        },
        background: {
            default: '#7fc4ff', // Mario sky blue
            paper: '#ffffff',
        },
        text: {
            primary: '#2e2418',
            secondary: '#8a7a5c',
        },
        success: {
            main: '#43b047',
            light: '#6fcf6f',
            dark: '#2b7a2f',
        },
        warning: {
            main: '#f5aa00', // coin yellow
            light: '#ffd54f',
            dark: '#c88700',
        },
        error: {
            main: '#d63031',
            light: '#ff8a80',
            dark: '#9a1111',
        },
        info: {
            main: '#049cd8', // overalls blue
            light: '#63c4e8',
            dark: '#0277a8',
        },
        divider: '#e9dfc8',
    },
    typography: {
        fontFamily: fontBody,
        h1: { fontFamily: fontPixel, fontWeight: 400, fontSize: '2rem', lineHeight: 1.7 },
        h2: { fontFamily: fontPixel, fontWeight: 400, fontSize: '1.5rem', lineHeight: 1.7 },
        h3: { fontFamily: fontPixel, fontWeight: 400, fontSize: '1.25rem', lineHeight: 1.7 },
        h4: { fontFamily: fontPixel, fontWeight: 400, fontSize: '1.1rem', lineHeight: 1.8 },
        h5: { fontFamily: fontPixel, fontWeight: 400, fontSize: '0.95rem', lineHeight: 1.8 },
        h6: { fontFamily: fontPixel, fontWeight: 400, fontSize: '0.8rem', lineHeight: 1.9, letterSpacing: 0.5 },
        button: { fontFamily: fontPixel, fontSize: '0.68rem', letterSpacing: 0.5 },
        caption: { fontSize: '0.85rem', letterSpacing: 0.5 },
        overline: { fontFamily: fontPixel, fontSize: '0.62rem', letterSpacing: 1 },
        body1: { fontSize: '1.1rem', lineHeight: 1.5 },
    },
    shape: {
        borderRadius: 0,
    },
    components: {
        MuiCssBaseline: {
            styleOverrides: {
                body: {
                    backgroundColor: '#7fc4ff',
                    '&::-webkit-scrollbar': { width: 12, height: 12 },
                    '&::-webkit-scrollbar-track': { backgroundColor: '#7fc4ff' },
                    '&::-webkit-scrollbar-thumb': { backgroundColor: '#e9dfc8', border: '2px solid #7fc4ff' },
                },
            },
        },
        MuiAppBar: {
            styleOverrides: {
                root: ({ theme }) => ({
                    backgroundColor: theme.palette.primary.main,
                    color: theme.palette.primary.contrastText,
                    border: '0',
                    borderBottom: `4px solid ${theme.palette.primary.dark}`,
                    boxShadow: 'none',
                    '& .MuiButton-root': {
                        color: 'inherit',
                        '&:hover': {
                            backgroundColor: alpha(theme.palette.primary.dark, 0.35),
                        },
                    },
                }),
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: ({ theme }) => ({
                    borderRadius: 0,
                    border: `1px solid ${theme.palette.divider}`,
                    backgroundImage: 'none',
                }),
            },
        },
        MuiButton: {
            styleOverrides: {
                root: ({ theme }) => ({
                    fontFamily: fontPixel,
                    textTransform: 'uppercase',
                    borderRadius: 0,
                    '&:focus-visible': {
                        outline: `2px solid ${theme.palette.primary.main}`,
                        outlineOffset: 2,
                    },
                }),
                contained: ({ theme }) => ({
                    boxShadow: `0 4px 0 ${theme.palette.common.black}`,
                    border: `2px solid ${theme.palette.common.black}`,
                    '&:hover': {
                        boxShadow: `0 2px 0 ${theme.palette.common.black}`,
                        transform: 'translateY(2px)',
                    },
                    '&:active': {
                        boxShadow: 'none',
                        transform: 'translateY(4px)',
                    },
                    '&.Mui-disabled': {
                        boxShadow: 'none',
                        border: 'none',
                    },
                }),
                outlined: {
                    borderWidth: 2,
                    '&:hover': {
                        borderWidth: 2,
                    },
                },
                text: ({ theme }) => ({
                    '&:hover': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.1),
                    },
                }),
            },
            variants: [
                {
                    props: { variant: 'contained', color: 'primary' },
                    style: ({ theme }) => ({
                        backgroundColor: theme.palette.primary.main,
                        color: theme.palette.primary.contrastText,
                        border: `2px solid ${theme.palette.primary.dark}`,
                        boxShadow: `0 4px 0 ${theme.palette.primary.dark}`,
                        '&:hover': {
                            backgroundColor: theme.palette.primary.light,
                            color: theme.palette.primary.contrastText,
                            boxShadow: `0 2px 0 ${theme.palette.primary.dark}`,
                            transform: 'translateY(2px)',
                        },
                    }),
                },
                {
                    props: { variant: 'contained', color: 'secondary' },
                    style: ({ theme }) => ({
                        backgroundColor: theme.palette.secondary.main,
                        color: theme.palette.secondary.contrastText,
                        border: `2px solid ${theme.palette.secondary.dark}`,
                        boxShadow: `0 4px 0 ${theme.palette.secondary.dark}`,
                        '&:hover': {
                            backgroundColor: theme.palette.secondary.light,
                            color: theme.palette.secondary.contrastText,
                            boxShadow: `0 2px 0 ${theme.palette.secondary.dark}`,
                            transform: 'translateY(2px)',
                        },
                    }),
                },
            ],
        },
        MuiChip: {
            styleOverrides: {
                root: ({ theme }) => ({
                    borderRadius: 0,
                    fontFamily: fontPixel,
                    fontSize: '0.6rem',
                    letterSpacing: 0.5,
                    '&:focus-visible': {
                        outline: `2px solid ${theme.palette.primary.main}`,
                        outlineOffset: 2,
                    },
                }),
                outlined: ({ theme }) => ({
                    backgroundColor: 'transparent',
                    borderColor: theme.palette.divider,
                }),
                colorPrimary: {
                    fontWeight: 400,
                },
            },
        },
        MuiAlert: {
            styleOverrides: {
                root: {
                    borderRadius: 0,
                },
            },
        },
        MuiDialog: {
            styleOverrides: {
                paper: ({ theme }) => ({
                    borderRadius: 0,
                    border: `3px solid ${theme.palette.primary.main}`,
                }),
            },
        },
        MuiBackdrop: {
            styleOverrides: {
                root: {
                    backgroundColor: 'rgba(30, 30, 70, 0.4)',
                },
            },
        },
        MuiDivider: {
            styleOverrides: {
                root: {
                    borderColor: '#e9dfc8',
                },
            },
        },
        MuiOutlinedInput: {
            styleOverrides: {
                root: ({ theme }) => ({
                    borderRadius: 0,
                    '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: theme.palette.divider,
                        borderWidth: 1,
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: theme.palette.primary.main,
                        borderWidth: 1,
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: theme.palette.primary.main,
                        borderWidth: 2,
                    },
                }),
            },
        },
        MuiToggleButton: {
            styleOverrides: {
                root: ({ theme }) => ({
                    borderRadius: 0,
                    fontFamily: fontPixel,
                    fontSize: '0.6rem',
                    letterSpacing: 0.5,
                    borderColor: theme.palette.divider,
                    color: theme.palette.text.secondary,
                    '&.Mui-selected': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.18),
                        color: theme.palette.primary.main,
                        '&:hover': {
                            backgroundColor: alpha(theme.palette.primary.main, 0.3),
                        },
                    },
                }),
            },
        },
        MuiListItemButton: {
            styleOverrides: {
                selected: ({ theme }) => ({
                    color: theme.palette.primary.main,
                    backgroundColor: alpha(theme.palette.primary.main, 0.18),
                    '&:hover': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.28),
                    },
                    '& .MuiListItemText-primary': {
                        color: theme.palette.primary.main,
                    },
                }),
            },
        },
        MuiIconButton: {
            styleOverrides: {
                root: {
                    borderRadius: 0,
                },
            },
        },
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
                    <Route path="/flash-cards" element={<FlashCards />} />
                    <Route path="/data-manager" element={<DataManager />} />
                </Routes>
            </Router>
        </ThemeProvider>
    );
}

export default App;
