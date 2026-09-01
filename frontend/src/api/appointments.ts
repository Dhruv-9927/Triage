import { apiClient } from './client';

export const appointmentsApi = {
  createAppointment: async (data: any) => {
    const res = await apiClient.post('/appointments', data);
    return res.data;
  },
  getAppointments: async () => {
    const res = await apiClient.get('/appointments');
    return res.data;
  },
  getAppointment: async (id: string) => {
    const res = await apiClient.get(`/appointments/${id}`);
    return res.data;
  },
  updateAppointment: async (id: string, data: any) => {
    const res = await apiClient.patch(`/appointments/${id}`, data);
    return res.data;
  }

};
