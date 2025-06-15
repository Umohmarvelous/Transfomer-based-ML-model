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
import TimeSeriesAnalysis from './components/TimeSeriesAnalysis';
import { useTheme } from '@mui/material/styles';

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
    const theme = useTheme();
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

    const AnalysisResults = ({ results }) => {
        const theme = useTheme();
        if (!results) return null;

        const { embeddings, statistics } = results;

        // Calculate additional statistics
        const embeddingArray = embeddings[0];
        const min = Math.min(...embeddingArray);
        const max = Math.max(...embeddingArray);
        const range = max - min;
        const variance = statistics.std.reduce((acc, val) => acc + val * val, 0) / statistics.std.length;
        const median = embeddingArray.sort((a, b) => a - b)[Math.floor(embeddingArray.length / 2)];
        const q1 = embeddingArray.sort((a, b) => a - b)[Math.floor(embeddingArray.length * 0.25)];
        const q3 = embeddingArray.sort((a, b) => a - b)[Math.floor(embeddingArray.length * 0.75)];
        const iqr = q3 - q1;

        return (
            <Box sx={{ mt: 4 }}>
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
                    Analysis Results
                </Typography>

                <Grid container spacing={3}>
                    {/* Statistics Cards */}
                    <Grid item xs={12} md={6}>
                        <Card elevation={3} sx={{
                            borderRadius: 2,
                            background: 'rgba(255, 255, 255, 0.9)',
                            backdropFilter: 'blur(10px)'
                        }}>
                            <CardContent>
                                <Typography
                                    variant="h6"
                                    gutterBottom
                                    sx={{
                                        color: theme.palette.primary.main,
                                        fontWeight: 'bold'
                                    }}
                                >
                                    Statistical Summary
                                </Typography>
                                <Box sx={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(2, 1fr)',
                                    gap: 2,
                                    '& > div': {
                                        background: 'linear-gradient(45deg, #f3f4f6 30%, #e5e7eb 90%)',
                                        borderRadius: 1,
                                        p: 2
                                    }
                                }}>
                                    <Box>
                                        <Typography variant="subtitle2" color="text.secondary">
                                            Mean Value
                                        </Typography>
                                        <Typography variant="body1" sx={{ fontWeight: 'bold', color: theme.palette.primary.main }}>
                                            {statistics.mean[0].toFixed(4)}
                                        </Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="subtitle2" color="text.secondary">
                                            Standard Deviation
                                        </Typography>
                                        <Typography variant="body1" sx={{ fontWeight: 'bold', color: theme.palette.primary.main }}>
                                            {statistics.std[0].toFixed(4)}
                                        </Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="subtitle2" color="text.secondary">
                                            Minimum
                                        </Typography>
                                        <Typography variant="body1" sx={{ fontWeight: 'bold', color: theme.palette.primary.main }}>
                                            {min.toFixed(4)}
                                        </Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="subtitle2" color="text.secondary">
                                            Maximum
                                        </Typography>
                                        <Typography variant="body1" sx={{ fontWeight: 'bold', color: theme.palette.primary.main }}>
                                            {max.toFixed(4)}
                                        </Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="subtitle2" color="text.secondary">
                                            Range
                                        </Typography>
                                        <Typography variant="body1" sx={{ fontWeight: 'bold', color: theme.palette.primary.main }}>
                                            {range.toFixed(4)}
                                        </Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="subtitle2" color="text.secondary">
                                            Variance
                                        </Typography>
                                        <Typography variant="body1" sx={{ fontWeight: 'bold', color: theme.palette.primary.main }}>
                                            {variance.toFixed(4)}
                                        </Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="subtitle2" color="text.secondary">
                                            Median
                                        </Typography>
                                        <Typography variant="body1" sx={{ fontWeight: 'bold', color: theme.palette.primary.main }}>
                                            {median.toFixed(4)}
                                        </Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="subtitle2" color="text.secondary">
                                            IQR
                                        </Typography>
                                        <Typography variant="body1" sx={{ fontWeight: 'bold', color: theme.palette.primary.main }}>
                                            {iqr.toFixed(4)}
                                        </Typography>
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Visualization */}
                    <Grid item xs={12} md={6}>
                        <Card elevation={3} sx={{
                            borderRadius: 2,
                            background: 'rgba(255, 255, 255, 0.9)',
                            backdropFilter: 'blur(10px)'
                        }}>
                            <CardContent>
                                <Typography
                                    variant="h6"
                                    gutterBottom
                                    sx={{
                                        color: theme.palette.primary.main,
                                        fontWeight: 'bold'
                                    }}
                                >
                                    Embedding Visualization
                                </Typography>
                                <Box sx={{ height: 300 }}>
                                    <Line data={chartData} options={chartOptions} />
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Raw Embeddings */}
                    <Grid item xs={12}>
                        <Card elevation={3} sx={{
                            borderRadius: 2,
                            background: 'rgba(255, 255, 255, 0.9)',
                            backdropFilter: 'blur(10px)'
                        }}>
                            <CardContent>
                                <Typography
                                    variant="h6"
                                    gutterBottom
                                    sx={{
                                        color: theme.palette.primary.main,
                                        fontWeight: 'bold'
                                    }}
                                >
                                    Raw Embeddings
                                </Typography>
                                <Box sx={{
                                    maxHeight: 200,
                                    overflow: 'auto',
                                    background: 'linear-gradient(45deg, #f3f4f6 30%, #e5e7eb 90%)',
                                    p: 2,
                                    borderRadius: 1
                                }}>
                                    <Typography variant="body2" component="pre" sx={{
                                        fontFamily: 'monospace',
                                        whiteSpace: 'pre-wrap',
                                        wordBreak: 'break-all',
                                        color: theme.palette.text.primary
                                    }}>
                                        {JSON.stringify(embeddings[0], null, 2)}
                                    </Typography>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </Box>
        );
    };

    return (
        <Container maxWidth="xxl" maxHeight="xxl">
            <Box
                sx={{
                    // my: 4,
                    // background: 'linear-gradient(145deg, #f5f7fa 0%, #e4e8eb 100%)',
                    // background: 'red',
                    
                    // height: 
                    // borderRadius: 4,
                    px: 8, 
                    // p: 4,
                    // mt: 7
                    // boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
                    border: '2px solid red'

                }}>
                <Fade in={true} timeout={1000}>
                    <Typography
                        variant="h3"
                        component="h1"
                        gutterBottom
                        align="center"
                        sx={{
                            fontWeight: 'bold',
                            background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            textShadow: '2px 2px 4px rgba(0,0,0,0.1)',
                            mb: 4,
                        }}
                    >
                        {/* Supply Chain Analysis Platform */}
                    </Typography>
                </Fade>

                <Box sx={{
                    borderBottom: 1,
                    borderColor: 'divider',
                    mb: 3,
                    '& .MuiTabs-root': {
                        minHeight: 60
                    },
                    '& .MuiTab-root': {
                        fontSize: '1.1rem',
                        fontWeight: 'medium',
                        textTransform: 'none',
                        minWidth: 200,
                        color: theme.palette.text.secondary,
                        '&.Mui-selected': {
                            color: theme.palette.primary.main,
                            fontWeight: 'bold'
                        }
                    }
                }}>
                    <Tabs
                        value={activeTab}
                        onChange={handleTabChange}
                        centered
                        TabIndicatorProps={{
                            style: {
                                backgroundColor: theme.palette.primary.main,
                                height: 3
                            }
                        }}
                    >
                        <Tab label="Data Ingestion" />
                        <Tab label="Text Analysis" />
                        <Tab label="Process Modeling" />
                        <Tab label="Time Series Analysis" />
                    </Tabs>
                </Box>

                {activeTab === 0 && (
                    <Fade in={true} timeout={500}>
                        <Card elevation={3} sx={{
                            borderRadius: 2,
                            background: 'rgba(255, 255, 255, 0.9)',
                            backdropFilter: 'blur(10px)'
                        }}>
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
                                        background: 'rgba(255, 255, 255, 0.9)',
                                        backdropFilter: 'blur(10px)'
                                    }}
                                >
                                    {error}
                                </Alert>
                            )}

                            <Card elevation={3} sx={{
                                mb: 3,
                                borderRadius: 2,
                                background: 'rgba(255, 255, 255, 0.9)',
                                backdropFilter: 'blur(10px)'
                            }}>
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
                                                        '&:hover fieldset': {
                                                            borderColor: theme.palette.primary.main,
                                                        },
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
                                                    background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                                                    boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)',
                                                    '&:hover': {
                                                        background: 'linear-gradient(45deg, #1976D2 30%, #1CB5E0 90%)',
                                                    }
                                                }}
                                            >
                                                {loading ? <CircularProgress size={24} /> : 'Analyze Text'}
                                            </Button>
                                        </Grid>
                                    </Grid>
                                </CardContent>
                            </Card>

                            {results && (
                                <AnalysisResults results={results} />
                            )}
                        </Box>
                    </Fade>
                )}

                {activeTab === 2 && (
                    <Fade in={true} timeout={500}>
                        <Card elevation={3} sx={{
                            borderRadius: 2,
                            background: 'rgba(255, 255, 255, 0.9)',
                            backdropFilter: 'blur(10px)'
                        }}>
                            <CardContent>
                                <ProcessModeling />
                            </CardContent>
                        </Card>
                    </Fade>
                )}

                {activeTab === 3 && (
                    <Fade in={true} timeout={500}>
                        <Card elevation={3} sx={{
                            borderRadius: 2,
                            background: 'rgba(255, 255, 255, 0.9)',
                            backdropFilter: 'blur(10px)'
                        }}>
                            <CardContent>
                                <TimeSeriesAnalysis />
                            </CardContent>
                        </Card>
                    </Fade>
                )}
            </Box>
        </Container>
    );
}

export default App; 