import React, { useEffect, useRef, useState } from "react";
import { Card, Typography, List, Box, useTheme } from "@mui/material";
import { dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import DraggableTask from "./DraggableTask";

function KanbanColumn({ usuario, userId, tasks, onDeleteTask, onToggleTask, onReassign }) {
  const ref = useRef(null);
  const [isOver, setIsOver] = useState(false);
  const theme = useTheme();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const cleanupDrop = dropTargetForElements({
      element: el,
      onDragEnter: () => setIsOver(true),
      onDragLeave: () => setIsOver(false),
      onDrop: ({ source }) => {
        setIsOver(false);
        const taskId = source.data.id;
        if (onReassign) onReassign(taskId, userId || null);
      },
    });

    return () => cleanupDrop();
  }, [userId, onReassign]);

  return (
    <Card
      ref={ref}
      sx={{
        p: 2,
        minHeight: 500,
        height: '100%',
        backgroundColor: isOver ? 'rgba(0, 176, 255, 0.1)' : theme.palette.background.paper,
        borderTop: `4px solid ${isOver ? theme.palette.secondary.main : theme.palette.primary.main}`,
        transition: "background-color 0.2s ease-in-out, border-color 0.2s ease-in-out",
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, textAlign: 'center' }}>
        {usuario}
      </Typography>

      <List sx={{ flexGrow: 1, overflowY: 'auto', p: 0 }}>
        {tasks.length > 0 ? (
          tasks.map((task) => (
            <DraggableTask
              key={task.id}
              task={task}
              onDeleteTask={onDeleteTask}
              onToggleTask={onToggleTask}
            />
          ))
        ) : (
          <Box sx={{ textAlign: 'center', p: 4, color: 'text.secondary', border: `2px dashed ${theme.palette.divider}`, borderRadius: 2 }}>
            <Typography variant="body2">No hay tareas por aquí...</Typography>
          </Box>
        )}
      </List>
    </Card>
  );
}

export default KanbanColumn;