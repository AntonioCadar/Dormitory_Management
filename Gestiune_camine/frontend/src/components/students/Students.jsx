import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    MenuItem,
    Alert,
    CircularProgress,
    Box
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Home as HomeIcon, Lock as LockIcon } from '@mui/icons-material';

const Students = () => {
    const [students, setStudents] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [faculties, setFaculties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [openAssignDialog, setOpenAssignDialog] = useState(false);
    const [editingStudent, setEditingStudent] = useState(null);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [confirmDeleteDialog, setConfirmDeleteDialog] = useState({ open: false, studentId: null });
    const [confirmUnassignDialog, setConfirmUnassignDialog] = useState({ open: false, studentId: null });
    const { user } = useAuth();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        email: '',
        fullName: '',
        phone: '',
        cnp: '',
        facultyId: '',
        year: '',
        groupName: '',
        password: ''
    });

    const [openPasswordDialog, setOpenPasswordDialog] = useState(false);
    const [passwordData, setPasswordData] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [passwordError, setPasswordError] = useState('');

    useEffect(() => {
        if (user) {
            fetchStudents();
            if (user.roles && user.roles.includes('ADMINISTRATOR')) {
                fetchRooms();
            }
        }
    }, [user]);

    const fetchStudents = async () => {
        try {
            setLoading(true);

            if (user.roles && user.roles.includes('ADMINISTRATOR')) {
                const response = await axios.get('http://localhost:8080/api/students', {
                    headers: { 'X-User-Role': 'ADMINISTRATOR' }
                });
                setStudents(response.data);
            } else if (user.roles && user.roles.includes('STUDENT')) {
                const response = await axios.get('http://localhost:8080/api/students/me', {
                    headers: { 'X-User-Id': user.userId }
                });
                setStudents([response.data]);
            }
        } catch (err) {
            setError('Eroare la încărcarea studenților');
        } finally {
            setLoading(false);
        }
    };

    const fetchRooms = async () => {
        try {
            const response = await axios.get('http://localhost:8080/api/rooms', {
                headers: { 'X-User-Role': 'ADMINISTRATOR' }
            });
            setRooms(response.data);
        } catch (err) {
            console.error('Error fetching rooms:', err);
        }
    };

    const handleAddStudent = () => {
        setEditingStudent(null);
        setFormData({
            email: '',
            fullName: '',
            phone: '',
            cnp: '',
            facultyId: '',
            year: '',
            groupName: '',
            password: ''
        });
        setOpenDialog(true);
    };

    const handleEditStudent = (student) => {
        setEditingStudent(student);
        setFormData({
            email: student.email,
            fullName: student.fullName,
            phone: student.phone || '',
            cnp: student.cnp || '',
            facultyId: student.facultyId || '',
            year: student.year || '',
            groupName: student.groupName || ''
        });
        setOpenDialog(true);
    };

    const handleDeleteStudent = (event, id) => {
        event.preventDefault();
        event.stopPropagation();
        setConfirmDeleteDialog({ open: true, studentId: id });
    };

    const confirmDeleteStudent = async () => {
        try {
            await axios.delete(`http://localhost:8080/api/students/${confirmDeleteDialog.studentId}`, {
                headers: { 'X-User-Role': 'ADMINISTRATOR' }
            });
            fetchStudents();
        } catch (err) {
            setError('Eroare la ștergerea studentului');
        } finally {
            setConfirmDeleteDialog({ open: false, studentId: null });
        }
    };

    const handleSaveStudent = async () => {
        try {
            if (editingStudent) {
                await axios.put(`http://localhost:8080/api/students/${editingStudent.id}`, formData, {
                    headers: { 'X-User-Role': 'ADMINISTRATOR' }
                });
            } else {
                await axios.post('http://localhost:8080/api/students', formData, {
                    headers: { 'X-User-Role': 'ADMINISTRATOR' }
                });
            }
            setOpenDialog(false);
            fetchStudents();
        } catch (err) {
            setError('Eroare la salvarea studentului');
        }
    };

    const handleAssignRoom = (student) => {
        setSelectedStudent(student);
        setOpenAssignDialog(true);
    };

    const handleUnassignRoom = (event, studentId) => {
        event.preventDefault();
        event.stopPropagation();
        setConfirmUnassignDialog({ open: true, studentId: studentId });
    };

    const confirmUnassignRoom = async () => {
        try {
            await axios.delete(
                `http://localhost:8080/api/students/${confirmUnassignDialog.studentId}/unassign-room`,
                { headers: { 'X-User-Role': 'ADMINISTRATOR' } }
            );
            fetchStudents();
            fetchRooms();
        } catch (err) {
            setError('Eroare la eliminarea din cameră');
        } finally {
            setConfirmUnassignDialog({ open: false, studentId: null });
        }
    };

    const handleAssignRoomSave = async (roomId) => {
        try {
            await axios.post(
                `http://localhost:8080/api/students/${selectedStudent.id}/assign-room/${roomId}`,
                {},
                { headers: { 'X-User-Role': 'ADMINISTRATOR' } }
            );
            setOpenAssignDialog(false);
            fetchStudents();
            fetchRooms();
        } catch (err) {
            setError('Eroare la alocarea camerei');
        }
    };

    const handleChangePassword = async () => {
        setPasswordError('');

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setPasswordError('Parolele noi nu coincid');
            return;
        }

        if (passwordData.newPassword.length < 6) {
            setPasswordError('Parola nouă trebuie să aibă cel puțin 6 caractere');
            return;
        }

        try {
            const response = await axios.post(
                'http://localhost:8080/api/auth/change-password',
                {
                    oldPassword: passwordData.oldPassword,
                    newPassword: passwordData.newPassword
                },
                { headers: { 'X-User-Id': user.userId } }
            );

            if (response.data.success) {
                setOpenPasswordDialog(false);
                setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
                alert('Parola a fost schimbată cu succes!');
            } else {
                setPasswordError(response.data.message);
            }
        } catch (err) {
            setPasswordError('Eroare la schimbarea parolei');
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

    const isAdmin = user.roles && user.roles.includes('ADMINISTRATOR');

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
                        {isAdmin ? 'Toți Studenții' : 'Profilul Meu'}
                    </Typography>
                </Box>
                {isAdmin && (
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<AddIcon />}
                        onClick={handleAddStudent}
                    >
                        Adaugă Student
                    </Button>
                )}
                {!isAdmin && (
                    <Button
                        variant="outlined"
                        color="secondary"
                        startIcon={<LockIcon />}
                        onClick={() => setOpenPasswordDialog(true)}
                    >
                        Schimbă Parola
                    </Button>
                )}
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ backgroundColor: '#1976d2' }}>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Nume</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Email</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Facultate</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>An</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Grupă</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Cameră</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Cămin</TableCell>
                            {isAdmin && <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Acțiuni</TableCell>}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {students.map((student) => (
                            <TableRow key={student.id} hover>
                                <TableCell>{student.fullName}</TableCell>
                                <TableCell>{student.email}</TableCell>
                                <TableCell>{student.facultyName || 'N/A'}</TableCell>
                                <TableCell>{student.year || 'N/A'}</TableCell>
                                <TableCell>{student.groupName || 'N/A'}</TableCell>
                                <TableCell>{student.roomNumber || 'Fără cameră'}</TableCell>
                                <TableCell>{student.dormitoryName || '-'}</TableCell>
                                {isAdmin && (
                                    <TableCell>
                                        <IconButton size="small" color="info" onClick={() => handleAssignRoom(student)}>
                                            <HomeIcon />
                                        </IconButton>
                                        {student.roomNumber && (
                                            <IconButton size="small" color="warning" onClick={(e) => handleUnassignRoom(e, student.id)} title="Elimină din cameră">
                                                <DeleteIcon />
                                            </IconButton>
                                        )}
                                        <IconButton size="small" color="primary" onClick={() => handleEditStudent(student)}>
                                            <EditIcon />
                                        </IconButton>
                                        <IconButton size="small" color="error" onClick={(e) => handleDeleteStudent(e, student.id)}>
                                            <DeleteIcon />
                                        </IconButton>
                                    </TableCell>
                                )}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Add/Edit Student Dialog */}
            <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>{editingStudent ? 'Editare Student' : 'Adăugare Student'}</DialogTitle>
                <DialogContent>
                    <TextField
                        fullWidth
                        margin="normal"
                        label="Email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                    <TextField
                        fullWidth
                        margin="normal"
                        label="Nume Complet"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    />
                    <TextField
                        fullWidth
                        margin="normal"
                        label="Telefon"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                    <TextField
                        fullWidth
                        margin="normal"
                        label="CNP"
                        value={formData.cnp}
                        onChange={(e) => setFormData({ ...formData, cnp: e.target.value })}
                    />
                    <TextField
                        fullWidth
                        margin="normal"
                        label="An"
                        type="number"
                        value={formData.year}
                        onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                    />
                    <TextField
                        fullWidth
                        margin="normal"
                        label="Grupă"
                        value={formData.groupName}
                        onChange={(e) => setFormData({ ...formData, groupName: e.target.value })}
                    />
                    {!editingStudent && (
                        <TextField
                            fullWidth
                            margin="normal"
                            label="Parolă (pentru login)"
                            type="password"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            required
                        />
                    )}
                    {editingStudent && (
                        <TextField
                            fullWidth
                            margin="normal"
                            label="Parolă nouă (lăsați gol pentru a păstra parola curentă)"
                            type="password"
                            value={formData.password || ''}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            helperText="Completați doar dacă doriți să resetați parola studentului"
                        />
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDialog(false)}>Anulează</Button>
                    <Button onClick={handleSaveStudent} variant="contained" color="primary">
                        Salvează
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Assign Room Dialog */}
            <Dialog open={openAssignDialog} onClose={() => setOpenAssignDialog(false)}>
                <DialogTitle>Alocare Cameră</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                        Selectează camera pentru: {selectedStudent?.fullName}
                    </Typography>
                    {rooms.map((room) => (
                        <Button
                            key={room.id}
                            fullWidth
                            variant="outlined"
                            sx={{ mb: 1 }}
                            onClick={() => handleAssignRoomSave(room.id)}
                        >
                            Camera {room.roomNumber} - {room.dormitoryName} ({room.currentOccupancy}/{room.capacity})
                        </Button>
                    ))}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenAssignDialog(false)}>Anulează</Button>
                </DialogActions>
            </Dialog>

            {/* Change Password Dialog */}
            <Dialog open={openPasswordDialog} onClose={() => setOpenPasswordDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Schimbă Parola</DialogTitle>
                <DialogContent>
                    {passwordError && <Alert severity="error" sx={{ mb: 2 }}>{passwordError}</Alert>}
                    <TextField
                        fullWidth
                        margin="normal"
                        label="Parola Veche"
                        type="password"
                        value={passwordData.oldPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                    />
                    <TextField
                        fullWidth
                        margin="normal"
                        label="Parola Nouă"
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    />
                    <TextField
                        fullWidth
                        margin="normal"
                        label="Confirmă Parola Nouă"
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenPasswordDialog(false)}>Anulează</Button>
                    <Button onClick={handleChangePassword} variant="contained" color="primary">
                        Salvează
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Confirm Delete Student Dialog */}
            <Dialog open={confirmDeleteDialog.open} onClose={() => setConfirmDeleteDialog({ open: false, studentId: null })}>
                <DialogTitle>Confirmare Ștergere</DialogTitle>
                <DialogContent>
                    <Typography>Sigur doriți să ștergeți acest student?</Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmDeleteDialog({ open: false, studentId: null })}>Anulează</Button>
                    <Button onClick={confirmDeleteStudent} variant="contained" color="error">
                        Șterge
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Confirm Unassign Room Dialog */}
            <Dialog open={confirmUnassignDialog.open} onClose={() => setConfirmUnassignDialog({ open: false, studentId: null })}>
                <DialogTitle>Confirmare Eliminare din Cameră</DialogTitle>
                <DialogContent>
                    <Typography>Sigur doriți să eliminați studentul din cameră?</Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmUnassignDialog({ open: false, studentId: null })}>Anulează</Button>
                    <Button onClick={confirmUnassignRoom} variant="contained" color="warning">
                        Elimină
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default Students;
