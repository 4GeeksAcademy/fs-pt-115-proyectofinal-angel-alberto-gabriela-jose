import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from '../components/Navbar.jsx';
import { Footer } from '../components/Footer.jsx';
import { ThemeModeProvider } from '../components/ThemeModeContext.jsx';

export const Layout = () => {
    return (
        <ThemeModeProvider>
            <div className="d-flex flex-column min-vh-100">
                <Navbar />
                <div style={{ flex: 1, paddingTop: '64px' }}>
                    <Outlet />
                </div>
                <Footer />
            </div>
        </ThemeModeProvider>
    );
};