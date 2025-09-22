import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Grid, Card, CardContent, Typography, Button, CircularProgress, Alert, Container, Box, useTheme, alpha, IconButton } from "@mui/material";
import AssignmentIcon from "@mui/icons-material/Assignment";
import MoneyOffIcon from "@mui/icons-material/MoneyOff";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import RedeemIcon from "@mui/icons-material/Redeem";
import { MiHogar } from './MiHogar';
import { GestionHogar } from './GestionHogar';
import { draggable } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import TestEmail from "./TestEmail";

const initialSections = [
  {
    id: "tareas",
    title: "Tareas",
    description: "Gestiona tus tareas pendientes",
    route: "/tareas",
    icon: <AssignmentIcon sx={{ fontSize: 50 }} />,
    gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "#667eea"
  },
  {
    id: "gastos",
    title: "Gastos",
    description: "Monitorea tus gastos diarios",
    route: "/gastos",
    icon: <MoneyOffIcon sx={{ fontSize: 50 }} />,
    gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    color: "#f5576c"
  },
  {
    id: "objetivos",
    title: "Objetivos",
    description: "Define y sigue tus metas",
    route: "/objetivos",
    icon: <EmojiEventsIcon sx={{ fontSize: 50 }} />,
    gradient: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
    color: "#4facfe"
  },
  {
    id: "recompensas",
    title: "Recompensas",
    description: "Disfruta tus logros con recompensas",
    route: "/recompensas",
    icon: <RedeemIcon sx={{ fontSize: 50 }} />,
    gradient: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
    color: "#43e97b"
  },
];

const mockSections = [
  {
    id: 'tasks',
    title: 'Tareas',
    description: 'Organiza las tareas del hogar.',
    route: '/tareas',
    icon: <AssignmentIcon sx={{ fontSize: 40 }} />,
    gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "#667eea"
  },
  {
    id: 'gastos',
    title: 'Gastos',
    description: 'Controla los gastos mensuales.',
    route: '/gastos',
    icon: <MoneyOffIcon sx={{ fontSize: 40 }} />,
    gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    color: "#f5576c"
  },
  {
    id: 'objetivos',
    title: 'Objetivos',
    description: 'Define y sigue tus metas de ahorro.',
    route: '/objetivos',
    icon: <EmojiEventsIcon sx={{ fontSize: 40 }} />,
    gradient: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
    color: "#4facfe"
  },
  {
    id: 'recompensas',
    title: 'Recompensas',
    description: 'Canjea puntos por premios.',
    route: '/recompensas',
    icon: <RedeemIcon sx={{ fontSize: 40 }} />,
    gradient: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
    color: "#43e97b"
  },
];

// Componente para el fondo con parallax
const ParallaxBackground = () => {
  const [scrollY, setScrollY] = useState(0);
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const lightBackground = `
    radial-gradient(circle at 20% 50%, rgba(120, 119, 198, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 40% 80%, rgba(120, 219, 255, 0.1) 0%, transparent 50%),
    linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)
  `;

  const darkBackground = `
    radial-gradient(circle at 20% 50%, rgba(120, 119, 198, 0.05) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.05) 0%, transparent 50%),
    radial-gradient(circle at 40% 80%, rgba(120, 219, 255, 0.05) 0%, transparent 50%),
    linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)
  `;

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '120%',
        zIndex: -2,
        background: isDark ? darkBackground : lightBackground,
        transform: `translateY(${scrollY * 0.5}px)`,
      }}
    />
  );
};

// Componente para las partículas flotantes
const FloatingParticles = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const particles = Array.from({ length: 15 }, (_, i) => (
    <Box
      key={i}
      sx={{
        position: 'absolute',
        width: `${Math.random() * 10 + 5}px`,
        height: `${Math.random() * 10 + 5}px`,
        borderRadius: '50%',
        background: isDark
          ? `rgba(${Math.random() * 100 + 100}, ${Math.random() * 100 + 100}, ${Math.random() * 100 + 200}, 0.1)`
          : `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 0.1)`,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        animation: `float ${Math.random() * 6 + 4}s ease-in-out infinite`,
        animationDelay: `${Math.random() * 2}s`,
        '@keyframes float': {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-20px) rotate(180deg)' },
        },
      }}
    />
  ));

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: -1,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      {particles}
    </Box>
  );
};

function Dashboard() {
  const [sections, setSections] = useState([]);
  const [error, setError] = useState(null);
  const [hogar, setHogar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEmailTester, setShowEmailTester] = useState(false);
  const theme = useTheme();

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
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 200) {
        const data = await response.json();
        setHogar(data);
      } else {
        const errorData = await response.json().catch(() => ({ msg: "Error de red." }));
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

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
        }}
      >
        <CircularProgress size={60} sx={{ color: 'white' }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="sm" sx={{ mt: 4 }}>
        <Alert
          severity="error"
          sx={{
            borderRadius: 3,
            boxShadow: theme.shadows[3]
          }}
        >
          {error}
        </Alert>
      </Container>
    );
  }

  if (!hogar) {
    return <GestionHogar onHogarChange={fetchHogar} />;
  }

  return (
    <>
      <ParallaxBackground />
      <FloatingParticles />

      <Container maxWidth="xl" sx={{ padding: "60px 20px", position: 'relative', zIndex: 1 }}>
        {/* Header con efecto glassmorphism */}
        <Box
          sx={{
            textAlign: 'center',
            mb: 6,
            p: 4,
            borderRadius: 4,
            background: alpha(theme.palette.background.paper, 0.1),
            backdropFilter: 'blur(20px)',
            border: `1px solid ${alpha(theme.palette.common.white, 0.2)}`,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          }}
        >
          <Typography
            variant="h3"
            sx={{
              fontWeight: 700,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 2,
            }}
          >
            Dashboard de {hogar.nombre}
          </Typography>
          <Typography
            variant="h6"
            sx={{
              color: theme.palette.text.secondary,
              fontWeight: 300
            }}
          >
            Gestiona tu hogar de manera inteligente y eficiente
          </Typography>
          <Typography>
            <Button
              variant="outlined"
              onClick={() => setShowEmailTester(!showEmailTester)}
              sx={{ mb: 3 }}
            >
              {showEmailTester ? 'Ocultar Probador email' : 'Mostrar probador'}
            </Button>
            {showEmailTester && <TestEmail />}
          </Typography>

        </Box>

        <Grid container spacing={3} sx={{ justifyContent: 'center' }}>
          {sections.map((section, index) => (
            <Grid item xs={12} sm={6} md={3} lg={3} xl={3} key={section.id} sx={{ display: 'flex' }}>
              <EnhancedCard
                section={section}
                index={index}
              />
            </Grid>
          ))}
        </Grid>

        <MiHogar />
      </Container >
    </>
  );
}

function EnhancedCard({ section, index }) {
  const ref = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isOver, setIsOver] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const handleMouseMove = (e) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    setMousePosition({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  };

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
      },
    });

    return () => {
      cleanupDrag();
      cleanupDrop();
    };
  }, [section.id]);

  const cardBackground = isDark
    ? `
        radial-gradient(
          circle at ${mousePosition.x}% ${mousePosition.y}%, 
          ${alpha(section.color, 0.1)} 0%, 
          transparent 50%
        ),
        ${alpha('#2d2d2d', 0.95)}
      `
    : `
        radial-gradient(
          circle at ${mousePosition.x}% ${mousePosition.y}%, 
          ${alpha(section.color, 0.1)} 0%, 
          transparent 50%
        ),
        ${alpha(theme.palette.background.paper, 0.95)}
      `;

  return (
    <Card
      ref={ref}
      onMouseMove={handleMouseMove}
      sx={{
        width: '100%',
        minHeight: 280,
        display: "flex",
        flexDirection: "column",
        position: 'relative',
        cursor: "grab",
        borderRadius: 4,
        overflow: 'hidden',
        transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        transform: isDragging ? "scale(1.05) rotate(5deg)" : "scale(1)",
        boxShadow: isDragging
          ? (isDark ? '0 25px 50px rgba(0, 0, 0, 0.5)' : '0 25px 50px rgba(0, 0, 0, 0.25)')
          : isOver
            ? (isDark ? '0 20px 40px rgba(0, 0, 0, 0.3)' : '0 20px 40px rgba(0, 0, 0, 0.15)')
            : (isDark ? '0 10px 30px rgba(0, 0, 0, 0.2)' : '0 10px 30px rgba(0, 0, 0, 0.1)'),

        // Efecto de background que sigue al mouse
        background: cardBackground,

        // Borde con gradiente
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          borderRadius: 4,
          padding: '2px',
          background: section.gradient,
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'subtract',
          maskComposite: 'subtract',
        },

        "&:hover": {
          transform: "scale(1.03) translateY(-5px)",
          boxShadow: isDark ? '0 20px 40px rgba(0, 0, 0, 0.3)' : '0 20px 40px rgba(0, 0, 0, 0.15)',
        },

        "&:active": {
          cursor: "grabbing",
        }
      }}
    >
      {/* Efecto de brillo superior */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '1px',
          background: section.gradient,
          opacity: 0.8,
        }}
      />

      <CardContent sx={{ p: 3, textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        {/* Icono con efecto de gradiente */}
        <Box
          sx={{
            mb: 2,
            p: 2,
            borderRadius: '50%',
            background: alpha(section.color, 0.1),
            display: 'inline-flex',
            alignSelf: 'center',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'scale(1.1) rotate(10deg)',
              background: alpha(section.color, 0.2),
            }
          }}
        >
          <Box sx={{ color: section.color }}>
            {section.icon}
          </Box>
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              mb: 1,
              color: theme.palette.text.primary
            }}
          >
            {section.title}
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: theme.palette.text.secondary,
              lineHeight: 1.5,
              fontSize: '0.9rem'
            }}
          >
            {section.description}
          </Typography>
        </Box>

        <Button
          component={Link}
          to={section.route}
          variant="contained"
          size="medium"
          sx={{
            borderRadius: 3,
            py: 1,
            px: 3,
            background: section.gradient,
            boxShadow: `0 4px 15px ${alpha(section.color, 0.4)}`,
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '0.9rem',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: `0 6px 20px ${alpha(section.color, 0.6)}`,
              background: section.gradient,
            }
          }}
        >
          Explorar {section.title}
        </Button>
      </CardContent>

      {/* Efecto de partículas en las esquinas */}
      <Box
        sx={{
          position: 'absolute',
          top: 10,
          right: 10,
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: section.color,
          opacity: 0.6,
          animation: 'pulse 2s ease-in-out infinite',
          '@keyframes pulse': {
            '0%, 100%': { opacity: 0.6, transform: 'scale(1)' },
            '50%': { opacity: 1, transform: 'scale(1.2)' },
          },
        }}
      />
    </Card>
  );
}

export default Dashboard;