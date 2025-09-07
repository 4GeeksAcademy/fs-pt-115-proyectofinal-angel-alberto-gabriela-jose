import React, { useState, useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from "react-router-dom";
import { StoreProvider } from './hooks/useGlobalReducer';
import { BackendURL } from './components/BackendURL';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { getTheme } from './theme.jsx';
import './index.css';
import { router } from "./routes";

// Contexto para el modo claro/oscuro
export const ColorModeContext = React.createContext({ toggleColorMode: () => { } });

const Main = () => {
    const [mode, setMode] = useState(() => {
        // Carga el modo desde localStorage o usa 'light' por defecto
        return localStorage.getItem('themeMode') || 'light';
    });

    const colorMode = useMemo(
        () => ({
            toggleColorMode: () => {
                setMode((prevMode) => {
                    const newMode = prevMode === 'light' ? 'dark' : 'light';
                    localStorage.setItem('themeMode', newMode); // Guarda la preferencia
                    return newMode;
                });
            },
        }),
        [],
    );

    const theme = useMemo(() => getTheme(mode), [mode]);

    if (!import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_BACKEND_URL === "") {
        return (
            <React.StrictMode>
                <BackendURL />
            </React.StrictMode>
        );
    }

    return (
        <React.StrictMode>
            <StoreProvider>
                <ColorModeContext.Provider value={colorMode}>
                    <ThemeProvider theme={theme}>
                        <CssBaseline />
                        <RouterProvider router={router} />
                    </ThemeProvider>
                </ColorModeContext.Provider>
            </StoreProvider>
        </React.StrictMode>
    );
}

ReactDOM.createRoot(document.getElementById('root')).render(<Main />);