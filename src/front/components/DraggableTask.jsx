import React, { useEffect, useRef, useState } from "react";
import { ListItem, ListItemText, Checkbox, IconButton, useTheme } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { draggable } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";

function DraggableTask({ task, onDeleteTask, onToggleTask }) {
  const ref = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const theme = useTheme();

  useEffect(() => {
    if (!ref.current) return;

    const cleanupDrag = draggable({
      element: ref.current,
      getInitialData: () => ({ id: task.id }),
      onDragStart: () => setIsDragging(true),
      onDrop: () => setIsDragging(false),
    });

    return () => {
      cleanupDrag();
    };
  }, [task.id]);

  return (
    <ListItem
      ref={ref}
      sx={{
        cursor: "grab",
        backgroundColor: isDragging ? theme.palette.action.hover : theme.palette.background.paper,
        mb: 1,
        borderRadius: 1,
        boxShadow: isDragging ? 3 : 1,
        transition: "all 0.2s ease-in-out",
      }}
      secondaryAction={
        <IconButton edge="end" onClick={() => onDeleteTask(task.id)}>
          <DeleteIcon />
        </IconButton>
      }
    >
      <Checkbox
        checked={task.estado === "completada"}
        onChange={() => onToggleTask(task.id, task.estado)}
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