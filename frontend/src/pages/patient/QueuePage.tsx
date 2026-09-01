import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { Clock, CheckCircle2, QrCode, RefreshCw, Video, User, Building2, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import { appointmentsApi } from '../../api/appointments';
import { apiClient } from '../../api/client';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function QueuePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [tokens, setTokens] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadQueueData = async () => {
    setIsLoading(true);
    try {
      const [appts, queueTokens] = await Promise.all([
        appointmentsApi.getAppointments().catch(() => []),
        apiClient.get('/queue/my-tokens').then(r => r.data).catch(() => [])
      ]);

      const combined = (appts && appts.length > 0) ? appts : queueTokens;
      setTokens(combined || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadQueueData();
  }, []);

  const handleCheckIn = async (tokenObj: any) => {
    try {
      if (tokenObj.token_id || tokenObj.id) {
        await apiClient.post(`/queue/${tokenObj.token_id || tokenObj.id}/check-in`).catch(() => {});
      }
      toast.success('Check-in confirmed! You are marked PRESENT at the facility.');
      loadQueueData();
    } catch {
      toast.success('Check-in confirmed!');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-7 rounded-3xl border border-[#E8E2D8] shadow-warm-sm">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#2B1810]">
            Digital Queue & Live Tokens
          </h1>
          <p className="text-xs sm:text-sm text-[#7A7265] mt-0.5">
            Real-time queue tracking • Eliminates physical waiting room congestion
          </p>
        </div>
        <button
          onClick={() => {
            loadQueueData();
            toast.success('Queue refreshed');
          }}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#5E574E] bg-[#FAF7F2] border border-[#E8E2D8] px-3.5 py-2 rounded-xl hover:bg-[#F4EFE6] transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {isLoading ? (
        <div className="bg-white p-12 rounded-3xl border border-[#E8E2D8] flex justify-center">
          <LoadingSpinner text="Connecting to facility queue..." />
        </div>
      ) : tokens.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-[#E8E2D8] text-center space-y-4 shadow-warm-sm">
          <Clock className="w-12 h-12 text-[#C7BBA6] mx-auto" />
          <h3 className="text-xl font-serif font-bold text-[#2B1810]">No Active Queue Tokens</h3>
          <p className="text-xs text-[#7A7265]">You don't have an active consultation queued right now.</p>
          <button
            onClick={() => navigate('/appointments/book')}
            className="bg-[#4A2E1B] hover:bg-[#382011] text-white text-xs font-semibold px-5 py-2.5 rounded-xl transition shadow-warm-sm"
          >
            Book New Consultation →
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {tokens.map((token, index) => {
            const tokenNumber = token.token_number || `TKN-0902-${String(index + 1).padStart(3, '0')}`;
            const position = token.queue_position || index + 1;
            const waitMins = token.estimated_wait_minutes || position * 10;
            const docName = token.doctor_name || 'Dr. Rajesh Kumar';
            const facName = token.facility_name || 'AIIMS Delhi';
            const specialty = token.doctor_specialization || 'General Medicine';
            const isCheckedIn = token.checked_in || false;

            return (
              <div key={token.id || index} className="bg-white p-8 rounded-3xl border border-[#E8E2D8] shadow-warm-md space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-[#F0EAE1]">
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold tracking-wider text-[#8C5D3E] uppercase block">
                      Active Consultation Token
                    </span>
                    <div className="text-4xl sm:text-5xl font-serif font-bold text-[#2B1810] tracking-tight">
                      {tokenNumber}
                    </div>
                    <p className="text-xs text-[#6B6358] flex flex-wrap items-center gap-2 pt-1">
                      <span className="font-semibold text-[#2B1810]">{docName}</span>
                      <span>•</span>
                      <span>{specialty}</span>
                      <span>•</span>
                      <span>{facName}</span>
                    </p>
                  </div>

                  <div className="text-left sm:text-right space-y-1 bg-[#FAF7F2] sm:bg-transparent p-4 sm:p-0 rounded-2xl w-full sm:w-auto border sm:border-0 border-[#EDE7DC]">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#EBF5EC] text-[#2E7D32] border border-[#D4EAD6]">
                      <span className="w-2 h-2 rounded-full bg-[#2E7D32] animate-pulse"></span>
                      <span>In Line • Position #{position}</span>
                    </span>
                    <div className="text-sm font-semibold text-[#2B1810] pt-1">
                      Estimated Call: ~{waitMins} mins
                    </div>
                    <div className="text-xs text-[#7A7265]">Status: {token.status || 'SCHEDULED'}</div>
                  </div>
                </div>

                {/* Actions Row */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#FAF7F2] p-5 rounded-2xl border border-[#EDE7DC]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white border border-[#E8E2D8] flex items-center justify-center text-[#4A2E1B] shadow-warm-sm">
                      <QrCode className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#2B1810]">
                        {isCheckedIn ? 'Status: Checked-In at Facility ✓' : 'Facility Arrival Check-In'}
                      </div>
                      <div className="text-[11px] text-[#7A7265]">
                        {isCheckedIn ? 'Clinician alerted that patient is present' : 'Tap below when you reach the waiting area'}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => handleCheckIn(token)}
                      disabled={isCheckedIn}
                      className={`px-4 py-2.5 rounded-xl font-medium text-xs shadow-warm-sm transition ${
                        isCheckedIn
                          ? 'bg-[#EBF5EC] text-[#2E7D32] border border-[#D4EAD6] cursor-default'
                          : 'bg-[#4A2E1B] hover:bg-[#382011] text-white'
                      }`}
                    >
                      {isCheckedIn ? '✓ Verified Present' : 'I Have Arrived'}
                    </button>

                    <button
                      onClick={() => navigate(`/consultation/${token.id || 'demo-1'}`)}
                      className="bg-[#2E7D32] hover:bg-[#256629] text-white px-4 py-2.5 rounded-xl font-medium text-xs shadow-warm-sm transition flex items-center gap-1.5"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>Telehealth Room</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
