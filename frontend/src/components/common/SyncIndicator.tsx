import { useSyncStatus } from '../../sync/useSyncStatus';
import { useTranslation } from 'react-i18next';
import { RefreshCw } from 'lucide-react';

export default function SyncIndicator() {
  const { pendingCount, isSyncing, triggerSync } = useSyncStatus();
  const { t } = useTranslation();

  return (
    <button 
      onClick={triggerSync}
      disabled={isSyncing || pendingCount === 0}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium shadow-sm transition-all
        ${pendingCount > 0 ? 'bg-amber-100 text-amber-800 hover:bg-amber-200' : 'bg-gray-100 text-gray-600'}
      `}
    >
      <RefreshCw size={16} className={isSyncing ? 'animate-spin' : ''} />
      {isSyncing ? t('common.syncing') : pendingCount > 0 ? `${pendingCount} ${t('common.pending')}` : t('common.synced')}
    </button>
  );
}
