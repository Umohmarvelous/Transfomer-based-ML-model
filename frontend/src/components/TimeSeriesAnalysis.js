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
    List,
    ListItem,
    ListItemText,
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

    const handleAnalyze = async () => {
        try {
            setLoading(true);
            setError('');
            const response = await axios.post('http://localhost:5000/api/analyze-timeseries', {
                data: JSON.parse(data)
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
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
                Time Series Analysis
            </Typography>

            <Card>
                <CardContent>
                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                multiline
                                rows={4}
                                label="Time Series Data (JSON)"
                                value={data}
                                onChange={(e) => setData(e.target.value)}
                                error={!!error}
                                helperText={error}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <Button
                                variant="contained"
                                onClick={handleAnalyze}
                                disabled={loading || !data}
                                fullWidth
                            >
                                {loading ? <CircularProgress size={24} /> : 'Analyze'}
                            </Button>
                        </Grid>
                    </Grid>

                    {analysis && (
                        <Box sx={{ mt: 3 }}>
                            <Typography variant="h6" gutterBottom>
                                Analysis Results
                            </Typography>
                            
                            {renderBottleneckGraph()}

                            <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                                Bottlenecks
                            </Typography>
                            <List>
                                {analysis.bottlenecks.map((bottleneck, index) => (
                                    <ListItem key={index}>
                                        <ListItemText
                                            primary={bottleneck.step}
                                            secondary={`Impact: ${(bottleneck.impact * 100).toFixed(1)}%`}
                                        />
                                    </ListItem>
                                ))}
                            </List>

                            <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                                Anomalies
                            </Typography>
                            <List>
                                {analysis.anomalies.map((anomaly, index) => (
                                    <ListItem key={index}>
                                        <ListItemText
                                            primary={anomaly.step}
                                            secondary={anomaly.description}
                                        />
                                    </ListItem>
                                ))}
                            </List>

                            <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                                Recommendations
                            </Typography>
                            <List>
                                {analysis.recommendations.map((rec, index) => (
                                    <ListItem key={index}>
                                        <ListItemText
                                            primary={rec.title}
                                            secondary={rec.description}
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        </Box>
                    )}
                </CardContent>
            </Card>
        </Box>
    );
};

export default TimeSeriesAnalysis; 