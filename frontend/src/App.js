import React, { useState } from 'react';
import {
    Container,
    Box,
    TextField,
    Button,
    Typography,
    CircularProgress,
    Grid,
    Alert,
    Tabs,
    Tab,
    Card,
    CardContent,
    Fade,
    // ThemeProvider,
    // CssBaseline,
    createTheme,
    IconButton,
    Snackbar,
    Paper
} from '@mui/material';
import {
    DarkMode as DarkModeIcon,
    LightMode as LightModeIcon,
    AttachMoney as MoneyIcon
} from '@mui/icons-material'
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
import TimeSeriesAnalysis from './components/TimeSeriesAnalysis';
import GoodsManagement from './components/GoodsManagement';

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

// Create theme
const theme = createTheme({
    palette: {
        primary: {
            main: '#1976d2',
        },
        secondary: {
            main: '#dc004e',
        },
        background: {
            default: '#f5f7fa',
        },
    },
    typography: {
        fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
        h3: {
            fontWeight: 500,
            fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
        },
        h4: {
            fontSize: 'clamp(1.2rem, 3vw, 2rem)',
        },
        h5: {
            fontSize: 'clamp(1rem, 2.5vw, 1.5rem)',
        },
        h6: {
            fontSize: 'clamp(0.9rem, 2vw, 1.25rem)',
        },
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    textTransform: 'none',
                    padding: '8px 16px',
                    '@media (max-width: 600px)': {
                        padding: '6px 12px',
                    },
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    '@media (max-width: 600px)': {
                        borderRadius: '8px',
                    },
                },
            },
        },
        MuiContainer: {
            styleOverrides: {
                root: {
                    '@media (max-width: 600px)': {
                        padding: '0px',
                    },
                },
            },
        },
        MuiTab: {
            styleOverrides: {
                root: {
                    '@media (max-width: 600px)': {
                        minWidth: 'auto',
                        fontSize: '0.875rem',
                    },
                },
            },
        },
    },
    breakpoints: {
        values: {
            xs: 0,
            sm: 600,
            md: 960,
            lg: 1280,
            xl: 1920,
        },
    },

});

function TabPanel(props) {

    const { children, value, index, ...other } = props;
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`simple-tabpanel-${index}`}
            aria-labelledby={`simple-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{
                    p: { xs: 2, sm: 3 },
                    width: '100%',
                    overflow: 'auto'
                }}>
                    {children}
                </Box>
            )}
        </div>
    );
}

function App() {
    const [darkMode, setDarkMode] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    const [text, setText] = useState('');
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState(null);
    const [error, setError] = useState('');
    const [value, setValue] = useState(0);

    const toggleDarkMode = () => {
        setDarkMode(!darkMode);
        showSnackbar(`${darkMode ? 'Light' : 'Dark'} mode activated`, 'info');
    };


    const showSnackbar = (message, severity) => {
        setSnackbar({ open: true, message, severity });
    };

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

            if (response.data.error) {
                setError(response.data.error);
                return;
            }

            setResults(response.data);
        } catch (err) {
            console.error('Error details:', err);
            if (err.code === 'ECONNABORTED') {
                setError('Request timed out. Please try again.');
            } else if (!err.response) {
                setError('Network error: Please make sure the backend server is running at http://localhost:5000');
            } else if (err.response?.status === 503) {
                setError('The model is currently unavailable. Please try again later.');
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

    const handleChange = (event, newValue) => {
        setValue(newValue);
    };

    const AnalysisResults = ({ results }) => {
        if (!results) return null;

        const { embeddings, statistics } = results;

        // Add warning if using fallback embeddings
        const isFallbackEmbeddings = embeddings[0].every(val =>
            typeof val === 'number' && val >= -1 && val <= 1
        );

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
            <Container sx={{ mt: 4 }}>
                <Typography variant="h5" gutterBottom>
                    Analysis Results
                </Typography>

                {isFallbackEmbeddings && (
                    <Alert severity="warning" sx={{ mb: 3 }}>
                        Using simplified analysis due to model loading issues. Results may be less accurate.
                    </Alert>
                )}

                <Grid container spacing={3}>
                    {/* Statistics Cards */}
                    <Grid item xs={12} md={6}>
                        <Card elevation={3}>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Statistical Summary
                                </Typography>
                                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
                                    <Box>
                                        <Typography variant="subtitle2" color="text.secondary">
                                            Mean Value
                                        </Typography>
                                        <Typography variant="body1">
                                            {statistics.mean[0].toFixed(4)}
                                        </Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="subtitle2" color="text.secondary">
                                            Standard Deviation
                                        </Typography>
                                        <Typography variant="body1">
                                            {statistics.std[0].toFixed(4)}
                                        </Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="subtitle2" color="text.secondary">
                                            Minimum
                                        </Typography>
                                        <Typography variant="body1">
                                            {min.toFixed(4)}
                                        </Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="subtitle2" color="text.secondary">
                                            Maximum
                                        </Typography>
                                        <Typography variant="body1">
                                            {max.toFixed(4)}
                                        </Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="subtitle2" color="text.secondary">
                                            Range
                                        </Typography>
                                        <Typography variant="body1">
                                            {range.toFixed(4)}
                                        </Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="subtitle2" color="text.secondary">
                                            Variance
                                        </Typography>
                                        <Typography variant="body1">
                                            {variance.toFixed(4)}
                                        </Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="subtitle2" color="text.secondary">
                                            Median
                                        </Typography>
                                        <Typography variant="body1">
                                            {median.toFixed(4)}
                                        </Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="subtitle2" color="text.secondary">
                                            IQR
                                        </Typography>
                                        <Typography variant="body1">
                                            {iqr.toFixed(4)}
                                        </Typography>
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Visualization */}
                    <Grid item xs={12} md={6}>
                        <Card elevation={3}>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
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
                        <Card elevation={3}>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Raw Embeddings
                                </Typography>
                                <Box sx={{
                                    maxHeight: 200,
                                    overflow: 'auto',
                                    backgroundColor: 'rgba(0, 0, 0, 0.02)',
                                    p: 2,
                                    borderRadius: 1
                                }}>
                                    <Typography variant="body2" component="pre" sx={{
                                        fontFamily: 'monospace',
                                        whiteSpace: 'pre-wrap',
                                        wordBreak: 'break-all'
                                    }}>
                                        {JSON.stringify(embeddings[0], null, 2)}
                                    </Typography>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </Container>
        );
    };

    return (

        <Box sx={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg,rgb(78, 79, 81) 0%, #e4e8eb 100%)',
            bgcolor: darkMode ? 'background.paper' : 'background.default',
            transition: 'all 0.3s ease-in-out',
            paddingTop:'40px'
        }}>

            {/* <Container maxWidth="xl"
                sx={{ pt: '40px',
                    pl: '0px',
                    pr: '0px',
                    padding: '0px',
                    // background: darkMode ? 'background.paper' : 'background.default',
                }}> */}
                <Box sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    alignItems: 'self-start',
                }}>
                    <Typography variant="h3" component="h1" gutterBottom sx={{
                        textAlign: 'center',
                        color: '#2c3e50',
                        fontWeight: 'bold',
                        mb: { xs: 2, sm: 4 },
                        mT: { xs: 2, sm: 4 },
                        textShadow: '2px 2px 4px rgba(0,0,0,0.1)'
                    }}>
                        Process Analysis Dashboard
                    </Typography>
                    <IconButton onClick={toggleDarkMode} color="primary"
                        sx={{ marginLeft: '130px' }}
                    >
                        {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
                    </IconButton>
                </Box>
                
                        <Box sx={{
                            borderBottom: 1,
                            borderColor: 'divider',
                            mb: 3,
                            overflowX: 'auto',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                        }}>
                            <Tabs
                                value={value}
                                onChange={handleChange}
                                variant="standard"
                                centered
                                sx={{
                                    '& .MuiTab-root': {
                                        fontSize: { xs: '0.875rem', sm: '1.1rem' },
                                        fontWeight: 'medium',
                                        textTransform: 'none',
                                        minWidth: { xs: 'auto', sm: 200 },
                                        color: '#546e7a',
                                        '&.Mui-selected': {
                                            color: '#1976d2',
                                            fontWeight: 'bold',
                                        },
                                    },
                                    '& .MuiTabs-indicator': {
                                        backgroundColor: '#1976d2',
                                        height: 3,
                                        borderRadius: '3px 3px 0 0',
                                    },
                                    '& .MuiTabs-flexContainer': {
                                        justifyContent: 'center',
                                        gap: 2
                                    }
                                }}
                            >
                                <Tab label="Text Analysis" />
                                <Tab label="Time Series Analysis" />
                                <Tab label="Goods Management" />
                            </Tabs>
                        </Box>

                        <TabPanel value={value} index={0} >
                            <Fade in={true} timeout={500}>
                                <Box sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexDirection: 'column'
                                }}>
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

                                    <Card elevation={3} sx={{
                                        mb: 3,
                                        width: '50%',
                                        borderRadius: 3,
                                        background: 'linear-gradient(145deg,rgb(118, 54, 54) 0%,rgb(112, 131, 151) 100%)',
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
                                                            color: 'black',
                                                            '& .MuiOutlinedInput-root': {
                                                                borderRadius: 2,
                                                                backgroundColor: 'rgba(255,255,255,0.9)',
                                                                '&:hover': {
                                                                    backgroundColor: 'rgba(255,255,255,1)',
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
                                                            background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                                                            boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)',
                                                            '&:hover': {
                                                                background: 'linear-gradient(45deg, #1976D2 30%, #1CB5E0 90%)',
                                                            },
                                                        }}
                                                    >
                                                        {loading ? <CircularProgress size={24} color="inherit" /> : 'Analyze Text'}
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
                        </TabPanel>

                        <TabPanel value={value} index={1}>
                            <Fade in={true} timeout={500}>
                                <Card elevation={3} sx={{
                                    borderRadius: 3,
                                    // background: 'linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)',
                                    // border: '1px solid rgba(0,0,0,0.1)'
                                }}>
                                    <CardContent>
                                        <TimeSeriesAnalysis />
                                    </CardContent>
                                </Card>
                            </Fade>
                        </TabPanel>

                        <TabPanel value={value} index={2}>
                            <Fade in={true} timeout={500}>
                                <Card elevation={0} sx={{
                                    borderRadius: 4,
                                    // background: 'linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)',
                                }}>                                        <CardContent>

                                        <GoodsManagement />
                                        </CardContent>
                                </Card>
                            </Fade>
                        </TabPanel>
            {/* </Container> */}
        </Box>
        // </ThemeProvider>
    );
}

export default App; 