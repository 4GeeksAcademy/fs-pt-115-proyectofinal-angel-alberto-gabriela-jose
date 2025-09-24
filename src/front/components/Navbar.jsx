import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import LogoutIcon from '@mui/icons-material/Logout';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { useColorMode } from './ThemeModeContext';
import useGlobalReducer from '../hooks/useGlobalReducer';

export const Navbar = () => {
  const { toggleColorMode, mode } = useColorMode();
  const { store, dispatch } = useGlobalReducer();
  const { user } = store.auth;
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);

  const handleLogout = () => {
    dispatch({ type: 'LOGOUT' });
    navigate('/');
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleMenuSelection = (route) => {
    navigate(route);
    handleMenuClose();
  };

  return (
    <AppBar position="fixed" color="primary" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
      <Toolbar>

        <Typography
          variant="h6"
          onClick={handleMenuOpen}
          sx={{
            flexGrow: 1,
            textDecoration: 'none',
            color: 'inherit',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          Aura
        </Typography>
        <Menu
          id="aura-menu"
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={() => handleMenuSelection('/dashboard')}>Dashboard</MenuItem>
          <MenuItem onClick={() => handleMenuSelection('/tareas')}>Tareas</MenuItem>
          <MenuItem onClick={() => handleMenuSelection('/gastos')}>Gastos</MenuItem>
          <MenuItem onClick={() => handleMenuSelection('/objetivos')}>Objetivos</MenuItem>
          <MenuItem onClick={() => handleMenuSelection('/recompensas')}>Recompensas</MenuItem>
        </Menu>

        <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center' }}>
          {user ? (
            <>
              <Typography sx={{ mr: 2 }}>
                Hola, {user.nombre}
              </Typography>
              <Button color="inherit" startIcon={<LogoutIcon />} onClick={handleLogout}>
                Cerrar Sesión
              </Button>
            </>
          ) : (
            <>
              <Button color="inherit" component={Link} to="/signup">
                Registrarse
              </Button>
              <Button color="inherit" component={Link} to="/login">
                Acceder
              </Button>
            </>
          )}
        </Box>
        <IconButton sx={{ ml: 1 }} onClick={toggleColorMode} color="inherit">
          {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
        </IconButton>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;