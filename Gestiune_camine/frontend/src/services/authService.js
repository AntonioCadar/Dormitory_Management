import api from './api';

export const authService = {
    login: async (email, password) => {
        const response = await api.post('/auth/login', { email, password });

        // Check if login was successful
        if (!response.data.success) {
            throw new Error(response.data.message || 'Email sau parolă incorectă');
        }

        if (response.data.token) {
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data));
        }
        return response.data;
    },

    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    },

    getCurrentUser: () => {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    },

    isAuthenticated: () => {
        return !!localStorage.getItem('token');
    }
};
