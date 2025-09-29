import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Button, TextField, Typography, Card, Alert, CircularProgress, Container, CssBaseline } from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledCard = styled(Card)(({ theme }) => ({
    marginTop: theme.spacing(8),
    padding: theme.spacing(4),
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    maxWidth: '400px',
    margin: 'auto'
}));

export default function ResetPassword() {
    const { token } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [validating, setValidating] = useState(true);
    const [valid, setValid] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [formData, setFormData] = useState({
        newPassword: '',
        confirmPassword: ''
    });

    useEffect(() => {
        const validateToken = async () => {
            try {
                const backendUrl = import.meta.env.VITE_BACKEND_URL;
                const response = await fetch(`${backendUrl}/api/validate-reset-token/${token}`);

                if (response.ok) {
                    const data = await response.json();
                    setValid(data.valid);
                } else {
                    setValid(false);
                }
            } catch (error) {
                console.error('Error validando token:', error);
                setValid(false);
            } finally {
                setValidating(false);
            }
        };

        validateToken();
    }, [token]);

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (formData.newPassword !== formData.confirmPassword) {
            setError('Las contraseñas no coinciden');
            return;
        }

        if (formData.newPassword.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const backendUrl = import.meta.env.VITE_BACKEND_URL;
            const response = await fetch(`${backendUrl}/api/reset-password/${token}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    new_password: formData.newPassword
                }),
            });

            if (response.ok) {
                setSuccess(true);
                setTimeout(() => {
                    navigate('/login');
                }, 3000);
            } else {
                const errorData = await response.json().catch(() => ({ msg: 'Error del servidor' }));
                setError(errorData.msg || 'Error al restablecer la contraseña');
            }
        } catch (error) {
            console.error('Error:', error);
            setError('Error de conexión');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (event) => {
        setFormData({
            ...formData,
            [event.target.name]: event.target.value
        });
    };

    if (validating) {
        return (
            <Container component="main" maxWidth="sm">
                <CssBaseline />
                <StyledCard>
                    <CircularProgress />
                    <Typography variant="h6" sx={{ mt: 2 }}>
                        Validando enlace...
                    </Typography>
                </StyledCard>
            </Container>
        );
    }

    if (!valid) {
        return (
            <Container component="main" maxWidth="sm">
                <CssBaseline />
                <StyledCard>
                    <Alert severity="error">
                        El enlace de recuperación es inválido o ha expirado.
                    </Alert>
                    <Button
                        fullWidth
                        variant="contained"
                        sx={{ mt: 2 }}
                        onClick={() => navigate('/login')}
                    >
                        Volver al Login
                    </Button>
                </StyledCard>
            </Container>
        );
    }

    return (
        <Container component="main" maxWidth="sm">
            <CssBaseline />
            <StyledCard>
                <Typography component="h1" variant="h5">
                    Restablecer Contraseña
                </Typography>

                {success ? (
                    <Alert severity="success" sx={{ mt: 2, width: '100%' }}>
                        ¡Contraseña restablecida exitosamente! Serás redirigido al login.
                    </Alert>
                ) : (
                    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
                        {error && (
                            <Alert severity="error" sx={{ mb: 2 }}>
                                {error}
                            </Alert>
                        )}

                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            name="newPassword"
                            label="Nueva Contraseña"
                            type="password"
                            value={formData.newPassword}
                            onChange={handleChange}
                            autoFocus
                        />
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            name="confirmPassword"
                            label="Confirmar Contraseña"
                            type="password"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                        />
                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            sx={{ mt: 3, mb: 2 }}
                            disabled={loading}
                        >
                            {loading ? <CircularProgress size={24} /> : 'Restablecer Contraseña'}
                        </Button>
                    </Box>
                )}
            </StyledCard>
        </Container>
    );
}