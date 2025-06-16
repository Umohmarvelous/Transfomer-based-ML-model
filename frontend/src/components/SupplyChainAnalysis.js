import React, { useState } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Grid,
    Button,
    CircularProgress,
    Alert,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
} from '@mui/material';
import axios from 'axios';

const SupplyChainAnalysis = () => {
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [analysis, setAnalysis] = useState(null);
    const [monitoring, setMonitoring] = useState(null);

    const handleFileChange = (event) => {
        const selectedFile = event.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            setError('');
            setAnalysis(null);
            setMonitoring(null);
        }
    };

    const handleAnalyze = async () => {
        if (!file) {
            setError('Please select a file first');
            return;
        }

        setLoading(true);
        setError('');
        setAnalysis(null);
        setMonitoring(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await axios.post('http://localhost:5000/api/analyze-supply-chain', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (response.data.error) {
                setError(response.data.error);
                return;
            }

            setAnalysis(response.data);
            startMonitoring();
        } catch (err) {
            console.error('Analysis error:', err);
            setError(err.response?.data?.error || 'Error analyzing data');
        } finally {
            setLoading(false);
        }
    };

    const startMonitoring = async () => {
        try {
            const response = await axios.post('http://localhost:5000/api/monitor-supply-chain', {
                metrics: {
                    cost_of_goods: 1000000,
                    average_inventory: 250000,
                    fulfilled_orders: 950,
                    total_orders: 1000,
                    total_lead_time: 5000
                }
            });

            setMonitoring(response.data);
        } catch (err) {
            console.error('Monitoring error:', err);
            setError('Error starting monitoring');
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'high':
                return 'error';
            case 'medium':
                return 'warning';
            case 'low':
                return 'success';
            default:
                return 'default';
        }
    };

    const renderAnalysisResults = () => {
        if (!analysis) return null;

        return (
            <>
                <Typography variant="h6" sx={{ mt: 3, mb: 2, color: '#34495e' }}>
                    Analysis Results
                </Typography>

                <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                        <Card elevation={2}>
                            <CardContent>
                                <Typography variant="subtitle1" gutterBottom>
                                    Key Metrics
                                </Typography>
                                <Typography variant="body2">
                                    Total Products: {analysis.metrics?.total_products || 'N/A'}
                                </Typography>
                                <Typography variant="body2">
                                    Total Locations: {analysis.metrics?.total_locations || 'N/A'}
                                </Typography>
                                <Typography variant="body2">
                                    Date Range: {analysis.metrics?.date_range?.start || 'N/A'} to {analysis.metrics?.date_range?.end || 'N/A'}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <Card elevation={2}>
                            <CardContent>
                                <Typography variant="subtitle1" gutterBottom>
                                    Anomalies Detected
                                </Typography>
                                <Typography variant="body2">
                                    Count: {analysis.anomalies?.count || 0}
                                </Typography>
                                <Typography variant="body2">
                                    Percentage: {(analysis.anomalies?.percentage || 0).toFixed(2)}%
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12}>
                        <Card elevation={2}>
                            <CardContent>
                                <Typography variant="subtitle1" gutterBottom>
                                    Recommendations
                                </Typography>
                                <TableContainer component={Paper}>
                                    <Table>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Type</TableCell>
                                                <TableCell>Description</TableCell>
                                                <TableCell>Priority</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {analysis.recommendations?.map((rec, index) => (
                                                <TableRow key={index}>
                                                    <TableCell>{rec.type}</TableCell>
                                                    <TableCell>{rec.description}</TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            label={rec.priority}
                                                            color={getPriorityColor(rec.priority)}
                                                            size="small"
                                                        />
                                                    </TableCell>
                                                </TableRow>
                                            )) || (
                                                    <TableRow>
                                                        <TableCell colSpan={3} align="center">
                                                            No recommendations available
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </>
        );
    };

    const renderMonitoring = () => {
        if (!monitoring) return null;

        return (
            <>
                <Typography variant="h6" sx={{ mt: 3, mb: 2, color: '#34495e' }}>
                    Real-time Monitoring
                </Typography>

                <Grid container spacing={3}>
                    <Grid item xs={12} md={4}>
                        <Card elevation={2}>
                            <CardContent>
                                <Typography variant="subtitle1" gutterBottom>
                                    Inventory Turnover
                                </Typography>
                                <Typography variant="h4">
                                    {monitoring.kpis?.inventory_turnover?.toFixed(2) || 'N/A'}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} md={4}>
                        <Card elevation={2}>
                            <CardContent>
                                <Typography variant="subtitle1" gutterBottom>
                                    Order Fulfillment Rate
                                </Typography>
                                <Typography variant="h4">
                                    {monitoring.kpis?.order_fulfillment_rate?.toFixed(1) || 'N/A'}%
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} md={4}>
                        <Card elevation={2}>
                            <CardContent>
                                <Typography variant="subtitle1" gutterBottom>
                                    Supply Chain Velocity
                                </Typography>
                                <Typography variant="h4">
                                    {monitoring.kpis?.supply_chain_velocity?.toFixed(1) || 'N/A'} days
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </>
        );
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
                Supply Chain Analysis
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
                                Upload Supply Chain Data
                            </Typography>
                            <Box sx={{ mb: 3 }}>
                                <input
                                    accept=".csv,.json,.xls,.xlsx"
                                    style={{ display: 'none' }}
                                    id="supply-chain-file-upload"
                                    type="file"
                                    onChange={handleFileChange}
                                />
                                <label htmlFor="supply-chain-file-upload">
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

                            <Button
                                variant="contained"
                                color="primary"
                                onClick={handleAnalyze}
                                disabled={loading || !file}
                                fullWidth
                                sx={{
                                    mt: 2,
                                    py: { xs: 1, sm: 1.5 },
                                    borderRadius: 2
                                }}
                            >
                                {loading ? <CircularProgress size={24} /> : 'Analyze Supply Chain'}
                            </Button>
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
                                Analysis Results
                            </Typography>
                            {error && (
                                <Alert severity="error" sx={{ mb: 2 }}>
                                    {error}
                                </Alert>
                            )}
                            {analysis && (
                                <Box sx={{ mt: 2 }}>
                                    <TableContainer component={Paper} sx={{ maxHeight: 400, overflow: 'auto' }}>
                                        <Table stickyHeader size="small">
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell>Metric</TableCell>
                                                    <TableCell align="right">Value</TableCell>
                                                    <TableCell align="right">Status</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {Object.entries(analysis.metrics).map(([key, value]) => (
                                                    <TableRow key={key}>
                                                        <TableCell component="th" scope="row">
                                                            {key}
                                                        </TableCell>
                                                        <TableCell align="right">
                                                            {typeof value === 'number' ? value.toFixed(2) : value}
                                                        </TableCell>
                                                        <TableCell align="right">
                                                            <Chip
                                                                label={value > analysis.thresholds[key] ? 'Good' : 'Warning'}
                                                                color={value > analysis.thresholds[key] ? 'success' : 'warning'}
                                                                size="small"
                                                            />
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                {monitoring && (
                    <Grid item xs={12}>
                        <Card elevation={3} sx={{
                            borderRadius: { xs: 2, sm: 3 },
                            mt: 2
                        }}>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Real-time Monitoring
                                </Typography>
                                <Grid container spacing={2}>
                                    {Object.entries(monitoring).map(([key, value]) => (
                                        <Grid item xs={12} sm={6} md={3} key={key}>
                                            <Card variant="outlined" sx={{ p: 2 }}>
                                                <Typography variant="subtitle2" color="text.secondary">
                                                    {key}
                                                </Typography>
                                                <Typography variant="h6">
                                                    {typeof value === 'number' ? value.toFixed(2) : value}
                                                </Typography>
                                            </Card>
                                        </Grid>
                                    ))}
                                </Grid>
                            </CardContent>
                        </Card>
                    </Grid>
                )}
            </Grid>
        </Box>
    );
};

export default SupplyChainAnalysis; 