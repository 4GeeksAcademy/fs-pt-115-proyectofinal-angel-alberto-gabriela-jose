import { createTheme } from '@mui/material/styles';
import { amber, grey, blue } from '@mui/material/colors';

const getDesignTokens = (mode) => ({
    palette: {
        mode,
        ...(mode === 'light'
            ? {
                // Paleta para modo claro
                primary: blue,
                secondary: {
                    main: grey[700],
                },
                background: {
                    default: '#f8f9fa',
                    paper: grey[50],
                },
                text: {
                    primary: grey[900],
                    secondary: grey[600],
                },
            }
            : {
                // Paleta para modo oscuro
                primary: amber,
                secondary: {
                    main: grey[400],
                },
                background: {
                    default: '#121212',
                    paper: '#1d1d1d',
                },
                text: {
                    primary: grey[50],
                    secondary: grey[400],
                },
            }),
    },
    typography: {
        fontFamily: [
            'Poppins',
            'Roboto',
            'sans-serif',
        ].join(','),
        h2: {
            fontWeight: 700,
        },
        h5: {
            fontWeight: 400,
        },
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                    textTransform: 'none',
                    padding: '12px 28px',
                    fontWeight: 600,
                },
                containedPrimary: {
                    boxShadow: '0 6px 15px rgba(25, 118, 210, 0.3)',
                },
            },
        },
        MuiAppBar: {
            styleOverrides: {
                root: {
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                    backdropFilter: 'blur(12px)',
                },
            },
        },
    },
});

export const getTheme = (mode) => createTheme(getDesignTokens(mode));