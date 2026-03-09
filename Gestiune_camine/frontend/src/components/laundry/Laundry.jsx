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
    Box,
    Tabs,
    Tab,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Alert
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Home as HomeIcon, ChevronLeft, ChevronRight } from '@mui/icons-material';

const LaundryCalendar = () => {
    const [bookings, setBookings] = useState([]);
    const [machines, setMachines] = useState([]);
    const [selectedFloor, setSelectedFloor] = useState(null);
    const [currentWeekStart, setCurrentWeekStart] = useState(getMonday(new Date()));
    const [confirmDialog, setConfirmDialog] = useState({ open: false, slot: null });
    const [error, setError] = useState(null);
    const { user } = useAuth();
    const navigate = useNavigate();

    // Time slots for the calendar (24h format)
    const timeSlots = [
        '06:00', '08:30', '11:00', '13:30', '16:00', '18:30', '21:00'
    ];

    // Days of the week
    const weekDays = ['Lun', 'Mar', 'Mie', 'Joi', 'Vin', 'Sâm', 'Dum'];

    useEffect(() => {
        fetchMachines();
    }, []);

    useEffect(() => {
        if (selectedFloor) {
            fetchBookings();
        }
    }, [selectedFloor, currentWeekStart]);

    const fetchMachines = async () => {
        try {
            const response = await axios.get('http://localhost:8080/api/laundry/machines', {
                headers: { 'X-User-Id': user.userId }
            });
            setMachines(response.data || []);
            // Select first machine by default
            if (response.data && response.data.length > 0) {
                setSelectedFloor(response.data[0].id);
            }
        } catch (err) {
            console.error('Error fetching machines:', err);
            setError('Nu s-au putut încărca mașinile de spălat. Verificați dacă sunteți asignat la o cameră.');
        }
    };

    function getMonday(date) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        return new Date(d.setDate(diff));
    }

    function addDays(date, days) {
        const result = new Date(date);
        result.setDate(result.getDate() + days);
        return result;
    }

    function formatDate(date) {
        const d = new Date(date);
        return `${d.getDate()}.${d.getMonth() + 1}`;
    }

    const fetchBookings = async () => {
        try {
            const response = await axios.get('http://localhost:8080/api/laundry/bookings', {
                headers: { 'X-User-Id': user.userId }
            });
            setBookings(response.data || []);
        } catch (err) {
            console.error('Error fetching bookings:', err);
        }
    };

    const findBookingForSlot = (dayIndex, time) => {
        const slotDate = addDays(currentWeekStart, dayIndex);

        // Format date in local timezone YYYY-MM-DD
        const year = slotDate.getFullYear();
        const month = String(slotDate.getMonth() + 1).padStart(2, '0');
        const day = String(slotDate.getDate()).padStart(2, '0');
        const slotDateTime = `${year}-${month}-${day}T${time}:00`;

        const found = bookings.find(b =>
            b.startTime &&
            b.startTime.startsWith(slotDateTime) &&
            !b.isCancelled &&
            b.machineId === selectedFloor  // Filter by selected machine
        );

        return found;
    };

    const handleCellClick = (dayIndex, time) => {
        // Check if user is properly authenticated
        if (!user || !user.userId) {
            setError('Trebuie să fii autentificat pentru a face o rezervare');
            return;
        }

        const booking = findBookingForSlot(dayIndex, time);

        if (booking) {
            if (booking.isOwn) {
                // Cancel own booking
                handleCancelBooking(booking.id);
            } else {
                // Else: already booked by someone else, do nothing
            }
        } else {
            // Open confirmation dialog
            setConfirmDialog({
                open: true,
                slot: { dayIndex, time }
            });
        }
    };

    const handleConfirmBooking = async () => {
        const { dayIndex, time } = confirmDialog.slot;
        const bookingDate = addDays(currentWeekStart, dayIndex);

        // Create start datetime
        const [startHours, startMinutes] = time.split(':').map(Number);
        const startDateTime = new Date(bookingDate);
        startDateTime.setHours(startHours, startMinutes, 0, 0);

        // Calculate end time (1.5 hours later)
        const endDateTime = new Date(startDateTime);
        endDateTime.setHours(startDateTime.getHours() + 1, startDateTime.getMinutes() + 30, 0, 0);

        // Format in local timezone as YYYY-MM-DDTHH:mm:ss
        const formatLocalDateTime = (date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            const seconds = String(date.getSeconds()).padStart(2, '0');
            return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
        };

        const startTimeStr = formatLocalDateTime(startDateTime);
        const endTimeStr = formatLocalDateTime(endDateTime);

        try {
            await axios.post(
                'http://localhost:8080/api/laundry/book',
                null,
                {
                    params: {
                        machineId: selectedFloor,
                        startTime: startTimeStr,
                        endTime: endTimeStr
                    },
                    headers: { 'X-User-Id': user.userId }
                }
            );
            setConfirmDialog({ open: false, slot: null });
            fetchBookings();
        } catch (err) {
            console.error('Booking error:', err);
            setError('Eroare la crearea rezervării');
            setConfirmDialog({ open: false, slot: null });
        }
    };

    const handleCancelBooking = async (bookingId) => {
        if (window.confirm('Sigur doriți să anulați această rezervare?')) {
            try {
                await axios.delete(`http://localhost:8080/api/laundry/bookings/${bookingId}`, {
                    headers: {
                        'X-User-Id': user.userId,
                        'X-User-Role': user.roles && user.roles[0]
                    }
                });
                fetchBookings();
            } catch (err) {
                setError('Eroare la anularea rezervării');
            }
        }
    };

    const getCellStyle = (booking) => {
        if (!booking) {
            return { backgroundColor: '#f5f5f5', cursor: 'pointer', border: '1px solid #ddd' };
        }
        if (booking.isOwn) {
            return { backgroundColor: '#c8e6c9', cursor: 'pointer', border: '1px solid #4caf50' };
        }
        return { backgroundColor: '#ffcdd2', border: '1px solid #f44336' };
    };

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
                        Programări Spălătorie
                    </Typography>
                </Box>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            {/* Floor selector */}
            {machines.length > 0 ? (
                <Paper sx={{ mb: 2 }}>
                    <Tabs value={selectedFloor} onChange={(e, v) => setSelectedFloor(v)}>
                        {machines.map((machine) => (
                            <Tab key={machine.id} label={machine.name} value={machine.id} />
                        ))}
                    </Tabs>
                </Paper>
            ) : (
                <Alert severity="warning" sx={{ mb: 2 }}>
                    Nu există mașini de spălat disponibile. Asigurați-vă că sunteți asignat la o cameră dintr-un cămin.
                </Alert>
            )}

            {/* Week navigation */}
            <Box display="flex" justifyContent="center" alignItems="center" gap={2} mb={2}>
                <Button
                    startIcon={<ChevronLeft />}
                    onClick={() => setCurrentWeekStart(addDays(currentWeekStart, -7))}
                >
                    Săptămâna anterioară
                </Button>
                <Typography variant="h6">
                    {formatDate(currentWeekStart)} - {formatDate(addDays(currentWeekStart, 6))}
                </Typography>
                <Button
                    endIcon={<ChevronRight />}
                    onClick={() => setCurrentWeekStart(addDays(currentWeekStart, 7))}
                >
                    Săptămâna următoare
                </Button>
            </Box>

            {/* Calendar grid */}
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ backgroundColor: '#1976d2' }}>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Ora</TableCell>
                            {weekDays.map((day, idx) => (
                                <TableCell key={idx} align="center" sx={{ color: 'white', fontWeight: 'bold' }}>
                                    {day}<br />
                                    <Typography variant="caption">{formatDate(addDays(currentWeekStart, idx))}</Typography>
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {timeSlots.map((time) => (
                            <TableRow key={time}>
                                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>
                                    {time}
                                </TableCell>
                                {weekDays.map((_, dayIdx) => {
                                    const booking = findBookingForSlot(dayIdx, time);
                                    return (
                                        <TableCell
                                            key={dayIdx}
                                            align="center"
                                            sx={getCellStyle(booking)}
                                            onClick={() => handleCellClick(dayIdx, time)}
                                        >
                                            {booking ? booking.roomNumber || '?' : ''}
                                        </TableCell>
                                    );
                                })}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Confirmation Dialog */}
            <Dialog open={confirmDialog.open} onClose={() => setConfirmDialog({ open: false, slot: null })}>
                <DialogTitle>Confirmare rezervare</DialogTitle>
                <DialogContent>
                    Sigur doriți să rezervați Etaj {selectedFloor - 3} pentru acest slot?
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmDialog({ open: false, slot: null })}>Anulează</Button>
                    <Button onClick={handleConfirmBooking} variant="contained">Confirmă</Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default LaundryCalendar;
