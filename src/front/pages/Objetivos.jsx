import React, { useState, useEffect } from "react";
import {
  Container, Card, CardContent, Typography,
  Grid, LinearProgress, Button, Stack, CircularProgress, Alert
} from "@mui/material";

function Objetivos() {
  const [goals, setGoals] = useState([]);
  const [hogar, setHogar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchGoalsData = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error("No hay token de autenticación. Por favor, inicia sesión.");
      }

      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/dashboard`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.msg || `Error ${response.status}: No se pudieron obtener los datos.`);
      }

      const data = await response.json();
      setGoals(data.metas_hogar || []);
      setHogar(data.hogar);

    } catch (error) {
      console.error("Error al obtener los objetivos:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoalsData();
  }, []);

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 5, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 5 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 5 }}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 3 }}
      >
        <Typography variant="h4">
          Objetivos del Hogar: {hogar ? `"${hogar.nombre}"` : ""}
        </Typography>
        <Button variant="outlined" onClick={fetchGoalsData} disabled={loading}>
          Refrescar
        </Button>
      </Stack>

      {goals.length === 0 ? (
        <Card>
          <CardContent>
            <Typography color="text.secondary">
              Aún no se han establecido objetivos para este hogar. ¡Créalos desde el panel de administración!
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {goals.map((goal) => {
            const progreso = Number(goal.progreso) || 0;
            const meta = Number(goal.meta) || 0;
            const porcentaje = meta > 0 ? Math.min(100, (progreso / meta) * 100) : 0;

            return (
              <Grid item xs={12} md={6} key={goal.id}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {goal.title}
                    </Typography>
                    {goal.description && (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {goal.description}
                      </Typography>
                    )}
                    <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                      <Typography variant="body1">
                        Progreso: <b>${progreso.toFixed(2)}</b>
                      </Typography>
                      <Typography variant="body1" color="text.secondary">
                        Meta: <b>${meta.toFixed(2)}</b>
                      </Typography>
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={porcentaje}
                      sx={{ height: 12, borderRadius: 6, mb: 1 }}
                    />
                    <Typography variant="caption" color="text.secondary" align="right" component="div">
                      {porcentaje.toFixed(1)}% completado
                    </Typography>
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