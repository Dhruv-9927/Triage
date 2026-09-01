import Dexie, { type Table } from 'dexie';
import type { Patient, HealthRecord, TriageSession, Appointment, QueueToken, OutboxItem } from './models';

export class SehatDatabase extends Dexie {
  patients!: Table<Patient, string>;
  healthRecords!: Table<HealthRecord, string>;
  triageSessions!: Table<TriageSession, string>;
  appointments!: Table<Appointment, string>;
  queueTokens!: Table<QueueToken, string>;
  outbox!: Table<OutboxItem, number>;

  constructor() {
    super('SehatDB');
    this.version(1).stores({
      patients: 'id, syncStatus',
      healthRecords: 'id, patientId, type, syncStatus',
      triageSessions: 'id, syncStatus, createdAt',
      appointments: 'id, doctorId, facilityId, status, syncStatus',
      queueTokens: 'id, appointmentId, status',
      outbox: '++id, uuid, resource, operation, timestamp, retryCount'
    });
  }
}

export const db = new SehatDatabase();
