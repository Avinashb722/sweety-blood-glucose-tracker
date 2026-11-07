import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5050/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor: attach auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('sweety_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401 unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear expired auth session
      localStorage.removeItem('sweety_token');
      localStorage.removeItem('sweety_user');
      // If not already on auth pages, redirect
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth endpoints
export const authService = {
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },
  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  }
};

// Reading endpoints
export const readingService = {
  getAll: async (params) => {
    const response = await api.get('/readings', { params });
    return response.data;
  },
  getById: async (id) => {
    const response = await api.get(`/readings/${id}`);
    return response.data;
  },
  create: async (readingData) => {
    const response = await api.post('/readings', readingData);
    return response.data;
  },
  update: async (id, readingData) => {
    const response = await api.put(`/readings/${id}`, readingData);
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/readings/${id}`);
    return response.data;
  }
};

// Report endpoints
export const reportService = {
  getDaily: async (date) => {
    const response = await api.get('/reports/daily', { params: { date } });
    return response.data;
  },
  getMonthToDate: async (date) => {
    const response = await api.get('/reports/month-to-date', { params: { date } });
    return response.data;
  },
  getMonthly: async (date) => {
    const response = await api.get('/reports/monthly', { params: { date } });
    return response.data;
  }
};

export default api;

