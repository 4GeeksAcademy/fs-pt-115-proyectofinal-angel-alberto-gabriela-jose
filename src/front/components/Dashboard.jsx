import React, { useState, useEffect, useRef, useState as useReactState } from "react";
import { Link } from "react-router-dom";
import { Grid, Card, CardContent, Typography, Button, CircularProgress, Alert } from "@mui/material";
import AssignmentIcon from "@mui/icons-material/Assignment";
import MoneyOffIcon from "@mui/icons-material/MoneyOff";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import RedeemIcon from "@mui/icons-material/Redeem";

import { draggable } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";

const iconMap = {
  assignment: <AssignmentIcon sx={{ fontSize: 50, color: "primary.main" }} />,
  money: <MoneyOffIcon sx={{ fontSize: 50, color: "error.main" }} />,
  goals: <EmojiEventsIcon sx={{ fontSize: 50, color: "success.main" }} />,
  reward: <RedeemIcon sx={{ fontSize: 50, color: "warning.main" }} />,
};

function Dashboard() {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/dashboard`);
        if (!response.ok) throw new Error("Error al cargar el dashboard");
        const data = await response.json();
        setSections(data.sections);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) return <CircularProgress sx={{ display: "block", margin: "50px auto" }} />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <div style={{ padding: "40px" }}>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      <Grid container spacing={3}>
        {sections.map((section) => (
          <DraggableCard key={section.id} section={section} />
        ))}
      </Grid>
    </div>
  );
}

function DraggableCard({ section }) {
  const ref = useRef(null);
  const [isDragging, setIsDragging] = useReactState(false);
  const [isOver, setIsOver] = useReactState(false);

  useEffect(() => {
    if (!ref.current) return;

    const cleanupDrag = draggable({
      element: ref.current,
      getInitialData: () => ({ id: section.id }),
      onDragStart: () => setIsDragging(true),
      onDrop: () => setIsDragging(false),
    });

    const cleanupDrop = dropTargetForElements({
      element: ref.current,
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
          backgroundColor: isDragging ? "#e3f2fd" : isOver ? "#f1f8e9" : "white",
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