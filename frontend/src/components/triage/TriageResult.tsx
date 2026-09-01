import { useTranslation } from 'react-i18next';
import { ArrowRight, AlertTriangle, CheckCircle, ShieldAlert, HeartPulse } from 'lucide-react';

export default function TriageResult({ assessment, onAction }: { assessment: any, onAction: () => void }) {
  const { t } = useTranslation();

  const level = (assessment.urgency_level || assessment.urgencyLevel || 'ROUTINE').toUpperCase();
  const advisory = assessment.advisory_summary || assessment.advisorySummary || assessment.advisory || 'Assessment complete.';
  const nextSteps = assessment.next_steps || assessment.nextSteps || [];
  const specialty = assessment.recommended_specialty || assessment.recommendedSpecialty || 'General Medicine';

  const isEmergency = level === 'EMERGENCY';
  const isUrgent = level === 'URGENT';

  const badgeConfig = isEmergency
    ? { bg: 'bg-[#FDF2F2]', border: 'border-[#F8D7D7]', text: 'text-[#DC2626]', label: '🔴 EMERGENCY (IMMEDIATE CARE)', icon: ShieldAlert }
    : isUrgent
    ? { bg: 'bg-[#FDF6EE]', border: 'border-[#F6E1C8]', text: 'text-[#C86D51]', label: '🟠 URGENT (SEE DOCTOR TODAY)', icon: AlertTriangle }
    : { bg: 'bg-[#EBF5EC]', border: 'border-[#D4EAD6]', text: 'text-[#2E7D32]', label: '🟢 ROUTINE (SCHEDULE CONSULTATION)', icon: CheckCircle };

  const BadgeIcon = badgeConfig.icon;

  return (
    <div className="space-y-6">
      {/* Urgency Acuity Header */}
      <div className={`p-6 rounded-2xl border ${badgeConfig.bg} ${badgeConfig.border} text-center space-y-2`}>
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white shadow-warm-sm mx-auto">
          <BadgeIcon className={`w-6 h-6 ${badgeConfig.text}`} />
        </div>
        <h2 className={`text-xl font-serif font-bold tracking-tight ${badgeConfig.text}`}>
          {badgeConfig.label}
        </h2>
        <div className="text-xs font-semibold text-[#6B6358]">
          Recommended Specialty: <span className="text-[#2B1810] font-bold">{specialty}</span>
        </div>
      </div>

      {/* Advisory Note */}
      <div className="bg-[#FAF7F2] p-6 rounded-2xl border border-[#EDE7DC] space-y-2">
        <h3 className="text-sm font-bold text-[#2B1810] font-serif uppercase tracking-wider">
          Clinical Guidance Summary
        </h3>
        <p className="text-xs sm:text-sm text-[#5E574E] leading-relaxed">
          {advisory}
        </p>
      </div>

      {/* Action Steps */}
      {nextSteps.length > 0 && (
        <div className="bg-white p-6 rounded-2xl border border-[#E8E2D8] space-y-3">
          <h3 className="text-sm font-bold text-[#2B1810] font-serif uppercase tracking-wider">
            Recommended Next Steps
          </h3>
          <ul className="space-y-2 text-xs sm:text-sm text-[#5E574E]">
            {nextSteps.map((step: string, i: number) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-[#8C5D3E] font-bold mt-0.5">•</span>
                <span>{step}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Action CTA */}
      <button 
        onClick={onAction}
        className="w-full bg-[#4A2E1B] hover:bg-[#382011] text-white p-4 rounded-xl font-medium text-sm transition shadow-warm-md flex items-center justify-center gap-2 tracking-wide"
      >
        <span>{t('triage.viewFacilities')}</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}
