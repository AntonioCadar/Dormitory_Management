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
    Alert,
    CircularProgress,
    Box,
    Chip,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Divider
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import HomeIcon from '@mui/icons-material/Home';
import PersonIcon from '@mui/icons-material/Person';
import CloseIcon from '@mui/icons-material/Close';

const Rooms = () => {
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { user } = useAuth();
    const navigate = useNavigate();

    // Modal state
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [students, setStudents] = useState([]);
    const [loadingStudents, setLoadingStudents] = useState(false);

    useEffect(() => {
        if (user) {
            fetchRooms();
        }
    }, [user]);

    const fetchRooms = async () => {
        try {
            setLoading(true);

            const isAdmin = user.roles && user.roles.includes('ADMINISTRATOR');
            const isStudent = user.roles && user.roles.includes('STUDENT');

            if (isAdmin) {
                // Admin: fetch all rooms
                const response = await axios.get('http://localhost:8080/api/rooms', {
                    headers: {
                        'X-User-Role': 'ADMINISTRATOR'
                    }
                });
                setRooms(response.data);
            } else if (isStudent) {
                // Student: fetch only assigned room
                const response = await axios.get('http://localhost:8080/api/rooms/my-room', {
                    headers: {
                        'X-User-Id': user.userId
                    }
                });
                setRooms([response.data]); // Show as single-item array
            } else {
                setError('Nu aveți permisiunea de a vizualiza camerele');
            }
        } catch (err) {
            console.error('Error fetching rooms:', err);
            if (err.response && err.response.status === 404) {
                setError('Nu aveți o cameră alocată');
            } else {
                setError('Eroare la încărcarea datelor despre camere');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleRoomClick = async (room) => {
        const isAdmin = user.roles && user.roles.includes('ADMINISTRATOR');
        if (!isAdmin) return;

        setSelectedRoom(room);
        setModalOpen(true);
        setLoadingStudents(true);

        try {
            const response = await axios.get(`http://localhost:8080/api/rooms/${room.id}/students`, {
                headers: {
                    'X-User-Role': 'ADMINISTRATOR'
                }
            });
            setStudents(response.data);
        } catch (err) {
            console.error('Error fetching students:', err);
            setStudents([]);
        } finally {
            setLoadingStudents(false);
        }
    };

    const handleCloseModal = () => {
        setModalOpen(false);
        setSelectedRoom(null);
        setStudents([]);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'AVAILABLE': return 'success';
            case 'FULL': return 'error';
            case 'MAINTENANCE': return 'warning';
            default: return 'default';
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'AVAILABLE': return 'Disponibilă';
            case 'FULL': return 'Ocupată';
            case 'MAINTENANCE': return 'Mentenanță';
            default: return status;
        }
    };

    if (loading) {
        return (
            <Container>
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                    <CircularProgress />
                </Box>
            </Container>
        );
    }

    if (error) {
        return (
            <Container>
                <Alert severity="error">{error}</Alert>
            </Container>
        );
    }

    const isAdmin = user.roles && user.roles.includes('ADMINISTRATOR');

    return (
        <Container maxWidth="lg" sx={{ mt: 4 }}>
            <Box display="flex" alignItems="center" gap={2} mb={3}>
                <Button
                    variant="outlined"
                    startIcon={<HomeIcon />}
                    onClick={() => navigate('/')}
                >
                    Înapoi la Dashboard
                </Button>
                <Typography variant="h4">
                    Situație Camere
                </Typography>
            </Box>

            {isAdmin && (
                <Alert severity="info" sx={{ mb: 2 }}>
                    Click pe o cameră pentru a vedea studenții cazați
                </Alert>
            )}

            <TableContainer component={Paper} sx={{ mt: 3 }}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ backgroundColor: '#1976d2' }}>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Număr Cameră</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Dormitor</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Etaj</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Capacitate</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Ocupare</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Status</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {rooms.map((room) => (
                            <TableRow
                                key={room.id}
                                hover
                                onClick={() => handleRoomClick(room)}
                                sx={{
                                    cursor: isAdmin ? 'pointer' : 'default',
                                    '&:hover': isAdmin ? { backgroundColor: '#e3f2fd' } : {}
                                }}
                            >
                                <TableCell><strong>{room.roomNumber}</strong></TableCell>
                                <TableCell>{room.dormitoryName || 'N/A'}</TableCell>
                                <TableCell>{room.floor || 'N/A'}</TableCell>
                                <TableCell>{room.capacity || 'N/A'}</TableCell>
                                <TableCell>{room.currentOccupancy || 0} / {room.capacity || 0}</TableCell>
                                <TableCell>
                                    <Chip
                                        label={getStatusLabel(room.status)}
                                        color={getStatusColor(room.status)}
                                        size="small"
                                    />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {rooms.length === 0 && (
                <Alert severity="info" sx={{ mt: 2 }}>
                    Nu există camere disponibile
                </Alert>
            )}

            {/* Modal for showing students */}
            <Dialog
                open={modalOpen}
                onClose={handleCloseModal}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle sx={{ backgroundColor: '#1976d2', color: 'white' }}>
                    Studenți în camera {selectedRoom?.roomNumber}
                    <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                        {selectedRoom?.dormitoryName}
                    </Typography>
                </DialogTitle>
                <DialogContent sx={{ mt: 2 }}>
                    {loadingStudents ? (
                        <Box display="flex" justifyContent="center" py={3}>
                            <CircularProgress />
                        </Box>
                    ) : students.length === 0 ? (
                        <Alert severity="info">
                            Nu există studenți în această cameră
                        </Alert>
                    ) : (
                        <List>
                            {students.map((student, index) => (
                                <React.Fragment key={student.id}>
                                    <ListItem>
                                        <ListItemIcon>
                                            <PersonIcon color="primary" />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={student.fullName}
                                            secondary={
                                                <>
                                                    <Typography component="span" variant="body2" color="text.primary">
                                                        Email: {student.email}
                                                    </Typography>
                                                    <br />
                                                    {student.phone && (
                                                        <>Telefon: {student.phone}<br /></>
                                                    )}
                                                    {student.facultyName && (
                                                        <>Facultatea: {student.facultyName}<br /></>
                                                    )}
                                                    {student.year && (
                                                        <>Anul: {student.year}</>
                                                    )}
                                                    {student.groupName && (
                                                        <>, Grupa: {student.groupName}</>
                                                    )}
                                                </>
                                            }
                                        />
                                    </ListItem>
                                    {index < students.length - 1 && <Divider />}
                                </React.Fragment>
                            ))}
                        </List>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseModal} startIcon={<CloseIcon />}>
                        Închide
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default Rooms;

