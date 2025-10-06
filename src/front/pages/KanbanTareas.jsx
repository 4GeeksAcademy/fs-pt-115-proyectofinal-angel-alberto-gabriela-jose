import React, { useState, useEffect } from "react";
import {
  Container, Typography, Button, TextField, Grid,
  CircularProgress, Alert, Box
} from "@mui/material";
import KanbanColumn from "../components/KanbanColumn";

function KanbanTareas() {
  const [usuarios, setUsuarios] = useState([]);
  const [tareas, setTareas] = useState([]);
  const [nuevoItem, setNuevoItem] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const token = localStorage.getItem("token");

  const fetchData = async () => {
    try {
      setLoading(true);
      if (!token) throw new Error("No hay token. Por favor inicia sesión.");

      const [usuariosRes, tareasRes] = await Promise.all([
        fetch(`${backendUrl}/api/hogar/miembros`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${backendUrl}/api/tasks/hogar`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (usuariosRes.status === 401 || tareasRes.status === 401) {
        throw new Error("Sesión expirada. Inicia sesión nuevamente.");
      }

      if (!usuariosRes.ok || !tareasRes.ok) {
        throw new Error("Error al cargar datos del servidor.");
      }

      setUsuarios(await usuariosRes.json());
      setTareas(await tareasRes.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTask = async () => {
    if (!nuevoItem.trim()) return;
    try {
      const resp = await fetch(`${backendUrl}/api/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title: nuevoItem }),
      });

      if (!resp.ok) throw new Error("Error al crear tarea.");
      const newTask = await resp.json();
      setTareas(prev => [...prev, newTask]);
      setNuevoItem("");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleReassign = async (taskId, newUserId) => {
    const originalTareas = [...tareas];
    setTareas(prev =>
      prev.map(t => t.id === taskId ? { ...t, asignado_a: newUserId } : t)
    );

    try {
      const resp = await fetch(`${backendUrl}/api/tasks/${taskId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ asignado_a: newUserId }),
      });

      if (!resp.ok) {
        setTareas(originalTareas);
        throw new Error("Error al reasignar tarea.");
      }
      await fetchData();
    } catch (err) {
      setError(err.message);
      setTareas(originalTareas);
    }
  };

  const handleToggleComplete = async (taskId, currentState) => {
    const originalTareas = [...tareas];
    const newStatus = currentState === "completada" ? "pendiente" : "completada";
    setTareas(prev =>
      prev.map(t => t.id === taskId ? { ...t, estado: newStatus } : t)
    );

    try {
      const resp = await fetch(`${backendUrl}/api/tasks/${taskId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ estado: newStatus }),
      });

      if (!resp.ok) {
        setTareas(originalTareas);
        throw new Error("Error al actualizar estado de la tarea.");
      }
      await fetchData();
    } catch (err) {
      setError(err.message);
      setTareas(originalTareas);
    }
  };

  const handleDeleteTask = async (taskId) => {
    const originalTareas = [...tareas];
    setTareas(prev => prev.filter((t) => t.id !== taskId));
    try {
      const resp = await fetch(`${backendUrl}/api/tasks/${taskId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!resp.ok) {
        setTareas(originalTareas);
        throw new Error("Error al eliminar tarea.");
      }
      await fetchData();
    } catch (err) {
      setError(err.message);
      setTareas(originalTareas);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading)
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );

  if (error)
    return (
      <Container maxWidth="md">
        <Alert severity="error" sx={{ mt: 4 }}>{error}</Alert>
      </Container>
    );

  return (
    <Container maxWidth="xl" sx={{ mt: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
        Tablero de Tareas
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, mb: 4, alignItems: 'center' }}>
        <TextField
          fullWidth
          label="Añadir una nueva misión al tablero..."
          variant="outlined"
          value={nuevoItem}
          onChange={(e) => setNuevoItem(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
        />
        <Button variant="contained" color="primary" onClick={handleAddTask} sx={{ py: '15px' }}>
          Agregar
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Columna sin asignar */}
        <Grid item xs={12} sm={6} md={3}>
          <KanbanColumn
            usuario="Misiones Pendientes"
            userId={null}
            tasks={tareas.filter((t) => t.asignado_a === null)}
            onDeleteTask={handleDeleteTask}
            onToggleTask={handleToggleComplete}
            onReassign={handleReassign}
          />
        </Grid>

        {/* Columnas para cada usuario */}
        {usuarios.map((u) => (
          <Grid item xs={12} sm={6} md={3} key={u.id}>
            <KanbanColumn
              usuario={u.nombre}
              userId={u.id}
              tasks={tareas.filter((t) => t.asignado_a === u.id)}
              onDeleteTask={handleDeleteTask}
              onToggleTask={handleToggleComplete}
              onReassign={handleReassign}
            />
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}

export default KanbanTareas;