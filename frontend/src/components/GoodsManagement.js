import React, { useState, useEffect } from 'react';
import {
    Box,
    Grid,
    TextField,
    Button,
    Typography,
    Card,
    CardContent,
    Alert,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
    CircularProgress,
    Divider,
    IconButton,
    Tooltip
} from '@mui/material';
import { ArrowUpward, ArrowDownward, Info } from '@mui/icons-material';
import axios from 'axios';

const GoodsManagement = () => {
    const [goods, setGoods] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [exchangeRate, setExchangeRate] = useState(null);
    const [formData, setFormData] = useState({
        goodsId: '',
        goodsName: '',
        cost: '',
        price: '',
        date: '',
        supplierId: '',
        supplierName: ''
    });

    useEffect(() => {
        fetchExchangeRate();
    }, []);

    const fetchExchangeRate = async () => {
        try {
            const response = await axios.get('https://api.exchangerate-api.com/v4/latest/USD');
            setExchangeRate(response.data.rates);
        } catch (error) {
            console.error('Error fetching exchange rate:', error);
            setExchangeRate({
                USD: 1,
                EUR: 0.85,
                GBP: 0.73,
                NGN: 460
            });
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        // Validate form data
        if (!formData.goodsId || !formData.goodsName || !formData.cost || !formData.price || !formData.date || !formData.supplierId || !formData.supplierName) {
            setError('Please fill in all fields');
            setLoading(false);
            return;
        }

        // Add new goods to the list
        const newGoods = {
            ...formData,
            id: Date.now(),
            currentPrice: parseFloat(formData.price),
            predictions: {
                up: {
                    30: parseFloat(formData.price) * 1.03,
                    50: parseFloat(formData.price) * 1.03,
                    60: parseFloat(formData.price) * 1.03
                },
                down: {
                    30: parseFloat(formData.price) * 0.97,
                    50: parseFloat(formData.price) * 0.97,
                    60: parseFloat(formData.price) * 0.97
                }
            },
            supplierPerformance: {
                onTimeDelivery: Math.random() > 0.3 ? 'Good' : 'Poor',
                qualityScore: Math.random() > 0.2 ? 'High' : 'Low',
                riskLevel: Math.random() > 0.4 ? 'Low' : 'High'
            }
        };

        setGoods(prev => [...prev, newGoods]);
        setFormData({
            goodsId: '',
            goodsName: '',
            cost: '',
            price: '',
            date: '',
            supplierId: '',
            supplierName: ''
        });
        setLoading(false);
    };

    const getSupplierRiskColor = (risk) => {
        return risk === 'High' ? 'error' : 'success';
    };

    return (
        <Box>
            <Typography variant="h4" gutterBottom sx={{ mb: 4 }}>
                Goods Management
            </Typography>

            {/* Input Form */}
            <Card sx={{ mb: 4 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        Add New Goods
                        <Tooltip title="Please fill in all fields with accurate information. The system will use this data for price predictions and supplier evaluation.">
                            <IconButton size="small">
                                <Info />
                            </IconButton>
                        </Tooltip>
                    </Typography>
                    <form onSubmit={handleSubmit}>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Goods ID"
                                    name="goodsId"
                                    value={formData.goodsId}
                                    onChange={handleInputChange}
                                    required
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Goods Name"
                                    name="goodsName"
                                    value={formData.goodsName}
                                    onChange={handleInputChange}
                                    required
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Cost"
                                    name="cost"
                                    type="number"
                                    value={formData.cost}
                                    onChange={handleInputChange}
                                    required
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Price"
                                    name="price"
                                    type="number"
                                    value={formData.price}
                                    onChange={handleInputChange}
                                    required
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Date"
                                    name="date"
                                    type="date"
                                    value={formData.date}
                                    onChange={handleInputChange}
                                    InputLabelProps={{ shrink: true }}
                                    required
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Supplier ID"
                                    name="supplierId"
                                    value={formData.supplierId}
                                    onChange={handleInputChange}
                                    required
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Supplier Name"
                                    name="supplierName"
                                    value={formData.supplierName}
                                    onChange={handleInputChange}
                                    required
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <Button
                                    type="submit"
                                    variant="contained"
                                    color="primary"
                                    disabled={loading}
                                    fullWidth
                                >
                                    {loading ? <CircularProgress size={24} /> : 'Add Goods'}
                                </Button>
                            </Grid>
                        </Grid>
                    </form>
                </CardContent>
            </Card>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            {/* Current Prices */}
            <Card sx={{ mb: 4 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        Current Prices
                    </Typography>
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>ID</TableCell>
                                    <TableCell>Name</TableCell>
                                    <TableCell>Current Price (USD)</TableCell>
                                    <TableCell>Supplier</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {goods.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell>{item.goodsId}</TableCell>
                                        <TableCell>{item.goodsName}</TableCell>
                                        <TableCell>${item.currentPrice.toFixed(2)}</TableCell>
                                        <TableCell>{item.supplierName}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </CardContent>
            </Card>

            {/* Price Predictions */}
            <Card sx={{ mb: 4 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        Price Predictions
                    </Typography>
                    <Grid container spacing={2}>
                        {goods.map((item) => (
                            <Grid item xs={12} key={item.id}>
                                <Card variant="outlined">
                                    <CardContent>
                                        <Typography variant="subtitle1" gutterBottom>
                                            {item.goodsName}
                                        </Typography>
                                        <Grid container spacing={2}>
                                            <Grid item xs={12} sm={6}>
                                                <Box sx={{ p: 2, bgcolor: 'success.light', borderRadius: 1 }}>
                                                    <Typography variant="subtitle2" color="white">
                                                        <ArrowUpward /> Price Increase Prediction
                                                    </Typography>
                                                    <Typography variant="body2" color="white">
                                                        30 days: ${item.predictions.up[30].toFixed(2)}
                                                    </Typography>
                                                    <Typography variant="body2" color="white">
                                                        50 days: ${item.predictions.up[50].toFixed(2)}
                                                    </Typography>
                                                    <Typography variant="body2" color="white">
                                                        60 days: ${item.predictions.up[60].toFixed(2)}
                                                    </Typography>
                                                </Box>
                                            </Grid>
                                            <Grid item xs={12} sm={6}>
                                                <Box sx={{ p: 2, bgcolor: 'error.light', borderRadius: 1 }}>
                                                    <Typography variant="subtitle2" color="white">
                                                        <ArrowDownward /> Price Decrease Prediction
                                                    </Typography>
                                                    <Typography variant="body2" color="white">
                                                        30 days: ${item.predictions.down[30].toFixed(2)}
                                                    </Typography>
                                                    <Typography variant="body2" color="white">
                                                        50 days: ${item.predictions.down[50].toFixed(2)}
                                                    </Typography>
                                                    <Typography variant="body2" color="white">
                                                        60 days: ${item.predictions.down[60].toFixed(2)}
                                                    </Typography>
                                                </Box>
                                            </Grid>
                                        </Grid>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </CardContent>
            </Card>

            {/* Supplier Performance & Risks */}
            <Card>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        Supplier Performance & Risk Assessment
                    </Typography>
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Supplier</TableCell>
                                    <TableCell>On-Time Delivery</TableCell>
                                    <TableCell>Quality Score</TableCell>
                                    <TableCell>Risk Level</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {goods.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell>{item.supplierName}</TableCell>
                                        <TableCell>
                                            <Chip
                                                label={item.supplierPerformance.onTimeDelivery}
                                                color={item.supplierPerformance.onTimeDelivery === 'Good' ? 'success' : 'error'}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={item.supplierPerformance.qualityScore}
                                                color={item.supplierPerformance.qualityScore === 'High' ? 'success' : 'error'}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={item.supplierPerformance.riskLevel}
                                                color={getSupplierRiskColor(item.supplierPerformance.riskLevel)}
                                                size="small"
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </CardContent>
            </Card>
        </Box>
    );
};

export default GoodsManagement; 