import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Box, Typography, Paper, Avatar, Tooltip, Grid, Button, TextField } from '@mui/material';
import { dropTargetForElements, draggable } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';

// --- Helper para obtener los días de la semana (Lunes a Domingo) ---
const getWeekDays = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const startOfWeek = new Date(today);
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    startOfWeek.setDate(today.getDate() + diff);
    return Array.from({ length: 7 }).map((_, i) => {
        const day = new Date(startOfWeek);
        day.setDate(startOfWeek.getDate() + i);
        return day;
    });
};

// --- Componentes Internos del Tablero ---
const TaskCard = ({ task, members }) => {
    const ref = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const assignedUser = members.find(m => m.id === task.asignado_a);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        return draggable({
            element: el,
            getInitialData: () => ({ taskId: task.id }),
            onDragStart: () => setIsDragging(true),
            onDrop: () => setIsDragging(false)
        });
    }, [task]);

    return (
        <Paper
            ref={ref}
            elevation={isDragging ? 8 : 2}
            sx={{
                p: 1.5,
                mb: 1.5,
                opacity: isDragging ? 0.85 : 1,
                cursor: 'grab',
                transition: 'all 0.2s ease-in-out',
                transform: isDragging ? 'rotate(3deg) scale(1.05)' : 'none',
                bgcolor: isDragging ? 'primary.light' : 'background.paper'
            }}
        >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2">{task.title}</Typography>
                {assignedUser && <Tooltip title={assignedUser.nombre}><Avatar sx={{ width: 24, height: 24, fontSize: 12, bgcolor: 'secondary.main', color: 'white' }}>{assignedUser.nombre.charAt(0).toUpperCase()}</Avatar></Tooltip>}
            </Box>
        </Paper>
    );
};

const DropColumn = ({ id, title, subtitle, tasks, members }) => {
    const ref = useRef(null);
    const [isOver, setIsOver] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        return dropTargetForElements({
            element: el,
            getData: () => ({ id }),
            onDragEnter: () => setIsOver(true),
            onDragLeave: () => setIsOver(false),
            onDrop: () => setIsOver(false)
        });
    }, [id]);

    const bgColor = id === 'backlog' ? 'rgba(233, 232, 247, 0.5)' : 'rgba(252, 232, 240, 0.5)';
    const headerColor = id === 'backlog' ? '#673ab7' : '#d81b60';

    return (
        <Box ref={ref} sx={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: isOver ? 'rgba(0,0,0,0.08)' : bgColor, borderRadius: 3, transition: 'background-color 0.2s', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <Typography variant="h6" align="center" sx={{ p: 1.5, bgcolor: headerColor, color: 'white', borderTopLeftRadius: 'inherit', borderTopRightRadius: 'inherit', fontSize: '1rem', fontWeight: 'bold' }}>
                {title}
                {subtitle && <Box component="span" sx={{ display: 'block', fontSize: '0.75rem', fontWeight: 'normal' }}>{subtitle}</Box>}
            </Typography>
            <Box sx={{ flexGrow: 1, p: 1, overflowY: 'auto' }}>
                {tasks.map(task => <TaskCard key={task.id} task={task} members={members} />)}
            </Box>
        </Box>
    );
};

// --- Componente Principal del Calendario Semanal ---
export const CalendarioSemanal = ({ tasks, members, onTaskUpdate, onTaskCreate, error }) => {
    const [newTaskTitle, setNewTaskTitle] = useState("");
    const weekDays = getWeekDays();

    const handleDrop = useCallback(({ source, location }) => {
        const destination = location.current.dropTargets[0];
        if (!destination) return;
        const taskId = source.data.taskId;
        const newDate = destination.data.id === 'backlog' ? null : destination.data.id;
        onTaskUpdate(taskId, newDate);
    }, [onTaskUpdate]);

    useEffect(() => {
        return dropTargetForElements({ element: document.body, onDrop: handleDrop });
    }, [handleDrop]);

    const handleAddTask = async () => {
        if (!newTaskTitle.trim()) return;
        await onTaskCreate(newTaskTitle);
        setNewTaskTitle("");
    };

    const unscheduledTasks = tasks.filter(t => !t.fecha_asignacion);

    return (
        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <Grid container spacing={2} sx={{ flexGrow: 1 }}>
                <Grid item xs={12} md={3} sx={{ display: 'flex', flexDirection: 'column', gap: 2, height: { md: 'calc(100vh - 160px)' } }}>
                    <DropColumn id="backlog" title="Banco de Tareas" tasks={unscheduledTasks} members={members} />
                    <Paper sx={{ p: 2, borderRadius: 3, flexShrink: 0, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                        <Typography variant="h6" sx={{ mb: 1.5 }}>Añadir Tarea</Typography>
                        <TextField fullWidth label="Título de la nueva tarea" value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)} size="small" onKeyPress={(e) => e.key === 'Enter' && handleAddTask()} />
                        <Button fullWidth variant="contained" onClick={handleAddTask} startIcon={<AddCircleOutlineIcon />} sx={{ mt: 1.5 }}>Añadir al Banco</Button>
                    </Paper>
                </Grid>
                <Grid item xs={12} md={9}>
                    <Grid container spacing={1.5} sx={{ height: '100%' }}>
                        {weekDays.map(day => {
                            const dateString = day.toISOString().split('T')[0];
                            const dayTasks = tasks.filter(t => t.fecha_asignacion === dateString);
                            return (
                                <Grid item xs key={dateString} sx={{ height: 'calc(100vh - 160px)' }}>
                                    <DropColumn id={dateString} title={day.toLocaleDateString('es-ES', { weekday: 'long' })} tasks={dayTasks} members={members} />
                                </Grid>
                            );
                        })}
                    </Grid>
                </Grid>
            </Grid>
        </Box>
    );
};
