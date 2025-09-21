import React, { useState } from 'react';
import { Button, Alert, Box, Typography, Card, CircularProgress } from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';

const TestEmail = () => {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);

    const sendTestEmail = async () => {
        setLoading(true);
        setResult(null);

        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                setResult({ type: 'error', message: 'No hay token de autenticación. Inicia sesión nuevamente.' });
                return;
            }


            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/send-test-email`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (response.ok) {
                setResult({ type: 'success', message: data.msg });
            } else {
                setResult({ type: 'error', message: data.msg || 'Error del servidor' });
            }
        } catch (error) {
            setResult({ type: 'error', message: 'Error de conexión: ' + error.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card sx={{ p: 3, mb: 3, background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}>
            <Typography variant="h6" gutterBottom color="primary">
                Probador de Email
            </Typography>
            <Box sx={{ p: 2 }}>
                <Button
                    variant="contained"
                    startIcon={loading ? <CircularProgress size={20} /> : <EmailIcon />}
                    onClick={sendTestEmail}
                    disabled={loading}
                    sx={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        '&:hover': {
                            background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                        }
                    }}
                >
                    {loading ? 'Enviando...' : 'Enviar Email de prueba'}
                </Button>

                {result && (
                    <Alert severity={result.type} sx={{ mt: 2 }}>
                        {result.message}
                    </Alert>
                )}

                <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
                    Se enviará un email de prueba a tu dirección de correo registrada.
                </Typography>


                <Typography variant="caption" sx={{ mt: 1, color: 'grey.500', display: 'block' }}>
                    Endpoint: {import.meta.env.VITE_BACKEND_URL}/api/send-test-email
                </Typography>
            </Box>
        </Card>
    );
};

export default TestEmail;