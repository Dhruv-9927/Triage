import { useVoiceInput } from '../../hooks/useVoiceInput';
import { Mic, MicOff } from 'lucide-react';
import { useEffect } from 'react';

export default function VoiceInputButton({ onTranscript }: { onTranscript: (t: string) => void }) {
  const { isListening, transcript, startListening, stopListening, isSupported } = useVoiceInput();

  useEffect(() => {
    if (transcript && !isListening) {
      onTranscript(transcript);
    }
  }, [transcript, isListening, onTranscript]);

  if (!isSupported) return null;

  return (
    <button 
      className={`p-3.5 rounded-xl transition-all border flex items-center justify-center ${
        isListening
          ? 'bg-[#FDF2F2] border-[#DC2626] text-[#DC2626] animate-pulse'
          : 'bg-[#FAF7F2] border-[#D8D1C5] text-[#5E574E] hover:bg-[#F4EFE6] hover:text-[#2B1810]'
      }`}
      onClick={isListening ? stopListening : startListening}
      type="button"
      title={isListening ? 'Stop Recording' : 'Voice Input (Hindi/English)'}
    >
      {isListening ? <MicOff size={20} /> : <Mic size={20} />}
    </button>
  );
}
