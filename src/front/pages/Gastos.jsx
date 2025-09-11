import React, { useState, useEffect, useRef } from "react";
import {
  Container,Card,Typography,Button,TextField,Grid,List,
  ListItem,ListItemText,IconButton,Divider,Select,MenuItem,Checkbox,FormControlLabel,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";

import { draggable } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";

function ControlDeGastos() {
  const STORAGE_KEY = "gastosMensuales";
  const USUARIOS_KEY = "usuarios";

  // Cargar gastos
  const [gastos, setGastos] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  // Cargar usuarios (objetos con id, nombre, ingresos, meta, etc.)
  const [usuarios, setUsuarios] = useState(() => {
    try {
      const raw = localStorage.getItem(USUARIOS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const [descripcion, setDescripcion] = useState("");
  const [monto, setMonto] = useState("");
  const [fecha, setFecha] = useState(() =>
    new Date().toISOString().split("T")[0]
  );
  const [usuario, setUsuario] = useState("");
  const [compartido, setCompartido] = useState(false);

  // Guardar gastos en localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(gastos));
  }, [gastos]);

  // Agregar gasto
  const handleAdd = () => {
    const montoNum = parseFloat(monto);

    // Si es compartido no exigimos usuario; si es individual, sí.
    if (!descripcion.trim() || isNaN(montoNum) || (!compartido && !usuario)) {
      alert("Por favor completa todos los campos con valores válidos");
      return;
    }

    setGastos((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        descripcion: descripcion.trim(),
        monto: montoNum,
        fecha,
        usuario: compartido ? "COMPARTIDO" : usuario,
        compartido: !!compartido,
      },
    ]);

    // reset form
    setDescripcion("");
    setMonto("");
    setFecha(new Date().toISOString().split("T")[0]);
    setUsuario("");
    setCompartido(false);
  };

  // Eliminar gasto
  const handleDelete = (id) => {
    setGastos((prev) => prev.filter((g) => g.id !== id));
  };

  // Reasignar gasto al arrastrar (al caer en otra columna deja de ser compartido)
  const handleReassign = (gastoId, newUsuario) => {
    setGastos((prev) =>
      prev.map((g) =>
        g.id === gastoId ? { ...g, usuario: newUsuario, compartido: false } : g
      )
    );
  };

  // Separar gastos
  const gastosCompartidos = gastos.filter((g) => g.compartido);
  const gastosIndividuales = gastos.filter((g) => !g.compartido);

  // Totales compartidos
  const totalCompartido = gastosCompartidos.reduce((s, g) => s + (g.monto || 0), 0);
  const cuotaCompartida =
    usuarios.length > 0 ? totalCompartido / usuarios.length : 0;

  // Total individual general (suma de todos los individuales)
  const totalIndividualGeneral = gastosIndividuales.reduce(
    (s, g) => s + (g.monto || 0),
    0
  );

  return (
    <Container maxWidth="xl" sx={{ mt: 5 }}>
      <Typography variant="h4" gutterBottom>
        Control de Gastos Mensuales
      </Typography>

      {/* Formulario */}
      <Card sx={{ mb: 3, p: 2 }}>
        <Typography variant="h6">Agregar gasto</Typography>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Descripción"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
            />
          </Grid>
          <Grid item xs={6} md={2}>
            <TextField
              fullWidth
              type="number"
              label="Monto"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
            />
          </Grid>
          <Grid item xs={6} md={2}>
            <TextField
              fullWidth
              type="date"
              label="Fecha"
              InputLabelProps={{ shrink: true }}
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            {!compartido && (
              <Select
                fullWidth
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                displayEmpty
              >
                <MenuItem value="">Seleccionar usuario</MenuItem>
                {usuarios.map((u) => (
                  <MenuItem key={u.id} value={u.nombre}>
                    {u.nombre}
                  </MenuItem>
                ))}
              </Select>
            )}
            <FormControlLabel
              sx={{ mt: 1 }}
              control={
                <Checkbox
                  checked={compartido}
                  onChange={(e) => setCompartido(e.target.checked)}
                />
              }
              label="Gasto compartido"
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              fullWidth
              variant="contained"
              onClick={handleAdd}
              sx={{ height: "100%" }}
            >
              +
            </Button>
          </Grid>
        </Grid>
      </Card>

      
      <Grid container spacing={2}>
        {usuarios.map((u) => (
          <Grid item xs={12} sm={6} md={4} key={u.id}>
            <KanbanColumn
              usuario={u.nombre}
              gastos={gastosIndividuales.filter((g) => g.usuario === u.nombre)}
              onDelete={handleDelete}
              onReassign={handleReassign}
              cuotaCompartida={cuotaCompartida}
            />
          </Grid>
        ))}
      </Grid>

      
      <Card sx={{ mt: 3, p: 2 }}>
        <Typography variant="h6">Totales</Typography>
        <Typography>Gastos individuales: 💸 ${totalIndividualGeneral.toFixed(2)}</Typography>
        <Typography>Gastos compartidos: 🏠 ${totalCompartido.toFixed(2)}</Typography>
        {usuarios.length > 0 && (
          <Typography>
            Cada usuario aporta en compartidos: 💵 ${cuotaCompartida.toFixed(2)}
          </Typography>
        )}
      </Card>
    </Container>
  );
}

function KanbanColumn({ usuario, gastos, onDelete, onReassign, cuotaCompartida }) {
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
        const gastoId = source.data.id;
        onReassign(gastoId, usuario);
      },
    });

    return () => {
      cleanupDrop();
    };
  }, [usuario, onReassign]);

  // Subtotal individual de esta columna
  const subtotalIndividual = gastos.reduce((s, g) => s + (g.monto || 0), 0);
  const totalPersonal = subtotalIndividual + (cuotaCompartida || 0);

  return (
    <Card
      ref={ref}
      sx={{
        p: 1,
        minHeight: 300,
        backgroundColor: isOver ? "#f1f8e9" : "#fafafa",
        transition: "all 0.2s ease-in-out",
      }}
    >
      <Typography variant="h6" align="center" gutterBottom>
        👤 {usuario}
      </Typography>
      <Divider sx={{ mb: 1 }} />

      <List>
        {gastos.map((g) => (
          <DraggableGasto key={g.id} gasto={g} onDelete={onDelete} />
        ))}

        <Divider sx={{ my: 1 }} />
        <ListItem>
          <ListItemText primary={`Subtotal individual: $${subtotalIndividual.toFixed(2)}`} />
        </ListItem>
        <ListItem>
          <ListItemText primary={`Cuota compartida: $${(cuotaCompartida || 0).toFixed(2)}`} />
        </ListItem>
        <ListItem>
          <ListItemText
            primary={`Total personal: $${totalPersonal.toFixed(2)}`}
            sx={{ fontWeight: "bold" }}
          />
        </ListItem>
      </List>
    </Card>
  );
}

function DraggableGasto({ gasto, onDelete }) {
  const ref = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!ref.current) return;

    const cleanupDrag = draggable({
      element: ref.current,
      getInitialData: () => ({ id: gasto.id }),
      onDragStart: () => setIsDragging(true),
      onDrop: () => setIsDragging(false),
    });

    return () => {
      cleanupDrag();
    };
  }, [gasto.id]);

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
        <IconButton edge="end" onClick={() => onDelete(gasto.id)}>
          <DeleteIcon />
        </IconButton>
      }
    >
      <ListItemText
        primary={`${new Date(gasto.fecha).toLocaleDateString()} - ${gasto.descripcion}`}
        secondary={`$${Number(gasto.monto || 0).toFixed(2)}`}
      />
    </ListItem>
  );
}

export default ControlDeGastos;