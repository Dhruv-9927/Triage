import axios from 'axios';
import { db } from '../db';

const uuidv4 = () => crypto.randomUUID();

export const apiClient = axios.create({
  baseURL: 'http://localhost:8000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('sehat_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('sehat_token');
      window.location.href = '/login';
    }
    
    // Offline handling for mutations
    if (!navigator.onLine && error.config && ['post', 'put', 'delete'].includes(error.config.method?.toLowerCase() || '')) {
      const resource = error.config.url?.split('/')[1] || 'unknown';
      const resourceId = error.config.url?.split('/')[2] || uuidv4();
      
      await db.outbox.add({
        uuid: uuidv4(),
        resource,
        resourceId,
        operation: error.config.method?.toLowerCase() as 'create' | 'update' | 'delete',
        payload: JSON.parse(error.config.data || '{}'),
        timestamp: Date.now(),
        retryCount: 0
      });
      
      // Return a simulated success response
      return Promise.resolve({ data: { id: resourceId, _offline: true } });
    }
    
    return Promise.reject(error);
  }
);
