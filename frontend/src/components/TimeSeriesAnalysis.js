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
    List,
    ListItem,
    ListItemText,
    Divider,
    useTheme,
} from '@mui/material';
import { Line } from 'react-chartjs-2';
import axios from 'axios';

const TimeSeriesAnalysis = () => {
    const theme = useTheme();
    const [inputData, setInputData] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [analysis, setAnalysis] = useState(null);

    const handleAnalyze = async () => {
        try {
            setLoading(true);
            setError('');

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
                    backgroundColor: 'rgba(147, 112, 219, 0.5)', // Purple
                    borderColor: 'rgb(147, 112, 219)',
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true,
                }
            ]
        };

        const options = {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Bottleneck Impact Analysis',
                    font: {
                        size: 16,
                        weight: 'bold',
                        color: theme.palette.primary.main
                    },
                    padding: 20
                },
                legend: {
                    labels: {
                        font: {
                            size: 14,
                            weight: 'bold'
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Impact Score',
                        font: {
                            size: 14,
                            weight: 'bold'
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            },
            animation: {
                duration: 2000,
                easing: 'easeInOutQuart'
            }
        };

        return (
            <Box sx={{ height: 300, mt: 2 }}>
                <Line data={data} options={options} />
            </Box>
        );
    };

    return (
        <Box sx={{
            background: 'linear-gradient(145deg, #f5f7fa 0%, #e4e8eb 100%)',
            borderRadius: 2,
            p: 3
        }}>
            <Typography
                variant="h5"
                gutterBottom
                sx={{
                    color: theme.palette.primary.main,
                    fontWeight: 'bold',
                    textAlign: 'center',
                    mb: 4
                }}
            >
                Time Series Analysis
            </Typography>

            <Card
                elevation={3}
                sx={{
                    mb: 3,
                    borderRadius: 2,
                    background: 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(10px)'
                }}
            >
                <CardContent>
                    <TextField
                        fullWidth
                        multiline
                        rows={6}
                        variant="outlined"
                        label="Enter time series data (JSON format)"
                        value={inputData}
                        onChange={(e) => setInputData(e.target.value)}
                        error={!!error}
                        helperText={error}
                        sx={{
                            mb: 2,
                            '& .MuiOutlinedInput-root': {
                                borderRadius: 2,
                                '&:hover fieldset': {
                                    borderColor: theme.palette.primary.main,
                                },
                            },
                        }}
                    />
                    <Button
                        variant="contained"
                        onClick={handleAnalyze}
                        disabled={loading}
                        fullWidth
                        sx={{
                            py: 1.5,
                            borderRadius: 2,
                            background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                            boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)',
                            '&:hover': {
                                background: 'linear-gradient(45deg, #1976D2 30%, #1CB5E0 90%)',
                            }
                        }}
                    >
                        {loading ? <CircularProgress size={24} /> : 'Analyze Time Series'}
                    </Button>
                </CardContent>
            </Card>

            {analysis && (
                <Grid container spacing={3}>
                    {/* Bottleneck Analysis */}
                    <Grid item xs={12} md={6}>
                        <Card
                            elevation={3}
                            sx={{
                                borderRadius: 2,
                                background: 'rgba(255, 255, 255, 0.9)',
                                backdropFilter: 'blur(10px)'
                            }}
                        >
                            <CardContent>
                                <Typography
                                    variant="h6"
                                    gutterBottom
                                    sx={{
                                        color: theme.palette.primary.main,
                                        fontWeight: 'bold'
                                    }}
                                >
                                    Bottleneck Analysis
                                </Typography>
                                {renderBottleneckGraph()}
                                <List>
                                    {analysis.bottlenecks.map((bottleneck, index) => (
                                        <React.Fragment key={index}>
                                            <ListItem
                                                sx={{
                                                    background: 'linear-gradient(45deg, #f3f4f6 30%, #e5e7eb 90%)',
                                                    borderRadius: 1,
                                                    mb: 1
                                                }}
                                            >
                                                <ListItemText
                                                    primary={
                                                        <Typography sx={{ fontWeight: 'bold', color: theme.palette.primary.main }}>
                                                            {bottleneck.step}
                                                        </Typography>
                                                    }
                                                    secondary={
                                                        <Typography sx={{ color: theme.palette.text.secondary }}>
                                                            Impact Score: {bottleneck.impact.toFixed(2)}
                                                        </Typography>
                                                    }
                                                />
                                            </ListItem>
                                        </React.Fragment>
                                    ))}
                                </List>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Recommendations */}
                    <Grid item xs={12} md={6}>
                        <Card
                            elevation={3}
                            sx={{
                                borderRadius: 2,
                                background: 'rgba(255, 255, 255, 0.9)',
                                backdropFilter: 'blur(10px)'
                            }}
                        >
                            <CardContent>
                                <Typography
                                    variant="h6"
                                    gutterBottom
                                    sx={{
                                        color: theme.palette.primary.main,
                                        fontWeight: 'bold'
                                    }}
                                >
                                    Recommendations
                                </Typography>
                                <List>
                                    {analysis.recommendations.map((rec, index) => (
                                        <ListItem
                                            key={index}
                                            sx={{
                                                background: 'linear-gradient(45deg, #f3f4f6 30%, #e5e7eb 90%)',
                                                borderRadius: 1,
                                                mb: 1
                                            }}
                                        >
                                            <ListItemText
                                                primary={
                                                    <Typography sx={{ fontWeight: 'bold', color: theme.palette.primary.main }}>
                                                        {rec.title}
                                                    </Typography>
                                                }
                                                secondary={
                                                    <Typography sx={{ color: theme.palette.text.secondary }}>
                                                        {rec.description}
                                                    </Typography>
                                                }
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Anomaly Detection */}
                    {analysis.anomalies && analysis.anomalies.length > 0 && (
                        <Grid item xs={12}>
                            <Card
                                elevation={3}
                                sx={{
                                    borderRadius: 2,
                                    background: 'rgba(255, 255, 255, 0.9)',
                                    backdropFilter: 'blur(10px)'
                                }}
                            >
                                <CardContent>
                                    <Typography
                                        variant="h6"
                                        gutterBottom
                                        sx={{
                                            color: theme.palette.error.main,
                                            fontWeight: 'bold'
                                        }}
                                    >
                                        Detected Anomalies
                                    </Typography>
                                    <List>
                                        {analysis.anomalies.map((anomaly, index) => (
                                            <ListItem
                                                key={index}
                                                sx={{
                                                    background: 'linear-gradient(45deg, #fee2e2 30%, #fecaca 90%)',
                                                    borderRadius: 1,
                                                    mb: 1
                                                }}
                                            >
                                                <ListItemText
                                                    primary={
                                                        <Typography sx={{ fontWeight: 'bold', color: theme.palette.error.main }}>
                                                            {anomaly.step}
                                                        </Typography>
                                                    }
                                                    secondary={
                                                        <Typography sx={{ color: theme.palette.error.dark }}>
                                                            {anomaly.description}
                                                        </Typography>
                                                    }
                                                />
                                            </ListItem>
                                        ))}
                                    </List>
                                </CardContent>
                            </Card>
                        </Grid>
                    )}
                </Grid>
            )}
        </Box>
    );
};

export default TimeSeriesAnalysis; 