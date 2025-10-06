import React, { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { Box, Button, Checkbox, CssBaseline, FormControlLabel, TextField,
  Typography, Stack, Card as MuiCard, Snackbar, Alert, Link as MuiLink, CircularProgress
} from '@mui/material';
import { styled } from '@mui/material/styles';
import ForgotPassword from './ForgotPassword';
import AppTheme from '../shared-theme/AppTheme';
import useGlobalReducer from '../hooks/useGlobalReducer';
import './styles/Login.css'; 

// === MUI Custom Components ===
const Card = styled(MuiCard)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignSelf: 'center',
  width: '100%',
  padding: theme.spacing(4),
  gap: theme.spacing(2),
  margin: 'auto',
  [theme.breakpoints.up('sm')]: { maxWidth: '450px' },
  boxShadow:
    'hsla(220, 30%, 5%, 0.05) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.05) 0px 15px 35px -5px',
}));

const SignInContainer = styled(Stack)(({ theme }) => ({
  height: 'calc((1 - var(--template-frame-height, 0)) * 100dvh)',
  minHeight: '100%',
  padding: theme.spacing(2),
  [theme.breakpoints.up('sm')]: { padding: theme.spacing(4) },
  background: 'transparent',
}));

// === Login Fetch Function ===
const loginUser = async (email, password) => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  if (!backendUrl) throw new Error("La URL del backend no está configurada.");

  const resp = await fetch(`${backendUrl}/api/login`, {
    method: 'POST',
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });

  if (!resp.ok) {
    const errorData = await resp.json().catch(() => ({ msg: 'Error de servidor desconocido' }));
    throw new Error(errorData.msg || 'Error en el inicio de sesión');
  }
  return await resp.json();
};

// === Main Component ===
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
      setSnackbar({ open: true, message: 'Email y contraseña son requeridos.', severity: 'warning' });
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

      {/* === Fondo animado con burbujas === */}
      <div className="animated-login-page-container">
        {/* Burbujas animadas */}
        <div className="background-bubble bubble-1"></div>
        <div className="background-bubble bubble-2"></div>
        <div className="background-bubble bubble-3"></div>
        <div className="background-bubble bubble-4"></div>
        <div className="background-bubble bubble-5"></div>
        <div className="background-bubble bubble-6"></div>
        <div className="background-bubble bubble-7"></div>
        <div className="background-bubble bubble-8"></div>
        <div className="background-bubble bubble-9"></div>
        <div className="background-bubble bubble-10"></div>

        {/* === Formulario de login (Card de MUI sobre el fondo) === */}
        <SignInContainer direction="column" justifyContent="center" alignItems="center">
          <Card variant="outlined" className="login-card">
           <Typography component="h1" variant="h4" className="login-title">
              Iniciar sesión
            </Typography>

            <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField id="email" name="email" type="email" label="Correo Electrónico" required fullWidth />
              <TextField id="password" name="password" type="password" label="Contraseña" required fullWidth />
              <FormControlLabel control={<Checkbox value="remember" color="primary" />} label="Recuérdame" />
              <Button type="submit" fullWidth variant="contained" disabled={loading} className="login-button" sx={{ py: 1.5 }}>
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Iniciar sesión'}
              </Button>
              <MuiLink
                component="button"
                type="button"
                variant="body2"
                sx={{ alignSelf: 'center', cursor: 'pointer' }}
                onClick={handleOpenForgotPassword}
              >
                ¿Olvidaste tu contraseña?
              </MuiLink>
            </Box>


            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography sx={{ textAlign: 'center' }}>
                ¿No tienes una cuenta?{' '}
                <MuiLink component={RouterLink} to="/signup" variant="body2">Regístrate</MuiLink>
              </Typography>
            </Box>
          </Card>
        </SignInContainer>
      </div>

      {/* === Forgot Password Modal === */}
      <ForgotPassword open={forgotPasswordOpen} handleClose={handleCloseForgotPassword} />

      {/* === Snackbar de mensajes === */}
      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </AppTheme>
  );
}