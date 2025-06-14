import React, { useState } from 'react';
import {
    Container,
    Box,
    TextField,
    Button,
    Typography,
    Paper,
    CircularProgress,
    Grid,
    Alert,
    Tabs,
    Tab,
    Card,
    CardContent,
    Fade,
    Zoom,
} from '@mui/material';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from 'chart.js';
import axios from 'axios';
import ProcessModeling from './components/ProcessModeling';
import DataIngestion from './components/DataIngestion';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

function App() {
    const [text, setText] = useState('');
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState(null);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState(0);

    const analyzeText = async () => {
        if (!text.trim()) {
            setError('Please enter some text to analyze');
            return;
        }

        setLoading(true);
        setError('');
        setResults(null);

        try {
            const response = await axios.post('http://localhost:5000/api/analyze', {
                text: text
            }, {
                timeout: 30000,
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            setResults(response.data);
        } catch (err) {
            console.error('Error details:', err);
            if (err.code === 'ECONNABORTED') {
                setError('Request timed out. Please try again.');
            } else if (!err.response) {
                setError('Network error: Please make sure the backend server is running at http://localhost:5000');
            } else {
                setError('Error analyzing text: ' + (err.response?.data?.error || err.message));
            }
        } finally {
            setLoading(false);
        }
    };

    const chartData = results ? {
        labels: Array.from({ length: results.statistics.mean.length }, (_, i) => i + 1),
        datasets: [
            {
                label: 'Mean Embedding Values',
                data: results.statistics.mean,
                borderColor: 'rgb(75, 192, 192)',
                backgroundColor: 'rgba(75, 192, 192, 0.1)',
                tension: 0.4,
                fill: true,
                pointRadius: 4,
                pointHoverRadius: 6,
            },
            {
                label: 'Standard Deviation',
                data: results.statistics.std,
                borderColor: 'rgb(255, 99, 132)',
                backgroundColor: 'rgba(255, 99, 132, 0.1)',
                tension: 0.4,
                fill: true,
                pointRadius: 4,
                pointHoverRadius: 6,
            },
        ],
    } : null;

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            title: {
                display: true,
                text: 'Embedding Analysis',
                font: {
                    size: 20,
                    weight: 'bold',
                },
                padding: 20,
            },
            legend: {
                position: 'top',
                labels: {
                    padding: 20,
                    usePointStyle: true,
                    pointStyle: 'circle',
                },
            },
            tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                padding: 12,
                titleFont: {
                    size: 14,
                },
                bodyFont: {
                    size: 13,
                },
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: {
                    color: 'rgba(0, 0, 0, 0.1)',
                },
            },
            x: {
                grid: {
                    display: false,
                },
            },
        },
        interaction: {
            intersect: false,
            mode: 'index',
        },
        animation: {
            duration: 2000,
            easing: 'easeInOutQuart',
        },
    };

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    return (
        <Container maxWidth="lg">
            <Box sx={{ my: 4 }}>
                <Fade in={true} timeout={1000}>
                    <Typography
                        variant="h3"
                        component="h1"
                        gutterBottom
                        align="center"
                        sx={{
                            fontWeight: 'bold',
                            color: '#1976d2',
                            textShadow: '2px 2px 4px rgba(0,0,0,0.1)',
                            mb: 4,
                        }}
                    >
                        Supply Chain Analysis Platform
                    </Typography>
                </Fade>

                <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                    <Tabs
                        value={activeTab}
                        onChange={handleTabChange}
                        centered
                        sx={{
                            '& .MuiTab-root': {
                                fontSize: '1.1rem',
                                fontWeight: 'medium',
                                textTransform: 'none',
                                minWidth: 200,
                            },
                        }}
                    >
                        <Tab label="Data Ingestion" />
                        <Tab label="Text Analysis" />
                        <Tab label="Process Modeling" />
                    </Tabs>
                </Box>

                {activeTab === 0 && (
                    <Fade in={true} timeout={500}>
                        <Card elevation={3} sx={{ borderRadius: 2 }}>
                            <CardContent>
                                <DataIngestion />
                            </CardContent>
                        </Card>
                    </Fade>
                )}

                {activeTab === 1 && (
                    <Fade in={true} timeout={500}>
                        <Box>
                            {error && (
                                <Alert
                                    severity="error"
                                    sx={{
                                        mb: 2,
                                        borderRadius: 2,
                                        boxShadow: 1,
                                    }}
                                >
                                    {error}
                                </Alert>
                            )}

                            <Card elevation={3} sx={{ mb: 3, borderRadius: 2 }}>
                                <CardContent>
                                    <Grid container spacing={2}>
                                        <Grid item xs={12}>
                                            <TextField
                                                fullWidth
                                                multiline
                                                rows={4}
                                                variant="outlined"
                                                label="Enter text to analyze"
                                                value={text}
                                                onChange={(e) => setText(e.target.value)}
                                                error={!!error}
                                                helperText={error}
                                                sx={{
                                                    '& .MuiOutlinedInput-root': {
                                                        borderRadius: 2,
                                                    },
                                                }}
                                            />
                                        </Grid>
                                        <Grid item xs={12}>
                                            <Button
                                                variant="contained"
                                                color="primary"
                                                onClick={analyzeText}
                                                disabled={loading}
                                                fullWidth
                                                sx={{
                                                    py: 1.5,
                                                    borderRadius: 2,
                                                    textTransform: 'none',
                                                    fontSize: '1.1rem',
                                                }}
                                            >
                                                {loading ? <CircularProgress size={24} /> : 'Analyze Text'}
                                            </Button>
                                        </Grid>
                                    </Grid>
                                </CardContent>
                            </Card>

                            {results && (
                                <Zoom in={true} timeout={500}>
                                    <Card elevation={3} sx={{ borderRadius: 2 }}>
                                        <CardContent>
                                            <Typography
                                                variant="h5"
                                                gutterBottom
                                                sx={{
                                                    fontWeight: 'bold',
                                                    color: '#1976d2',
                                                    mb: 3,
                                                }}
                                            >
                                                Analysis Results
                                            </Typography>
                                            <Box sx={{ height: 500, position: 'relative' }}>
                                                <Line
                                                    data={chartData}
                                                    options={chartOptions}
                                                />
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Zoom>
                            )}
                        </Box>
                    </Fade>
                )}

                {activeTab === 2 && (
                    <Fade in={true} timeout={500}>
                        <Card elevation={3} sx={{ borderRadius: 2 }}>
                            <CardContent>
                                <ProcessModeling />
                            </CardContent>
                        </Card>
                    </Fade>
                )}
            </Box>
        </Container>
    );
}

export default App; 