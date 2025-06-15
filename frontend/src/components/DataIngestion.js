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
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom sx={{
                color: '#2c3e50',
                fontWeight: 'bold',
                mb: 4,
                textAlign: 'center',
                textShadow: '2px 2px 4px rgba(0,0,0,0.1)'
            }}>
                Data Ingestion
            </Typography>

            {/* Error Snackbar */}
            <Snackbar
                open={openError}
                autoHideDuration={6000}
                onClose={handleCloseError}
                TransitionComponent={SlideTransition}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert
                    onClose={handleCloseError}
                    severity="error"
                    variant="filled"
                    sx={{
                        width: '100%',
                        borderRadius: 2,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        animation: 'slideIn 0.3s ease-out',
                        '@keyframes slideIn': {
                            '0%': {
                                transform: 'translateY(-100%)',
                                opacity: 0
                            },
                            '100%': {
                                transform: 'translateY(0)',
                                opacity: 1
                            }
                        }
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
            >
                <Alert
                    onClose={handleCloseSuccess}
                    severity="success"
                    variant="filled"
                    sx={{
                        width: '100%',
                        borderRadius: 2,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        animation: 'fadeIn 0.3s ease-out',
                        '@keyframes fadeIn': {
                            '0%': {
                                opacity: 0,
                                transform: 'scale(0.95)'
                            },
                            '100%': {
                                opacity: 1,
                                transform: 'scale(1)'
                            }
                        }
                    }}
                >
                    {success}
                </Alert>
            </Snackbar>

            <Grid container spacing={3}>
                <Grid item xs={12}>
                    <Card elevation={3} sx={{
                        borderRadius: 3,
                        background: 'linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)',
                        border: '1px solid rgba(0,0,0,0.1)'
                    }}>
                        <CardContent>
                            <Grid container spacing={3}>
                                <Grid item xs={12} md={6}>
                                    <FormControl fullWidth>
                                        <InputLabel>Data Type</InputLabel>
                                        <Select
                                            value={dataType}
                                            onChange={handleDataTypeChange}
                                            label="Data Type"
                                            sx={{
                                                '& .MuiOutlinedInput-root': {
                                                    borderRadius: 2,
                                                },
                                            }}
                                        >
                                            <MenuItem value="csv">CSV</MenuItem>
                                            <MenuItem value="json">JSON</MenuItem>
                                            <MenuItem value="xlsx">Excel</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>

                                <Grid item xs={12} md={6}>
                                    <Button
                                        variant="contained"
                                        component="label"
                                        fullWidth
                                        sx={{
                                            py: 1.5,
                                            borderRadius: 2,
                                            background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                                            boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)',
                                            '&:hover': {
                                                background: 'linear-gradient(45deg, #1976D2 30%, #1CB5E0 90%)',
                                            },
                                        }}
                                    >
                                        Select File
                                        <input
                                            type="file"
                                            hidden
                                            onChange={handleFileChange}
                                            accept={`.${dataType}`}
                                        />
                                    </Button>
                                </Grid>

                                <Grid item xs={12}>
                                    <Typography variant="subtitle1" gutterBottom sx={{ color: '#34495e' }}>
                                        Preprocessing Options
                                    </Typography>
                                    <Grid container spacing={2}>
                                        <Grid item xs={12} md={4}>
                                            <FormControlLabel
                                                control={
                                                    <Checkbox
                                                        checked={preprocessingSteps.handle_missing !== undefined}
                                                        onChange={handlePreprocessingChange}
                                                        name="cleanMissing"
                                                        color="primary"
                                                    />
                                                }
                                                label="Clean Missing Values"
                                            />
                                        </Grid>
                                        <Grid item xs={12} md={4}>
                                            <FormControlLabel
                                                control={
                                                    <Checkbox
                                                        checked={preprocessingSteps.normalize !== undefined}
                                                        onChange={handlePreprocessingChange}
                                                        name="normalize"
                                                        color="primary"
                                                    />
                                                }
                                                label="Normalize Data"
                                            />
                                        </Grid>
                                        <Grid item xs={12} md={4}>
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
                                        </Grid>
                                    </Grid>

                                    <Grid item xs={12}>
                                        <Button
                                            variant="contained"
                                            onClick={handleUpload}
                                            disabled={loading || !file}
                                            fullWidth
                                            sx={{
                                                py: 1.5,
                                                borderRadius: 2,
                                                background: 'linear-gradient(45deg, #4CAF50 30%, #45a049 90%)',
                                                boxShadow: '0 3px 5px 2px rgba(76, 175, 80, .3)',
                                                '&:hover': {
                                                    background: 'linear-gradient(45deg, #388E3C 30%, #2E7D32 90%)',
                                                },
                                            }}
                                        >
                                            {loading ? <CircularProgress size={24} color="inherit" /> : 'Process Data'}
                                        </Button>
                                    </Grid>
                                </Grid>

                                {summary && (
                                    <Card elevation={2} sx={{ mt: 3, borderRadius: 2 }}>
                                        <CardContent>
                                            <Typography variant="h6" gutterBottom sx={{ color: '#34495e' }}>
                                                Processing Summary
                                            </Typography>
                                            <Grid container spacing={2}>
                                                <Grid item xs={12} md={6}>
                                                    <Typography variant="subtitle2" color="text.secondary">
                                                        Original Rows
                                                    </Typography>
                                                    <Typography variant="body1">
                                                        {summary.original_rows}
                                                    </Typography>
                                                </Grid>
                                                <Grid item xs={12} md={6}>
                                                    <Typography variant="subtitle2" color="text.secondary">
                                                        Processed Rows
                                                    </Typography>
                                                    <Typography variant="body1">
                                                        {summary.processed_rows}
                                                    </Typography>
                                                </Grid>
                                                <Grid item xs={12}>
                                                    <Typography variant="subtitle2" color="text.secondary">
                                                        Columns
                                                    </Typography>
                                                    <Typography variant="body1">
                                                        {summary.columns.join(', ')}
                                                    </Typography>
                                                </Grid>
                                            </Grid>
                                        </CardContent>
                                    </Card>
                                )}
                            </Grid>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
};

export default DataIngestion; 