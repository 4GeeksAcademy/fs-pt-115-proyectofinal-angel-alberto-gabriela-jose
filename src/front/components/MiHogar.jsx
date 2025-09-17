import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Paper, CircularProgress, Alert, TextField, Tooltip } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

export const MiHogar = () => {
    const [hogar, setHogar] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [copied, setCopied] = useState(false);

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

    if (loading) return <CircularProgress />;
    if (error) return <Alert severity="warning">{error}</Alert>;
    // El Dashboard decidirá si mostrar este componente o el de GestionHogar
    if (!hogar) return null; 

    return (
        <Paper elevation={3} sx={{ p: 3, mt: 4, borderRadius: 3 }}>
            <Typography variant="h5" gutterBottom>
                Panel de Mi Hogar: {hogar.nombre}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                Invita a otros a unirse a tu hogar compartiendo este enlace único.
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TextField 
                    fullWidth 
                    variant="outlined" 
                    value={hogar.invitation_link || ''} 
                    InputProps={{
                        readOnly: true,
                    }}
                    label="Enlace de Invitación"
                />
                <Tooltip title={copied ? "¡Copiado!" : "Copiar enlace"} placement="top">
                    <Button variant="contained" onClick={handleCopy} sx={{ minWidth: 'auto', p: 1.5 }}>
                        <ContentCopyIcon />
                    </Button>
                </Tooltip>
            </Box>
        </Paper>
    );
};