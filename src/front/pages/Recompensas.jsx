import React, { useState, useEffect, useRef } from "react";
import {
  Container, Grid, Card, Typography, Button, Divider, List, ListItem, ListItemText, TextField, IconButton, MenuItem, Box, Modal,
  CardMedia, Fab, Paper, CircularProgress, Alert
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from '@mui/icons-material/Add';
import Tilt from 'react-parallax-tilt';
import cartaNormal from "../assets/img/carta2.png";
import cartaRara from "../assets/img/carta3.png";
import cartaEpica from "../assets/img/carta1.png";
import cartaLeyenda from "../assets/img/carta4.png";
import chimeSound from "../assets/sounds/chime.mp3";

// --- API helper ---
const apiRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    ...options
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.msg || 'Error en la solicitud');
  }

  return response.json();
};

const emojiList = ['🎮', '❤️', '⭐', '🔥', '🚀', '🎉', '🏆', '📚', '🐾', '🍕', '🍽️', '👑', '🛋️'];

const getTier = (costo) => {
  if (costo >= 100) return { name: 'LEYENDA', color: '#ffc107', imagen: cartaLeyenda };
  if (costo >= 60) return { name: 'ÉPICA', color: '#9c27b0', imagen: cartaEpica };
  if (costo >= 40) return { name: 'RARA', color: '#2196f3', imagen: cartaRara };
  return { name: 'NORMAL', color: '#4caf50', imagen: cartaNormal };
};

// --- Componente de Carta ---
const RewardCard = ({ recompensa, onCanjear, onDelete, isPreview = false, usuarioActivo, usuarios }) => {
  const tier = getTier(recompensa.costo || recompensa.costo_puntos || 0);
  const usuario = usuarios?.find(u => u.id === usuarioActivo);
  const puntosUsuario = usuario?.puntos || 0;
  const costoRecompensa = recompensa.costo || recompensa.costo_puntos || 0;
  const puedeCanjear = usuarioActivo && puntosUsuario >= costoRecompensa;

  return (
    <Tilt tiltMaxAngleX={7} tiltMaxAngleY={7} glareEnable={true} glareMaxOpacity={0.15} scale={1.05}>
      <Card sx={{
        width: '100%',
        height: 450,
        borderRadius: '16px',
        overflow: 'hidden',
        position: 'relative',
        color: 'white',
        boxShadow: `0 10px 30px -5px rgba(0,0,0,0.5)`,
      }}>
        <CardMedia
          component="img"
          image={tier.imagen}
          sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <Box sx={{
          position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
          background: 'linear-gradient(to top, rgba(0,0,0,0.95) 25%, rgba(0,0,0,0.1) 60%)'
        }} />
        <Box sx={{
          position: 'relative', zIndex: 2, height: '100%',
          display: 'flex', flexDirection: 'column', padding: '16px',
          justifyContent: 'flex-end',
          textAlign: 'center'
        }}>
          <Box sx={{
            position: 'absolute', top: 16, right: -30,
            backgroundColor: tier.color,
            px: 4, py: 0.5,
            transform: 'rotate(45deg)',
            boxShadow: '0 0 10px rgba(0,0,0,0.5)'
          }}>
            <Typography variant="caption" sx={{ fontWeight: 'bold' }}>{tier.name}</Typography>
          </Box>
          <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {recompensa.emoji && (
              <Typography sx={{ fontSize: '6rem', textShadow: `0 0 25px ${tier.color}` }}>
                {recompensa.emoji}
              </Typography>
            )}
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 'bold', wordWrap: 'break-word', textShadow: '2px 2px 4px #000' }}>
              {recompensa.titulo || recompensa.title || "Título..."}
            </Typography>
            <Typography variant="body2" sx={{ wordWrap: 'break-word', opacity: 0.8, minHeight: '40px', mt: 0.5 }}>
              {recompensa.descripcion || recompensa.description || "Descripción..."}
            </Typography>
            <Divider sx={{ my: 1.5, borderColor: 'rgba(255,255,255,0.2)' }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
              <Typography variant="h5" sx={{ fontWeight: 'bold', color: tier.color }}>
                ⭐ {recompensa.costo || recompensa.costo_puntos || 0}
              </Typography>
              {!isPreview && (
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button variant="contained" onClick={() => onCanjear(recompensa)} sx={{
                    backgroundColor: tier.color,
                    '&:hover': { opacity: 0.9, backgroundColor: tier.color }
                  }}>
                    Canjear
                  </Button>
                  <IconButton onClick={() => onDelete(recompensa.id)} sx={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
                    <DeleteIcon sx={{ color: 'white' }} />
                  </IconButton>
                </Box>
              )}
            </Box>
          </Box>
        </Box>
      </Card>
    </Tilt>
  );
};

function Recompensas() {
  const [recompensas, setRecompensas] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [usuarioActivo, setUsuarioActivo] = useState("");
  const [openModal, setOpenModal] = useState(false);
  const [nuevaRecompensa, setNuevaRecompensa] = useState({ titulo: "", descripcion: "", costo: "", emoji: "" });
  const audioRef = useRef(null);

  const cartasPredeterminadas = [
    { id: "default-1", titulo: "¡La cuenta por favor!", descripcion: "Hoy te invito a cenar", costo: 40, emoji: "🍽️" },
    { id: "default-2", titulo: "Rey/Reina por un día", descripcion: "Desayuno a la cama y trato real", costo: 60, emoji: "👑" },
    { id: "default-3", titulo: "Día libre", descripcion: "Te libras de los quehaceres por un día", costo: 100, emoji: "🛋️" },
  ];

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [recompensasData, historialData, usuariosData] = await Promise.all([
        apiRequest('/api/recompensas/hogar'),
        apiRequest('/api/recompensas/historial'),
        apiRequest('/api/hogar/miembros')
      ]);
      setRecompensas([...cartasPredeterminadas, ...recompensasData]);
      setHistorial(historialData);
      setUsuarios(usuariosData);
    } catch (error) {
      setRecompensas(cartasPredeterminadas);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const canjear = async (recompensa) => {
    if (!usuarioActivo) {
      alert("Selecciona un usuario para canjear.");
      return;
    }

    const usuario = usuarios.find(u => u.id === usuarioActivo);
    const puntosUsuario = usuario?.puntos || 0;
    const costoRecompensa = recompensa.costo || recompensa.costo_puntos || 0;

    if (puntosUsuario < costoRecompensa) {
      alert(`${usuario?.nombre} no tiene suficientes puntos.`);
      return;
    }

    if (String(recompensa.id).startsWith("default-")) {
      try {
        await apiRequest(`/api/recompensas/canjear_default`, {
          method: 'POST',
          body: JSON.stringify({
            titulo: recompensa.titulo,
            costo: recompensa.costo
          })
        });

        alert("🎉 Recompensa canjeada exitosamente");
        if (audioRef.current) audioRef.current.play();

        const usuariosData = await apiRequest('/api/hogar/miembros');
        setUsuarios(usuariosData);

        setHistorial(prev => [
          ...prev,
          {
            id: Date.now(),
            usuario: usuarios.find(u => u.id === usuarioActivo)?.nombre || "Usuario",
            titulo: recompensa.titulo,
            costo: recompensa.costo,
            fecha: new Date().toISOString()
          }
        ]);
      } catch (error) {
        alert(error.message);
      }
      return;
    }

    try {
      await apiRequest(`/api/recompensas/canjear/${recompensa.id}`, { method: 'POST' });
      alert(`🎉 Recompensa canjeada exitosamente`);
      if (audioRef.current) audioRef.current.play();

      const [recompensasData, usuariosData] = await Promise.all([
        apiRequest('/api/recompensas/hogar'),
        apiRequest('/api/hogar/miembros')
      ]);

      setRecompensas([...cartasPredeterminadas, ...recompensasData]);
      setUsuarios(usuariosData);

    } catch (error) {
      alert(error.message);
    }
  };

  const agregarRecompensa = async () => {
    if (!nuevaRecompensa.titulo || !nuevaRecompensa.descripcion || !nuevaRecompensa.costo) {
      alert("Completa todos los campos");
      return;
    }

    try {
      await apiRequest('/api/recompensas', {
        method: 'POST',
        body: JSON.stringify(nuevaRecompensa)
      });
      await loadData();
      setNuevaRecompensa({ titulo: "", descripcion: "", costo: "", emoji: "" });
      setOpenModal(false);
    } catch (error) {
      setError(error.message);
    }
  };

  const eliminarRecompensa = async (id) => {
    if (String(id).startsWith("default-")) {
      setRecompensas(prev => prev.filter(r => r.id !== id));
      return;
    }
    try {
      await apiRequest(`/api/recompensas/${id}`, { method: 'DELETE' });
      await loadData();
    } catch (error) {
      setError(error.message);
    }
  };

  const limpiarHistorial = async () => {
    try {
      await apiRequest('/api/recompensas/historial', { method: 'DELETE' });
      setHistorial([]);
      alert("Historial borrado correctamente");
    } catch (error) {
      alert(error.message);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 5, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 5, mb: 5 }}>
      <Typography variant="h4" gutterBottom>Tienda de Recompensas</Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <TextField
        select
        label="Usuario Activo"
        value={usuarioActivo}
        onChange={(e) => setUsuarioActivo(e.target.value)}
        sx={{ mb: 3, minWidth: 250 }}
      >
        <MenuItem value="">-- Sin asignar --</MenuItem>
        {usuarios.map((u) => (
          <MenuItem key={u.id} value={u.id}>
            {u.nombre} (Puntos: ⭐ {u.puntos || 0})
          </MenuItem>
        ))}
      </TextField>

      <Grid container spacing={4} sx={{ mb: 5 }}>
        {recompensas.length === 0 ? (
          <Grid item xs={12}>
            <Paper elevation={0} sx={{ textAlign: 'center', p: 4, border: '2px dashed', borderColor: 'divider', borderRadius: 2 }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>La tienda está vacía</Typography>
              <Typography color="text.secondary">
                Usa el botón <AddIcon sx={{ verticalAlign: 'middle', fontSize: '1rem' }} /> para crear la primera recompensa.
              </Typography>
            </Paper>
          </Grid>
        ) : (
          recompensas.map((r) => (
            <Grid item xs={12} sm={6} md={4} key={r.id}>
              <RewardCard recompensa={r} onCanjear={canjear} onDelete={eliminarRecompensa} usuarioActivo={usuarioActivo} usuarios={usuarios} />
            </Grid>
          ))
        )}
      </Grid>

      <Fab color="primary" aria-label="add" sx={{ position: 'fixed', bottom: 24, right: 24 }} onClick={() => setOpenModal(true)}>
        <AddIcon />
      </Fab>

      <Divider sx={{ my: 3 }} />
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h5">Historial de Canjes</Typography>
        {historial.length > 0 && (
          <Button 
            color="error" 
            onClick={() => {
              if (window.confirm("¿Seguro que quieres borrar todo el historial de canjes? Esta acción no se puede deshacer.")) {
                limpiarHistorial();
              }
            }}
          >
            Limpiar historial
          </Button>
        )}
      </Box>
      {historial.length === 0 ? (
        <Typography color="text.secondary">Aún no se han canjeado recompensas.</Typography>
      ) : (
        <List>
          {historial.map((r) => {
            const fecha = r.fecha ? new Date(r.fecha).toLocaleString() : null;
            return (
              <ListItem key={r.id} divider>
                <ListItemText
                  primary={`${r.usuario} canjeó "${r.titulo || r.title}"`}
                  secondary={`Costo: ${r.costo || r.costo_puntos} puntos${fecha ? ` • ${fecha}` : ""}`}
                />
              </ListItem>
            );
          })}
        </List>
      )}

      <Modal open={openModal} onClose={() => setOpenModal(false)}>
        <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 400, bgcolor: 'background.paper', border: '2px solid #000', boxShadow: 24, p: 4, borderRadius: 2 }}>
          <Typography variant="h6" component="h2">Crear Nueva Recompensa</Typography>
          <TextField fullWidth label="Título" value={nuevaRecompensa.titulo} onChange={(e) => setNuevaRecompensa({ ...nuevaRecompensa, titulo: e.target.value })} sx={{ mt: 2 }} />
          <TextField fullWidth label="Descripción" value={nuevaRecompensa.descripcion} onChange={(e) => setNuevaRecompensa({ ...nuevaRecompensa, descripcion: e.target.value })} sx={{ mt: 2 }} />
          <TextField fullWidth label="Costo en Puntos" type="number" value={nuevaRecompensa.costo} onChange={(e) => setNuevaRecompensa({ ...nuevaRecompensa, costo: e.target.value })} sx={{ mt: 2 }} />
          <TextField select fullWidth label="Emoji" value={nuevaRecompensa.emoji} onChange={(e) => setNuevaRecompensa({ ...nuevaRecompensa, emoji: e.target.value })} sx={{ mt: 2 }}>
            {emojiList.map(emoji => <MenuItem key={emoji} value={emoji}>{emoji}</MenuItem>)}
          </TextField>
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button onClick={() => setOpenModal(false)}>Cancelar</Button>
            <Button variant="contained" onClick={agregarRecompensa} sx={{ ml: 1 }}>Agregar</Button>
          </Box>
        </Box>
      </Modal>

      <audio ref={audioRef} src={chimeSound} preload="auto" />
    </Container>
  );
}

export default Recompensas;