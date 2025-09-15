import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Grid, Card, CardContent, Typography, Button, CircularProgress, Alert, Container } from "@mui/material";
import AssignmentIcon from "@mui/icons-material/Assignment";
import MoneyOffIcon from "@mui/icons-material/MoneyOff";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import RedeemIcon from "@mui/icons-material/Redeem";
import { MiHogar } from './MiHogar';
import { GestionHogar } from './GestionHogar';

import { draggable } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";

const iconMap = {
  assignment: <AssignmentIcon sx={{ fontSize: 50, color: "primary.main" }} />,
  money: <MoneyOffIcon sx={{ fontSize: 50, color: "error.main" }} />,
  goals: <EmojiEventsIcon sx={{ fontSize: 50, color: "success.main" }} />,
  reward: <RedeemIcon sx={{ fontSize: 50, color: "warning.main" }} />,
};

const mockSections = [
    { id: 'tasks', title: 'Tareas', description: 'Organiza las tareas del hogar.', route: '/tareas', icon: 'assignment' },
    { id: 'gastos', title: 'Gastos', description: 'Controla los gastos mensuales.', route: '/gastos', icon: 'money' },
    { id: 'objetivos', title: 'Objetivos', description: 'Define y sigue tus metas de ahorro.', route: '/objetivos', icon: 'goals' },
    { id: 'recompensas', title: 'Recompensas', description: 'Canjea puntos por premios.', route: '/recompensas', icon: 'reward' },
];

function Dashboard() {
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
  );
}

function DraggableCard({ section }) {
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
    });

    return () => {
      cleanupDrag();
      cleanupDrop();
    };
  }, [section.id]);

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
          "&:hover": {
            transform: "scale(1.02)",
            boxShadow: 3,
          },
        }}
      >
        <CardContent>
          {iconMap[section.icon]}
          <Typography variant="h6" component="div" gutterBottom>
            {section.title}
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {section.description}
          </Typography>
          <Button component={Link} to={section.route} variant="contained" size="small">
            Ir a {section.title}
          </Button>
        </CardContent>
      </Card>
    </Grid>
  );
}

export default Dashboard;