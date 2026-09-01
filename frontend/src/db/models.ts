export interface Patient {
  id: string;
  fullName: string;
  dob: string;
  gender: string;
  bloodGroup: string;
  syncStatus: 'synced' | 'pending' | 'conflict';
  updatedAt: number;
}

export interface HealthRecord {
  id: string;
  patientId: string;
  type: string;
  data: any;
  date: number;
  syncStatus: 'synced' | 'pending' | 'conflict';
}

export interface TriageSession {
  id: string;
  symptoms: string;
  urgencyLevel: string;
  aiResponse: any;
  createdAt: number;
  syncStatus: 'synced' | 'pending' | 'conflict';
}

export interface Appointment {
  id: string;
  doctorId: string;
  facilityId: string;
  scheduledStart: number;
  status: string;
  syncStatus: 'synced' | 'pending' | 'conflict';
}

export interface QueueToken {
  id: string;
  appointmentId: string;
  tokenNumber: string;
  position: number;
  status: string;
}

export interface OutboxItem {
  id?: number;
  uuid: string;
  resource: string;
  resourceId: string;
  operation: 'create' | 'update' | 'delete';
  payload: any;
  timestamp: number;
  retryCount: number;
}
