import React, { useState, useEffect } from "react";
import {
  Container, Card, CardContent, Typography,
  Grid, LinearProgress, Button, Stack, IconButton
} from "@mui/material";
import EditIcon from '@mui/icons-material/Edit';
import EditObjetivos from './EditObjetivos';



function Objetivos() {

  const [usuarios, setUsuarios] = useState([]);
  const [gastos, setGastos] = useState([]);
  const [compras, setCompras] = useState([]);

  const [open, setOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const loadData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error("No hay token de autenticacion");
        return;
      }
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/hogar/miembros`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error(`Error ${response.status}: No autorizado o token inválido.`);
      }

      const data = await response.json();
      setUsuarios(data);

    } catch (error) {
      console.error("Error al obtener los usuarios:", error);
    }
  };

  useEffect(() => {
    loadData();
  }, []);


  // Unimos gastos y compras
  const movimientos = [...gastos, ...compras];

  // Subtotales por usuario (por nombre)
  const subtotales = movimientos.reduce((acc, m) => {
    if (!m?.usuario) return acc;
    acc[m.usuario] = (acc[m.usuario] || 0) + (Number(m.monto) || 0);
    return acc;
  }, {});

  const handleEdit = (user) => {
    setSelectedUser(user);
    setOpen(true);
  };
  const handleSave = async (id, Values) => {
    try {
      const token = localStorage.getItem("token");
      await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/hogar/miembros/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(Values),
      });

      console.log("Usuario actualizado:", Values);

      setOpen(false);
      setSelectedUser(null);
      loadData();
    } catch (error) {
      console.error("Error al guardar cambios:", error);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 5 }}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 2 }}
      >
        <Typography variant="h4">Dashboard de Objetivos</Typography>
        <Button variant="outlined" onClick={loadData}>Refrescar</Button>
      </Stack>

      {usuarios.length === 0 ? (
        <Card>
          <CardContent>
            <Typography color="text.secondary">
              No hay usuarios registrados. Ve a <b>Usuarios</b> para crear uno.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {usuarios.map((u) => {
            const ingresos = Number(u.ingresos) || 0;
            const meta = Number(u.meta) || 0;
            const freq = u.frecuenciaMeta === "semanal" ? "semanal" : "mensual";

            // Presupuesto disponible = ingresos 
            const disponible = Math.max(0, ingresos - meta);
            const gastado = Number(subtotales[u.nombre] || 0);
            const restante = disponible - gastado;

            // Ahorro acumulado 
            const ahorro = meta + (restante > 0 ? restante : 0);

            const porcentaje =
              disponible > 0 ? Math.min(100, (gastado / disponible) * 100) : 0;

            return (
              <Grid item xs={12} md={6} key={u.id}>
                <Card>
                  <CardContent>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="h6" gutterBottom>
                        Presupuesto de {u.nombre}
                      </Typography>
                      <IconButton onClick={() => handleEdit(u)} color="primary">
                        <EditIcon />
                      </IconButton>
                    </Stack>

                    <Typography sx={{ mb: 0.5 }}>
                      Ingresos declarados: <b>${ingresos.toFixed(2)}</b>
                    </Typography>
                    <Typography sx={{ mb: 0.5 }}>
                      Meta de ahorro: <b>${meta.toFixed(2)}</b> ({freq})
                    </Typography>

                    <Typography sx={{ mt: 1 }}>
                      Disponible: 💵 <b>${disponible.toFixed(2)}</b> &nbsp;|&nbsp; Gastado: 💸{" "}
                      <b>${gastado.toFixed(2)}</b> &nbsp;|&nbsp; Restante: 💰{" "}
                      <b>${restante.toFixed(2)}</b>
                    </Typography>

                    <Typography
                      sx={{ mt: 1, fontWeight: "bold", color: "green" }}
                    >
                      Ahorro acumulado estimado: ⭐ ${ahorro.toFixed(2)} ({freq})
                    </Typography>

                    <LinearProgress
                      variant="determinate"
                      value={porcentaje}
                      sx={{ height: 10, borderRadius: 5, mt: 2 }}
                    />
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
      <EditObjetivos
        open={open}
        user={selectedUser}
        onClose={() => setOpen(false)}
        onSave={handleSave}
      />
    </Container>
  );
}

export default Objetivos;