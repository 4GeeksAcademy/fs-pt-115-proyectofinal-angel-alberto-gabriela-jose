import React, { useState, useEffect } from "react";
import {
  Container,Grid,Card,CardContent,Typography,Button,Divider,
  List,ListItem,ListItemText,TextField,IconButton,MenuItem,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";

const listaRecompensasFijas = [
  { id: 1, titulo: "La cuenta porfavor!!! 🍽️", descripcion: "Hoy te invito a cenar", costo: 40 },
  { id: 2, titulo: "Rey/Reina por un día 👑", descripcion: "Desayuno a la cama y trato real", costo: 60 },
  { id: 3, titulo: "La carta de la envidia", descripcion: "Intercambio de platos, tu comida tiene mejor pinta", costo: 50 },
  { id: 4, titulo: "Day off 🛌", descripcion: "Te libras de los quehaceres por un día", costo: 100 },
  { id: 5, titulo: "Cuponazo 🎁", descripcion: "Un paseo por el Ikea, ¿qué compramos?", costo: 100 },
];

const PUNTOS_KEY = "puntosPorUsuario";
const HISTORIAL_KEY = "historialRecompensas";
const RECOMPENSAS_KEY = "recompensasPersonalizadas";

function Recompensas() {
  

  const [puntos, setPuntos] = useState(() => {
    try {
      const raw = localStorage.getItem(PUNTOS_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  // Historial
  const [historial, setHistorial] = useState(() => {
    try {
      const raw = localStorage.getItem(HISTORIAL_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  //Recompensas personalizadas
  const [recompensasExtra, setRecompensasExtra] = useState(() => {
    try {
      const raw = localStorage.getItem(RECOMPENSAS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  
  const [nueva, setNueva] = useState({ titulo: "", descripcion: "", costo: "" });

  const [usuarioActivo, setUsuarioActivo] = useState("");

  useEffect(() => {
    localStorage.setItem(PUNTOS_KEY, JSON.stringify(puntos));
  }, [puntos]);

  useEffect(() => {
    localStorage.setItem(HISTORIAL_KEY, JSON.stringify(historial));
  }, [historial]);

  useEffect(() => {
    localStorage.setItem(RECOMPENSAS_KEY, JSON.stringify(recompensasExtra));
  }, [recompensasExtra]);

  
  const canjear = (recompensa) => {
    if (!usuarioActivo) {
      alert("Selecciona un usuario para canjear.");
      return;
    }

    const saldo = puntos[usuarioActivo] || 0;
    if (saldo >= recompensa.costo) {
      setPuntos((prev) => ({
        ...prev,
        [usuarioActivo]: saldo - recompensa.costo,
      }));

      const nuevoRegistro = {
        id: Date.now(),
        usuario: usuarioActivo,
        titulo: recompensa.titulo,
        descripcion: recompensa.descripcion,
        fecha: new Date().toLocaleString(),
      };
      setHistorial((prev) => [nuevoRegistro, ...prev]);

      alert(`🎉 ${usuarioActivo} canjeó "${recompensa.titulo}"`);
    } else {
      alert(`❌ ${usuarioActivo} no tiene suficientes puntos.`);
    }
  };


  const agregarRecompensa = () => {
    if (!nueva.titulo || !nueva.descripcion || !nueva.costo) {
      alert("Completa todos los campos");
      return;
    }

    const nuevaRecompensa = {
      id: Date.now(),
      titulo: nueva.titulo,
      descripcion: nueva.descripcion,
      costo: parseInt(nueva.costo),
      personalizada: true,
    };

    setRecompensasExtra((prev) => [...prev, nuevaRecompensa]);
    setNueva({ titulo: "", descripcion: "", costo: "" });
  };


  const eliminarRecompensa = (id) => {
    setRecompensasExtra((prev) => prev.filter((r) => r.id !== id));
  };

  
  const limpiarHistorial = () => {
    if (window.confirm("¿Seguro que quieres limpiar el historial de recompensas?")) {
      setHistorial([]);
    }
  };

 
  const todasRecompensas = [...listaRecompensasFijas, ...recompensasExtra];

  return (
    <Container maxWidth="lg" sx={{ mt: 5 }}>
      <Typography variant="h4" gutterBottom>
        Recompensas disponibles
      </Typography>

    
      <TextField
        select
        label="Usuario"
        value={usuarioActivo}
        onChange={(e) => setUsuarioActivo(e.target.value)}
        sx={{ mb: 3, minWidth: 200 }}
      >
        {Object.keys(puntos).map((u) => (
          <MenuItem key={u} value={u}>
            {u} ⭐ {puntos[u]}
          </MenuItem>
        ))}
      </TextField>

      
      <Card sx={{ p: 2, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Agregar nueva recompensa
        </Typography>
        <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
          <TextField
            label="Título"
            fullWidth
            value={nueva.titulo}
            onChange={(e) => setNueva({ ...nueva, titulo: e.target.value })}
          />
          <TextField
            label="Costo (⭐ puntos)"
            type="number"
            sx={{ width: "200px" }}
            value={nueva.costo}
            onChange={(e) => setNueva({ ...nueva, costo: e.target.value })}
          />
        </div>
        <TextField
          label="Descripción"
          fullWidth
          multiline
          rows={2}
          sx={{ mb: 2 }}
          value={nueva.descripcion}
          onChange={(e) => setNueva({ ...nueva, descripcion: e.target.value })}
        />
        <Button variant="contained" onClick={agregarRecompensa}>
          Agregar recompensa
        </Button>
      </Card>

     
      <Grid container spacing={3} sx={{ mb: 5 }}>
        {todasRecompensas.map((r) => (
          <Grid item xs={12} sm={6} md={4} key={r.id}>
            <Card
              sx={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <CardContent>
                <Typography variant="h6">{r.titulo}</Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  gutterBottom
                  sx={{ minHeight: 50 }}
                >
                  {r.descripcion}
                </Typography>
                <Typography variant="body2">Costo: ⭐ {r.costo}</Typography>
              </CardContent>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "8px 16px",
                }}
              >
                <Button variant="contained" onClick={() => canjear(r)}>
                  Canjear
                </Button>
                {r.personalizada && (
                  <IconButton color="error" onClick={() => eliminarRecompensa(r.id)}>
                    <DeleteIcon />
                  </IconButton>
                )}
              </div>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Divider sx={{ mb: 3 }} />

      
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="h5">Historial de recompensas canjeadas</Typography>
        {historial.length > 0 && (
          <Button color="error" onClick={limpiarHistorial}>
            Limpiar historial
          </Button>
        )}
      </div>
      {historial.length === 0 ? (
        <Typography color="text.secondary">Todavía no has canjeado recompensas.</Typography>
      ) : (
        <List>
          {historial.map((r) => (
            <ListItem key={r.id} sx={{ borderBottom: "1px solid #eee" }}>
              <ListItemText
                primary={`${r.usuario} → ${r.titulo} (${r.fecha})`}
                secondary={r.descripcion}
              />
            </ListItem>
          ))}
        </List>
      )}
    </Container>
  );
}

export default Recompensas;