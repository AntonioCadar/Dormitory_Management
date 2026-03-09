import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import {
    Container,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Alert,
    CircularProgress,
    Box,
    Chip,
    IconButton,
    Autocomplete
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { CheckCircle as PaidIcon, Add as AddIcon, Home as HomeIcon, Search as SearchIcon } from '@mui/icons-material';

const Payments = () => {
    const [payments, setPayments] = useState([]);
    const [students, setStudents] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [openGenerateDialog, setOpenGenerateDialog] = useState(false);
    const { user } = useAuth();
    const navigate = useNavigate();

    const [generateForm, setGenerateForm] = useState({
        type: '',
        amount: ''
    });

    const isAdmin = user?.roles?.includes('ADMINISTRATOR');
    const isCasierie = user?.roles?.includes('CASIERIE');
    const isStudent = user?.roles?.includes('STUDENT');
    const canViewAll = isAdmin || isCasierie;

    useEffect(() => {
        if (user) {
            if (canViewAll) {
                fetchStudents();
            } else if (isStudent) {
                // Student sees own payments directly
                fetchStudentPayments();
            }
        }
    }, [user]);

    const fetchStudents = async () => {
        try {
            setLoading(true);
            const userRole = isCasierie ? 'CASIERIE' : 'ADMINISTRATOR';
            const response = await axios.get('http://localhost:8080/api/students', {
                headers: { 'X-User-Role': userRole }
            });
            setStudents(response.data);
        } catch (err) {
            setError('Eroare la încărcarea studenților');
        } finally {
            setLoading(false);
        }
    };

    const fetchStudentPayments = async () => {
        try {
            setLoading(true);
            const response = await axios.get('http://localhost:8080/api/payments/my-payments', {
                headers: { 'X-User-Id': user.userId }
            });
            setPayments(response.data);
        } catch (err) {
            setError('Eroare la încărcarea plăților');
        } finally {
            setLoading(false);
        }
    };

    const fetchPaymentsForStudent = async (studentId) => {
        try {
            setLoading(true);
            const userRole = isCasierie ? 'CASIERIE' : 'ADMINISTRATOR';
            const response = await axios.get(`http://localhost:8080/api/payments/student/${studentId}`, {
                headers: { 'X-User-Role': userRole }
            });
            setPayments(response.data);
        } catch (err) {
            setError('Eroare la încărcarea plăților studentului');
        } finally {
            setLoading(false);
        }
    };

    const handleStudentSelect = (event, student) => {
        setSelectedStudent(student);
        if (student) {
            fetchPaymentsForStudent(student.id);
        } else {
            setPayments([]);
        }
    };

    const handleMarkAsPaid = async (paymentId) => {
        try {
            await axios.post(
                `http://localhost:8080/api/payments/${paymentId}/mark-paid`,
                {},
                { headers: { 'X-User-Role': 'CASIERIE' } }
            );
            // Refresh payments for selected student
            if (selectedStudent) {
                fetchPaymentsForStudent(selectedStudent.id);
            }
        } catch (err) {
            setError('Eroare la marcarea plății');
        }
    };

    const handleGeneratePayment = async () => {
        if (!selectedStudent) {
            setError('Selectați un student mai întâi');
            return;
        }

        // Validate required fields
        if (!generateForm.type || !generateForm.amount) {
            setError('Completați toate câmpurile obligatorii');
            return;
        }

        // Auto-set due date to today
        const today = new Date().toISOString().split('T')[0];

        try {
            console.log('Generating payment with:', {
                studentId: selectedStudent.id,
                type: generateForm.type,
                amount: parseFloat(generateForm.amount),
                dueDate: today
            });
            await axios.post(
                'http://localhost:8080/api/payments/generate',
                null,
                {
                    params: {
                        studentId: selectedStudent.id,
                        type: generateForm.type,
                        amount: parseFloat(generateForm.amount),
                        dueDate: today
                    },
                    headers: { 'X-User-Role': 'CASIERIE' }
                }
            );
            setOpenGenerateDialog(false);
            setGenerateForm({ type: '', amount: '' });
            setError(null);
            fetchPaymentsForStudent(selectedStudent.id);
        } catch (err) {
            console.error('Error generating payment:', err);
            setError('Eroare la generarea plății: ' + (err.response?.data?.message || err.message));
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'PAID': return 'success';
            case 'PENDING': return 'warning';
            case 'OVERDUE': return 'error';
            default: return 'default';
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'PAID': return 'Plătită';
            case 'PENDING': return 'Neachitată';
            case 'OVERDUE': return 'Întârziată';
            default: return status;
        }
    };

    if (loading && !canViewAll) {
        return (
            <Container>
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                    <CircularProgress />
                </Box>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ mt: 4 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Box display="flex" alignItems="center" gap={2}>
                    <Button
                        variant="outlined"
                        startIcon={<HomeIcon />}
                        onClick={() => navigate('/')}
                    >
                        Înapoi la Dashboard
                    </Button>
                    <Typography variant="h4">
                        Plăți și Taxe
                    </Typography>
                </Box>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

            {/* Search section for ADMIN and CASIERIE */}
            {canViewAll && (
                <Paper sx={{ p: 3, mb: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        <SearchIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                        Caută Student
                    </Typography>
                    <Autocomplete
                        options={students}
                        getOptionLabel={(option) => `${option.fullName} (${option.email})`}
                        value={selectedStudent}
                        onChange={handleStudentSelect}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Caută după nume..."
                                variant="outlined"
                                fullWidth
                            />
                        )}
                        isOptionEqualToValue={(option, value) => option.id === value.id}
                    />

                    {selectedStudent && isCasierie && (
                        <Box sx={{ mt: 2 }}>
                            <Button
                                variant="contained"
                                color="primary"
                                startIcon={<AddIcon />}
                                onClick={() => setOpenGenerateDialog(true)}
                            >
                                Generează Plată Extra
                            </Button>
                        </Box>
                    )}
                </Paper>
            )}

            {/* Payments Table */}
            {(selectedStudent || isStudent) && (
                <>
                    <Typography variant="h6" gutterBottom>
                        {isStudent ? 'Situația ta de plată' : `Plăți pentru: ${selectedStudent?.fullName}`}
                    </Typography>

                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow sx={{ backgroundColor: '#1976d2' }}>
                                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Tip Plată</TableCell>
                                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Sumă</TableCell>
                                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Scadență</TableCell>
                                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Data Plății</TableCell>
                                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Status</TableCell>
                                    {isCasierie && <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Acțiuni</TableCell>}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {payments.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={isCasierie ? 6 : 5} align="center">
                                            Nu există plăți înregistrate
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    payments.map((payment) => (
                                        <TableRow key={payment.id} hover>
                                            <TableCell>{payment.paymentType || 'N/A'}</TableCell>
                                            <TableCell><strong>{payment.amount} RON</strong></TableCell>
                                            <TableCell>{payment.dueDate || 'N/A'}</TableCell>
                                            <TableCell>{payment.paidDate || '-'}</TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={getStatusLabel(payment.status)}
                                                    color={getStatusColor(payment.status)}
                                                    size="small"
                                                />
                                            </TableCell>
                                            {isCasierie && (
                                                <TableCell>
                                                    {payment.status !== 'PAID' && (
                                                        <IconButton
                                                            size="small"
                                                            color="success"
                                                            onClick={() => handleMarkAsPaid(payment.id)}
                                                            title="Marchează ca plătită"
                                                        >
                                                            <PaidIcon />
                                                        </IconButton>
                                                    )}
                                                </TableCell>
                                            )}
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </>
            )}

            {canViewAll && !selectedStudent && (
                <Alert severity="info" sx={{ mt: 2 }}>
                    Caută și selectează un student pentru a vedea plățile
                </Alert>
            )}

            {/* Generate Payment Dialog */}
            <Dialog open={openGenerateDialog} onClose={() => setOpenGenerateDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Generează Plată pentru {selectedStudent?.fullName}</DialogTitle>
                <DialogContent>
                    <TextField
                        fullWidth
                        margin="normal"
                        label="Tip Plată"
                        value={generateForm.type}
                        onChange={(e) => setGenerateForm({ ...generateForm, type: e.target.value })}
                        placeholder="Ex: Cazare Decembrie, Teren Fotbal, etc."
                    />
                    <TextField
                        fullWidth
                        margin="normal"
                        label="Sumă (RON)"
                        type="number"
                        value={generateForm.amount}
                        onChange={(e) => setGenerateForm({ ...generateForm, amount: e.target.value })}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenGenerateDialog(false)}>Anulează</Button>
                    <Button onClick={handleGeneratePayment} variant="contained" color="primary">
                        Generează
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default Payments;
