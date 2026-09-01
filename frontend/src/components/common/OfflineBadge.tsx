import { useOnlineStatus } from '../../pwa/useOnlineStatus';

export default function OfflineBadge() {
  const isOnline = useOnlineStatus();

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wide transition-all ${
        isOnline
          ? 'bg-[#EBF5EC] text-[#2E7D32] border border-[#CDE5CF]'
          : 'bg-[#FDF2F2] text-[#DC2626] border border-[#F8D7D7]'
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          isOnline ? 'bg-[#2E7D32] animate-pulse' : 'bg-[#DC2626]'
        }`}
      />
      <span>{isOnline ? 'Online' : 'Offline Mode'}</span>
    </div>
  );
}
