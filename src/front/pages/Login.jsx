import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import CssBaseline from '@mui/material/CssBaseline';
import FormControlLabel from '@mui/material/FormControlLabel';
import Divider from '@mui/material/Divider';
import FormLabel from '@mui/material/FormLabel';
import FormControl from '@mui/material/FormControl';
import Link from '@mui/material/Link';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import MuiCard from '@mui/material/Card';
import { styled } from '@mui/material/styles';
import ForgotPassword from './components/ForgotPassword';
import AppTheme from '../shared-theme/AppTheme';
import ColorModeSelect from '../shared-theme/ColorModeSelect';
import { GoogleIcon, FacebookIcon, SitemarkIcon } from './components/CustomIcons';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

const Card = styled(MuiCard)(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    alignSelf: 'center',
    width: '100%',
    padding: theme.spacing(4),
    gap: theme.spacing(2),
    margin: 'auto',
    [theme.breakpoints.up('sm')]: {
        maxWidth: '450px',
    },
    boxShadow:
        'hsla(220, 30%, 5%, 0.05) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.05) 0px 15px 35px -5px',
    ...theme.applyStyles('dark', {
        boxShadow:
            'hsla(220, 30%, 5%, 0.5) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.08) 0px 15px 35px -5px',
    }),
}));

const SignInContainer = styled(Stack)(({ theme }) => ({
    height: 'calc((1 - var(--template-frame-height, 0)) * 100dvh)',
    minHeight: '100%',
    padding: theme.spacing(2),
    [theme.breakpoints.up('sm')]: {
        padding: theme.spacing(4),
    },
    '&::before': {
        content: '""',
        display: 'block',
        position: 'absolute',
        zIndex: -1,
        inset: 0,
        backgroundImage:
            'radial-gradient(ellipse at 50% 50%, hsl(210, 100%, 97%), hsl(0, 0%, 100%))',
        backgroundRepeat: 'no-repeat',
        ...theme.applyStyles('dark', {
            backgroundImage:
                'radial-gradient(at 50% 50%, hsla(210, 100%, 16%, 0.5), hsl(220, 30%, 5%))',
        }),
    },
}));


const loginUser = async (email, password) => {
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });
        // corregido ruta login.

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error en el inicio de sesión');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        throw error;
    }
};

export default function SignIn(props) {
    const [emailError, setEmailError] = React.useState(false);
    const [emailErrorMessage, setEmailErrorMessage] = React.useState('');
    const [passwordError, setPasswordError] = React.useState(false);
    const [passwordErrorMessage, setPasswordErrorMessage] = React.useState('');
    const [open, setOpen] = React.useState(false);
    const [loading, setLoading] = React.useState(false);
    const [snackbar, setSnackbar] = React.useState({
        open: false,
        message: '',
        severity: 'error',
    });

    const handleClickOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!validateInputs()) {
            return;
        }

        const data = new FormData(event.currentTarget);
        const email = data.get('email');
        const password = data.get('password');

        setLoading(true);

        try {
            const result = await loginUser(email, password);


            setSnackbar({
                open: true,
                message: 'Inicio de sesión exitoso!',
                severity: 'success'
            });


            console.log('Login exitoso:', result);


            if (result.token) {
                localStorage.setItem('authToken', result.token);
            }


            setTimeout(() => {
                window.location.href = '/dashboard';
            }, 1000);

        } catch (error) {
            console.error('Error en el login:', error);
            setSnackbar({
                open: true,
                message: error.message || 'Error al iniciar sesión. Intenta nuevamente.',
                severity: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    const validateInputs = () => {
        const email = document.getElementById('email');
        const password = document.getElementById('password');

        let isValid = true;

        try {
            if (!email.value || !/\S+@\S+\.\S+/.test(email.value)) {
                setEmailError(true);
                setEmailErrorMessage('Por favor ingresa una dirección de correo válida.');
                isValid = false;
            } else {
                setEmailError(false);
                setEmailErrorMessage('');
            }

            if (!password.value || password.value.length < 6) {
                setPasswordError(true);
                setPasswordErrorMessage('La contraseña debe tener al menos 6 caracteres.');
                isValid = false;
            } else {
                setPasswordError(false);
                setPasswordErrorMessage('');
            }
        } catch (error) {
            console.error('Error validando inputs:', error);
            setSnackbar({
                open: true,
                message: 'Error validando los campos. Por favor, recarga la página.',
                severity: 'error'
            });
            isValid = false;
        }

        return isValid;
    };

    return (
        <AppTheme {...props}>
            <CssBaseline enableColorScheme />
            <SignInContainer direction="column" justifyContent="space-between">
                <ColorModeSelect sx={{ position: 'fixed', top: '1rem', right: '1rem' }} />
                <Card variant="outlined">
                    <SitemarkIcon />
                    <Typography
                        component="h1"
                        variant="h4"
                        sx={{ width: '100%', fontSize: 'clamp(2rem, 10vw, 2.15rem)' }}
                    >
                        Iniciar sesión
                    </Typography>
                    <Box
                        component="form"
                        onSubmit={handleSubmit}
                        noValidate
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            width: '100%',
                            gap: 2,
                        }}
                    >
                        <FormControl>
                            <FormLabel htmlFor="email">Email</FormLabel>
                            <TextField
                                error={emailError}
                                helperText={emailErrorMessage}
                                id="email"
                                type="email"
                                name="email"
                                placeholder="tu@email.com"
                                autoComplete="email"
                                autoFocus
                                required
                                fullWidth
                                variant="outlined"
                                color={emailError ? 'error' : 'primary'}
                            />
                        </FormControl>
                        <FormControl>
                            <FormLabel htmlFor="password">Contraseña</FormLabel>
                            <TextField
                                error={passwordError}
                                helperText={passwordErrorMessage}
                                name="password"
                                placeholder="••••••"
                                type="password"
                                id="password"
                                autoComplete="current-password"
                                required
                                fullWidth
                                variant="outlined"
                                color={passwordError ? 'error' : 'primary'}
                            />
                        </FormControl>
                        <FormControlLabel
                            control={<Checkbox value="remember" color="primary" />}
                            label="Recuérdame"
                        />
                        <ForgotPassword open={open} handleClose={handleClose} />
                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            disabled={loading}
                        >
                            {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
                        </Button>
                        <Link
                            component="button"
                            type="button"
                            onClick={handleClickOpen}
                            variant="body2"
                            sx={{ alignSelf: 'center' }}
                        >
                            ¿Olvidaste tu contraseña?
                        </Link>
                    </Box>
                    <Divider>o</Divider>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Button
                            fullWidth
                            variant="outlined"
                            onClick={() => {
                                try {
                                    // Lógica para inicio con Google
                                    alert('Iniciar sesión con Google');
                                } catch (error) {
                                    console.error('Error con Google auth:', error);
                                    setSnackbar({
                                        open: true,
                                        message: 'Error al iniciar con Google',
                                        severity: 'error'
                                    });
                                }
                            }}
                            startIcon={<GoogleIcon />}
                        >
                            Iniciar con Google
                        </Button>
                        <Button
                            fullWidth
                            variant="outlined"
                            onClick={() => {
                                try {
                                    // Lógica para inicio con Facebook
                                    alert('Iniciar sesión con Facebook');
                                } catch (error) {
                                    console.error('Error con Facebook auth:', error);
                                    setSnackbar({
                                        open: true,
                                        message: 'Error al iniciar con Facebook',
                                        severity: 'error'
                                    });
                                }
                            }}
                            startIcon={<FacebookIcon />}
                        >
                            Iniciar con Facebook
                        </Button>
                        <Typography sx={{ textAlign: 'center' }}>
                            ¿No tienes una cuenta?{' '}
                            <Link
                                href="/signup"
                                variant="body2"
                                sx={{ alignSelf: 'center' }}
                            >
                                Regístrate
                            </Link>
                        </Typography>
                    </Box>
                </Card>
            </SignInContainer>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    onClose={handleCloseSnackbar}
                    severity={snackbar.severity}
                    sx={{ width: '100%' }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </AppTheme>
    );
}