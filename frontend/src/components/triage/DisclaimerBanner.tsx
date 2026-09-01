import { useTranslation } from 'react-i18next';
import { ShieldAlert } from 'lucide-react';

export default function DisclaimerBanner() {
  const { t } = useTranslation();

  return (
    <div className="bg-[#FAF7F2] border border-[#E8E2D8] text-[#6B6358] p-4 rounded-xl flex items-center gap-3 text-xs leading-relaxed shadow-warm-sm">
      <ShieldAlert className="w-5 h-5 text-[#8C5D3E] flex-shrink-0" />
      <div>
        <strong className="text-[#2B1810] font-serif font-bold">NON-DIAGNOSTIC ADVISORY: </strong>
        <span>{t('triage.disclaimer')}</span>
      </div>
    </div>
  );
}
