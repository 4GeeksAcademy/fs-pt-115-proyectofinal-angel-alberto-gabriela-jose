
import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Typography, Alert, CircularProgress } from '@mui/material';



const ForgotPassword = ({ open, handleClose }) => {
    const [email, setEmail] = useState('');
    const [emailError, setEmailError] = useState(false);
    const [emailErrorMessage, setEmailErrorMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const validateEmail = () => {
        if (!email || !/\S+@\S+\.\S+/.test(email)) {
            setEmailError(true);
            setEmailErrorMessage('Ingresa un email válido');
            return false;
        }
        setEmailError(false);
        setEmailErrorMessage('');
        return true;
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!validateEmail()) {
            return;
        }

        setLoading(true);
        setError('');

        try {
            const backendUrl = import.meta.env.VITE_BACKEND_URL;
            const response = await fetch(`${backendUrl}/api/forgot-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            if (response.ok) {
                setSuccess(true);
            } else {
                const errorData = await response.json().catch(() => ({ msg: 'Error del servidor' }));

                setError(errorData.msg || 'Error al enviar el email de recuperación');
            }
        } catch (error) {
            console.error('Error:', error);
            setError('Error de conexión');
        } finally {
            setLoading(false);
        }
    };
    const handleReset = () => {
        setEmail('');
        setEmailError(false);
        setEmailErrorMessage('');
        setError('');
        setSuccess(false);
        handleClose();
    };
    return (
        <Dialog open={open} onClose={handleReset} maxWidth="sm" fullWidth>
            <DialogTitle>
                <Typography variant="h6" component="div">
                    Recuperar Contraseña
                </Typography>
            </DialogTitle>

            <form onSubmit={handleSubmit}>
                <DialogContent>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                        Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña.
                    </Typography>

                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}

                    {success ? (
                        <Alert severity="success" sx={{ mb: 2 }}>
                            ¡Email enviado! Revisa tu bandeja de entrada para restablecer tu contraseña.
                        </Alert>
                    ) : (
                        <TextField
                            autoFocus
                            margin="dense"
                            id="recovery-email"
                            label="Email"
                            type="email"
                            fullWidth
                            variant="outlined"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            error={emailError}
                            helperText={emailErrorMessage}
                            disabled={loading}
                        />
                    )}
                </DialogContent>

                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={handleReset} disabled={loading}>
                        {success ? 'Cerrar' : 'Cancelar'}
                    </Button>
                    {!success && (
                        <Button
                            type="submit"
                            variant="contained"
                            disabled={loading || success}
                        >
                            {loading ? <CircularProgress size={24} /> : 'Enviar Enlace'}
                        </Button>
                    )}
                </DialogActions>
            </form>
        </Dialog>
    );
};

export default ForgotPassword;
