import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Button, Box, IconButton, Menu, MenuItem, useTheme } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonAddAltIcon from '@mui/icons-material/PersonAddAlt';
import LoginIcon from '@mui/icons-material/Login';
import useGlobalReducer from '../hooks/useGlobalReducer';

export const Navbar = () => {
    const { store, dispatch } = useGlobalReducer();
    const { user } = store.auth;
    const navigate = useNavigate();
    const theme = useTheme();
    const [anchorEl, setAnchorEl] = useState(null);
    const openMenu = Boolean(anchorEl);

    const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
    const handleMenuClose = () => setAnchorEl(null);

    const handleLogout = () => {
        dispatch({ type: 'LOGOUT' });
        navigate('/');
        handleMenuClose();
    };

    return (
        <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
            <Toolbar>
                <Box component={Link} to="/" sx={{ flexGrow: 1, textDecoration: 'none' }}>
                    <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                        Aura
                    </Typography>
                </Box>

                <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 1 }}>
                    {user ? (
                        <>
                            <Typography sx={{ mr: 2, color: 'text.secondary' }}>Hola, {user.nombre}</Typography>
                            <Button variant="outlined" color="primary" startIcon={<LogoutIcon />} onClick={handleLogout}>
                                Cerrar Sesión
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button component={Link} to="/signup" sx={{ color: 'text.primary' }}>
                                Registrarse
                            </Button>
                            <Button variant="contained" color="primary" component={Link} to="/login">
                                Acceder
                            </Button>
                        </>
                    )}
                </Box>

                <Box sx={{ display: { xs: 'flex', md: 'none' } }}>
                    <IconButton color="inherit" onClick={handleMenuOpen}>
                        <MenuIcon />
                    </IconButton>
                    <Menu
                        anchorEl={anchorEl}
                        open={openMenu}
                        onClose={handleMenuClose}
                        PaperProps={{ sx: { border: `1px solid ${theme.palette.divider}` } }}
                    >
                         {user ? (
                            <div>
                                <MenuItem disabled sx={{color: 'text.secondary'}}>Hola, {user.nombre}</MenuItem>
                                <MenuItem onClick={handleLogout} sx={{color: 'text.primary'}}>
                                    <LogoutIcon fontSize="small" sx={{ mr: 1 }} /> Cerrar Sesión
                                </MenuItem>
                            </div>
                        ) : (
                            <div>
                                <MenuItem component={Link} to="/signup" onClick={handleMenuClose} sx={{color: 'text.primary'}}>
                                    <PersonAddAltIcon fontSize="small" sx={{ mr: 1 }} /> Registrarse
                                </MenuItem>
                                <MenuItem component={Link} to="/login" onClick={handleMenuClose} sx={{color: 'text.primary'}}>
                                    <LoginIcon fontSize="small" sx={{ mr: 1 }} /> Acceder
                                </MenuItem>
                            </div>
                        )}
                    </Menu>
                </Box>
            </Toolbar>
        </AppBar>
    );
};