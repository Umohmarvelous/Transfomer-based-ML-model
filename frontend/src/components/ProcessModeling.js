import React, { useState, useEffect } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import axios from 'axios';
import {
  Paper,
  Typography,
  Box,
  IconButton,
  Tooltip,
  LinearProgress,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Save as SaveIcon
} from '@mui/icons-material';
import './ProcessModeling.css';

const ProcessStep = ({ id, text, index, moveStep, onDelete, onEdit }) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'STEP',
    item: { id, index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: 'STEP',
    hover: (draggedItem) => {
      if (draggedItem.index !== index) {
        moveStep(draggedItem.index, index);
        draggedItem.index = index;
      }
    },
  });

  return (
    <div
      ref={(node) => drag(drop(node))}
      className={`process-step ${isDragging ? 'dragging' : ''}`}
    >
      <Box sx={{ flex: 1 }}>
        <Typography variant="body1">{text}</Typography>
      </Box>
      <Box sx={{ display: 'flex', gap: 1 }}>
        <Tooltip title="Edit Step">
          <IconButton size="small" onClick={() => onEdit(id)}>
            <EditIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Delete Step">
          <IconButton size="small" onClick={() => onDelete(id)}>
            <DeleteIcon />
          </IconButton>
        </Tooltip>
      </Box>
    </div>
  );
};

const ProcessModelingContent = () => {
  const [steps, setSteps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    fetchProcessModel();
  }, []);

  const fetchProcessModel = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/process-model');
      setSteps(response.data.steps);
      setError(null);
    } catch (err) {
      setError('Failed to fetch process model');
      showSnackbar('Failed to fetch process model', 'error');
    } finally {
      setLoading(false);
    }
  };

  const moveStep = (dragIndex, hoverIndex) => {
    const draggedStep = steps[dragIndex];
    const newSteps = [...steps];
    newSteps.splice(dragIndex, 1);
    newSteps.splice(hoverIndex, 0, draggedStep);
    setSteps(newSteps);
  };

  const handleDelete = async (id) => {
    try {
      const newSteps = steps.filter(step => step.id !== id);
      await axios.post('http://localhost:5000/api/process-model', { steps: newSteps });
      setSteps(newSteps);
      showSnackbar('Step deleted successfully', 'success');
    } catch (err) {
      showSnackbar('Failed to delete step', 'error');
    }
  };

  const handleEdit = (id) => {
    const step = steps.find(s => s.id === id);
    if (step) {
      // Implement edit functionality here
      showSnackbar('Edit functionality coming soon', 'info');
    }
  };

  const handleSave = async () => {
    try {
      await axios.post('http://localhost:5000/api/process-model', { steps });
      showSnackbar('Process model saved successfully', 'success');
    } catch (err) {
      showSnackbar('Failed to save process model', 'error');
    }
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  if (loading) {
    return (
      <Box sx={{ width: '100%', mt: 4 }}>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Box className="process-modeling-container">
      <Typography variant="h4" component="h2" gutterBottom>
        Process Modeling
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Tooltip title="Save Changes">
          <IconButton
            color="primary"
            onClick={handleSave}
            disabled={loading}
          >
            <SaveIcon />
          </IconButton>
        </Tooltip>
      </Box>

      <Paper elevation={3} className="process-steps-container">
        {steps.map((step, index) => (
          <ProcessStep
            key={step.id}
            id={step.id}
            text={step.text}
            index={index}
            moveStep={moveStep}
            onDelete={handleDelete}
            onEdit={handleEdit}
          />
        ))}
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

const ProcessModeling = () => {
  return (
    <DndProvider backend={HTML5Backend}>
      <ProcessModelingContent />
    </DndProvider>
  );
};

export default ProcessModeling; 