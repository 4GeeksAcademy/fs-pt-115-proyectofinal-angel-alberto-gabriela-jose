import React, { useEffect } from 'react';
import { Navigate, Outlet, useNavigate } from 'react-router-dom';
import useGlobalReducer from '../hooks/useGlobalReducer';

const PrivateRoute = () => {
    const { store, dispatch } = useGlobalReducer();
    const navigate = useNavigate();
    const isAuthenticated = !!store.auth.token;

    useEffect(() => {
        const checkTokenExpiration = () => {
            const token = localStorage.getItem('authToken');
            if (!token) {
                dispatch({ type: 'LOGOUT' });
                navigate('/');
                return;
            }

            try {
                const jwtPayload = JSON.parse(atob(token.split('.')[1]));
                const expirationTime = jwtPayload.exp * 1000;

                if (Date.now() >= expirationTime) {
                    dispatch({ type: 'LOGOUT' });
                    navigate('/');
                }
            } catch (error) {
                dispatch({ type: 'LOGOUT' });
                navigate('/');
            }
        };

        checkTokenExpiration();

        const interval = setInterval(checkTokenExpiration, 60000);
        return () => clearInterval(interval);
    }, [dispatch, navigate]);


    return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

export default PrivateRoute;