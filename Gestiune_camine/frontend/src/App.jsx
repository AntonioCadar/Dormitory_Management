import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './context/AuthContext';
import Login from './components/auth/Login';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Dashboard from './components/dashboard/Dashboard';
import Students from './components/students/Students';
import Rooms from './components/rooms/Rooms';
import Payments from './components/payments/Payments';
import Laundry from './components/laundry/Laundry';
import Repairs from './components/repairs/Repairs';

const theme = createTheme({
    palette: {
        primary: {
            main: '#1976d2',
        },
        secondary: {
            main: '#dc004e',
        },
    },
});

function App() {
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <AuthProvider>
                <BrowserRouter>
                    <Routes>
                        <Route path="/login" element={<Login />} />
                        <Route
                            path="/"
                            element={
                                <ProtectedRoute>
                                    <Dashboard />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/students"
                            element={
                                <ProtectedRoute>
                                    <Students />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/rooms"
                            element={
                                <ProtectedRoute>
                                    <Rooms />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/payments"
                            element={
                                <ProtectedRoute>
                                    <Payments />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/laundry"
                            element={
                                <ProtectedRoute>
                                    <Laundry />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/repairs"
                            element={
                                <ProtectedRoute>
                                    <Repairs />
                                </ProtectedRoute>
                            }
                        />
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </BrowserRouter>
            </AuthProvider>
        </ThemeProvider>
    );
}

export default App;
