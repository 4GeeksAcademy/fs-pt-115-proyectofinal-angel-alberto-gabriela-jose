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
import { useColorMode } from './ThemeModeContext';
import useGlobalReducer from '../hooks/useGlobalReducer';

export const Navbar = () => {
  const { toggleColorMode, mode } = useColorMode();
  const { store, dispatch } = useGlobalReducer();
  const { user } = store.auth;
  const navigate = useNavigate();


  const handleLogout = () => {
    dispatch({ type: 'LOGOUT' });
    navigate('/');
  };

  return (
    <AppBar position="fixed" color="primary" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
      <Toolbar>
        <Typography
          variant="h6"
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