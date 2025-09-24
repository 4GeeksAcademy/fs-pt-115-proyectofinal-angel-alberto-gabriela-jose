import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import CssBaseline from '@mui/material/CssBaseline';
import Divider from '@mui/material/Divider';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormLabel from '@mui/material/FormLabel';
import FormControl from '@mui/material/FormControl';
import Link from '@mui/material/Link';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import MuiCard from '@mui/material/Card';
import { styled } from '@mui/material/styles';
import AppTheme from "../components/AppTheme";
import { GoogleIcon } from '../shared-theme/CustomIcons';
import { useState } from 'react';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import { useNavigate } from 'react-router-dom';
import useGlobalReducer from '../hooks/useGlobalReducer'

const Card = styled(MuiCard)(({ theme }) => ({
    display: "flex",
    flexDirection: "column",
    alignSelf: "center",
    width: "100%",
    padding: theme.spacing(4),
    gap: theme.spacing(2),
    margin: "auto",
    boxShadow:
        "hsla(220, 30%, 5%, 0.05) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.05) 0px 15px 35px -5px",
    [theme.breakpoints.up("sm")]: {
        width: "450px"
    },
    ...theme.applyStyles("dark", {
        boxShadow:
            "hsla(220, 30%, 5%, 0.5) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.08) 0px 15px 35px -5px"
    })
}));

const SignUpContainer = styled(Stack)(({ theme }) => ({
    height: "calc((1 - var(--template-frame-height, 0)) * 100dvh)",
    minHeight: "100%",
    padding: theme.spacing(2),
    [theme.breakpoints.up("sm")]: {
        padding: theme.spacing(4)
    },
    "&::before": {
        content: '""',
        display: "block",
        position: "absolute",
        zIndex: -1,
        inset: 0,
        backgroundImage:
            "radial-gradient(ellipse at 50% 50%, hsl(210, 100%, 97%), hsl(0, 0%, 100%))",
        backgroundRepeat: "no-repeat",
        ...theme.applyStyles("dark", {
            backgroundImage:
                "radial-gradient(at 50% 50%, hsla(210, 100%, 16%, 0.5), hsl(220, 30%, 5%))"
        })
    }
}));

export default function SignUp(props) {
    const { dispatch } = useGlobalReducer();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [invitationLink, setInvitationLink] = useState(''); // --- AÑADIDO: Nuevo estado para el enlace ---
    const [loading, setLoading] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

    const [emailError, setEmailError] = useState(false);
    const [emailErrorMessage, setEmailErrorMessage] = useState("");
    const [passwordError, setPasswordError] = useState(false);
    const [passwordErrorMessage, setPasswordErrorMessage] = useState("");
    const [nameError, setNameError] = useState(false);
    const [nameErrorMessage, setNameErrorMessage] = useState("");

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

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
        if (!validateInputs()) {
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                // --- MODIFICADO: Se incluye el invitation_link en el cuerpo de la petición ---
                body: JSON.stringify({
                    nombre: name,
                    email,
                    password,
                    invitation_link: invitationLink
                }),
            });

            const data = await response.json();
            if (response.ok) {
                const { access_token, user } = data;
                localStorage.setItem('token', access_token);
                dispatch({ type: 'LOGIN_SUCCESS', payload: { token: access_token, user } });
                navigate('/dashboard')

                setSnackbar({ open: true, message: '¡Registro exitoso! Ahora puedes iniciar sesión.', severity: 'success' });
            } else {
                setSnackbar({ open: true, message: data.msg || 'Error en el registro.', severity: 'error' });
            }
        } catch (error) {
            console.error('ocurrio un error:', error);
            setSnackbar({ open: true, message: 'No se pudo conectar al servidor. Inténtalo de nuevo.', severity: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <AppTheme {...props}>
            <CssBaseline enableColorScheme />
            <SignUpContainer direction="column" justifyContent="space-between">
                <Card variant="outlined">
                    <Typography
                        component="h1"
                        variant="h4"
                        sx={{ width: "100%", fontSize: "clamp(2rem, 10vw, 2.15rem)" }}
                    >
                        Registrarse
                    </Typography>
                    <Box
                        component="form"
                        onSubmit={handleSubmit}
                        noValidate
                        sx={{ display: "flex", flexDirection: "column", gap: 2 }}
                    >
                        <FormControl>
                            <FormLabel htmlFor="name">Nombre completo</FormLabel>
                            <TextField
                                autoComplete="name"
                                name="name"
                                required
                                fullWidth
                                id="name"
                                placeholder="Juan Perez"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                error={nameError}
                                helperText={nameErrorMessage}
                                color={nameError ? "error" : "primary"}
                            />
                        </FormControl>
                        <FormControl>
                            <FormLabel htmlFor="email">Email</FormLabel>
                            <TextField
                                required
                                fullWidth
                                id="email"
                                placeholder="tu@email.com"
                                name="email"
                                autoComplete="email"
                                variant="outlined"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                error={emailError}
                                helperText={emailErrorMessage}
                                color={emailError ? "error" : "primary"}
                            />
                        </FormControl>
                        <FormControl>
                            <FormLabel htmlFor="password">Contraseña</FormLabel>
                            <TextField
                                required
                                fullWidth
                                name="password"
                                placeholder="••••••"
                                type="password"
                                id="password"
                                autoComplete="new-password"
                                variant="outlined"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                error={passwordError}
                                helperText={passwordErrorMessage}
                                color={passwordError ? "error" : "primary"}
                            />
                        </FormControl>
                        {/* --- AÑADIDO: Campo para el enlace de invitación --- */}
                        <FormControl>
                            <FormLabel htmlFor="invitationLink">Enlace de Invitación (Opcional)</FormLabel>
                            <TextField
                                fullWidth
                                id="invitationLink"
                                placeholder="Pega el enlace de invitación aquí"
                                name="invitationLink"
                                value={invitationLink}
                                onChange={(e) => setInvitationLink(e.target.value)}
                                sx={{ mb: 2 }}
                            />
                        </FormControl>
                        <FormControlLabel
                            control={<Checkbox value="allowExtraEmails" color="primary" />}
                            label="Quiero recibir ofertas y actualizaciones via email."
                        />
                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            disabled={loading}
                        >
                            {loading ? 'Creando cuenta...' : 'Crear cuenta'}
                        </Button>
                    </Box>
                    <Divider>
                        <Typography sx={{ color: "text.secondary" }}>o</Typography>
                    </Divider>
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        <Button
                            fullWidth
                            variant="outlined"
                            onClick={() => alert("Registro con Google")}
                            startIcon={<GoogleIcon />}
                        >
                            Registro con Google
                        </Button>
                        <Typography sx={{ textAlign: "center" }}>
                            Ya tienes cuenta?{" "}
                            <Link
                                href="/login"
                                variant="body2"
                                sx={{ alignSelf: "center" }}
                            >
                                Entrar
                            </Link>
                        </Typography>
                    </Box>
                </Card>
            </SignUpContainer>
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
    )
}