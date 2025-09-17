import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { createTheme, ThemeProvider, CssBaseline } from '@mui/material'; // Importa CssBaseline

const ColorModeContext = createContext({ toggleColorMode: () => { } });

export const useColorMode = () => {
    return useContext(ColorModeContext);
};

export const ThemeModeProvider = ({ children }) => {
    const [mode, setMode] = useState(() => {
        // Carga el modo desde localStorage o usa 'light' por defecto
        return localStorage.getItem('themeMode') || 'light';
    });

    useEffect(() => {
        // Guarda el modo en localStorage cada vez que cambia
        localStorage.setItem('themeMode', mode);
    }, [mode]);

    const colorMode = useMemo(
        () => ({
            toggleColorMode: () => {
                setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
            },
            mode,
        }),
        [mode],
    );

    const theme = useMemo(
        () =>
            createTheme({
                palette: {
                    mode,
                    primary: {
                        main: '#5E72E4',
                    },
                    secondary: {
                        main: '#F4F5F7',
                    },
                    background: {
                        default: mode === 'dark' ? '#333333' : '#F4F5F7', // Tu color oscuro
                        paper: mode === 'dark' ? '#1D1D1D' : '#FFFFFF',
                    },
                    text: {
                        primary: mode === 'dark' ? '#EAEAEA' : '#1D1D1D',
                        secondary: mode === 'dark' ? '#A0A0A0' : '#5E5E5E',
                    },
                },
                components: {
                    MuiCard: {
                        styleOverrides: {
                            root: {
                                boxShadow: mode === 'dark' ? '0px 4px 20px rgba(0, 0, 0, 0.5)' : '0px 4px 20px rgba(0, 0, 0, 0.1)',
                            },
                        },
                    },
                },
            }),
        [mode],
    );

    return (
        <ColorModeContext.Provider value={colorMode}>
            <ThemeProvider theme={theme}>
                <CssBaseline />
                {children}
            </ThemeProvider>
        </ColorModeContext.Provider>
    );
};