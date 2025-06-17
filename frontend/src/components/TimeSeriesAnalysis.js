import React, { useState } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Grid,
    TextField,
    Button,
    CircularProgress,
} from '@mui/material';
import { Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import axios from 'axios';

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

const TimeSeriesAnalysis = () => {
    const [data, setData] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [analysis, setAnalysis] = useState(null);
    const [windowSize, setWindowSize] = useState(5);
    const [forecastSteps, setForecastSteps] = useState(3);

    const handleAnalyze = async () => {
        try {
            setLoading(true);
            setError('');
            const response = await axios.post('http://localhost:5000/api/analyze-timeseries', {
                data: JSON.parse(data),
                windowSize: windowSize,
                forecastSteps: forecastSteps
            });
            setAnalysis(response.data);
        } catch (err) {
            setError(err.response?.data?.error || 'Error analyzing data');
        } finally {
            setLoading(false);
        }
    };

    const renderBottleneckGraph = () => {
        if (!analysis?.bottlenecks) return null;

        const chartData = {
            labels: analysis.bottlenecks.map(b => b.step),
            datasets: [
                {
                    label: 'Delay Impact',
                    data: analysis.bottlenecks.map(b => b.impact),
                    backgroundColor: 'rgba(255, 99, 132, 0.5)',
                    borderColor: 'rgb(255, 99, 132)',
                    borderWidth: 1
                }
            ]
        };

        const options = {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Bottleneck Impact Analysis'
                },
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Impact Score'
                    }
                }
            }
        };

        return (
            <Box sx={{ height: 300, mt: 2 }}>
                <Bar data={chartData} options={options} />
            </Box>
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
                Time Series Analysis
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
                                Input Parameters
                            </Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Time Series Data"
                                        multiline
                                        rows={4}
                                        variant="outlined"
                                        value={data}
                                        onChange={(e) => setData(e.target.value)}
                                        sx={{ mb: 2 }}
                                        error={!!error}
                                        helperText={error}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Window Size"
                                        type="number"
                                        value={windowSize}
                                        onChange={(e) => setWindowSize(Number(e.target.value))}
                                        InputProps={{ inputProps: { min: 1 } }}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Forecast Steps"
                                        type="number"
                                        value={forecastSteps}
                                        onChange={(e) => setForecastSteps(Number(e.target.value))}
                                        InputProps={{ inputProps: { min: 1 } }}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        onClick={handleAnalyze}
                                        disabled={loading}
                                        fullWidth
                                        sx={{
                                            mt: 2,
                                            py: { xs: 1, sm: 1.5 },
                                            borderRadius: 2
                                        }}
                                    >
                                        {loading ? <CircularProgress size={24} /> : 'Analyze Time Series'}
                                    </Button>
                                </Grid>
                            </Grid>
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
                            {analysis ? (
                                <Box sx={{ height: '100%', minHeight: 300 }}>
                                    {renderBottleneckGraph()}
                                </Box>
                            ) : (
                                <Box sx={{
                                    height: 300,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    bgcolor: 'background.default',
                                    borderRadius: 2
                                }}>
                                    <Typography variant="body1" color="text.secondary">
                                        No analysis results yet
                                    </Typography>
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                {analysis && analysis.statistics && (
                    <Grid item xs={12}>
                        <Card elevation={3} sx={{
                            borderRadius: { xs: 2, sm: 3 },
                            mt: 2
                        }}>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Statistical Summary
                                </Typography>
                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={6} md={3}>
                                        <Typography variant="subtitle2" color="text.secondary">
                                            Mean
                                        </Typography>
                                        <Typography variant="body1">
                                            {analysis.statistics.mean?.toFixed(4) || 'N/A'}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={6} md={3}>
                                        <Typography variant="subtitle2" color="text.secondary">
                                            Standard Deviation
                                        </Typography>
                                        <Typography variant="body1">
                                            {analysis.statistics.std?.toFixed(4) || 'N/A'}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={6} md={3}>
                                        <Typography variant="subtitle2" color="text.secondary">
                                            Trend
                                        </Typography>
                                        <Typography variant="body1">
                                            {analysis.statistics.trend || 'N/A'}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={6} md={3}>
                                        <Typography variant="subtitle2" color="text.secondary">
                                            Seasonality
                                        </Typography>
                                        <Typography variant="body1">
                                            {analysis.statistics.seasonality !== undefined ?
                                                (analysis.statistics.seasonality ? 'Present' : 'Not Present') :
                                                'N/A'}
                                        </Typography>
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>
                    </Grid>
                )}
            </Grid>
        </Box>
    );
};

export default TimeSeriesAnalysis; 