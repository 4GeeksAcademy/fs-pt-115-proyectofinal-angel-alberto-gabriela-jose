import * as React from 'react';
import {Box, Button, CssBaseline, FormLabel, FormControl, Link, TextField, Typography, Snackbar, Alert, Stack, Card as MuiCard,} from '@mui/material';
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useGlobalReducer from '../hooks/useGlobalReducer';
import './styles/SignUp.css';

export default function SignUp(props) {
  const { dispatch } = useGlobalReducer();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [invitationLink, setInvitationLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  const [emailError, setEmailError] = useState(false);
  const [emailErrorMessage, setEmailErrorMessage] = useState("");
  const [passwordError, setPasswordError] = useState(false);
  const [passwordErrorMessage, setPasswordErrorMessage] = useState("");
  const [nameError, setNameError] = useState(false);
  const [nameErrorMessage, setNameErrorMessage] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const inviteCode = params.get('invite');
    if (inviteCode) {
      setInvitationLink(inviteCode);
    }
  }, [location]);

  const handleCloseSnackbar = () => setSnackbar({ ...snackbar, open: false });

  const validateInputs = () => {
    let isValid = true;

    if (!name || name.trim().length < 1) {
      setNameError(true);
      setNameErrorMessage("El nombre es requerido.");
      isValid = false;
    } else {
      setNameError(false);
      setNameErrorMessage("");
    }

    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setEmailError(true);
      setEmailErrorMessage("Por favor ingresa un email válido.");
      isValid = false;
    } else {
      setEmailError(false);
      setEmailErrorMessage("");
    }

    if (!password || password.length < 6) {
      setPasswordError(true);
      setPasswordErrorMessage("La contraseña debe tener al menos 6 caracteres.");
      isValid = false;
    } else {
      setPasswordError(false);
      setPasswordErrorMessage("");
    }

    return isValid;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateInputs()) return;

    setLoading(true);

    let finalInviteCode = invitationLink;
    if (invitationLink.includes('/')) {
      try {
        const url = new URL(invitationLink);
        finalInviteCode = url.searchParams.get('invite') || invitationLink.split('/').pop();
      } catch (e) {
        finalInviteCode = invitationLink.split('/').pop();
      }
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: name,
          email,
          password,
          invitation_link: finalInviteCode
        }),
      });

      const data = await response.json();
      if (response.ok) {
        const { access_token, user } = data;
        localStorage.setItem('token', access_token);
        dispatch({ type: 'LOGIN_SUCCESS', payload: { token: access_token, user } });
        navigate('/dashboard');
        setSnackbar({ open: true, message: '¡Registro exitoso!', severity: 'success' });
      } else {
        setSnackbar({ open: true, message: data.msg || 'Error en el registro.', severity: 'error' });
      }
    } catch (error) {
      console.error('Error en registro:', error);
      setSnackbar({ open: true, message: 'No se pudo conectar al servidor.', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <CssBaseline enableColorScheme />
      <div className="animated-signup-page-container">
        <div className="signup-bubble signup-bubble-1"></div>
        <div className="signup-bubble signup-bubble-2"></div>
        <div className="signup-bubble signup-bubble-3"></div>
        <div className="signup-bubble signup-bubble-4"></div>
        <div className="signup-bubble signup-bubble-5"></div>
        <div className="signup-bubble signup-bubble-6"></div>

        <Stack className="signup-container" direction="column" justifyContent="center" alignItems="center">
          <MuiCard variant="outlined" className="signup-card">
            <Typography component="h1" variant="h4" className="signup-title">
              Registrarse
            </Typography>

            <Box component="form" onSubmit={handleSubmit} noValidate className="signup-form">
              <FormControl>
                <FormLabel>Nombre completo</FormLabel>
                <TextField
                  placeholder="Juan Perez"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  error={nameError}
                  helperText={nameErrorMessage}
                  fullWidth
                />
              </FormControl>

              <FormControl>
                <FormLabel>Email</FormLabel>
                <TextField
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  error={emailError}
                  helperText={emailErrorMessage}
                  fullWidth
                />
              </FormControl>

              <FormControl>
                <FormLabel>Contraseña</FormLabel>
                <TextField
                  type="password"
                  placeholder="••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  error={passwordError}
                  helperText={passwordErrorMessage}
                  fullWidth
                />
              </FormControl>

              <FormControl>
                <FormLabel>Enlace de Invitación (Opcional)</FormLabel>
                <TextField
                  placeholder="Pega el enlace de invitación aquí"
                  value={invitationLink}
                  onChange={(e) => setInvitationLink(e.target.value)}
                  fullWidth
                />
              </FormControl>

              <Button
                type="submit"
                fullWidth
                variant="contained"
                color="primary" 
              >
                {loading ? 'Creando cuenta...' : 'Crear cuenta'}
              </Button>
            </Box>

            <Typography className="signup-footer">
              ¿Ya tienes una cuenta? <Link href="/login">Entrar</Link>
            </Typography>
          </MuiCard>
        </Stack>
      </div>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}