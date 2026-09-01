import { apiClient } from './client';

export const triageApi = {
  assessSymptoms: async (symptoms: string, language: string, latitude?: number, longitude?: number) => {
    const res = await apiClient.post('/triage/assess', { 
      symptoms, 
      language,
      latitude,
      longitude
    });
    return res.data;
  },
  getTriageHistory: async () => {
    const res = await apiClient.get('/triage/history');
    return res.data;
  }
};
