import React, { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from '../components/Navbar.jsx';
import { Footer } from '../components/Footer.jsx';
import { Sidebar } from '../components/Sidebar.jsx';
import { ThemeModeProvider } from '../components/ThemeModeContext.jsx';
import { Box, CircularProgress, Toolbar, useTheme } from '@mui/material';
import useGlobalReducer from '../hooks/useGlobalReducer.jsx';

// Componente para las burbujas
const AuraBubbles = () => {
    const theme = useTheme();
    return (
        <Box sx={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            overflow: 'hidden', zIndex: -1, pointerEvents: 'none',
        }}>
            {Array.from({ length: 10 }).map((_, i) => (
                <Box
                    key={i}
                    sx={{
                        position: 'absolute',
                        borderRadius: '50%',
                        animation: 'aura-float-bounce linear infinite',
                        opacity: 0.15,
                        filter: 'blur(5px)',
                        width: `${Math.random() * 80 + 40}px`,
                        height: `${Math.random() * 80 + 40}px`,
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                        animationDuration: `${Math.random() * 15 + 20}s`,
                        animationDelay: `${Math.random() * 10}s`,
                        background: `radial-gradient(circle, ${i % 2 === 0 ? theme.palette.primary.main : theme.palette.secondary.main} 0%, rgba(0,0,0,0) 70%)`,
                        boxShadow: `0 0 20px ${i % 2 === 0 ? theme.palette.primary.main : theme.palette.secondary.main}`,
                    }}
                />
            ))}
             <style>
                {`
                    @keyframes aura-float-bounce {
                        0%, 100% { transform: translateY(0) scale(1); }
                        50% { transform: translateY(-20px) scale(1.05); }
                    }
                `}
            </style>
        </Box>
    );
};

export const Layout = () => {
    const { store } = useGlobalReducer();
    const isAuthenticated = !!store.auth.token;

    return (
        <ThemeModeProvider>
            <AuraBubbles /> {/* Añadimos las burbujas aquí */}
            <Box sx={{ display: 'flex', minHeight: '100vh' }}>
                <Navbar />
                {isAuthenticated && <Sidebar />}
                <Box
                    component="main"
                    sx={{
                        flexGrow: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        width: isAuthenticated ? { sm: `calc(100% - 240px)` } : '100%',
                    }}
                >
                    <Toolbar />
                    <Box component="div" sx={{ flexGrow: 1, p: 3 }}>
                        <Suspense fallback={<Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress color="primary" /></Box>}>
                            <Outlet />
                        </Suspense>
                    </Box>
                    <Footer />
                </Box>
            </Box>
        </ThemeModeProvider>
    );
};