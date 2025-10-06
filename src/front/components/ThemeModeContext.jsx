import React, { useMemo } from 'react';
import { createTheme, ThemeProvider, CssBaseline } from '@mui/material';


export const ThemeModeProvider = ({ children }) => {

    const theme = useMemo(
        () =>
            createTheme({
                palette: {
                    mode: 'dark',
                    primary: {
                        main: '#00B0FF', 
                    },
                    secondary: {
                        main: '#FF00FF',
                    },
                    background: {
                        default: '#0A0A0A', 
                        paper: '#1A1A1A',   
                    },
                    text: {
                        primary: '#FFFFFF', 
                        secondary: '#BDBDBD',
                    },
                    divider: 'rgba(0, 176, 255, 0.2)',
                },
                typography: {
                    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
                    fontWeightBold: 700,
                    h1: { fontWeight: 700 },
                    h2: { fontWeight: 700 },
                    h3: { fontWeight: 700 },
                    h4: { fontWeight: 600 },
                    h5: { fontWeight: 600 },
                    h6: { fontWeight: 600 },
                },
                components: {
                    MuiCssBaseline: {
                        styleOverrides: `
                            body {
                                background-color: #0A0A0A;
                            }
                        `,
                    },
                    MuiAppBar: {
                        styleOverrides: {
                            root: {
                                backgroundColor: '#1A1A1A',
                                backgroundImage: 'none',
                                boxShadow: 'none',
                                borderBottom: '1px solid rgba(0, 176, 255, 0.2)',
                            },
                        },
                    },
                    MuiDrawer: {
                        styleOverrides: {
                            paper: {
                                backgroundColor: '#1A1A1A',
                                backgroundImage: 'none',
                                borderRight: '1px solid rgba(0, 176, 255, 0.2)',
                            },
                        },
                    },
                    MuiCard: {
                        styleOverrides: {
                            root: {
                                backgroundImage: 'none',
                                border: '1px solid rgba(0, 176, 255, 0.2)',
                                boxShadow: 'none',
                            },
                        },
                    },
                    MuiButton: {
                        styleOverrides: {
                            containedPrimary: {
                                color: '#0A0A0A',
                                fontWeight: 'bold',
                                textTransform: 'none',
                                borderRadius: '8px',
                                background: 'linear-gradient(45deg, #00BFFF 30%, #FF00FF 90%)',
                                '&:hover': {
                                    boxShadow: '0 0 15px #00BFFF',
                                },
                            },
                        },
                    },
                },
            }),
        [], 
    );

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            {children}
        </ThemeProvider>
    );
};