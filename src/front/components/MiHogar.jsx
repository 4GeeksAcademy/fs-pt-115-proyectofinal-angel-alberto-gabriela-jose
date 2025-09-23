import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Paper, CircularProgress, Alert, TextField, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, Snackbar } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import EmailIcon from '@mui/icons-material/Email';
export const MiHogar = () => {
    const [hogar, setHogar] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [copied, setCopied] = useState(false);
    const [emailDialogOpen, setEmailDialogOpen] = useState(false);
    const [email, setEmail] = useState('');
    const [sending, setSending] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    useEffect(() => {
        const fetchHogar = async () => {
            const token = localStorage.getItem('authToken');
            if (!token) {
                setError("No se encontró token de autenticación.");
                setLoading(false);
                return;
            }

            try {
                const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/hogar`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.status === 401) {
                    throw new Error('Sesión inválida. Por favor, inicia sesión de nuevo.');
                }
                if (!response.ok) {
                    const errorData = await response.json().catch(() => null);
                    // Si no hay hogar, el backend devuelve un 200 con `null`, no es un error.
                    if (response.status === 404 || !errorData) {
                        setHogar(null);
                        return;
                    }
                    throw new Error(errorData?.msg || 'No se pudo cargar la información del hogar.');
                }

                const data = await response.json();
                setHogar(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchHogar();
    }, []);

    const handleCopy = () => {
        if (hogar?.invitation_link) {
            navigator.clipboard.writeText(hogar.invitation_link);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000); // Reset tooltip after 2 seconds
        }
    };

    const handleSendEmail = async () => {
        if (!email || !hogar?.invitation_link) return;

        setSending(true);
        const token = localStorage.getItem('authToken');

        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/send-invitation`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: email,
                    invitation_link: hogar.invitation_link,
                    hogar_nombre: hogar.nombre
                })
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData?.msg || 'Error al enviar email');
            }
            setSnackbar({
                open: true,
                message: 'Invitación enviada correctamente',
                severity: 'success'
            });
            setEmailDialogOpen(false);
            setEmail('');
        } catch (error) {
            setSnackbar({
                open: true,
                message: error.message,
                severity: 'error'
            });
        } finally {
            setSending(false);
        }
    };
    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    }

    if (loading) return <CircularProgress />;
    if (error) return <Alert severity="warning">{error}</Alert>;
    // El Dashboard decidirá si mostrar este componente o el de GestionHogar
    if (!hogar) return null;

    return (
        <>
            <Paper elevation={3} sx={{ p: 3, mt: 4, borderRadius: 3 }}>
                <Typography variant="h5" gutterBottom>
                    Panel de Mi Hogar: {hogar.nombre}
                </Typography>
                <Button
                    variant="outlined"
                    startIcon={<EmailIcon />}
                    onClick={() => setEmailDialogOpen(true)}
                >
                    Enviar invitación por email
                </Button>
            </Paper>

            <Dialog open={emailDialogOpen} onClose={() => setEmailDialogOpen(false)}>
                <DialogTitle>Enviar invitación por email</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                        Introduce email del invitado a unirse a "{hogar.nombre}"
                    </Typography>
                    <TextField
                        autoFocus label="Email"
                        type="email"
                        fullWidth variant="outlined"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="email@email.com"
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleSendEmail}
                        disabled={sending || !email}
                        variant="contained"
                    >{sending ? <CircularProgress size={24} /> : 'Enviar invitacion'}
                    </Button>
                </DialogActions>
            </Dialog>
            <Snackbar
                open={Snackbar.open}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
            >
                <Alert
                    onclose={handleCloseSnackbar}
                    severity={snackbar.severity}
                    s={{ width: '100%' }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </>
    );
};