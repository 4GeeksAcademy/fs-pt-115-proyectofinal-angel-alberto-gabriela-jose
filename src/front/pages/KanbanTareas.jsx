import React, { useState, useEffect } from "react";
import {
  Container, Typography, Button, TextField, Grid,
  CircularProgress, Alert
} from "@mui/material";
import KanbanColumn from "../components/KanbanColumn";

function KanbanTareas() {
  const [usuarios, setUsuarios] = useState([]);
  const [tareas, setTareas] = useState([]);
  const [nuevoItem, setNuevoItem] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const token = localStorage.getItem("authToken");

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
      setNuevoItem("");
      fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleReassign = async (taskId, newUserId) => {
    try {
      const resp = await fetch(`${backendUrl}/api/tasks/${taskId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ asignado_a: newUserId }),
      });

      if (!resp.ok) throw new Error("Error al reasignar tarea.");
      fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleToggleComplete = async (taskId, currentState) => {
    try {
      const resp = await fetch(`${backendUrl}/api/tasks/${taskId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          estado: currentState === "completada" ? "pendiente" : "completada",
        }),
      });

      if (!resp.ok) throw new Error("Error al actualizar estado de la tarea.");
      fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      const resp = await fetch(`${backendUrl}/api/tasks/${taskId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!resp.ok) throw new Error("Error al eliminar tarea.");
      fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) return <CircularProgress sx={{ display: "block", margin: "20px auto" }} />;
  if (error) return <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>;

  return (
    <Container maxWidth="lg" sx={{ mt: 5 }}>
      <Typography variant="h4" gutterBottom>
        Kanban de Tareas
      </Typography>

      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <TextField
          fullWidth
          label="Escribe una tarea"
          variant="outlined"
          value={nuevoItem}
          onChange={(e) => setNuevoItem(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
        />
        <Button variant="contained" onClick={handleAddTask}>
          Agregar
        </Button>
      </div>

      <Grid container spacing={2}>
        {/* Columna sin asignar */}
        <Grid item xs={12} sm={6} md={3}>
          <KanbanColumn
            usuario="Sin asignar"
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