import { useState, useEffect } from 'react';
import { appointmentsApi } from '../../api/appointments';
import { useNavigate } from 'react-router-dom';
import { Users, PhoneCall, Check, Video, AlertCircle, RefreshCw, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function PatientQueuePage() {
  const [patients, setPatients] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const loadData = async (showToast = false) => {
    try {
      const appts = await appointmentsApi.getAppointments().catch(() => []);
      if (Array.isArray(appts)) {
        setPatients(appts);
      }
      if (showToast) toast.success('Queue refreshed');
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(() => loadData(false), 3000);
    return () => clearInterval(interval);
  }, []);

  const handleComplete = async (patientId: string, name: string) => {
    try {
      await appointmentsApi.updateAppointment(patientId, { status: 'COMPLETED' }).catch(() => null);
      toast.success(`Completed consultation for ${name}`);
      setPatients((prev) => prev.map((p) => (p.id === patientId ? { ...p, status: 'COMPLETED' } : p)));
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const activePatients = patients.filter((p) => p.status !== 'COMPLETED' && p.status !== 'CANCELLED');

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-[#E8E2D8] shadow-warm-sm">
        <div>
          <h1 className="text-2xl font-serif font-bold text-[#2B1810] flex items-center gap-2">
            <Users className="w-6 h-6 text-[#C86D51]" />
            <span>Doctor Patient Queue</span>
          </h1>
          <p className="text-xs text-[#7A7265] mt-0.5">Live OPD queue integrated with Telegram & Web bookings</p>
        </div>
        <button
          onClick={() => loadData(true)}
          className="border border-[#E8E2D8] text-[#5E574E] hover:bg-[#FAF7F2] text-xs font-semibold px-3 py-2 rounded-xl transition flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-[#E8E2D8] shadow-warm-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 flex justify-center">
            <LoadingSpinner text="Fetching active patients..." />
          </div>
        ) : activePatients.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#7A7265]">
            No patients currently waiting in the active queue.
          </div>
        ) : (
          <div className="divide-y divide-[#F0EAE1]">
            {activePatients.map((p, index) => {
              const isUrgent =
                p.chief_complaint?.toLowerCase().includes('chest') ||
                p.chief_complaint?.toLowerCase().includes('breath') ||
                p.chief_complaint?.toLowerCase().includes('emergency') ||
                p.chief_complaint?.toLowerCase().includes('severe') ||
                p.chief_complaint?.toLowerCase().includes('urgent');

              const isTelegram = p.consultation_type === 'TELEGRAM' || p.channel === 'TELEGRAM';

              return (
                <div
                  key={p.id || index}
                  className={`p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition ${
                    index === 0 ? 'bg-[#FCF9F5]' : 'hover:bg-[#FAF7F2]'
                  }`}
                >
                  <div className="flex gap-4 items-center">
                    <div className="text-2xl font-serif font-bold text-[#4A2E1B] w-14 text-center">
                      #{index + 1}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-serif font-bold text-lg text-[#2B1810]">
                          {p.patient_name || 'Patient'}
                        </span>
                        {isTelegram && (
                          <span className="text-[11px] bg-[#EBF3FA] text-[#2563EB] border border-[#D0E2F2] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                            <Send className="w-3 h-3 text-[#2563EB]" />
                            Telegram
                          </span>
                        )}
                        <span className="text-[10px] text-[#8C5D3E] font-mono bg-[#FAF7F2] px-1.5 py-0.5 rounded border border-[#EDE7DC]">
                          {p.token_number || `TKN-${index + 1}`}
                        </span>
                        {isUrgent ? (
                          <span className="text-[11px] bg-[#FDF6EE] text-[#C86D51] border border-[#F6E1C8] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            URGENT
                          </span>
                        ) : (
                          <span className="text-[11px] bg-[#FAF7F2] text-[#6B6358] border border-[#E8E2D8] font-semibold px-2 py-0.5 rounded-md">
                            ROUTINE
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-[#5E574E]">
                        <strong>Complaint:</strong> {p.chief_complaint || 'General Consultation'}
                      </div>
                      <div className="text-[11px] text-[#8C8275]">
                        Estimated Wait: ~{(index + 1) * 15} mins • Doctor: {p.doctor_name || 'Dr. Rajesh Kumar'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <button
                      onClick={() => handleComplete(p.id, p.patient_name || 'Patient')}
                      className="border border-[#2E7D32] text-[#2E7D32] hover:bg-[#EBF5EC] font-medium text-xs px-3 py-2 rounded-xl transition flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Complete</span>
                    </button>
                    <button
                      onClick={() => navigate(`/consultation/${p.id}`)}
                      className="bg-[#4A2E1B] hover:bg-[#382011] text-white font-medium text-xs px-4 py-2 rounded-xl shadow-warm-sm transition flex items-center gap-1.5"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>Consult</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
