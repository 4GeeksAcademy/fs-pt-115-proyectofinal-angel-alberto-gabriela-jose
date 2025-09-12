import React, { useState, useEffect } from "react";
import {
  Container,Card,CardContent,Typography,
  Grid,LinearProgress,Button,Stack,
} from "@mui/material";

function Objetivos() {
  const USUARIOS_KEY = "usuarios";
  const GASTOS_KEY = "gastosMensuales";
  const COMPRAS_KEY = "compras";

  const [usuarios, setUsuarios] = useState([]);
  const [gastos, setGastos] = useState([]);
  const [compras, setCompras] = useState([]);

  // función central para leer siempre del localStorage
  const loadData = () => {
    setUsuarios(JSON.parse(localStorage.getItem(USUARIOS_KEY)) || []);
    setGastos(JSON.parse(localStorage.getItem(GASTOS_KEY)) || []);
    setCompras(JSON.parse(localStorage.getItem(COMPRAS_KEY)) || []);
  };

  useEffect(() => {
    loadData();
    // si otra pestaña cambia algo, también refrescamos
    const onStorage = () => loadData();
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Unimos gastos y compras
  const movimientos = [...gastos, ...compras];

  // Subtotales por usuario (por nombre)
  const subtotales = movimientos.reduce((acc, m) => {
    if (!m?.usuario) return acc;
    acc[m.usuario] = (acc[m.usuario] || 0) + (Number(m.monto) || 0);
    return acc;
  }, {});

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
                    <Typography variant="h6" gutterBottom>
                      Presupuesto de {u.nombre}
                    </Typography>

                    <Typography sx={{ mb: 0.5 }}>
                      Meta de ahorro: <b>${meta.toFixed(2)}</b> ({freq})
                    </Typography>
                    <Typography sx={{ mb: 0.5 }}>
                      Ingresos declarados: <b>${ingresos.toFixed(2)}</b>
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
    </Container>
  );
}

export default Objetivos;