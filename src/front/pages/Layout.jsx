import React, { Suspense } from 'react'; 
import { Outlet } from 'react-router-dom';
import { Navbar } from '../components/Navbar.jsx';
import { Footer } from '../components/Footer.jsx';
import { Sidebar } from '../components/Sidebar.jsx';
import { ThemeModeProvider } from '../components/ThemeModeContext.jsx';
import { Box, CircularProgress } from '@mui/material';
import useGlobalReducer from '../hooks/useGlobalReducer.jsx';

export const Layout = () => {
    const { store } = useGlobalReducer();
    const isAuthenticated = !!store.auth.token;

    return (
        <ThemeModeProvider>
            <Box sx={{ display: 'flex' }}>
                <Navbar />
                {isAuthenticated && <Sidebar />}
                <Box
                    component="main"
                    sx={{
                        flexGrow: 1,
                        p: 3,
                        width: isAuthenticated ? { sm: `calc(100% - 240px)` } : '100%',
                    }}
                >
                    <div style={{ flex: 1, paddingTop: '64px' }}>
                        
                        <Suspense fallback={<Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>}>
                            <Outlet />
                        </Suspense>
                    </div>
                    <Footer />
                </Box>
            </Box>
        </ThemeModeProvider>
    );
};