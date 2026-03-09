import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import {
    Container,
    Typography,
    Card,
    CardContent,
    CardActions,
    Grid,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    MenuItem,
    Alert,
    CircularProgress,
    Box,
    Chip,
    Divider,
    List,
    ListItem,
    ListItemText,
    IconButton,
    Paper
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
    Add as AddIcon,
    Home as HomeIcon,
    Send as SendIcon,
    Comment as CommentIcon,
    Build as BuildIcon,
    CheckCircle as CheckCircleIcon
} from '@mui/icons-material';

const Repairs = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [openSubmitDialog, setOpenSubmitDialog] = useState(false);
    const [openCommentsDialog, setOpenCommentsDialog] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [loadingComments, setLoadingComments] = useState(false);
    const { user } = useAuth();
    const navigate = useNavigate();

    const [submitForm, setSubmitForm] = useState({
        title: '',
        description: ''
    });

    useEffect(() => {
        if (user) {
            fetchRequests();
        }
    }, [user]);

    const isHandyman = user?.roles?.includes('HANDYMAN');
    const isAdmin = user?.roles?.includes('ADMINISTRATOR');
    const isStudent = user?.roles?.includes('STUDENT');

    const fetchRequests = async () => {
        try {
            setLoading(true);
            let response;

            if (isHandyman || isAdmin) {
                response = await axios.get('http://localhost:8080/api/repairs', {
                    headers: { 'X-User-Role': isHandyman ? 'HANDYMAN' : 'ADMINISTRATOR' }
                });
            } else if (isStudent) {
                response = await axios.get('http://localhost:8080/api/repairs/my-room', {
                    headers: { 'X-User-Id': user.userId }
                });
            }

            setRequests(response?.data || []);
        } catch (err) {
            console.error('Error fetching repairs:', err);
            setError('Eroare la încărcarea sesizărilor');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitRequest = async () => {
        try {
            await axios.post(
                'http://localhost:8080/api/repairs',
                submitForm,
                {
                    headers: { 'X-User-Id': user.userId }
                }
            );
            setOpenSubmitDialog(false);
            setSubmitForm({ title: '', description: '' });
            fetchRequests();
        } catch (err) {
            console.error('Error creating repair:', err);
            setError('Eroare la trimiterea sesizării');
        }
    };

    const handleUpdateStatus = async (requestId, newStatus) => {
        try {
            await axios.put(
                `http://localhost:8080/api/repairs/${requestId}/status`,
                { status: newStatus },
                {
                    headers: { 'X-User-Role': isHandyman ? 'HANDYMAN' : 'ADMINISTRATOR' }
                }
            );
            fetchRequests();
        } catch (err) {
            console.error('Error updating status:', err);
            setError('Eroare la actualizarea statusului');
        }
    };

    const handleOpenComments = async (request) => {
        setSelectedRequest(request);
        setOpenCommentsDialog(true);
        setLoadingComments(true);

        try {
            const response = await axios.get(
                `http://localhost:8080/api/repairs/${request.id}/comments`
            );
            setComments(response.data);
        } catch (err) {
            console.error('Error fetching comments:', err);
        } finally {
            setLoadingComments(false);
        }
    };

    const handleAddComment = async () => {
        if (!newComment.trim()) return;

        try {
            await axios.post(
                `http://localhost:8080/api/repairs/${selectedRequest.id}/comments`,
                { message: newComment },
                {
                    headers: { 'X-User-Id': user.userId }
                }
            );
            setNewComment('');
            // Refresh comments
            const response = await axios.get(
                `http://localhost:8080/api/repairs/${selectedRequest.id}/comments`
            );
            setComments(response.data);
        } catch (err) {
            console.error('Error adding comment:', err);
            setError('Eroare la adăugarea comentariului');
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'PENDING': return 'warning';
            case 'IN_PROGRESS': return 'info';
            case 'COMPLETED': return 'success';
            case 'CANCELLED': return 'error';
            default: return 'default';
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'PENDING': return 'În Așteptare';
            case 'IN_PROGRESS': return 'În Desfășurare';
            case 'COMPLETED': return 'Finalizată';
            case 'CANCELLED': return 'Anulată';
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

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
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
                        {isHandyman ? 'Toate Sesizările' : 'Sesizări Cameră'}
                    </Typography>
                </Box>
                {isStudent && (
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<AddIcon />}
                        onClick={() => setOpenSubmitDialog(true)}
                    >
                        Sesizare Nouă
                    </Button>
                )}
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

            {isHandyman && (
                <Alert severity="info" sx={{ mb: 2 }}>
                    Ești logat ca Handyman. Poți vedea toate sesizările și actualiza statusul lor.
                </Alert>
            )}

            <Grid container spacing={3}>
                {requests.map((request) => (
                    <Grid item xs={12} md={6} key={request.id}>
                        <Card elevation={3}>
                            <CardContent>
                                <Box display="flex" justifyContent="space-between" alignItems="start" mb={1}>
                                    <Typography variant="h6" gutterBottom>
                                        {request.title || `Sesizare #${request.id}`}
                                    </Typography>
                                    <Chip
                                        label={getStatusLabel(request.status)}
                                        color={getStatusColor(request.status)}
                                        size="small"
                                    />
                                </Box>

                                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                    {request.description || 'Fără descriere'}
                                </Typography>

                                <Divider sx={{ my: 1 }} />

                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                    {request.roomNumber && (
                                        <Typography variant="body2" color="text.secondary">
                                            <strong>Cameră:</strong> {request.roomNumber}
                                            {request.dormitoryName && ` - ${request.dormitoryName}`}
                                        </Typography>
                                    )}
                                    {request.location && (
                                        <Typography variant="body2" color="text.secondary">
                                            <strong>Locație:</strong> {request.location}
                                        </Typography>
                                    )}
                                    {request.reporterName && (
                                        <Typography variant="body2" color="text.secondary">
                                            <strong>Raportat de:</strong> {request.reporterName}
                                        </Typography>
                                    )}
                                    {request.createdAt && (
                                        <Typography variant="body2" color="text.secondary">
                                            <strong>Data:</strong> {new Date(request.createdAt).toLocaleDateString('ro-RO')}
                                        </Typography>
                                    )}
                                </Box>
                            </CardContent>

                            <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                                <Button
                                    size="small"
                                    startIcon={<CommentIcon />}
                                    onClick={() => handleOpenComments(request)}
                                >
                                    Comentarii
                                </Button>

                                {(isHandyman || isAdmin) && request.status !== 'COMPLETED' && (
                                    <Box>
                                        {request.status === 'PENDING' && (
                                            <Button
                                                size="small"
                                                color="info"
                                                startIcon={<BuildIcon />}
                                                onClick={() => handleUpdateStatus(request.id, 'IN_PROGRESS')}
                                            >
                                                Încep Lucrul
                                            </Button>
                                        )}
                                        {request.status === 'IN_PROGRESS' && (
                                            <Button
                                                size="small"
                                                color="success"
                                                startIcon={<CheckCircleIcon />}
                                                onClick={() => handleUpdateStatus(request.id, 'COMPLETED')}
                                            >
                                                Finalizează
                                            </Button>
                                        )}
                                    </Box>
                                )}
                            </CardActions>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {requests.length === 0 && (
                <Alert severity="info" sx={{ mt: 2 }}>
                    {isStudent ? 'Nu există sesizări pentru camera ta' : 'Nu există sesizări'}
                </Alert>
            )}

            {/* Submit Request Dialog */}
            <Dialog open={openSubmitDialog} onClose={() => setOpenSubmitDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Sesizare Nouă</DialogTitle>
                <DialogContent>
                    <TextField
                        fullWidth
                        margin="normal"
                        label="Titlu"
                        placeholder="Ex: Robinet defect, Priză stricată..."
                        value={submitForm.title}
                        onChange={(e) => setSubmitForm({ ...submitForm, title: e.target.value })}
                    />
                    <TextField
                        fullWidth
                        margin="normal"
                        label="Descriere"
                        placeholder="Descrieți problema în detaliu..."
                        multiline
                        rows={4}
                        value={submitForm.description}
                        onChange={(e) => setSubmitForm({ ...submitForm, description: e.target.value })}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenSubmitDialog(false)}>Anulează</Button>
                    <Button
                        onClick={handleSubmitRequest}
                        variant="contained"
                        color="primary"
                        disabled={!submitForm.title.trim()}
                    >
                        Trimite Sesizare
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Comments Dialog */}
            <Dialog
                open={openCommentsDialog}
                onClose={() => setOpenCommentsDialog(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>
                    Comentarii - {selectedRequest?.title}
                </DialogTitle>
                <DialogContent>
                    {loadingComments ? (
                        <Box display="flex" justifyContent="center" p={3}>
                            <CircularProgress />
                        </Box>
                    ) : (
                        <>
                            {comments.length === 0 ? (
                                <Alert severity="info" sx={{ mb: 2 }}>
                                    Nu există comentarii încă
                                </Alert>
                            ) : (
                                <List sx={{ maxHeight: 300, overflow: 'auto', mb: 2 }}>
                                    {comments.map((comment) => (
                                        <Paper key={comment.id} sx={{ mb: 1, p: 1.5 }} variant="outlined">
                                            <Typography variant="subtitle2" color="primary">
                                                {comment.senderName}
                                            </Typography>
                                            <Typography variant="body2">
                                                {comment.message}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {new Date(comment.sentAt).toLocaleString('ro-RO')}
                                            </Typography>
                                        </Paper>
                                    ))}
                                </List>
                            )}

                            <Divider sx={{ my: 2 }} />

                            <Box display="flex" gap={1}>
                                <TextField
                                    fullWidth
                                    size="small"
                                    placeholder="Scrie un comentariu..."
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleAddComment();
                                        }
                                    }}
                                />
                                <IconButton
                                    color="primary"
                                    onClick={handleAddComment}
                                    disabled={!newComment.trim()}
                                >
                                    <SendIcon />
                                </IconButton>
                            </Box>
                        </>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenCommentsDialog(false)}>Închide</Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default Repairs;
