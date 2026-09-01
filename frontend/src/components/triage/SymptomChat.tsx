import { Stethoscope, Sparkles } from 'lucide-react';
import LoadingSpinner from '../common/LoadingSpinner';

export default function SymptomChat({ isLoading }: { isLoading: boolean }) {
  return (
    <div className="space-y-4">
      {/* Welcome AI Message */}
      <div className="flex gap-3.5 items-start">
        <div className="w-9 h-9 rounded-xl bg-[#FAF7F2] border border-[#E8E2D8] text-[#4A2E1B] flex items-center justify-center flex-shrink-0 shadow-warm-sm">
          <Stethoscope className="w-5 h-5 stroke-[1.75]" />
        </div>
        <div className="bg-[#FAF7F2] p-5 rounded-2xl border border-[#EDE7DC] text-xs sm:text-sm text-[#5E574E] max-w-xl space-y-2 leading-relaxed">
          <div className="font-serif font-bold text-[#2B1810] text-sm flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#C86D51]" />
            <span>AI Clinical Navigation Assistant</span>
          </div>
          <p>
            Please describe your symptoms in your own words (or tap the microphone icon to speak in Hindi/English).
          </p>
          <p className="text-xs text-[#7A7265]">
            Example: <em>"I have had a mild fever and dry cough for 3 days"</em> or <em>"Chest pain radiating to my left arm"</em>.
          </p>
        </div>
      </div>

      {isLoading && (
        <div className="flex justify-center py-6">
          <LoadingSpinner text="Analyzing symptoms and cross-matching available facilities..." />
        </div>
      )}
    </div>
  );
}
