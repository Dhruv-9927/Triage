import { apiClient } from './client';

export const facilitiesApi = {
  getFacilities: async (filters: any = {}) => {
    const res = await apiClient.get('/facilities', { params: filters });
    return res.data;
  },
  getFacilityDetails: async (id: string) => {
    const res = await apiClient.get(`/facilities/${id}`);
    return res.data;
  },
  getRoutingResults: async (triageData: any) => {
    const res = await apiClient.post('/facilities/route', triageData);
    return res.data;
  },
  discoverFacilities: async (latitude: number, longitude: number, radiusKm: number = 20, specialty: string = 'General Medicine') => {
    const res = await apiClient.post('/facilities/discover', {
      latitude,
      longitude,
      radius_km: radiusKm,
      specialty
    });
    return res.data;
  }
};
