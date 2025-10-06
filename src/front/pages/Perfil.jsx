import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Avatar, Divider, Button, List, ListItemIcon, ListItemText,
    Dialog, DialogTitle, DialogContent, TextField, DialogActions, Snackbar, Alert,
    CircularProgress, ListItemButton
} from '@mui/material';
import useGlobalReducer from '../hooks/useGlobalReducer';
import PersonIcon from '@mui/icons-material/Person';
import LockResetIcon from '@mui/icons-material/LockReset';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import { useNavigate } from 'react-router-dom';

export const Profile = () => {
    const { store, dispatch } = useGlobalReducer();
    const navigate = useNavigate();
    const { user } = store.auth;
    const [openEdit, setOpenEdit] = useState(false);
    const [openPassword, setOpenPassword] = useState(false);
    const [name, setName] = useState(user ? user.nombre : '');
    const [passwords, setPasswords] = useState({ old_password: '', new_password: '' });
    const [loading, setLoading] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    useEffect(() => {
        const loadProfile = async () => {
            const token = localStorage.getItem('token');
            try {
                const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/profile`, {
                    method: 'GET',
                    headers: { 'Authorization': `Bearer ${token}` },
                });
                if (response.ok) {
                    const userData = await response.json();
                    setName(userData.nombre);
                }
            } catch (error) {
                console.error('Error cargando perfil:', error);
            }
        };

        if (user) {
            loadProfile();
        }
    }, [user]);

    // --- FUNCIONES QUE FALTABAN ---
    const handleOpenEdit = () => {
        setName(user.nombre);
        setOpenEdit(true);
    };

    const handleUpdateProfile = async () => {
        setLoading(true);
        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/profile`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ nombre: name }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.msg || 'Error al actualizar');

            dispatch({ type: 'LOGIN_SUCCESS', payload: { token, user: data.user } });
            setSnackbar({ open: true, message: 'Perfil actualizado con éxito', severity: 'success' });
            setOpenEdit(false);
        } catch (error) {
            setSnackbar({ open: true, message: error.message, severity: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async () => {
        setLoading(true);
        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/profile/password`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(passwords),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.msg || 'Error al cambiar la contraseña');

            setSnackbar({ open: true, message: 'Contraseña cambiada con éxito', severity: 'success' });
            setOpenPassword(false);
            setPasswords({ old_password: '', new_password: '' });
        } catch (error) {
            setSnackbar({ open: true, message: error.message, severity: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (window.confirm('¿Estás seguro? Esta acción es irreversible y eliminará todos tus datos.')) {
            setLoading(true);
            const token = localStorage.getItem('token');
            try {
                const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/profile`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` },
                });
                if (!response.ok) throw new Error('No se pudo eliminar la cuenta.');

                dispatch({ type: 'LOGOUT' });
                navigate('/');

            } catch (error) {
                setSnackbar({ open: true, message: error.message, severity: 'error' });
                setLoading(false);
            }
        }
    };

    const handleCloseSnackbar = () => setSnackbar({ ...snackbar, open: false });
    // --- FIN DE LAS FUNCIONES QUE FALTABAN ---

    if (!user) {
        return <Typography>Por favor, inicia sesión para ver tu perfil.</Typography>;
    }

    return (
        <Box sx={{ maxWidth: 800, mx: 'auto', mt: 4 }}>
            <Paper elevation={3} sx={{ p: { xs: 2, md: 4 }, borderRadius: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <Avatar sx={{ width: 80, height: 80, mr: 3, bgcolor: 'primary.main' }}>
                        <Typography variant="h3">{user.nombre.charAt(0).toUpperCase()}</Typography>
                    </Avatar>
                    <div>
                        <Typography variant="h4" gutterBottom>{user.nombre}</Typography>
                        <Typography variant="body1" color="text.secondary">{user.email}</Typography>
                    </div>
                </Box>
                <Divider sx={{ my: 3 }} />

                <Typography variant="h6" gutterBottom>Configuración de la cuenta</Typography>

                <List>
                    <ListItemButton onClick={handleOpenEdit}>
                        <ListItemIcon><PersonIcon /></ListItemIcon>
                        <ListItemText primary="Editar información personal" />
                    </ListItemButton>
                    <ListItemButton onClick={() => setOpenPassword(true)}>
                        <ListItemIcon><LockResetIcon /></ListItemIcon>
                        <ListItemText primary="Cambiar contraseña" />
                    </ListItemButton>
                </List>

                <Divider sx={{ my: 3 }} />

                <Typography variant="h6" gutterBottom color="error">Zona de peligro</Typography>
                <Box sx={{ p: 2, border: '1px solid', borderColor: 'error.main', borderRadius: 2 }}>
                    <Typography color="text.secondary" sx={{ mb: 2 }}>
                        La eliminación de tu cuenta es una acción irreversible. Se borrarán todos tus datos personales y de tu hogar.
                    </Typography>
                    <Button
                        variant="contained"
                        color="error"
                        startIcon={<DeleteForeverIcon />}
                        onClick={handleDeleteAccount}
                        disabled={loading}
                    >
                        {loading ? <CircularProgress size={24} /> : 'Eliminar mi cuenta'}
                    </Button>
                </Box>
            </Paper>

            {/* Modal para Editar Perfil */}
            <Dialog open={openEdit} onClose={() => setOpenEdit(false)}>
                <DialogTitle>Editar Perfil</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Nombre completo"
                        type="text"
                        fullWidth
                        variant="standard"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenEdit(false)}>Cancelar</Button>
                    <Button onClick={handleUpdateProfile} disabled={loading}>
                        {loading ? <CircularProgress size={24} /> : 'Guardar'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Modal para Cambiar Contraseña */}
            <Dialog open={openPassword} onClose={() => setOpenPassword(false)}>
                <DialogTitle>Cambiar Contraseña</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Contraseña Actual"
                        type="password"
                        fullWidth
                        variant="standard"
                        value={passwords.old_password}
                        onChange={(e) => setPasswords({ ...passwords, old_password: e.target.value })}
                    />
                    <TextField
                        margin="dense"
                        label="Nueva Contraseña"
                        type="password"
                        fullWidth
                        variant="standard"
                        value={passwords.new_password}
                        onChange={(e) => setPasswords({ ...passwords, new_password: e.target.value })}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenPassword(false)}>Cancelar</Button>
                    <Button onClick={handleChangePassword} disabled={loading}>
                        {loading ? <CircularProgress size={24} /> : 'Cambiar'}
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar}>
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default Profile;