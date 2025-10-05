import { Link, useNavigate } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonAddAltIcon from '@mui/icons-material/PersonAddAlt';
import LoginIcon from '@mui/icons-material/Login';
import { useColorMode } from './ThemeModeContext';
import useGlobalReducer from '../hooks/useGlobalReducer';
import { useState } from 'react';

export const Navbar = () => {
  const { toggleColorMode, mode } = useColorMode();
  const { store, dispatch } = useGlobalReducer();
  const { user } = store.auth;
  const navigate = useNavigate();

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
    <AppBar position="fixed" color="primary" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
      <Toolbar>
        <Box
          component={Link}
          to="/"
          sx={{
            flexGrow: 1,
            display: 'flex',
            alignItems: 'center',
            textDecoration: 'none',
            color: 'inherit',
            cursor: 'pointer'
          }}
        >
          <Box
            sx={{
              width: 30,
              height: 30,
              borderRadius: '50%',
              background: 'linear-gradient(45deg, #1976d2, #e072a4)', 
              mr: 1
            }}
          />
          <Typography
            variant="h5"
            sx={{ fontWeight: 'bold', letterSpacing: 1.5 }}
          >
            Aura
          </Typography>
        </Box>

        {/* --- DESKTOP --- */}
        <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center' }}>
          {user ? (
            <>
              <Typography sx={{ mr: 2 }}>Hola, {user.nombre}</Typography>
              <Button color="inherit" startIcon={<LogoutIcon />} onClick={handleLogout}>
                Cerrar Sesión
              </Button>
            </>
          ) : (
            <>
              <Button color="inherit" component={Link} to="/signup" startIcon={<PersonAddAltIcon />}>
                Registrarse
              </Button>
              <Button color="inherit" component={Link} to="/login" startIcon={<LoginIcon />}>
                Acceder
              </Button>
            </>
          )}
        </Box>

        {/* --- MOBILE MENU --- */}
        <Box sx={{ display: { xs: 'flex', md: 'none' } }}>
          <IconButton color="inherit" onClick={handleMenuOpen}>
            <MenuIcon />
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={openMenu}
            onClose={handleMenuClose}
            anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            {user ? (
              <>
                <MenuItem disabled>Hola, {user.nombre}</MenuItem>
                <MenuItem onClick={handleLogout}>
                  <LogoutIcon fontSize="small" style={{ marginRight: 8 }} />
                  Cerrar Sesión
                </MenuItem>
              </>
            ) : (
              <>
                <MenuItem component={Link} to="/signup" onClick={handleMenuClose}>
                  <PersonAddAltIcon fontSize="small" style={{ marginRight: 8 }} />
                  Registrarse
                </MenuItem>
                <MenuItem component={Link} to="/login" onClick={handleMenuClose}>
                  <LoginIcon fontSize="small" style={{ marginRight: 8 }} />
                  Acceder
                </MenuItem>
              </>
            )}
          </Menu>
        </Box>

        {/* --- TOGGLE DARK MODE --- */}
        <IconButton sx={{ ml: 1 }} onClick={toggleColorMode} color="inherit">
          {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
        </IconButton>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
