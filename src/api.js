// src/api.js
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api'; // Adjust based on your Django server

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  login: (credentials) => api.post('/auth/login/', credentials),
  signup: (userData) => api.post('/auth/register/', userData),
  getCurrentUser: () => api.get('/auth/me/'),
};

export const groupAPI = {
  getGroups: () => api.get('/groups/'),
  createGroup: (groupData) => api.post('/groups/', groupData),
  getGroup: (id) => api.get(`/groups/${id}/`),
  deleteGroup: (id) => api.delete(`/groups/${id}/`),
};

export const transactionAPI = {
  createTransaction: (transactionData) => api.post('/transactions/', transactionData),
  getGroupTransactions: (groupId) => api.get(`/groups/${groupId}/transactions/`),
};

export const dashboardAPI = {
  getSummary: () => api.get('/dashboard/summary/'),
};