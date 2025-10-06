import React, { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Box,Button,Checkbox,CssBaseline,FormControlLabel,TextField,Typography,Stack,Card as MuiCard,Snackbar,Alert,
  Link as MuiLink,CircularProgress,
} from '@mui/material';
import ForgotPassword from './ForgotPassword';
import AppTheme from '../shared-theme/AppTheme';
import useGlobalReducer from '../hooks/useGlobalReducer';
import './styles/Login.css';

// === funcion para login ===
const loginUser = async (email, password) => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  if (!backendUrl) throw new Error('La URL del backend no está configurada.');

  const resp = await fetch(`${backendUrl}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!resp.ok) {
    const errorData = await resp.json().catch(() => ({ msg: 'Error de servidor desconocido' }));
    throw new Error(errorData.msg || 'Error en el inicio de sesión');
  }
  return await resp.json();
};

// === componente principal ===
export default function SignIn(props) {
  const { dispatch } = useGlobalReducer();
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'error' });
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const email = data.get('email');
    const password = data.get('password');

    if (!email || !password) {
      setSnackbar({
        open: true,
        message: 'Email y contraseña son requeridos.',
        severity: 'warning',
      });
      return;
    }

    setLoading(true);
    try {
      const result = await loginUser(email, password);
      if (result.token) {
        localStorage.setItem('token', result.token);
        dispatch({ type: 'LOGIN_SUCCESS', payload: result });
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Error en el login:', error);
      setSnackbar({ open: true, message: error.message, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => setSnackbar({ ...snackbar, open: false });
  const handleOpenForgotPassword = () => setForgotPasswordOpen(true);
  const handleCloseForgotPassword = () => setForgotPasswordOpen(false);

  return (
    <AppTheme {...props}>
      <CssBaseline enableColorScheme />

      <div className="animated-login-page-container">
        {/* burbujas animadas */}
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className={`background-bubble bubble-${i + 1}`}></div>
        ))}

        {/* formulario */}
        <Stack className="login-container" direction="column" justifyContent="center" alignItems="center">
          <MuiCard variant="outlined" className="login-card">
            <Typography component="h1" variant="h4" className="login-title">
              Iniciar sesión
            </Typography>

            <Box component="form" onSubmit={handleSubmit} noValidate className="login-form">
              <TextField id="email" name="email" type="email" label="Correo Electrónico" required fullWidth />
              <TextField id="password" name="password" type="password" label="Contraseña" required fullWidth />
              <FormControlLabel control={<Checkbox value="remember" color="primary" />} label="Recuérdame" />

              <Button type="submit" fullWidth variant="contained" disabled={loading} className="login-button">
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Iniciar sesión'}
              </Button>

              <MuiLink component="button" type="button" onClick={handleOpenForgotPassword} className="login-forgot">
                ¿Olvidaste tu contraseña?
              </MuiLink>
            </Box>

            <Typography className="login-footer">
              ¿No tienes una cuenta? <MuiLink component={RouterLink} to="/signup">Regístrate</MuiLink>
            </Typography>
          </MuiCard>
        </Stack>
      </div>

      <ForgotPassword open={forgotPasswordOpen} handleClose={handleCloseForgotPassword} />

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </AppTheme>
  );
}
