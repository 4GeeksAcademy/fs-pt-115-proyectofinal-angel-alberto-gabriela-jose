import React, { useState, useEffect, useRef } from "react";
import {
  Container,Card,Typography,Button,TextField,Grid,
  List,ListItem,ListItemText,Checkbox,IconButton,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import PersonRemoveIcon from "@mui/icons-material/PersonRemove";

import { draggable } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";

const PUNTOS_KEY = "puntosPorUsuario";

function KanbanTareas() {

  // Usuarios (objetos con id, nombre, correo...)
  const [usuarios, setUsuarios] = useState(() => {
    try {
      const raw = localStorage.getItem("usuarios");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  // Tareas
  const [items, setItems] = useState(() => {
    try {
      const raw = localStorage.getItem("tareas");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [nuevoItem, setNuevoItem] = useState("");

  // Puntos por usuario
  const [puntos, setPuntos] = useState(() => {
    try {
      const raw = localStorage.getItem(PUNTOS_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem("tareas", JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem(PUNTOS_KEY, JSON.stringify(puntos));
  }, [puntos]);

  const handleAddTask = () => {
    if (!nuevoItem.trim()) return;
    setItems((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        texto: nuevoItem.trim(),
        completada: false,
        usuario: "Sin asignar", 
      },
    ]);
    setNuevoItem("");
  };

  const handleDeleteTask = (id) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleToggleComplete = (id) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;

        const usuario = item.usuario || "Sin asignar";
        const wasCompleted = item.completada;

        setPuntos((p) => {
          const current = p[usuario] || 0;
          const delta = wasCompleted ? -10 : +10;
          return { ...p, [usuario]: Math.max(0, current + delta) };
        });

        return { ...item, completada: !item.completada };
      })
    );
  };

  const handleReassign = (taskId, newUsuario) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === taskId ? { ...item, usuario: newUsuario } : item
      )
    );
  };

  const eliminarUsuario = (id) => {
    const user = usuarios.find((u) => u.id === id);
    if (!user) return;

    if (
      !window.confirm(
        `¿Seguro que quieres eliminar a ${user.nombre}? Sus tareas se moverán a "Sin asignar".`
      )
    )
      return;

    setUsuarios((prev) => prev.filter((u) => u.id !== id));
    setItems((prev) =>
      prev.map((task) =>
        task.usuario === user.nombre ? { ...task, usuario: "Sin asignar" } : task
      )
    );
  };

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
       
        <Grid item xs={12} sm={6} md={3} key="sin-asignar">
          <KanbanColumn
            usuario="Sin asignar"
            tasks={items.filter((t) => t.usuario === "Sin asignar")}
            puntos={puntos}
            onDeleteTask={handleDeleteTask}
            onToggleTask={handleToggleComplete}
            onReassign={handleReassign}
          />
        </Grid>

        
        {usuarios.map((u) => (
          <Grid item xs={12} sm={6} md={3} key={u.id}>
            <KanbanColumn
              usuario={u.nombre} // 👈 usamos el nombre
              tasks={items.filter((t) => t.usuario === u.nombre)}
              puntos={puntos}
              onDeleteTask={handleDeleteTask}
              onToggleTask={handleToggleComplete}
              onReassign={handleReassign}
              onDeleteUser={() => eliminarUsuario(u.id)}
            />
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}

function KanbanColumn({
  usuario,
  tasks,
  puntos,
  onDeleteTask,
  onToggleTask,
  onReassign,
  onDeleteUser,
}) {
  const ref = useRef(null);
  const [isOver, setIsOver] = useState(false);

  useEffect(() => {
    if (!ref.current) return;

    const cleanupDrop = dropTargetForElements({
      element: ref.current,
      onDragEnter: () => setIsOver(true),
      onDragLeave: () => setIsOver(false),
      onDrop: ({ source }) => {
        setIsOver(false);
        const taskId = source.data.id;
        onReassign(taskId, usuario);
      },
    });

    return () => {
      cleanupDrop();
    };
  }, [usuario, onReassign]);

  return (
    <Card
      ref={ref}
      sx={{
        p: 1,
        minHeight: 400,
        backgroundColor: isOver ? "#f1f8e9" : "#fafafa",
        transition: "all 0.2s ease-in-out",
      }}
    >
      <Typography variant="h6" align="center" gutterBottom>
        {usuario} ⭐ {puntos[usuario] || 0}
        {usuario !== "Sin asignar" && (
          <IconButton
            size="small"
            color="error"
            onClick={onDeleteUser}
          >
            <PersonRemoveIcon fontSize="small" />
          </IconButton>
        )}
      </Typography>

      <List>
        {tasks.map((task) => (
          <DraggableTask
            key={task.id}
            task={task}
            onDeleteTask={onDeleteTask}
            onToggleTask={onToggleTask}
          />
        ))}
      </List>
    </Card>
  );
}

function DraggableTask({ task, onDeleteTask, onToggleTask }) {
  const ref = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!ref.current) return;

    const cleanupDrag = draggable({
      element: ref.current,
      getInitialData: () => ({ id: task.id }),
      onDragStart: () => setIsDragging(true),
      onDrop: () => setIsDragging(false),
    });

    return () => {
      cleanupDrag();
    };
  }, [task.id]);

  return (
    <ListItem
      ref={ref}
      sx={{
        cursor: "grab",
        backgroundColor: isDragging ? "#e3f2fd" : "white",
        mb: 1,
        borderRadius: 1,
        boxShadow: isDragging ? 3 : 1,
        transition: "all 0.2s ease-in-out",
      }}
      secondaryAction={
        <IconButton edge="end" onClick={() => onDeleteTask(task.id)}>
          <DeleteIcon />
        </IconButton>
      }
    >
      <Checkbox
        checked={!!task.completada}
        onChange={() => onToggleTask(task.id)}
      />
      <ListItemText
        primary={task.texto}
        sx={{
          textDecoration: task.completada ? "line-through" : "none",
          opacity: task.completada ? 0.6 : 1,
        }}
      />
    </ListItem>
  );
}

export default KanbanTareas;