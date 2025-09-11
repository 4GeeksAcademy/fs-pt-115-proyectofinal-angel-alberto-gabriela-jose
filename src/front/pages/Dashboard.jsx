import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Button, Container, CircularProgress, Alert } from '@mui/material';
import ShareIcon from '@mui/icons-material/Share';
import { GestionHogar } from '../components/GestionHogar';
import { CalendarioSemanal } from '../components/CalendarioSemanal';

export const Dashboard = () => {
    const [hogar, setHogar] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('authToken');
            const hogarRes = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/hogar`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (!hogarRes.ok) throw new Error('Error al obtener datos del hogar.');

            const hogarData = await hogarRes.json();
            setHogar(hogarData);

            if (hogarData) {
                const [tasksRes, membersRes] = await Promise.all([
                    fetch(`${import.meta.env.VITE_BACKEND_URL}/api/tasks/hogar`, { headers: { 'Authorization': `Bearer ${token}` } }),
                    fetch(`${import.meta.env.VITE_BACKEND_URL}/api/hogar/miembros`, { headers: { 'Authorization': `Bearer ${token}` } }),
                ]);
                if (!tasksRes.ok) throw new Error('Error al cargar las tareas.');
                if (!membersRes.ok) throw new Error('Error al cargar los miembros.');
                setTasks(await tasksRes.json());
                setMembers(await membersRes.json());
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleTaskUpdate = (taskId, newDate) => {
        const originalTasks = [...tasks];
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, fecha_asignacion: newDate } : t));
        const token = localStorage.getItem('authToken');
        fetch(`${import.meta.env.VITE_BACKEND_URL}/api/tasks/${taskId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ fecha_asignacion: newDate })
        }).catch(err => {
            setError(err.message);
            setTasks(originalTasks);
        });
    };

    const handleTaskCreate = async (title) => {
        const token = localStorage.getItem('authToken');
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/tasks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ title })
        });
        if (!res.ok) {
            const errData = await res.json();
            setError(errData.msg || "Error al crear tarea.");
            throw new Error(errData.msg);
        }
        const newTask = await res.json();
        setTasks(prev => [...prev, newTask]);
    };

    const handleShare = () => {
        navigator.clipboard.writeText(hogar.invitation_link);
        alert('Enlace de invitación copiado. ¡Compártelo para que otros se unan a tu hogar!');
    };

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}><CircularProgress size={60} /></Box>;

    return (
        <Box sx={{
            minHeight: 'calc(100vh - 64px)',
            p: 2,
            background: 'linear-gradient(to bottom right, #f8efff, #e7d8ff)'
        }}>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            {hogar ? (
                <Container maxWidth="xl">
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: '#4d2c91' }}>
                            {hogar.nombre}
                        </Typography>
                        <Button variant="contained" startIcon={<ShareIcon />} onClick={handleShare} size="large">
                            Compartir Hogar
                        </Button>
                    </Box>
                    <CalendarioSemanal
                        tasks={tasks}
                        members={members}
                        onTaskUpdate={handleTaskUpdate}
                        onTaskCreate={handleTaskCreate}
                    />
                    /</Container>
            ) : (
                <GestionHogar onHogarChange={fetchData} />
            )}
        </Box>
    );
};