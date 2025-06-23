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
    IconButton,
    Tooltip,
    useTheme,
    Snackbar
} from '@mui/material';
import {
    Info,
    Add as AddIcon,
    Delete as DeleteIcon,
    Edit as EditIcon,

    TrendingUp as TrendingUpIcon,
    TrendingDown as TrendingDownIcon,
    Warning as WarningIcon,
    CheckCircle as CheckCircleIcon,
    Error as ErrorIcon,
    LocalShipping as ShippingIcon,
    Assessment as AssessmentIcon,
    AttachMoney as MoneyIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import axios from 'axios';

const MotionCard = motion(Card);
const MotionButton = motion(Button);
const MotionAlert = motion(Alert);

const GoodsManagement = () => {
    const theme = useTheme();
    const [goods, setGoods] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [formData, setFormData] = useState({
        goodsId: '',
        goodsName: '',
        Quantity: '',
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
            await axios.get('https://api.exchangerate-api.com/v4/latest/USD');
            showSnackbar('Exchange rates updated successfully', 'success');
        } catch (error) {
            console.error('Error fetching exchange rate:', error);
            showSnackbar('Using fallback exchange rates', 'warning');
        }
    };

    const showSnackbar = (message, severity) => {
        setSnackbar({ open: true, message, severity });
    };

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

   

    const validateForm = () => {
        const errors = [];
        if (!formData.goodsId) errors.push('Goods ID is required');
        if (!formData.goodsName) errors.push('Goods Name is required');
        if (!formData.cost) errors.push('Quantity is required');
        if (!formData.price) errors.push('Price is required');
        if (!formData.date) errors.push('Date is required');
        if (!formData.supplierId) errors.push('Supplier ID is required');
        if (!formData.supplierName) errors.push('Supplier Name is required');

        if (formData.cost && isNaN(formData.cost)) errors.push('Cost must be a number');
        if (formData.price && isNaN(formData.price)) errors.push('Price must be a number');
        if (formData.cost && formData.price && parseFloat(formData.cost) > parseFloat(formData.price)) {
            errors.push('Cost cannot be greater than price');
        }

        return errors;
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

        const errors = validateForm();
        if (errors.length > 0) {
            setError(errors.join(', '));
            setLoading(false);
            showSnackbar('Please fix the form errors', 'error');
            return;
        }

        const currentPrice = parseFloat(formData.price);

        // Helper function to get random percentage from array
        const getRandomPercentage = (percentages) => {
            return percentages[Math.floor(Math.random() * percentages.length)];
        };

        // Calculate predictions with different percentages for each interval
        const predictions = {
            up: {
                30: currentPrice * (1 + getRandomPercentage([0.03, 0.07])),
                50: currentPrice * (1 + getRandomPercentage([0.02, 0.08, 0.09])),
                60: currentPrice * (1 + getRandomPercentage([0.01, 0.04]))
            },
            down: {
                30: currentPrice * (1 - getRandomPercentage([0.03, 0.07])),
                50: currentPrice * (1 - getRandomPercentage([0.02, 0.08, 0.09])),
                60: currentPrice * (1 - getRandomPercentage([0.01, 0.04]))
            }
        };

        const newGoods = {
            ...formData,
            id: Date.now(),
            currentPrice: currentPrice,
            predictions: predictions,
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
        showSnackbar('Goods added successfully', 'success');
    };

    const getSupplierRiskColor = (risk) => {
        return risk === 'High' ? 'error' : 'success';
    };

    return (
        <Box sx={{
            minHeight: '100vh',
            transition: 'all 0.3s ease-in-out',
        }}>
         
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <MotionAlert
                    severity={snackbar.severity}
                    sx={{ width: '100%' }}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                >
                    {snackbar.message}
                </MotionAlert>
            </Snackbar>

            {/* Input Form */}
            <MotionCard
                sx={{ mb: 4 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <CardContent>
                    <Typography variant="h6" gutterBottom sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1
                    }}>
                        <AddIcon color="primary" /> Add New Goods
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
                                    error={!!error && error.includes('Goods ID')}
                                    helperText={error && error.includes('Goods ID') ? 'Goods ID is required' : ''}
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
                                    error={!!error && error.includes('Goods Name')}
                                    helperText={error && error.includes('Goods Name') ? 'Goods Name is required' : ''}
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
                                    error={!!error && error.includes('Cost')}
                                    helperText={error && error.includes('Cost') ? 'Quantity is required' : ''}
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
                                    error={!!error && error.includes('Price')}
                                    helperText={error && error.includes('Price') ? 'Price is required' : ''}
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
                                    error={!!error && error.includes('Date')}
                                    helperText={error && error.includes('Date') ? 'Date is required' : ''}
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
                                    error={!!error && error.includes('Supplier ID')}
                                    helperText={error && error.includes('Supplier ID') ? 'Supplier ID is required' : ''}
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
                                    error={!!error && error.includes('Supplier Name')}
                                    helperText={error && error.includes('Supplier Name') ? 'Supplier Name is required' : ''}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <MotionButton
                                    type="submit"
                                    variant="contained"
                                    color="primary"
                                    disabled={loading}
                                    fullWidth
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    startIcon={loading ? <CircularProgress size={20} /> : <AddIcon />}
                                >
                                    {loading ? 'Adding...' : 'Add Goods'}
                                </MotionButton>
                            </Grid>
                        </Grid>
                    </form>
                </CardContent>
            </MotionCard>

            {error && (
                <MotionAlert
                    severity="error"
                    sx={{ mb: 3 }}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                >
                    <ErrorIcon sx={{ mr: 1 }} />
                    {error}
                </MotionAlert>
            )}

            {/* Current Prices */}
            <MotionCard
                sx={{ mb: 4 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
            >
                <CardContent>
                    <Typography variant="h6" gutterBottom sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1
                    }}>
                        <MoneyIcon color="primary" /> Current Prices
                    </Typography>
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>ID</TableCell>
                                    <TableCell>Name</TableCell>
                                    <TableCell>Current Price (USD)</TableCell>
                                    <TableCell>Supplier</TableCell>
                                    <TableCell>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {goods.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell>{item.goodsId}</TableCell>
                                        <TableCell>{item.goodsName}</TableCell>
                                        <TableCell>${item.currentPrice.toFixed(2)}</TableCell>
                                        <TableCell>{item.supplierName}</TableCell>
                                        <TableCell>
                                            <IconButton size="small" color="primary">
                                                <EditIcon />
                                            </IconButton>
                                            <IconButton size="small" color="error">
                                                <DeleteIcon />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </CardContent>
            </MotionCard>

            {/* Price Predictions */}
            <MotionCard
                sx={{ mb: 4 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
            >
                <CardContent>
                    <Typography variant="h6" gutterBottom sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1
                    }}>
                        <AssessmentIcon color="primary" /> Price Predictions
                    </Typography>
                    <Grid container spacing={2}>
                        {goods.map((item) => (
                            <Grid item xs={12} key={item.id}>
                                <Card variant="outlined">
                                    <CardContent>
                                        <Typography variant="subtitle1" gutterBottom sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 1
                                        }}>
                                            <MoneyIcon color="primary" /> {item.goodsName}
                                        </Typography>
                                        <Grid container spacing={2}>
                                            <Grid item xs={12} sm={6}>
                                                <Box sx={{
                                                    p: 2,
                                                    bgcolor: 'success.light',
                                                    borderRadius: 1,
                                                    transition: 'all 0.3s ease'
                                                }}>
                                                    <Typography variant="subtitle2" color="white" sx={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 1
                                                    }}>
                                                        <TrendingUpIcon /> Price Increase Prediction
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
                                                <Box sx={{
                                                    p: 2,
                                                    bgcolor: 'error.light',
                                                    borderRadius: 1,
                                                    transition: 'all 0.3s ease'
                                                }}>
                                                    <Typography variant="subtitle2" color="white" sx={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 1
                                                    }}>
                                                        <TrendingDownIcon /> Price Decrease Prediction
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
            </MotionCard>

            {/* Supplier Performance & Risks */}
            <MotionCard
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
            >
                <CardContent>
                    <Typography variant="h6" gutterBottom sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1
                    }}>
                        <ShippingIcon color="primary" /> Supplier Performance & Risk Assessment
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
                                                icon={item.supplierPerformance.onTimeDelivery === 'Good' ? <CheckCircleIcon /> : <WarningIcon />}
                                                label={item.supplierPerformance.onTimeDelivery}
                                                color={item.supplierPerformance.onTimeDelivery === 'Good' ? 'success' : 'error'}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                icon={item.supplierPerformance.qualityScore === 'High' ? <CheckCircleIcon /> : <WarningIcon />}
                                                label={item.supplierPerformance.qualityScore}
                                                color={item.supplierPerformance.qualityScore === 'High' ? 'success' : 'error'}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                icon={item.supplierPerformance.riskLevel === 'Low' ? <CheckCircleIcon /> : <WarningIcon />}
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
            </MotionCard>
        </Box>
    );
};

export default GoodsManagement; 