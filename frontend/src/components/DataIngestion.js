import React, { useState } from 'react';
import {
    Box,
    Button,
    Card,
    CardContent,
    Typography,
    Grid,
    FormControlLabel,
    Checkbox,
    Alert,
    CircularProgress,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Snackbar,
    Slide,
    Fade,
} from '@mui/material';
import axios from 'axios';

// API URL from environment variable
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Custom transition component for error messages
function SlideTransition(props) {
    return <Slide {...props} direction="up" />;
}

// Custom transition component for success messages
function FadeTransition(props) {
    return <Fade {...props} />;
}

const DataIngestion = () => {
    const [file, setFile] = useState(null);
    const [dataType, setDataType] = useState('csv');
    const [preprocessingSteps, setPreprocessingSteps] = useState({
        handle_missing: undefined,
        normalize: undefined,
        remove_duplicates: false
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [summary, setSummary] = useState(null);
    const [openError, setOpenError] = useState(false);
    const [openSuccess, setOpenSuccess] = useState(false);

    const handleFileChange = (event) => {
        const selectedFile = event.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            setError('');
            setSuccess('');
            setSummary(null);
        }
    };

    const handlePreprocessingChange = (event) => {
        const { name, checked } = event.target;
        setPreprocessingSteps(prev => {
            const newSteps = { ...prev };
            switch (name) {
                case 'cleanMissing':
                    newSteps.handle_missing = checked ? { strategy: 'mean' } : undefined;
                    break;
                case 'normalize':
                    newSteps.normalize = checked ? { method: 'minmax' } : undefined;
                    break;
                case 'removeDuplicates':
                    newSteps.remove_duplicates = checked;
                    break;
                default:
                    break;
            }
            return newSteps;
        });
    };

    const handleDataTypeChange = (event) => {
        setDataType(event.target.value);
    };

    const handleCloseError = () => {
        setOpenError(false);
    };

    const handleCloseSuccess = () => {
        setOpenSuccess(false);
    };

    const handleUpload = async () => {
        if (!file) {
            setError('Please select a file first');
            setOpenError(true);
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');
        setSummary(null);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('dataType', dataType);
        formData.append('preprocessing', JSON.stringify(preprocessingSteps));

        try {
            const response = await axios.post(`${API_URL}/api/ingest-data`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            setSuccess('Data processed successfully!');
            setOpenSuccess(true);
            setSummary(response.data.summary);
        } catch (err) {
            console.error('Upload error:', err);
            setError(err.response?.data?.error || 'Error processing data');
            setOpenError(true);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography variant="h4" gutterBottom sx={{
                color: '#2c3e50',
                fontWeight: 'bold',
                mb: { xs: 2, sm: 4 },
                textAlign: 'center',
                textShadow: '2px 2px 4px rgba(0,0,0,0.1)'
            }}>
                Data Ingestion
            </Typography>

            <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                    <Card elevation={3} sx={{
                        borderRadius: { xs: 2, sm: 3 },
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column'
                    }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Upload Data
                            </Typography>
                            <Box sx={{ mb: 3 }}>
                                <input
                                    accept=".csv,.json,.xls,.xlsx"
                                    style={{ display: 'none' }}
                                    id="file-upload"
                                    type="file"
                                    onChange={handleFileChange}
                                />
                                <label htmlFor="file-upload">
                                    <Button
                                        variant="contained"
                                        component="span"
                                        fullWidth
                                        sx={{
                                            mb: 2,
                                            py: { xs: 1, sm: 1.5 },
                                            borderRadius: 2
                                        }}
                                    >
                                        Choose File
                                    </Button>
                                </label>
                                {file && (
                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                        Selected: {file.name}
                                    </Typography>
                                )}
                            </Box>

                            <FormControl fullWidth sx={{ mb: 3 }}>
                                <InputLabel>Data Type</InputLabel>
                                <Select
                                    value={dataType}
                                    onChange={handleDataTypeChange}
                                    label="Data Type"
                                    sx={{ borderRadius: 2 }}
                                >
                                    <MenuItem value="csv">CSV</MenuItem>
                                    <MenuItem value="json">JSON</MenuItem>
                                    <MenuItem value="excel">Excel</MenuItem>
                                </Select>
                            </FormControl>

                            <Typography variant="subtitle1" gutterBottom>
                                Preprocessing Options
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={!!preprocessingSteps.handle_missing}
                                            onChange={handlePreprocessingChange}
                                            name="cleanMissing"
                                        />
                                    }
                                    label="Handle Missing Values"
                                />
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={!!preprocessingSteps.normalize}
                                            onChange={handlePreprocessingChange}
                                            name="normalize"
                                        />
                                    }
                                    label="Normalize Data"
                                />
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={preprocessingSteps.remove_duplicates}
                                            onChange={handlePreprocessingChange}
                                            name="removeDuplicates"
                                        />
                                    }
                                    label="Remove Duplicates"
                                />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                    <Card elevation={3} sx={{
                        borderRadius: { xs: 2, sm: 3 },
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column'
                    }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Process Data
                            </Typography>
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={handleUpload}
                                disabled={loading || !file}
                                fullWidth
                                sx={{
                                    mt: 2,
                                    py: { xs: 1, sm: 1.5 },
                                    borderRadius: 2
                                }}
                            >
                                {loading ? <CircularProgress size={24} /> : 'Process Data'}
                            </Button>

                            {summary && (
                                <Box sx={{ mt: 3 }}>
                                    <Typography variant="subtitle1" gutterBottom>
                                        Data Summary
                                    </Typography>
                                    <Grid container spacing={2}>
                                        <Grid item xs={6}>
                                            <Typography variant="body2" color="text.secondary">
                                                Rows
                                            </Typography>
                                            <Typography variant="body1">
                                                {summary.rows}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <Typography variant="body2" color="text.secondary">
                                                Columns
                                            </Typography>
                                            <Typography variant="body1">
                                                {summary.columns}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={12}>
                                            <Typography variant="body2" color="text.secondary">
                                                Memory Usage
                                            </Typography>
                                            <Typography variant="body1">
                                                {summary.memory_usage}
                                            </Typography>
                                        </Grid>
                                    </Grid>
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Error Snackbar */}
            <Snackbar
                open={openError}
                autoHideDuration={6000}
                onClose={handleCloseError}
                TransitionComponent={SlideTransition}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                sx={{
                    width: { xs: '100%', sm: 'auto' },
                    maxWidth: { xs: '100%', sm: '400px' }
                }}
            >
                <Alert
                    onClose={handleCloseError}
                    severity="error"
                    variant="filled"
                    sx={{
                        width: '100%',
                        borderRadius: 2,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                    }}
                >
                    {error}
                </Alert>
            </Snackbar>

            {/* Success Snackbar */}
            <Snackbar
                open={openSuccess}
                autoHideDuration={4000}
                onClose={handleCloseSuccess}
                TransitionComponent={FadeTransition}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                sx={{
                    width: { xs: '100%', sm: 'auto' },
                    maxWidth: { xs: '100%', sm: '400px' }
                }}
            >
                <Alert
                    onClose={handleCloseSuccess}
                    severity="success"
                    variant="filled"
                    sx={{
                        width: '100%',
                        borderRadius: 2,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                    }}
                >
                    {success}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default DataIngestion; 