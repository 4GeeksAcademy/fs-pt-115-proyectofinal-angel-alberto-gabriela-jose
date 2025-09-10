import React, { useState, useEffect } from 'react';
import { Box, Typography, TextField, Button, List, ListItem, ListItemText, IconButton, Checkbox, Paper, CircularProgress, Alert } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import { GestionHogar } from '../components/GestionHogar';

export const Tareas = () => {
    const [tasks, setTasks] = useState([]);
    const [newTaskTitle, setNewTaskTitle] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [user, setUser] = useState(null);

    // Cargar datos del usuario al iniciar
    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (userData) {
            setUser(JSON.parse(userData));
        } else {
            setError("No se encontraron datos de usuario. Por favor, inicie sesión de nuevo.");
            setLoading(false);
        }
    }, []);

    // Cargar tareas del hogar (solo si el usuario tiene un hogar)
    useEffect(() => {
        if (!user || !user.casa_id) {
            setLoading(false); // Si no hay hogar, no hay nada que cargar
            return;
        }

        const fetchTasks = async () => {
            setLoading(true);
            setError(null);
            try {
                const token = localStorage.getItem('authToken');
                const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/tasks/${user.casa_id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (!response.ok) throw new Error('No se pudieron cargar las tareas.');

                const data = await response.json();
                setTasks(data);
            } catch (error) {
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchTasks();
    }, [user]); // Se ejecuta si el objeto de usuario cambia


    const handleAddTask = async () => {
        if (!newTaskTitle.trim()) return;
        setError(null);
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/tasks`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ title: newTaskTitle })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.msg || 'Error al crear la tarea.');
            }
            const newTask = await response.json();
            setTasks([...tasks, newTask]);
            setNewTaskTitle("");
        } catch (error) {
            setError(error.message);
        }
    };

    const handleToggleTask = async (task) => {
        const newStatus = task.estado === 'completada' ? 'pendiente' : 'completada';
        setError(null);
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/tasks/${task.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ estado: newStatus })
            });
            if (!response.ok) throw new Error('No se pudo actualizar la tarea.');

            const updatedTask = await response.json();
            setTasks(tasks.map(t => t.id === task.id ? updatedTask : t));
        } catch (error) {
            setError(error.message);
        }
    };

    const handleDeleteTask = async (taskId) => {
        setError(null);
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/tasks/${taskId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('No se pudo eliminar la tarea.');

            setTasks(tasks.filter(t => t.id !== taskId));
        } catch (error) {
            setError(error.message);
        }
    };

    // Callback para actualizar el usuario cuando se crea un hogar
    const handleHomeCreated = (updatedUser) => {
        setUser(updatedUser);
    };

    // --- Lógica de renderizado ---
    if (loading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
    }

    // Si el usuario no tiene casa_id, muestra el componente para crear/unirse a un hogar
    if (user && !user.casa_id) {
        return <GestionHogar onHomeCreated={handleHomeCreated} />;
    }

    return (
        <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 800, margin: 'auto' }}>
            <Typography variant="h4" gutterBottom>
                Gestión de Tareas del Hogar
            </Typography>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <TextField
                        fullWidth
                        label="Nueva tarea..."
                        variant="outlined"
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddTask()}
                    />
                    <Button
                        variant="contained"
                        onClick={handleAddTask}
                        startIcon={<AddCircleOutlineIcon />}
                    >
                        Añadir
                    </Button>
                </Box>
            </Paper>
            <List>
                {tasks.map(task => (
                    <ListItem
                        key={task.id}
                        secondaryAction={
                            <IconButton edge="end" aria-label="delete" onClick={() => handleDeleteTask(task.id)}>
                                <DeleteIcon />
                            </IconButton>
                        }
                        sx={{ bgcolor: 'background.paper', mb: 1, borderRadius: 2, boxShadow: 1, textDecoration: task.estado === 'completada' ? 'line-through' : 'none', opacity: task.estado === 'completada' ? 0.6 : 1 }}
                    >
                        <Checkbox
                            edge="start"
                            checked={task.estado === 'completada'}
                            tabIndex={-1}
                            disableRipple
                            onClick={() => handleToggleTask(task)}
                        />
                        <ListItemText primary={task.title} secondary={task.description || ''} />
                    </ListItem>
                ))}
            </List>
        </Box>
    );
};
