import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTriageStore } from '../../stores/triageStore';
import SymptomChat from '../../components/triage/SymptomChat';
import VoiceInputButton from '../../components/triage/VoiceInputButton';
import TriageResult from '../../components/triage/TriageResult';
import DisclaimerBanner from '../../components/triage/DisclaimerBanner';
import CaregiverFamilySelector from '../../components/common/CaregiverFamilySelector';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles, ShieldCheck, CheckSquare, Square, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

export default function TriagePage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { symptoms, setSymptoms, submitSymptoms, assessment, isLoading, error, clearTriage } = useTriageStore();
  const [hasConsent, setHasConsent] = useState(true);

  const handleStartTriage = async () => {
    if (!hasConsent) {
      toast.error('Please accept the ABDM advisory consent to proceed.');
      return;
    }
    if (!symptoms.trim()) {
      toast.error('Please enter or speak your symptoms.');
      return;
    }
    await submitSymptoms();
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col min-h-[calc(100vh-8rem)] pb-8 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-7 rounded-3xl border border-[#E8E2D8] shadow-warm-sm">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#F4EFE6] text-[#7A5438] text-[11px] font-bold tracking-wider uppercase mb-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#C86D51]" />
            <span>Advisory AI Layer (Bhashini & ABDM Compliant)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#2B1810]">
            AI Symptom Assessment / लक्षण जांचें
          </h1>
          <p className="text-xs sm:text-sm text-[#7A7265] mt-0.5">
            Preliminary non-diagnostic evaluation • Instant emergency fast-path
          </p>
        </div>

        {assessment && (
          <button
            onClick={clearTriage}
            className="text-xs font-semibold text-[#8C5D3E] hover:text-[#4A2E1B] underline transition flex items-center gap-1"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Check New Symptoms</span>
          </button>
        )}
      </div>

      {/* ABDM Patient Consent Banner */}
      <div className="bg-[#FAF7F2] p-4 sm:p-5 rounded-2xl border border-[#EDE7DC] flex items-start gap-3 shadow-warm-sm">
        <button
          type="button"
          onClick={() => setHasConsent(!hasConsent)}
          className="mt-0.5 text-[#4A2E1B] flex-shrink-0"
        >
          {hasConsent ? (
            <CheckSquare className="w-5 h-5 text-[#2E7D32]" />
          ) : (
            <Square className="w-5 h-5 text-[#9E978B]" />
          )}
        </button>
        <div className="text-xs text-[#5E574E] leading-relaxed select-none">
          <strong className="text-[#2B1810] font-serif block text-xs mb-0.5">
            ABDM Patient Consent & Privacy Guarantee:
          </strong>
          I consent to preliminary AI-assisted symptom screening. I understand this is <strong>strictly advisory, not a formal medical diagnosis</strong>, and will be reviewed by a qualified doctor at the allocated facility.
        </div>
      </div>

      {assessment && <DisclaimerBanner />}

      {/* Family / Dependant Selector */}
      {!assessment && <CaregiverFamilySelector />}

      {/* Main Chat/Result Area */}
      <div className="flex-1 bg-white rounded-3xl border border-[#E8E2D8] shadow-warm-sm p-6 sm:p-8 space-y-6">
        {!assessment ? (
          <SymptomChat isLoading={isLoading} />
        ) : (
          <TriageResult 
            assessment={assessment} 
            onAction={() => navigate('/triage/results')} 
          />
        )}
        {error && (
          <div className="text-sm font-semibold text-[#DC2626] p-3 bg-[#FDF2F2] rounded-2xl border border-[#F8D7D7] text-center">
            {error}
          </div>
        )}
      </div>

      {/* Input Bar (when assessment not completed yet) */}
      {!assessment && (
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-[#E8E2D8] shadow-warm-md flex gap-2.5 items-center">
          <input
            type="text"
            className="flex-1 p-3.5 bg-[#FAF7F2] border border-[#D8D1C5] rounded-2xl text-sm text-[#2B1810] placeholder-[#8C8275] focus:outline-none focus:ring-1 focus:ring-[#4A2E1B] focus:border-[#4A2E1B] transition"
            placeholder="Type or speak symptoms in Hindi/English (e.g. 3 दिन से सीने में दर्द है)..."
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleStartTriage()}
          />
          <VoiceInputButton onTranscript={(text) => setSymptoms(text)} />
          <button 
            className="bg-[#4A2E1B] hover:bg-[#382011] text-white px-6 py-3.5 rounded-2xl font-medium text-sm transition shadow-warm-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            onClick={handleStartTriage}
            disabled={isLoading || !symptoms.trim() || !hasConsent}
          >
            <span>{isLoading ? 'Assessing...' : 'Assess Symptoms'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
