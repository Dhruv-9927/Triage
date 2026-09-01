import { apiClient } from './client';

export const queueApi = {
  getMyTokens: async () => {
    const res = await apiClient.get('/queue/my-tokens');
    return res.data;
  },
  getTokenStatus: async (id: string) => {
    const res = await apiClient.get(`/queue/${id}/status`);
    return res.data;
  },
  checkIn: async (tokenId: string) => {
    const res = await apiClient.post(`/queue/${tokenId}/checkin`);
    return res.data;
  }
};
