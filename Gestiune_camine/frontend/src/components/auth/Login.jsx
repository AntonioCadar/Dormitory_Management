import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    Container,
    Box,
    Card,
    CardContent,
    TextField,
    Button,
    Typography,
    Alert
} from '@mui/material';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            await login(email, password);
            navigate('/');
        } catch (err) {
            // Handle both axios errors and thrown Error objects
            const errorMessage = err.message || err.response?.data?.message || 'Email sau parolă incorectă';
            setError(errorMessage);
        }
    };

    return (
        <Container maxWidth="sm">
            <Box sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Card sx={{ width: '100%', p: 3 }}>
                    <CardContent>
                        <Typography variant="h4" component="h1" gutterBottom align="center">
                            Gestiune Cămin
                        </Typography>
                        <Typography variant="subtitle1" gutterBottom align="center" color="text.secondary">
                            UTCN - Universitatea Tehnică din Cluj-Napoca
                        </Typography>

                        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}

                        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
                            <TextField
                                fullWidth
                                label="Email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                margin="normal"
                                required
                                autoFocus
                            />
                            <TextField
                                fullWidth
                                label="Parolă"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                margin="normal"
                                required
                            />
                            <Button
                                type="submit"
                                fullWidth
                                variant="contained"
                                size="large"
                                sx={{ mt: 3 }}
                            >
                                Autentificare
                            </Button>
                        </Box>

                        <Box sx={{ mt: 3 }}>
                            <Typography variant="body2" color="text.secondary">
                                <strong>Demo Credentials:</strong><br />
                                Admin: admin@utcn.ro / admin123<br />
                                Casierie: casierie@utcn.ro / casierie123<br />
                                Handyman: handyman@utcn.ro / handyman123<br />
                                Student: student2@student.utcn.ro / student123
                            </Typography>
                        </Box>
                    </CardContent>
                </Card>
            </Box>
        </Container>
    );
};

export default Login;
