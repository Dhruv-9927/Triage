import { db } from '../db';
import { apiClient } from '../api/client';

export class SyncEngine {
  async sync() {
    if (!navigator.onLine) return;
    
    const pending = await db.outbox.toArray();
    for (const item of pending) {
      try {
        if (item.operation === 'create') {
          await apiClient.post(`/${item.resource}`, item.payload);
        } else if (item.operation === 'update') {
          await apiClient.put(`/${item.resource}/${item.resourceId}`, item.payload);
        } else if (item.operation === 'delete') {
          await apiClient.delete(`/${item.resource}/${item.resourceId}`);
        }
        await db.outbox.delete(item.id!);
      } catch (error: any) {
        if (error.response?.status === 409) {
          // Conflict
          await db.outbox.update(item.id!, { retryCount: item.retryCount + 1 });
        } else {
          // Other error, increment retry
          await db.outbox.update(item.id!, { retryCount: item.retryCount + 1 });
        }
      }
    }
  }

  start() {
    window.addEventListener('online', () => this.sync());
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.sync();
      }
    });
  }
}

export const syncEngine = new SyncEngine();
syncEngine.start();
