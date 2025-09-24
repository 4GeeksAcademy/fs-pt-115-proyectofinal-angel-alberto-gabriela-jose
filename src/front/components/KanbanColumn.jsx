import React, { useEffect, useRef, useState } from "react";
import { Card, Typography, List, IconButton, useTheme } from "@mui/material";
import PersonRemoveIcon from "@mui/icons-material/PersonRemove";
import { dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import DraggableTask from "./DraggableTask";

function KanbanColumn({usuario,userId,tasks,onDeleteTask,onToggleTask,onReassign,onDeleteUser,}) {
  const ref = useRef(null);
  const [isOver, setIsOver] = useState(false);
  const theme = useTheme();

  useEffect(() => {
    if (!ref.current) return;

    const cleanupDrop = dropTargetForElements({
      element: ref.current,
      onDragEnter: () => setIsOver(true),
      onDragLeave: () => setIsOver(false),
      onDrop: ({ source }) => {
        setIsOver(false);
        const taskId = source.data.id;
        if (onReassign) onReassign(taskId, userId || null);
      },
    });

    return () => {
      cleanupDrop();
    };
  }, [userId, onReassign]);

  return (
    <Card
      ref={ref}
      sx={{
        p: 1,
        minHeight: 400,
        flex: 1,
        backgroundColor: isOver ? theme.palette.action.hover : theme.palette.background.default,
        transition: "all 0.2s ease-in-out",
      }}
    >
      <Typography
        variant="h6"
        align="center"
        gutterBottom
        sx={{ display: "flex", justifyContent: "center", alignItems: "center" }}
      >
        {usuario}
        {onDeleteUser && (
          <IconButton
            size="small"
            color="error"
            sx={{ ml: 1 }}
            onClick={onDeleteUser}
          >
            <PersonRemoveIcon fontSize="small" />
          </IconButton>
        )}
      </Typography>

      <List>
        {tasks.map((task) => (
          <DraggableTask
            key={task.id}
            task={task}
            onDeleteTask={onDeleteTask}
            onToggleTask={onToggleTask}
          />
        ))}
      </List>
    </Card>
  );
}

export default KanbanColumn;