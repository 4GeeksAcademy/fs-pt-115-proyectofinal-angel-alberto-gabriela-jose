import React, { useState, useEffect, useRef } from "react";
import {
  Container, Grid, Card, Typography, Button, Divider,
  List, ListItem, ListItemText, TextField, IconButton, MenuItem, Box, Modal,
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

// Servicio para llamadas API
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
    const errorData = await response.json();
    throw new Error(errorData.msg || 'Error en la solicitud');
  }

  return response.json();
};

const emojiList = ['🎮', '❤️', '⭐', '🔥', '🚀', '🎉', '🏆', '📚', '🐾', '🍕'];

const getTier = (costo) => {
  if (costo >= 100) return { name: 'LEYENDA', color: '#ffc107', imagen: cartaLeyenda };
  if (costo >= 80) return { name: 'ÉPICA', color: '#9c27b0', imagen: cartaEpica };
  if (costo >= 50) return { name: 'RARA', color: '#2196f3', imagen: cartaRara };
  return { name: 'NORMAL', color: '#4caf50', imagen: cartaNormal };
};

const styleModal = {
  position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
  width: { xs: '90%', md: 800 }, bgcolor: 'background.paper', border: '2px solid #000',
  boxShadow: 24, p: 4, borderRadius: 2, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3
};

const RewardCard = ({ recompensa, onCanjear, onDelete, isPreview = false }) => {
  const tier = getTier(recompensa.costo || recompensa.costo_puntos || 0);

  return (
    <Tilt tiltMaxAngleX={7} tiltMaxAngleY={7} glareEnable={true} glareMaxOpacity={0.15} scale={1.05}>
      <Card sx={{
        width: '100%',
        height: 380,
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
                  <Button variant="contained" onClick={() => onCanjear(recompensa)} sx={{ backgroundColor: tier.color, '&:hover': { opacity: 0.9, backgroundColor: tier.color } }}>
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
}

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

  // Cargar datos iniciales
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [recompensasData, historialData, usuariosData] = await Promise.all([
        apiRequest('/api/recompensas/hogar'),
        apiRequest('/api/recompensas/historial'),
        apiRequest('/api/hogar/miembros')
      ]);

      setRecompensas(recompensasData);
      setHistorial(historialData);
      setUsuarios(usuariosData);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = () => setOpenModal(true);
  const handleCloseModal = () => { setNuevaRecompensa({ titulo: "", descripcion: "", costo: "", emoji: "" }); setOpenModal(false); };

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

      // Recargar las recompensas después de crear una nueva
      await loadData();
      handleCloseModal();
    } catch (error) {
      setError(error.message);
    }
  };

  const canjear = async (recompensa) => {
    if (!usuarioActivo) {
      alert("Selecciona un usuario para canjear.");
      return;
    }

    try {
      await apiRequest(`/api/recompensas/canjear/${recompensa.id}`, {
        method: 'POST'
      });

      alert(`🎉 Recompensa canjeada exitosamente`);
      if (audioRef.current) {
        audioRef.current.play().catch(error => console.log("Error al reproducir audio:", error));
      }

      // Recargar datos para actualizar puntos y historial
      await loadData();
    } catch (error) {
      alert(error.message);
    }
  };

  const eliminarRecompensa = async (id) => {
    try {
      await apiRequest(`/api/recompensas/${id}`, {
        method: 'DELETE'
      });

      // Recargar las recompensas después de eliminar
      await loadData();
    } catch (error) {
      setError(error.message);
    }
  };

  const limpiarHistorial = () => {
    // Esto solo limpia el historial local
    setHistorial([]);
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
              <Typography color="text.secondary">Usa el botón <AddIcon sx={{ verticalAlign: 'middle', fontSize: '1rem' }} /> para crear la primera recompensa.</Typography>
            </Paper>
          </Grid>
        ) : (
          recompensas.map((r) => (
            <Grid item xs={12} sm={6} md={4} key={r.id}>
              <RewardCard
                recompensa={r}
                onCanjear={canjear}
                onDelete={eliminarRecompensa}
              />
            </Grid>
          ))
        )}
      </Grid>

      <Fab color="primary" aria-label="add" sx={{ position: 'fixed', bottom: 24, right: 24 }} onClick={handleOpenModal}>
        <AddIcon />
      </Fab>

      <Modal open={openModal} onClose={handleCloseModal}>
        <Box sx={styleModal}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" component="h2">Crea tu Carta</Typography>
            <TextField label="Título" fullWidth margin="normal" value={nuevaRecompensa.titulo} onChange={(e) => setNuevaRecompensa({ ...nuevaRecompensa, titulo: e.target.value })} />
            <TextField label="Descripción" fullWidth margin="normal" value={nuevaRecompensa.descripcion} onChange={(e) => setNuevaRecompensa({ ...nuevaRecompensa, descripcion: e.target.value })} />
            <TextField label="Costo en Puntos" type="number" fullWidth margin="normal" value={nuevaRecompensa.costo} onChange={(e) => setNuevaRecompensa({ ...nuevaRecompensa, costo: e.target.value })} />
            <Typography sx={{ mt: 2, mb: 1, color: 'text.secondary' }}>Elige un emoji (opcional)</Typography>
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
              {emojiList.map(emoji => (
                <IconButton key={emoji} onClick={() => setNuevaRecompensa({ ...nuevaRecompensa, emoji: nuevaRecompensa.emoji === emoji ? '' : emoji })} sx={{ border: '2px solid', borderColor: nuevaRecompensa.emoji === emoji ? 'primary.main' : 'transparent', fontSize: '1.5rem' }}>
                  {emoji}
                </IconButton>
              ))}
            </Box>
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
              <Button onClick={handleCloseModal}>Cancelar</Button>
              <Button variant="contained" onClick={agregarRecompensa}>Guardar</Button>
            </Box>
          </Box>
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <Typography variant="h6" component="h2" align="center" sx={{ mb: 2 }}>Vista Previa</Typography>
            <RewardCard recompensa={nuevaRecompensa} isPreview={true} />
          </Box>
        </Box>
      </Modal>

      <Divider sx={{ my: 3 }} />
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h5">Historial de Canjes</Typography>
        {historial.length > 0 && (
          <Button color="error" onClick={limpiarHistorial}>Limpiar historial local</Button>
        )}
      </Box>
      {historial.length === 0 ? (
        <Typography color="text.secondary">Aún no se han canjeado recompensas.</Typography>
      ) : (
        <List>
          {historial.map((r) => (
            <ListItem key={r.id} divider>
              <ListItemText
                primary={`${r.usuario} canjeó "${r.titulo || r.title}"`}
                secondary={`Costo: ${r.costo || r.costo_puntos} puntos`}
              />
            </ListItem>
          ))}
        </List>
      )}

      <audio ref={audioRef} src={chimeSound} preload="auto" />
    </Container>
  );
}

export default Recompensas;