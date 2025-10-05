import React, { useState, useEffect, useRef, useCallback } from "react";
import {
    Container, Typography, CircularProgress, Alert, Box, useTheme,
    Grid, Card, CardContent, List, ListItem, ListItemText, Stack, Avatar, LinearProgress, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, IconButton
} from "@mui/material";
import { GestionHogar } from './GestionHogar';
import { MiHogar } from './MiHogar';
import useGlobalReducer from '../hooks/useGlobalReducer';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import RedeemIcon from '@mui/icons-material/Redeem';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import {
    draggable,
    dropTargetForElements
} from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { reorder } from '@atlaskit/pragmatic-drag-and-drop/reorder';
import { DragIndicator } from "@mui/icons-material";
import '../styles/dashboard.css';


// --- Sub-componentes del Dashboard ---

const StatCard = ({ icon, title, value, color }) => (
    <Card className="dashboard-card-hover dashboard-stat-hober" sx={{ display: 'flex', alignItems: 'center', p: 2, borderRadius: 3, height: '100%', boxShadow: 3 }}>
        <Avatar className="dashboard-avatar-hover" sx={{ bgcolor: `${color}.light`, color: `${color}.dark`, width: 56, height: 56, mr: 2 }}>{icon}</Avatar>
        <Box>
            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>{value}</Typography>
            <Typography variant="body2" color="text.secondary">{title}</Typography>
        </Box>
    </Card>
);

const RankingTable = ({ ranking, currentUser }) => (
    <Card className="dashboard-card-hover" sx={{ borderRadius: 3, p: 2, height: '100%', boxShadow: 3 }}>
        <Typography variant="h6" gutterBottom>🏆 Ranking del Hogar</Typography>
        <List dense>
            {ranking.map((user, index) => (
                <ListItem key={user.usuario_id} className="dashboard-list-item" sx={{ bgcolor: user.usuario_actual ? 'action.hover' : 'transparent', borderRadius: 2, mb: 1 }}>
                    <Typography className={index === 0 ? 'dashboard-rank-1' : index === 1 ? 'dashboard-rank-2' : index === 2 ? 'dashboard-rank-3' : ''} sx={{ mr: 2, fontWeight: 'bold' }}>#{index + 1}</Typography>
                    <ListItemText primary={user.nombre} secondary={`⭐ ${user.puntos} puntos`} />
                </ListItem>
            ))}
        </List>
    </Card>
);

const RecentTasks = ({ tasks }) => (
    <Card className="dashboard-card-hover" sx={{ borderRadius: 3, p: 2, height: '100%', boxShadow: 3 }}>
        <Typography variant="h6" gutterBottom>📝 Tareas Recientes</Typography>
        {tasks.length > 0 ? (
            <List dense>
                {tasks.map((task, index) => (
                    <ListItem key={task.id} className="dashboard-fade-in" sx={{ animationDelay: `${index * 0.1}s` }}>
                        <ListItemText primary={task.title} secondary={`Asignada a: ${task.asignado_a_nombre || 'Nadie'}`} /></ListItem>
                ))}
            </List>
        ) : <Typography color="text.secondary">No hay tareas recientes.</Typography>}
    </Card>
);

const MemberManagement = ({ currentUser }) => {
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [currentUserToEdit, setCurrentUserToEdit] = useState(null);
    const [editedValues, setEditedValues] = useState({ ingresos: 0, meta: 0 });

    const fetchMembers = async () => {
        setLoading(true); setError(null);
        const token = localStorage.getItem('token');
        if (!token) { setError("No autenticado."); setLoading(false); return; }
        try {
            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/hogar/miembros`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (!res.ok) throw new Error('No se pudo cargar los miembros.');
            setMembers(await res.json());
        } catch (err) { setError(err.message); } finally { setLoading(false); }
    };
    useEffect(() => { fetchMembers(); }, []);

    const handleDelete = async (userId) => {
        if (!window.confirm('¿Seguro que quieres eliminar a este miembro?')) return;
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/hogar/miembros/${userId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
            if (!res.ok) throw new Error((await res.json()).msg || 'Error al eliminar.');
            fetchMembers();
        } catch (err) { setError(err.message); }
    };
    const handleOpenEditModal = (user) => { setCurrentUserToEdit(user); setEditedValues({ ingresos: user.ingresos || 0, meta: user.meta || 0 }); setEditModalOpen(true); };
    const handleCloseEditModal = () => setEditModalOpen(false);
    const handleSaveChanges = async () => {
        if (!currentUserToEdit) return;
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/hogar/miembros/${currentUserToEdit.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(editedValues) });
            if (!res.ok) throw new Error((await res.json()).msg || 'Error al actualizar.');
            fetchMembers();
            handleCloseEditModal();
        } catch (err) { setError(err.message); }
    };

    if (loading) return <CircularProgress />;
    if (error) return <Alert severity="error">{error}</Alert>;

    return <>
        <Card className="dashboard-card-hover" sx={{ borderRadius: 3, p: 2, boxShadow: 3 }}>
            <Typography variant="h6" gutterBottom>👥 Miembros del Hogar</Typography>
            <List>
                {members.map(member => (
                    <ListItem key={member.id} className="dashboard-list-item" secondaryAction={currentUser?.role === 'admin' && currentUser.id !== member.id && (
                        <Stack direction="row" spacing={1}>
                            <Button variant="outlined" size="small" startIcon={<EditIcon />} onClick={() => handleOpenEditModal(member)}>Editar</Button>
                            <Button variant="outlined" size="small" color="error" startIcon={<DeleteIcon />} onClick={() => handleDelete(member.id)}>Borrar</Button>
                        </Stack>
                    )}>
                        <ListItemText primary={member.nombre} secondary={member.email} />
                    </ListItem>
                ))}
            </List>
        </Card>
        <Dialog open={editModalOpen} onClose={handleCloseEditModal}><DialogTitle>Editar Miembro</DialogTitle><DialogContent><Typography>Editando a {currentUserToEdit?.nombre}</Typography><TextField autoFocus margin="dense" id="ingresos" label="Ingresos" type="number" fullWidth variant="standard" value={editedValues.ingresos} onChange={(e) => setEditedValues({ ...editedValues, ingresos: e.target.value })} /><TextField margin="dense" id="meta" label="Meta de Ahorro" type="number" fullWidth variant="standard" value={editedValues.meta} onChange={(e) => setEditedValues({ ...editedValues, meta: e.target.value })} /></DialogContent><DialogActions><Button onClick={handleCloseEditModal}>Cancelar</Button><Button onClick={handleSaveChanges} variant="contained">Guardar</Button></DialogActions></Dialog>
    </>;
};

const DraggableWidget = ({ id, onReorder, children }) => {
    const ref = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isDraggedOver, setIsDraggedOver] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const cleanupDraggable = draggable({ element: el, getInitialData: () => ({ id }), onDragStart: () => setIsDragging(true), onDrop: () => setIsDragging(false) });
        const cleanupDropTarget = dropTargetForElements({ element: el, getData: () => ({ id }), onDragEnter: () => setIsDraggedOver(true), onDragLeave: () => setIsDraggedOver(false), onDrop: ({ source }) => onReorder(source.data.id, id) });

        return () => { cleanupDraggable(); cleanupDropTarget(); };
    }, [id, onReorder]);

    return (
        <Grid item xs={12} ref={ref} sx={{ opacity: isDragging ? 0.4 : 1, p: 1, backgroundColor: isDraggedOver ? 'action.hover' : 'transparent', borderRadius: 4, transition: 'background-color 0.2s ease-in-out' }}>
            <Box sx={{ position: 'relative' }}>
                <Box sx={{ position: 'absolute', top: 16, right: 16, cursor: 'grab', color: 'text.disabled', zIndex: 1, '&:hover': { color: 'text.primary' } }}><DragIndicator /></Box>
                {children}
            </Box>
        </Grid>
    );
};

function Dashboard() {
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { store } = useGlobalReducer();
    const [openModal, setOpenModal] = useState(false);
    const [nuevoNombre, setNuevoNombre] = useState("");
    const { dataUpdatedToggle } = store;
    const [layout, setLayout] = useState(() => {
        try {
            const savedLayout = localStorage.getItem('dashboardLayout_v2');
            return savedLayout ? JSON.parse(savedLayout) : ['stats', 'mainContent', 'sideContent'];
        } catch { return ['stats', 'mainContent', 'sideContent']; }
    });

    useEffect(() => { localStorage.setItem('dashboardLayout_v2', JSON.stringify(layout)); }, [layout]);

    const handleReorder = useCallback((sourceId, destinationId) => {
        if (sourceId === destinationId) return;
        setLayout(currentLayout => {
            const startIndex = currentLayout.indexOf(sourceId);
            const finishIndex = currentLayout.indexOf(destinationId);
            return reorder({ list: currentLayout, startIndex, finishIndex });
        });
    }, []);

    const fetchData = async () => {
        setLoading(true); setError(null);
        const token = localStorage.getItem('token');
        if (!token) { setLoading(false); return; }
        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/dashboard`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (!response.ok) {
                if (response.status === 404 || (response.status === 200 && (await response.clone().json()) === null)) { setDashboardData({ hogar: null }); return; }
                throw new Error((await response.json()).msg || 'Error al cargar los datos.');
            }
            setDashboardData(await response.json());
        } catch (err) { setError(err.message); } finally { setLoading(false); }
    };
    useEffect(() => { fetchData(); }, []);


    const updateNombreHogar = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/hogar`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ nombre: nuevoNombre })
            });

            if (response.ok) {
                const data = await response.json();

                setDashboardData(prev => ({
                    ...prev,
                    hogar: data.hogar
                }));
                setOpenModal(false);
                setNuevoNombre("");
            } else {
                const err = await response.json();
                alert(`Error: ${err.msg}`);
            }
        } catch (error) {
            alert("No se pudo actualizar el nombre del hogar.");
        }
    };


    const handleOpenModal = () => {
        if (dashboardData?.hogar) {
            setNuevoNombre(dashboardData.hogar.nombre);
            setOpenModal(true);
        }
    };

    if (loading) return <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh" }}><CircularProgress /></Box>;
    if (error) return <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>;
    if (!dashboardData?.hogar) return <GestionHogar onHogarChange={fetchData} />;

    const { user, hogar, stats, ranking, tareas_recientes, metas_hogar } = dashboardData;

    const widgets = {
        stats: (
            <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={3}><StatCard icon={<EmojiEventsIcon />} title="Mis Puntos" value={stats.puntos} color="warning" /></Grid>
                <Grid item xs={12} sm={6} md={3}><StatCard icon={<CheckCircleOutlineIcon />} title="Tareas Completadas" value={stats.tareas_completas} color="success" /></Grid>
                <Grid item xs={12} sm={6} md={3}><StatCard icon={<PendingActionsIcon />} title="Tareas Pendientes" value={stats.tareas_pendientes} color="info" /></Grid>
                <Grid item xs={12} sm={6} md={3}><StatCard icon={<RedeemIcon />} title="Recompensas Canjeadas" value={stats.recompensas_canjeadas} color="primary" /></Grid>
            </Grid>
        ),
        mainContent: (
            <Grid container spacing={3}>
                <Grid item xs={12} lg={8}>
                    <Stack spacing={3}>
                        {metas_hogar && metas_hogar.length > 0 && (
                            <Card className="dashboard-card-hover" sx={{ borderRadius: 3, p: 2, boxShadow: 3 }}>
                                <Typography variant="h6" gutterBottom>🎯 Metas del Hogar</Typography>
                                {metas_hogar.map(meta => (
                                    <Box key={meta.id} className="dashboard-slide-in" sx={{ mb: 2, animationDelay: `{index * 0.1}s` }}>
                                        <Typography variant="body1">{meta.title} - {meta.porcentaje_completado}%</Typography>
                                        <LinearProgress variant="determinate" value={meta.porcentaje_completado} sx={{
                                            height: 10, borderRadius: 5, '& .MuiLinearProgress-bar': {
                                                transition: 'transform 0.8s ease-in-out'
                                            }
                                        }}
                                        />
                                    </Box>
                                ))}
                            </Card>
                        )}
                        <MemberManagement currentUser={user} />
                    </Stack>
                </Grid>
                <Grid item xs={12} lg={4}>
                    <RecentTasks tasks={tareas_recientes} />
                </Grid>
            </Grid>
        ),
        sideContent: <RankingTable ranking={ranking} currentUser={user} />
    };

    return (
        <Container maxWidth="xl" sx={{ py: 4 }}>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
                    Bienvenido a {hogar.nombre}, {user.nombre}!
                </Typography>
                <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 2 }}>
                    Organiza los módulos a tu gusto arrastrándolos.
                </Typography>


                <Button
                    variant="outlined"
                    onClick={handleOpenModal}
                    sx={{ mr: 2 }}
                >
                    Cambiar nombre del hogar
                </Button>
            </Box>
            <Box className="dashboard-grid-container">
                <Grid container spacing={3}>
                    {layout.map(id => (
                        <DraggableWidget key={id} id={id} onReorder={handleReorder}>
                            {widgets[id]}
                        </DraggableWidget>
                    ))}
                </Grid>
            </Box>

            <MiHogar />


            <Dialog open={openModal} onClose={() => setOpenModal(false)}>
                <DialogTitle>Cambiar nombre del hogar</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Nuevo nombre"
                        type="text"
                        fullWidth
                        value={nuevoNombre}
                        onChange={(e) => setNuevoNombre(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenModal(false)}>Cancelar</Button>
                    <Button variant="contained" onClick={updateNombreHogar}>Guardar</Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
}

export default Dashboard;