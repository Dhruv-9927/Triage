import { create } from 'zustand';
import { triageApi } from '../api/triage';

interface TriageState {
  symptoms: string;
  language: string;
  assessment: any | null;
  facilities: any[];
  isLoading: boolean;
  error: string | null;
  setSymptoms: (s: string) => void;
  setLanguage: (l: string) => void;
  submitSymptoms: () => Promise<void>;
  clearTriage: () => void;
}

export const useTriageStore = create<TriageState>((set, get) => ({
  symptoms: '',
  language: 'en',
  assessment: null,
  facilities: [],
  isLoading: false,
  error: null,
  setSymptoms: (symptoms) => set({ symptoms }),
  setLanguage: (language) => set({ language }),
  submitSymptoms: async () => {
    const { symptoms, language } = get();
    set({ isLoading: true, error: null });

    let lat: number | undefined = undefined;
    let lon: number | undefined = undefined;

    // Get live browser GPS coordinates if available
    if ('geolocation' in navigator) {
      try {
        const pos: any = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 4000 });
        });
        lat = pos.coords.latitude;
        lon = pos.coords.longitude;
      } catch {
        // Fallback default
      }
    }

    try {
      const result = await triageApi.assessSymptoms(symptoms, language, lat, lon);
      set({ 
        assessment: result.assessment, 
        facilities: result.facilities || [], 
        isLoading: false 
      });
    } catch (err: any) {
      set({ error: err.message || 'Error assessing symptoms', isLoading: false });
    }
  },
  clearTriage: () => set({ symptoms: '', assessment: null, facilities: [], error: null })
}));
