import React, { useState } from 'react';
import { Button, Alert, Box, Typography, Card } from '@mui/material';

const TestEmail = () => {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);

    const sendTestEmail = async () => {
        setLoading(true);
        setResult(null);

        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/email/send-test-email`, {
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
                setResult({ type: 'error', message: data.msg });
            }
        } catch (error) {
            setResult({ type: 'error', message: 'Error de conexión' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
                Probador Email
            </Typography>
            <Box sx={{ p: 2 }} >
                <Button
                    variant="contained"
                    onClick={sendTestEmail}
                    disabled={loading}
                >
                    {loading ? 'Enviando...' : 'Enviar Email de prueba'}
                </Button>
                {result && (
                    <Alert severity={result.type} sx={{ mt: 2 }}>
                        {result.message}
                    </Alert>
                )}
                <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
                    El botón enviará un email de prueba.
                </Typography>
            </Box>
        </Card>
    );
};

export default TestEmail;