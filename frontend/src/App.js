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
} from 'chart.js';
import axios from 'axios';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

function App() {
    const [text, setText] = useState('');
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState(null);
    const [error, setError] = useState('');

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
                timeout: 30000, // 30 second timeout
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
                tension: 0.1,
            },
            {
                label: 'Standard Deviation',
                data: results.statistics.std,
                borderColor: 'rgb(255, 99, 132)',
                tension: 0.1,
            },
        ],
    } : null;

    return (
        <Container maxWidth="lg">
            <Box sx={{ my: 4 }}>
                <Typography variant="h3" component="h1" gutterBottom align="center">
                    Transformer Model Analysis
                </Typography>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
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
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={analyzeText}
                                disabled={loading}
                                fullWidth
                            >
                                {loading ? <CircularProgress size={24} /> : 'Analyze Text'}
                            </Button>
                        </Grid>
                    </Grid>
                </Paper>

                {results && (
                    <Paper elevation={3} sx={{ p: 3 }}>
                        <Typography variant="h5" gutterBottom>
                            Analysis Results
                        </Typography>
                        <Box sx={{ height: 400 }}>
                            <Line
                                data={chartData}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: {
                                        title: {
                                            display: true,
                                            text: 'Embedding Analysis',
                                        },
                                    },
                                }}
                            />
                        </Box>
                    </Paper>
                )}
            </Box>
        </Container>
    );
}

export default App; 