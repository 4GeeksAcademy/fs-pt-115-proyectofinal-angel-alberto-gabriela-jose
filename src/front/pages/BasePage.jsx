import React, { useState, useEffect, useRef } from "react";
import {
  Container,Card,CardContent,Typography,Button,TextField,
  List,ListItem,ListItemText, IconButton,  Checkbox,  MenuItem,  Select,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

import { draggable } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";

function BasePage({ titulo, storageKey, placeholder, botonTexto, puntosKey }) {

  // Items de la página (tareas, compras, gastos, etc.)
  const [items, setItems] = useState(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  // Lista de usuarios registrada en Usuarios.jsx
  const [usuarios, setUsuarios] = useState(() => {
    try {
      const raw = localStorage.getItem("usuarios");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  // Puntos (solo para tareas)
  const resolvedPuntosKey = puntosKey || "puntos";
  const [puntos, setPuntos] = useState(() => {
    const raw = localStorage.getItem(resolvedPuntosKey);
    const val = raw ? parseInt(raw, 10) : 0;
    return Number.isNaN(val) ? 0 : val;
  });

  // Guardar en localStorage
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(items));
  }, [items, storageKey]);

  useEffect(() => {
    localStorage.setItem(resolvedPuntosKey, String(puntos));
  }, [puntos, resolvedPuntosKey]);

  // Inputs
  const [nuevoItem, setNuevoItem] = useState("");
  const [usuario, setUsuario] = useState("");

  // Agregar item
  const handleAdd = () => {
    if (!nuevoItem.trim() || !usuario) {
      alert("Debes escribir un item y asignar un usuario");
      return;
    }

    setItems((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        texto: nuevoItem.trim(),
        completada: false,
        usuario,
      },
    ]);
    setNuevoItem("");
    setUsuario("");
  };

  // Eliminar
  const handleDelete = (id) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Editar
  const handleEdit = (id) => {
    const nuevoTexto = prompt("Editar:");
    if (nuevoTexto && nuevoTexto.trim()) {
      setItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, texto: nuevoTexto.trim() } : item
        )
      );
    }
  };

  // Completar + puntos en tareas
  const handleToggleComplete = (id) => {
    setItems((prev) => {
      const before = prev.find((i) => i.id === id);
      const wasCompleted = !!before?.completada;

      const updated = prev.map((item) =>
        item.id === id ? { ...item, completada: !item.completada } : item
      );

      if (storageKey === "tareas") {
        setPuntos((p) => {
          const next = p + (wasCompleted ? -10 : 10);
          return next < 0 ? 0 : next;
        });
      }

      return updated;
    });
  };

  const handleReorder = (sourceId, targetId) => {
    if (sourceId === targetId) return;
    const sourceIndex = items.findIndex((i) => i.id === sourceId);
    const targetIndex = items.findIndex((i) => i.id === targetId);

    const newItems = [...items];
    const [moved] = newItems.splice(sourceIndex, 1);
    newItems.splice(targetIndex, 0, moved);

    setItems(newItems);
  };

  return (
    <Container maxWidth="md" sx={{ mt: 5 }}>
      <Card>
        <CardContent>
          <Typography variant="h4" gutterBottom>
            {titulo}
          </Typography>

          {storageKey === "tareas" && (
            <Typography variant="h6" gutterBottom>
              Puntos acumulados: ⭐ {puntos}
            </Typography>
          )}

          
          <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
            <TextField
              fullWidth
              label={placeholder}
              variant="outlined"
              value={nuevoItem}
              onChange={(e) => setNuevoItem(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            />
            <Select
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              displayEmpty
              sx={{ minWidth: 150 }}
            >
              <MenuItem value="">Seleccionar usuario</MenuItem>
              {usuarios.map((u) => (
                <MenuItem key={u.id} value={u.nombre}>
                  {u.nombre}
                </MenuItem>
              ))}
            </Select>
            <Button variant="contained" onClick={handleAdd}>
              {botonTexto}
            </Button>
          </div>

         
          <List>
            {items.map((item) => (
              <DraggableListItem
                key={item.id}
                item={item}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onToggle={handleToggleComplete}
                onReorder={handleReorder}
              />
            ))}
          </List>
        </CardContent>
      </Card>
    </Container>
  );
}

// Item arrastrable
function DraggableListItem({ item, onEdit, onDelete, onToggle, onReorder }) {
  const ref = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isOver, setIsOver] = useState(false);

  useEffect(() => {
    if (!ref.current) return;

    const cleanupDrag = draggable({
      element: ref.current,
      getInitialData: () => ({ id: item.id }),
      onDragStart: () => setIsDragging(true),
      onDrop: () => setIsDragging(false),
    });

    const cleanupDrop = dropTargetForElements({
      element: ref.current,
      onDragEnter: () => setIsOver(true),
      onDragLeave: () => setIsOver(false),
      onDrop: ({ source }) => {
        setIsOver(false);
        onReorder(source.data.id, item.id);
      },
    });

    return () => {
      cleanupDrag();
      cleanupDrop();
    };
  }, [item.id, onReorder]);

  return (
    <ListItem
      ref={ref}
      sx={{
        cursor: "grab",
        backgroundColor: isDragging
          ? "#e3f2fd"
          : isOver
          ? "#f1f8e9"
          : "#f9f9f9",
        boxShadow: isDragging ? 4 : isOver ? 2 : 0,
        mb: 1,
        borderRadius: 1,
        transition: "all 0.2s ease-in-out",
      }}
      secondaryAction={
        <>
          <IconButton edge="end" onClick={() => onEdit(item.id)}>
            <EditIcon />
          </IconButton>
          <IconButton edge="end" onClick={() => onDelete(item.id)}>
            <DeleteIcon />
          </IconButton>
        </>
      }
    >
      <Checkbox checked={!!item.completada} onChange={() => onToggle(item.id)} />
      <ListItemText
        primary={item.texto}
        secondary={`👤 ${item.usuario}`}
        sx={{
          textDecoration: item.completada ? "line-through" : "none",
          opacity: item.completada ? 0.6 : 1,
        }}
      />
    </ListItem>
  );
}

export default BasePage;