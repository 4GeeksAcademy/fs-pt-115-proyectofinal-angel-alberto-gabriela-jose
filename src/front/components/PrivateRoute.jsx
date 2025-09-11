import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const PrivateRoute = () => {
    // Comprueba si existe el token de autenticación en el localStorage
    const isAuthenticated = !!localStorage.getItem('authToken');

    // Si está autenticado, renderiza el componente hijo (Outlet), que será el Dashboard.
    // Si no, redirige a la página de login.
    return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

export default PrivateRoute;