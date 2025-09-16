<<<<<<< HEAD
import React, { useState, useEffect, useRef, useState as useReactState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Grid, Card, CardContent, Typography, Button, Alert, CircularProgress } from "@mui/material";
=======
import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Grid, Card, CardContent, Typography, Button, CircularProgress, Alert, Container } from "@mui/material";
>>>>>>> e5a32c76451fcb28e4526fc31afa631c774ff836
import AssignmentIcon from "@mui/icons-material/Assignment";
import MoneyOffIcon from "@mui/icons-material/MoneyOff";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import RedeemIcon from "@mui/icons-material/Redeem";
import { MiHogar } from './MiHogar';
import { GestionHogar } from './GestionHogar';

import { draggable } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";

const initialSections = [
  { id: "tareas", title: "Tareas", description: "Gestiona tus tareas pendientes", route: "/tareas", icon: <AssignmentIcon sx={{ fontSize: 50, color: "primary.main" }} /> },
  { id: "gastos", title: "Gastos", description: "Monitorea tus gastos diarios", route: "/gastos", icon: <MoneyOffIcon sx={{ fontSize: 50, color: "error.main" }} /> },
  { id: "objetivos", title: "Objetivos", description: "Define y sigue tus metas", route: "/objetivos", icon: <EmojiEventsIcon sx={{ fontSize: 50, color: "success.main" }} /> },
  { id: "recompensas", title: "Recompensas", description: "Disfruta tus logros con recompensas", route: "/recompensas", icon: <RedeemIcon sx={{ fontSize: 50, color: "warning.main" }} /> },
];

const mockSections = [
    { id: 'tasks', title: 'Tareas', description: 'Organiza las tareas del hogar.', route: '/tareas', icon: 'assignment' },
    { id: 'gastos', title: 'Gastos', description: 'Controla los gastos mensuales.', route: '/gastos', icon: 'money' },
    { id: 'objetivos', title: 'Objetivos', description: 'Define y sigue tus metas de ahorro.', route: '/objetivos', icon: 'goals' },
    { id: 'recompensas', title: 'Recompensas', description: 'Canjea puntos por premios.', route: '/recompensas', icon: 'reward' },
];

function Dashboard() {
<<<<<<< HEAD
  const [sections, setSections] = useState(initialSections);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userPoints, setUserPoints] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const token = localStorage.getItem("authToken");
        if (!token) {
          navigate("/login"); //si no hay token, redirigimos
          return;
        }

        const resp = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/dashboard`, {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        });

        if (resp.status === 401) {
          localStorage.removeItem("authToken");
          localStorage.removeItem("user");
          navigate("/login"); //si token no es válido, redirigimos
          return;
        }

        if (!resp.ok) throw new Error("Error al cargar el dashboard.");
        const data = await resp.json();
        console.log(" Dashboard data:", data);
        setUserPoints(data.user_points);
      } catch (err) {
        console.error("Error conectando al backend:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [navigate]);

  const handleReorder = (sourceId, targetId) => {
    if (sourceId === targetId) return;
    const sourceIndex = sections.findIndex((s) => s.id === sourceId);
    const targetIndex = sections.findIndex((s) => s.id === targetId);
    const newSections = [...sections];
    const [moved] = newSections.splice(sourceIndex, 1);
    newSections.splice(targetIndex, 0, moved);
    setSections(newSections);
  };

  return (
    <div style={{ padding: "40px" }}>
      <Typography variant="h4" gutterBottom>Dashboard</Typography>

      {loading && <CircularProgress sx={{ display: "block", margin: "20px auto" }} />}

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {!loading && !error && userPoints !== null && (
        <Alert severity="success" sx={{ mb: 3 }}>
          🏆 Puntos acumulados: <strong>{userPoints}</strong>
        </Alert>
      )}

      {!loading && !error && (
        <Grid container spacing={3}>
          {sections.map((section) => (
            <DraggableCard key={section.id} section={section} onReorder={handleReorder} />
          ))}
        </Grid>
      )}
    </div>
=======
  const [sections, setSections] = useState([]);
  const [error, setError] = useState(null);
  const [hogar, setHogar] = useState(null);
  const [loading, setLoading] = useState(true);

  // Esta función ahora se encarga de verificar si el usuario tiene un hogar.
  const fetchHogar = async () => {
    setLoading(true);
    setError(null);
    const token = localStorage.getItem('authToken');

    if (!token) {
        setHogar(null);
        setLoading(false);
        return;
    }

    try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/hogar`, {
            headers: { 
                'Authorization': `Bearer ${token}` // **CORRECCIÓN CLAVE: Se envía el token**
            }
        });
        
        if (response.status === 200) {
            const data = await response.json();
            setHogar(data);
        } else {
             const errorData = await response.json().catch(() => ({ msg: "Error de red."}));
             throw new Error(errorData.msg || 'No se pudo cargar la información del hogar.');
        }
    } catch (err) {
        setError(err.message);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchHogar();
    setSections(mockSections);
  }, []);

  if (loading) return <CircularProgress sx={{ display: "block", margin: "50px auto" }} />;
  if (error) return <Alert severity="error" sx={{m: 2}}>{error}</Alert>;

  if (!hogar) {
    return <GestionHogar onHogarChange={fetchHogar} />;
  }

  return (
    <Container maxWidth="lg" sx={{ padding: "40px" }}>
      <Typography variant="h4" gutterBottom>
        Dashboard de {hogar.nombre}
      </Typography>
      <Grid container spacing={3}>
        {sections.map((section) => (
          <DraggableCard key={section.id} section={section} />
        ))}
      </Grid>
      
      <MiHogar />
    </Container>
>>>>>>> e5a32c76451fcb28e4526fc31afa631c774ff836
  );
}

function DraggableCard({ section, onReorder }) {
  const ref = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isOver, setIsOver] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const cleanupDrag = draggable({
      element: el,
      getInitialData: () => ({ id: section.id }),
      onDragStart: () => setIsDragging(true),
      onDrop: () => setIsDragging(false),
    });

    const cleanupDrop = dropTargetForElements({
      element: el,
      onDragEnter: () => setIsOver(true),
      onDragLeave: () => setIsOver(false),
      onDrop: ({ source }) => {
        setIsOver(false);
        onReorder(source.data.id, section.id);
      },
    });

    return () => {
      cleanupDrag();
      cleanupDrop();
    };
  }, [section.id, onReorder]);

  return (
    <Grid item xs={12} sm={6} md={4}>
      <Card
        ref={ref}
        sx={{
          minHeight: 220,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          alignItems: "center",
          textAlign: "center",
          p: 2,
          cursor: "grab",
          transition: "all 0.25s ease-in-out",
          boxShadow: isDragging ? 6 : isOver ? 4 : 1,
          backgroundColor: isDragging ? "#e3f2fd" : isOver ? "#f1f8e9" : "background.paper",
          transform: isDragging ? "scale(1.05)" : "scale(1)",
          "&:hover": { transform: "scale(1.02)", boxShadow: 3 },
        }}
      >
        <CardContent>
          {section.icon}
          <Typography variant="h6">{section.title}</Typography>
          <Typography variant="body2" color="text.secondary">{section.description}</Typography>
          <Button component={Link} to={section.route} variant="contained" size="small">
            Ir a {section.title}
          </Button>
        </CardContent>
      </Card>
    </Grid>
  );
}

export default Dashboard;