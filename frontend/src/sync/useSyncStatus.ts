import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { syncEngine } from './syncEngine';
import { useState } from 'react';

export function useSyncStatus() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);

  const pendingCount = useLiveQuery(
    () => db.outbox.count(),
    []
  ) ?? 0;

  const triggerSync = async () => {
    setIsSyncing(true);
    try {
      await syncEngine.sync();
      setLastSyncTime(Date.now());
    } finally {
      setIsSyncing(false);
    }
  };

  return { pendingCount, isSyncing, lastSyncTime, triggerSync };
}
