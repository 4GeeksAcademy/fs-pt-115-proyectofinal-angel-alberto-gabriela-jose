import React, { useEffect, useRef, useState } from "react";
import { ListItem, ListItemText, Checkbox, IconButton, useTheme, Box } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { draggable } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";

function DraggableTask({ task, onDeleteTask, onToggleTask }) {
  const ref = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const theme = useTheme();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const cleanupDrag = draggable({
      element: el,
      getInitialData: () => ({ id: task.id }),
      onDragStart: () => setIsDragging(true),
      onDrop: () => setIsDragging(false),
    });

    return () => cleanupDrag();
  }, [task.id]);

  return (
    <ListItem
      ref={ref}
      sx={{
        backgroundColor: isDragging ? 'rgba(0, 176, 255, 0.2)' : theme.palette.background.default,
        border: `1px solid ${theme.palette.divider}`,
        mb: 1.5,
        borderRadius: 2,
        boxShadow: isDragging ? `0 0 15px ${theme.palette.primary.main}` : 'none',
        transition: "all 0.2s ease-in-out",
        display: 'flex',
        alignItems: 'center',
      }}
      secondaryAction={
        <IconButton edge="end" onClick={() => onDeleteTask(task.id)} sx={{color: 'text.secondary', '&:hover': { color: 'secondary.main' }}}>
          <DeleteIcon />
        </IconButton>
      }
    >
      <Box sx={{ cursor: 'grab', display: 'flex', alignItems: 'center', color: 'text.secondary', mr: 1 }}>
        <DragIndicatorIcon />
      </Box>
      <Checkbox
        checked={task.estado === "completada"}
        onChange={() => onToggleTask(task.id, task.estado)}
        color="primary"
      />
      <ListItemText
        primary={task.title}
        sx={{
          textDecoration: task.estado === "completada" ? "line-through" : "none",
          opacity: task.estado === "completada" ? 0.6 : 1,
        }}
      />
    </ListItem>
  );
}

export default DraggableTask;