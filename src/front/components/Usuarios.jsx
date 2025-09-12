import React, { useState, useEffect } from "react";
import {Container,Card,CardContent,Typography,Button,TextField, List,ListItem,ListItemText,
  IconButton,Dialog,DialogTitle,DialogContent,DialogActions,Stack,MenuItem,Select,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";

function Usuarios() {
  const USUARIOS_KEY = "usuarios";
  const TAREAS_KEY = "tareas";
  const GASTOS_KEY = "gastosMensuales";
  const COMPRAS_KEY = "compras";
  const PUNTOS_KEY = "puntosPorUsuario";

  const [usuarios, setUsuarios] = useState(() => {
    try {
      const raw = localStorage.getItem(USUARIOS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [ingresos, setIngresos] = useState("");
  const [meta, setMeta] = useState("");
  const [frecuenciaMeta, setFrecuenciaMeta] = useState("mensual"); // 👈 nueva

  // Modal edición
  const [editUser, setEditUser] = useState(null);
  const [editIngresos, setEditIngresos] = useState("");
  const [editMeta, setEditMeta] = useState("");
  const [editFrecuencia, setEditFrecuencia] = useState("mensual");

  useEffect(() => {
    localStorage.setItem(USUARIOS_KEY, JSON.stringify(usuarios));
  }, [usuarios]);

  //Registrar usuario
  const handleAdd = () => {
    if (!nombre.trim() || !correo.trim() || !password.trim()) {
      alert("Completa todos los campos");
      return;
    }

    setUsuarios((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        nombre: nombre.trim(),
        correo: correo.trim(),
        password,
        ingresos: parseFloat(ingresos) || 0,
        meta: parseFloat(meta) || 0,
        frecuenciaMeta, // guardamos semanal o mensual
      },
    ]);

    setNombre("");
    setCorreo("");
    setPassword("");
    setIngresos("");
    setMeta("");
    setFrecuenciaMeta("mensual");
  };

  // Eliminar usuario y limpiar datos asociados
  const handleDelete = (id) => {
    const user = usuarios.find((u) => u.id === id);
    if (!user) return;

    if (
      !window.confirm(
        `¿Eliminar a ${user.nombre}? También se borrarán sus tareas, compras, gastos y puntos.`
      )
    ) {
      return;
    }

    const nuevosUsuarios = usuarios.filter((u) => u.id !== id);
    setUsuarios(nuevosUsuarios);

    // Borrar relacionados
    const cleanStorage = (key) => {
      try {
        const raw = localStorage.getItem(key);
        const arr = raw ? JSON.parse(raw) : [];
        const filtrados = arr.filter((x) => x.usuario !== user.nombre);
        localStorage.setItem(key, JSON.stringify(filtrados));
      } catch {}
    };
    cleanStorage(TAREAS_KEY);
    cleanStorage(COMPRAS_KEY);
    cleanStorage(GASTOS_KEY);

    try {
      const rawP = localStorage.getItem(PUNTOS_KEY);
      const puntos = rawP ? JSON.parse(rawP) : {};
      if (puntos[user.nombre]) {
        delete puntos[user.nombre];
        localStorage.setItem(PUNTOS_KEY, JSON.stringify(puntos));
      }
    } catch {}
  };

  //Abrir modal edición
  const handleOpenEdit = (user) => {
    setEditUser(user);
    setEditIngresos((user.ingresos ?? 0).toString());
    setEditMeta((user.meta ?? 0).toString());
    setEditFrecuencia(user.frecuenciaMeta || "mensual");
  };

  //Guardar edición
  const handleSaveEdit = () => {
    setUsuarios((prev) =>
      prev.map((u) =>
        u.id === editUser.id
          ? {
              ...u,
              ingresos: parseFloat(editIngresos) || 0,
              meta: parseFloat(editMeta) || 0,
              frecuenciaMeta: editFrecuencia,
            }
          : u
      )
    );
    setEditUser(null);
  };

  //Reset general
  const handleResetAll = () => {
    if (
      !window.confirm(
        "Esto borrará TODOS los usuarios, tareas, compras, gastos y puntos. ¿Continuar?"
      )
    ) {
      return;
    }
    localStorage.removeItem(USUARIOS_KEY);
    localStorage.removeItem(TAREAS_KEY);
    localStorage.removeItem(COMPRAS_KEY);
    localStorage.removeItem(GASTOS_KEY);
    localStorage.removeItem(PUNTOS_KEY);
    setUsuarios([]);
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 5 }}>
      <Card>
        <CardContent>
          <Typography variant="h4" gutterBottom>
            Registro de Usuarios
          </Typography>

          
          <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
            <Button color="error" variant="contained" onClick={handleResetAll}>
              Resetear todo
            </Button>
          </Stack>

          
          <TextField
            fullWidth
            label="Nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Correo"
            type="email"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Contraseña"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Ingresos"
            type="number"
            value={ingresos}
            onChange={(e) => setIngresos(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Meta de ahorro"
            type="number"
            value={meta}
            onChange={(e) => setMeta(e.target.value)}
            sx={{ mb: 2 }}
          />

         
          <Select
            fullWidth
            value={frecuenciaMeta}
            onChange={(e) => setFrecuenciaMeta(e.target.value)}
            sx={{ mb: 2 }}
          >
            <MenuItem value="semanal">Semanal</MenuItem>
            <MenuItem value="mensual">Mensual</MenuItem>
          </Select>

          <Button variant="contained" onClick={handleAdd}>
            Registrar
          </Button>

          
          <Typography variant="h6" sx={{ mt: 3 }}>
            Usuarios
          </Typography>
          <List>
            {usuarios.map((u) => (
              <ListItem
                key={u.id}
                secondaryAction={
                  <>
                    <IconButton edge="end" onClick={() => handleOpenEdit(u)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton edge="end" onClick={() => handleDelete(u.id)}>
                      <DeleteIcon />
                    </IconButton>
                  </>
                }
              >
                <ListItemText
                  primary={`${u.nombre} (💵 ${u.ingresos}, Meta: ${u.meta} - ${u.frecuenciaMeta})`}
                  secondary={u.correo}
                />
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>

     
      <Dialog open={!!editUser} onClose={() => setEditUser(null)}>
        <DialogTitle>Editar Usuario</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            label="Ingresos"
            type="number"
            fullWidth
            value={editIngresos}
            onChange={(e) => setEditIngresos(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Meta de ahorro"
            type="number"
            fullWidth
            value={editMeta}
            onChange={(e) => setEditMeta(e.target.value)}
            sx={{ mb: 2 }}
          />
          <Select
            fullWidth
            value={editFrecuencia}
            onChange={(e) => setEditFrecuencia(e.target.value)}
          >
            <MenuItem value="semanal">Semanal</MenuItem>
            <MenuItem value="mensual">Mensual</MenuItem>
          </Select>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditUser(null)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSaveEdit}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default Usuarios;