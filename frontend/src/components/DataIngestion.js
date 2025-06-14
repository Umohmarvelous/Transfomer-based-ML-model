import React, { useState } from 'react';
import {
    Box,
    Typography,
    Paper,
    Button,
    LinearProgress,
    Alert,
    Grid,
    Card,
    CardContent,
    IconButton,
    Tooltip,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
} from '@mui/material';
import {
    CloudUpload as CloudUploadIcon,
    Delete as DeleteIcon,
    Refresh as RefreshIcon,
    Settings as SettingsIcon,
} from '@mui/icons-material';
import axios from 'axios';

const DataIngestion = () => {
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [preview, setPreview] = useState(null);
    const [dataType, setDataType] = useState('csv');
    const [preprocessingSteps, setPreprocessingSteps] = useState({
        cleanMissing: true,
        normalize: true,
        removeDuplicates: true,
    });

    const handleFileChange = (event) => {
        const selectedFile = event.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            // Generate preview
            const reader = new FileReader();
            reader.onload = (e) => {
                setPreview(e.target.result);
            };
            reader.readAsText(selectedFile);
        }
    };

    const handleUpload = async () => {
        if (!file) {
            setError('Please select a file first');
            return;
        }

        setLoading(true);
        setError(null);
        setSuccess(null);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('dataType', dataType);
        formData.append('preprocessing', JSON.stringify(preprocessingSteps));

        try {
            const response = await axios.post('http://localhost:5000/api/ingest-data', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            setSuccess('Data uploaded and processed successfully');
            setPreview(null);
            setFile(null);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to upload data');
        } finally {
            setLoading(false);
        }
    };

    const handlePreprocessingChange = (step) => {
        setPreprocessingSteps(prev => ({
            ...prev,
            [step]: !prev[step]
        }));
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" component="h2" gutterBottom>
                Data Ingestion & Processing
            </Typography>

            <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                    <Card elevation={3}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Upload Data
                            </Typography>

                            <FormControl fullWidth sx={{ mb: 2 }}>
                                <InputLabel>Data Type</InputLabel>
                                <Select
                                    value={dataType}
                                    onChange={(e) => setDataType(e.target.value)}
                                    label="Data Type"
                                >
                                    <MenuItem value="csv">CSV</MenuItem>
                                    <MenuItem value="json">JSON</MenuItem>
                                    <MenuItem value="xls">Excel</MenuItem>
                                </Select>
                            </FormControl>

                            <Button
                                variant="contained"
                                component="label"
                                startIcon={<CloudUploadIcon />}
                                fullWidth
                                sx={{ mb: 2 }}
                            >
                                Choose File
                                <input
                                    type="file"
                                    hidden
                                    accept=".csv,.json,.xls,.xlsx"
                                    onChange={handleFileChange}
                                />
                            </Button>

                            {file && (
                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        Selected file: {file.name}
                                    </Typography>
                                </Box>
                            )}

                            <Button
                                variant="contained"
                                color="primary"
                                onClick={handleUpload}
                                disabled={loading || !file}
                                fullWidth
                            >
                                {loading ? 'Processing...' : 'Upload & Process'}
                            </Button>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                    <Card elevation={3}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Preprocessing Options
                            </Typography>

                            <Box sx={{ mb: 2 }}>
                                <Button
                                    variant="outlined"
                                    startIcon={<SettingsIcon />}
                                    onClick={() => handlePreprocessingChange('cleanMissing')}
                                    color={preprocessingSteps.cleanMissing ? 'primary' : 'inherit'}
                                    fullWidth
                                    sx={{ mb: 1 }}
                                >
                                    Clean Missing Values
                                </Button>

                                <Button
                                    variant="outlined"
                                    startIcon={<SettingsIcon />}
                                    onClick={() => handlePreprocessingChange('normalize')}
                                    color={preprocessingSteps.normalize ? 'primary' : 'inherit'}
                                    fullWidth
                                    sx={{ mb: 1 }}
                                >
                                    Normalize Data
                                </Button>

                                <Button
                                    variant="outlined"
                                    startIcon={<SettingsIcon />}
                                    onClick={() => handlePreprocessingChange('removeDuplicates')}
                                    color={preprocessingSteps.removeDuplicates ? 'primary' : 'inherit'}
                                    fullWidth
                                >
                                    Remove Duplicates
                                </Button>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {loading && (
                <Box sx={{ width: '100%', mt: 2 }}>
                    <LinearProgress />
                </Box>
            )}

            {error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                    {error}
                </Alert>
            )}

            {success && (
                <Alert severity="success" sx={{ mt: 2 }}>
                    {success}
                </Alert>
            )}

            {preview && (
                <Card elevation={3} sx={{ mt: 2 }}>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            Data Preview
                        </Typography>
                        <Box
                            component="pre"
                            sx={{
                                p: 2,
                                bgcolor: '#f5f5f5',
                                borderRadius: 1,
                                overflow: 'auto',
                                maxHeight: '200px',
                            }}
                        >
                            {preview}
                        </Box>
                    </CardContent>
                </Card>
            )}
        </Box>
    );
};

export default DataIngestion; 