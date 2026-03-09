import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    Container,
    Grid,
    Card,
    CardContent,
    CardActions,
    Typography,
    Button,
    Box
} from '@mui/material';
import {
    School,
    Home,
    Restaurant,
    EmojiPeople,
    Payment,
    Logout,
    Build
} from '@mui/icons-material';

const DashboardCard = ({ title, icon: Icon, description, onClick }) => (
    <Grid item xs={12} sm={6} md={4}>
        <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
                <Icon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                <Typography variant="h5" component="h2" gutterBottom>
                    {title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    {description}
                </Typography>
            </CardContent>
            <CardActions>
                <Button size="small" variant="contained" fullWidth onClick={onClick}>
                    Detalii
                </Button>
            </CardActions>
        </Card>
    </Grid>
);

const Dashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const isAdmin = user?.roles?.includes('ADMINISTRATOR');
    const isStudent = user?.roles?.includes('STUDENT');
    const isHandyman = user?.roles?.includes('HANDYMAN');
    const isCasierie = user?.roles?.includes('CASIERIE');

    // Different dashboard cards for different roles
    const adminCards = [
        {
            title: 'Studenți',
            icon: School,
            description: 'Gestionare studenți și camere',
            path: '/students'
        },
        {
            title: 'Camere',
            icon: Home,
            description: 'Gestionare camere și ocupare',
            path: '/rooms'
        },
        {
            title: 'Plăți',
            icon: Payment,
            description: 'Plată cămin, istoric plăți',
            path: '/payments'
        },
        {
            title: 'Reparații',
            icon: Build,
            description: 'Toate sesizările din sistem',
            path: '/repairs'
        }
    ];

    const studentCards = [
        {
            title: 'Profil',
            icon: School,
            description: 'Informații personale și facultate',
            path: '/students'
        },
        {
            title: 'Spălătorie',
            icon: Restaurant,
            description: 'Rezervare slot spălătorie',
            path: '/laundry'
        },
        {
            title: 'Reparații',
            icon: Home,
            description: 'Sesizări și cereri de reparații',
            path: '/repairs'
        },
        {
            title: 'Plăți',
            icon: Payment,
            description: 'Plată cămin, istoric plăți',
            path: '/payments'
        }
    ];

    const handymanCards = [
        {
            title: 'Sesizări Reparații',
            icon: Build,
            description: 'Vezi toate sesizările și actualizează statusul',
            path: '/repairs'
        }
    ];

    const casierieCards = [
        {
            title: 'Plăți Studenți',
            icon: Payment,
            description: 'Vizualizare și înregistrare plăți',
            path: '/payments'
        }
    ];

    const getDashboardCards = () => {
        if (isAdmin) return adminCards;
        if (isCasierie) return casierieCards;
        if (isHandyman) return handymanCards;
        if (isStudent) return studentCards;
        return [];
    };

    const dashboardCards = getDashboardCards();

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                    <Typography variant="h3" component="h1" gutterBottom>
                        Bine ai venit, {user?.fullName}!
                    </Typography>
                    <Typography variant="subtitle1" color="text.secondary">
                        Roluri: {user?.roles?.join(', ')}
                    </Typography>
                </Box>
                <Button
                    variant="outlined"
                    color="error"
                    startIcon={<Logout />}
                    onClick={handleLogout}
                >
                    Delogare
                </Button>
            </Box>

            <Grid container spacing={3}>
                {dashboardCards.map((card, index) => (
                    <DashboardCard
                        key={index}
                        {...card}
                        onClick={() => navigate(card.path)}
                    />
                ))}
            </Grid>

            <Box sx={{ mt: 4, p: 3, bgcolor: 'info.light', borderRadius: 2 }}>
                <Typography variant="h6" gutterBottom>
                    ℹ️ Informații Sistem
                </Typography>
                <Typography variant="body2">
                    Aplicație pentru gestiunea căminului studențesc.
                    Click pe carduri pentru a accesa fiecare modul.
                </Typography>
            </Box>
        </Container>
    );
};

export default Dashboard;
