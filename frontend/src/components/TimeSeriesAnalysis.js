import React, { useState } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    TextField,
    Button,
    Grid,
    CircularProgress,
    Alert,
    Paper,
    List,
    ListItem,
    ListItemText,
    Divider,
} from '@mui/material';
import { Line, Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from 'chart.js';
import axios from 'axios';

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

const TimeSeriesAnalysis = () => {
    const [inputData, setInputData] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [analysis, setAnalysis] = useState(null);

    const handleAnalyze = async () => {
        try {
            setLoading(true);
            setError('');

            // Parse the input data
            const parsedData = JSON.parse(inputData);

            const response = await axios.post('http://localhost:5000/api/analyze-timeseries', {
                data: parsedData
            });

            setAnalysis(response.data);
        } catch (err) {
            setError(err.response?.data?.error || 'Error analyzing time series data');
        } finally {
            setLoading(false);
        }
    };

    const renderBottleneckGraph = () => {
        if (!analysis?.bottlenecks) return null;

        const data = {
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
            maintainAspectRatio: false,
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
                    },
                    grid: {
                        color: 'rgba(0,0,0,0.1)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        };

        return (
            <Box sx={{ height: 300, mt: 2 }}>
                <Bar data={data} options={options} />
            </Box>
        );
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
                Time Series Analysis
            </Typography>

            <Grid container spacing={3}>
                <Grid item xs={12}>
                    <Card elevation={3} sx={{
                        borderRadius: 3,
                        background: 'linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)',
                        border: '1px solid rgba(0,0,0,0.1)'
                    }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom sx={{
                                color: '#34495e',
                                fontWeight: 'medium',
                                mb: 2
                            }}>
                                Input Data
                            </Typography>
                            <TextField
                                fullWidth
                                multiline
                                rows={6}
                                variant="outlined"
                                value={inputData}
                                onChange={(e) => setInputData(e.target.value)}
                                placeholder="Enter time series data in JSON format..."
                                error={!!error}
                                helperText={error}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 2,
                                        backgroundColor: 'rgba(255,255,255,0.9)',
                                        '&:hover': {
                                            backgroundColor: 'rgba(255,255,255,1)',
                                        },
                                    },
                                }}
                            />
                            <Button
                                variant="contained"
                                onClick={handleAnalyze}
                                disabled={loading}
                                sx={{
                                    mt: 2,
                                    py: 1.5,
                                    borderRadius: 2,
                                    background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                                    boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)',
                                    '&:hover': {
                                        background: 'linear-gradient(45deg, #1976D2 30%, #1CB5E0 90%)',
                                    },
                                }}
                            >
                                {loading ? <CircularProgress size={24} color="inherit" /> : 'Analyze Data'}
                            </Button>
                        </CardContent>
                    </Card>
                </Grid>

                {analysis && (
                    <>
                        <Grid item xs={12} md={6}>
                            <Card elevation={3} sx={{
                                borderRadius: 3,
                                background: 'linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)',
                                height: '100%'
                            }}>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom sx={{
                                        color: '#34495e',
                                        fontWeight: 'medium',
                                        mb: 2
                                    }}>
                                        Bottleneck Analysis
                                    </Typography>
                                    <Box sx={{ height: 300 }}>
                                        <Bar
                                            data={{
                                                labels: analysis.bottlenecks.map(b => b.step),
                                                datasets: [{
                                                    label: 'Impact Score',
                                                    data: analysis.bottlenecks.map(b => b.impact),
                                                    backgroundColor: 'rgba(54, 162, 235, 0.8)',
                                                    borderColor: 'rgba(54, 162, 235, 1)',
                                                    borderWidth: 1,
                                                }]
                                            }}
                                            options={{
                                                responsive: true,
                                                maintainAspectRatio: false,
                                                plugins: {
                                                    legend: {
                                                        display: false
                                                    }
                                                },
                                                scales: {
                                                    y: {
                                                        beginAtZero: true,
                                                        grid: {
                                                            color: 'rgba(0,0,0,0.1)'
                                                        }
                                                    },
                                                    x: {
                                                        grid: {
                                                            display: false
                                                        }
                                                    }
                                                }
                                            }}
                                        />
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <Card elevation={3} sx={{
                                borderRadius: 3,
                                background: 'linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)',
                                height: '100%'
                            }}>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom sx={{
                                        color: '#34495e',
                                        fontWeight: 'medium',
                                        mb: 2
                                    }}>
                                        Anomalies Detected
                                    </Typography>
                                    <List>
                                        {analysis.anomalies.map((anomaly, index) => (
                                            <ListItem key={index} sx={{
                                                mb: 1,
                                                borderRadius: 2,
                                                backgroundColor: 'rgba(255, 193, 7, 0.1)',
                                                border: '1px solid rgba(255, 193, 7, 0.3)'
                                            }}>
                                                <ListItemText
                                                    primary={anomaly.step}
                                                    secondary={anomaly.description}
                                                    primaryTypographyProps={{
                                                        color: '#d32f2f',
                                                        fontWeight: 'medium'
                                                    }}
                                                />
                                            </ListItem>
                                        ))}
                                    </List>
                                </CardContent>
                            </Card>
                        </Grid>

                        <Grid item xs={12}>
                            <Card elevation={3} sx={{
                                borderRadius: 3,
                                background: 'linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)'
                            }}>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom sx={{
                                        color: '#34495e',
                                        fontWeight: 'medium',
                                        mb: 2
                                    }}>
                                        Recommendations
                                    </Typography>
                                    <Grid container spacing={2}>
                                        {analysis.recommendations.map((rec, index) => (
                                            <Grid item xs={12} md={4} key={index}>
                                                <Card sx={{
                                                    borderRadius: 2,
                                                    background: 'linear-gradient(145deg, #e3f2fd 0%, #bbdefb 100%)',
                                                    height: '100%'
                                                }}>
                                                    <CardContent>
                                                        <Typography variant="subtitle1" sx={{
                                                            color: '#1565c0',
                                                            fontWeight: 'bold',
                                                            mb: 1
                                                        }}>
                                                            {rec.title}
                                                        </Typography>
                                                        <Typography variant="body2" color="text.secondary">
                                                            {rec.description}
                                                        </Typography>
                                                    </CardContent>
                                                </Card>
                                            </Grid>
                                        ))}
                                    </Grid>
                                </CardContent>
                            </Card>
                        </Grid>
                    </>
                )}
            </Grid>
        </Box>
    );
};

export default TimeSeriesAnalysis; 