import { usePWAInstall } from '../../pwa/usePWAInstall';
import { useState } from 'react';
import { X } from 'lucide-react';

export default function InstallBanner() {
  const { canInstall, promptInstall } = usePWAInstall();
  const [dismissed, setDismissed] = useState(false);

  if (!canInstall || dismissed) return null;

  return (
    <div className="bg-blue-600 text-white px-4 py-3 sm:px-6 lg:px-8 flex items-center justify-between">
      <p className="text-sm font-medium">Install SeHAT for offline access and better experience.</p>
      <div className="flex items-center gap-4">
        <button 
          onClick={() => promptInstall?.prompt()} 
          className="bg-white text-blue-600 px-3 py-1 rounded text-sm font-bold"
        >
          Install
        </button>
        <button onClick={() => setDismissed(true)} className="text-white hover:text-blue-100">
          <X size={20} />
        </button>
      </div>
    </div>
  );
}
