import React, { useState } from 'react';
import { Box, Typography, TextField, Button, Paper, CircularProgress, Alert, Tabs, Tab, Container, Avatar } from '@mui/material'; // <-- Se añadió Avatar aquí
import HomeWorkIcon from '@mui/icons-material/HomeWork';

export const GestionHogar = ({ onHogarChange }) => {
    const [tab, setTab] = useState(0);
    const [nombreHogar, setNombreHogar] = useState("");
    const [invitationLink, setInvitationLink] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    const handleAction = async () => {
        setLoading(true);
        setError(null);
        setSuccess(null);
        const isCreating = tab === 0;
        const endpoint = isCreating ? '/api/hogar/create' : '/api/hogar/join';
        const body = isCreating ? { nombre: nombreHogar } : { invitation_link: invitationLink };

        if ((isCreating && !nombreHogar.trim()) || (!isCreating && !invitationLink.trim())) {
            setError("Por favor, completa el campo requerido.");
            setLoading(false);
            return;
        }

        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(body)
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.msg || "Ocurrió un error.");

            setSuccess(isCreating ? `Hogar "${data.nombre}" creado.` : `Te has unido a "${data.nombre}".`);
            onHogarChange(); // para hacer el refetch, si alguien me lee esto no crea una actualizacion pesimista? 
            setNombreHogar("");
            setInvitationLink("");
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container component="main" maxWidth="sm" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 64px)' }}>
            <Paper
                elevation={6}
                sx={{
                    p: { xs: 3, md: 5 },
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    borderRadius: '16px',
                    width: '100%'
                }}
            >
                <Avatar sx={{ m: 1, bgcolor: 'secondary.main', width: 56, height: 56 }}>
                    <HomeWorkIcon fontSize="large" />
                </Avatar>
                <Typography component="h1" variant="h4" sx={{ mt: 2, mb: 1 }}>
                    Organiza tu Hogar
                </Typography>
                <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 3 }}>
                    Crea un espacio para tu familia o únete a uno existente con un enlace de invitación.
                </Typography>

                <Box sx={{ width: '100%' }}>
                    <Tabs value={tab} onChange={(e, newValue) => setTab(newValue)} centered variant="fullWidth">
                        <Tab label="Crear Hogar" />
                        <Tab label="Unirse con Enlace" />
                    </Tabs>
                </Box>

                <Box component="form" onSubmit={(e) => { e.preventDefault(); handleAction(); }} sx={{ width: '100%', mt: 3 }}>
                    {error && <Alert severity="error" sx={{ mb: 2, width: '100%' }}>{error}</Alert>}
                    {success && <Alert severity="success" sx={{ mb: 2, width: '100%' }}>{success}</Alert>}

                    <Box sx={{ display: tab === 0 ? 'block' : 'none', width: '100%' }}>
                        <TextField fullWidth label="Nombre de tu nuevo hogar" variant="outlined" value={nombreHogar} onChange={(e) => setNombreHogar(e.target.value)} margin="normal" />
                    </Box>
                    <Box sx={{ display: tab === 1 ? 'block' : 'none', width: '100%' }}>
                        <TextField fullWidth label="Pega aquí el enlace de invitación" variant="outlined" value={invitationLink} onChange={(e) => setInvitationLink(e.target.value)} margin="normal" />
                    </Box>

                    <Button fullWidth variant="contained" type="submit" disabled={loading} sx={{ mt: 3, mb: 2, py: 1.5 }}>
                        {loading ? <CircularProgress size={24} color="inherit" /> : (tab === 0 ? 'Crear mi Hogar' : 'Unirme al Hogar')}
                    </Button>
                </Box>
            </Paper>
        </Container>
    );
};