import React, { useState, useEffect } from "react";
import {
  Container,Card,CardContent,Typography,Table,
  TableBody,TableCell,TableContainer,TableHead,TableRow,Paper,Grid,
} from "@mui/material";

const PUNTOS_KEY = "puntosPorUsuario";
const USUARIOS_KEY = "usuarios";
const GASTOS_KEY = "gastosMensuales";

function Ranking() {
  const [usuarios, setUsuarios] = useState([]);
  const [puntos, setPuntos] = useState({});
  const [gastos, setGastos] = useState([]);

  useEffect(() => {
    try {
      const u = JSON.parse(localStorage.getItem(USUARIOS_KEY)) || [];
      setUsuarios(u);

      const p = JSON.parse(localStorage.getItem(PUNTOS_KEY)) || {};
      setPuntos(p);

      const g = JSON.parse(localStorage.getItem(GASTOS_KEY)) || [];
      setGastos(g);
    } catch {
      setUsuarios([]);
      setPuntos({});
      setGastos([]);
    }
  }, []);

  // Calcular subtotales de gastos por usuario
  const subtotales = gastos.reduce((acc, g) => {
    acc[g.usuario] = (acc[g.usuario] || 0) + (g.monto || 0);
    return acc;
  }, {});

  // Construir datos por usuario
  const data = usuarios.map((u) => {
    const puntosUsuario = puntos[u.nombre] || 0;
    const gastado = subtotales[u.nombre] || 0;
    const disponible = (u.ingresos || 0) - (u.meta || 0);
    const ahorro = disponible - gastado; // 💰 cuánto logró ahorrar

    return {
      nombre: u.nombre,
      puntos: puntosUsuario,
      ahorro: ahorro > 0 ? ahorro : 0,
    };
  });

  // Ordenar rankings
  const rankingPuntos = [...data].sort((a, b) => b.puntos - a.puntos);
  const rankingAhorro = [...data].sort((a, b) => b.ahorro - a.ahorro);

  return (
    <Container maxWidth="lg" sx={{ mt: 5 }}>
      <Typography variant="h4" gutterBottom>
        🏆 Ranking de Competencia
      </Typography>

      <Grid container spacing={3}>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                ⭐ Ranking por Puntos
              </Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Posición</TableCell>
                      <TableCell>Usuario</TableCell>
                      <TableCell>Puntos</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rankingPuntos.map((r, index) => (
                      <TableRow key={r.nombre}>
                        <TableCell>#{index + 1}</TableCell>
                        <TableCell>{r.nombre}</TableCell>
                        <TableCell>{r.puntos}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                💰 Ranking por Ahorro
              </Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Posición</TableCell>
                      <TableCell>Usuario</TableCell>
                      <TableCell>Ahorro</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rankingAhorro.map((r, index) => (
                      <TableRow key={r.nombre}>
                        <TableCell>#{index + 1}</TableCell>
                        <TableCell>{r.nombre}</TableCell>
                        <TableCell>${r.ahorro.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
}

export default Ranking;