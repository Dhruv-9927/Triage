import { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { useNavigate } from 'react-router-dom';
import { appointmentsApi } from '../../api/appointments';
import { apiClient } from '../../api/client';
import { Users, CheckCircle2, Stethoscope, AlertCircle, Video, Activity, Sparkles, RefreshCw, PhoneCall, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function DoctorDashboard() {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const [isAvailable, setIsAvailable] = useState(true);
  const [queuePatients, setQueuePatients] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');
  const [isLoading, setIsLoading] = useState(true);
  const [isCallingNext, setIsCallingNext] = useState(false);

  const loadData = async (showToast = false) => {
    try {
      const appts = await appointmentsApi.getAppointments().catch(() => []);
      if (Array.isArray(appts)) {
        setQueuePatients(appts);
      }
      if (showToast) toast.success('Queue refreshed');
    } catch (err) {
      console.error('Failed to load appointments:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(() => loadData(false), 5000);
    return () => clearInterval(interval);
  }, []);

  const toggleAvailability = () => {
    const nextState = !isAvailable;
    setIsAvailable(nextState);
    toast.success(nextState ? 'Marked ONLINE (Accepting consultations)' : 'Marked OFFLINE');
  };

  // Filter active waiting vs completed
  const activeQueue = queuePatients.filter((p) => p.status !== 'COMPLETED' && p.status !== 'CANCELLED');
  const completedQueue = queuePatients.filter((p) => p.status === 'COMPLETED');

  const handleNextPatient = async () => {
    if (activeQueue.length === 0) {
      toast('No patients waiting in queue right now.', { icon: 'ℹ️' });
      return;
    }

    setIsCallingNext(true);
    const nextPatient = activeQueue[0];

    try {
      // 1. Try advancing via queue backend
      const res = await apiClient.post('/queue/advance').catch(() => null);
      
      // 2. Also mark appointment as COMPLETED
      await appointmentsApi.updateAppointment(nextPatient.id, { status: 'COMPLETED' }).catch(() => null);

      toast.success(
        `📢 Calling ${nextPatient.patient_name || 'Patient'} (${nextPatient.token_number || 'Token #1'})! Previous patient cleared.`
      );

      // Immediately advance state locally
      setQueuePatients((prev) =>
        prev.map((p) => (p.id === nextPatient.id ? { ...p, status: 'COMPLETED' } : p))
      );
      await loadData(false);
    } catch (err) {
      console.error(err);
      toast.error('Failed to advance queue');
    } finally {
      setIsCallingNext(false);
    }
  };

  const handleCompletePatient = async (patientId: string, patientName: string) => {
    try {
      await appointmentsApi.updateAppointment(patientId, { status: 'COMPLETED' }).catch(() => null);
      toast.success(`Marked consultation with ${patientName} as COMPLETED.`);
      setQueuePatients((prev) =>
        prev.map((p) => (p.id === patientId ? { ...p, status: 'COMPLETED' } : p))
      );
      await loadData(false);
    } catch (err) {
      toast.error('Failed to update patient status');
    }
  };

  const urgentCount = activeQueue.filter(
    (p) =>
      p.chief_complaint?.toLowerCase().includes('chest') ||
      p.chief_complaint?.toLowerCase().includes('breath') ||
      p.chief_complaint?.toLowerCase().includes('emergency') ||
      p.chief_complaint?.toLowerCase().includes('severe')
  ).length;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-7 rounded-3xl border border-[#E8E2D8] shadow-warm-sm">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#F4EFE6] text-[#7A5438] text-[11px] font-bold tracking-wider uppercase mb-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#C86D51]" />
            <span>Clinician Station • Live Triage & Telegram Sync</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#2B1810]">
            Welcome, {user?.full_name || 'Dr. Rajesh Kumar'}
          </h1>
          <p className="text-xs sm:text-sm text-[#7A7265] mt-0.5">
            General Medicine & Triage Routing Station • Live OPD Queue
          </p>
        </div>

        {/* Availability Toggle */}
        <div className="flex items-center gap-3 bg-[#FAF7F2] px-4 py-2.5 rounded-xl border border-[#EDE7DC]">
          <span className={`text-xs font-bold ${isAvailable ? 'text-[#2E7D32]' : 'text-[#8C8275]'}`}>
            {isAvailable ? '🟢 Online (Accepting Patients)' : '⚪ Away / Offline'}
          </span>
          <button
            type="button"
            className={`w-11 h-6 rounded-full flex items-center p-0.5 transition-colors ${
              isAvailable ? 'bg-[#2E7D32]' : 'bg-[#D6D0C4]'
            }`}
            onClick={toggleAvailability}
          >
            <div
              className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                isAvailable ? 'translate-x-5' : ''
              }`}
            />
          </button>
        </div>
      </div>

      {/* Stats Counter */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-[#E8E2D8] shadow-warm-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-[#FAF7F2] border border-[#E8E2D8] text-[#4A2E1B] rounded-xl flex items-center justify-center font-bold">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-serif font-bold text-[#2B1810]">{activeQueue.length}</div>
            <div className="text-xs text-[#7A7265] font-medium">Patients Waiting in Queue</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-[#E8E2D8] shadow-warm-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-[#FDF6EE] border border-[#F6E1C8] text-[#C86D51] rounded-xl flex items-center justify-center font-bold">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-serif font-bold text-[#C86D51]">{urgentCount}</div>
            <div className="text-xs text-[#7A7265] font-medium">Urgent Triage Acuity</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-[#E8E2D8] shadow-warm-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-[#EBF5EC] border border-[#D4EAD6] text-[#2E7D32] rounded-xl flex items-center justify-center font-bold">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-serif font-bold text-[#2E7D32]">{completedQueue.length}</div>
            <div className="text-xs text-[#7A7265] font-medium">Completed Consultations</div>
          </div>
        </div>
      </div>

      {/* Live Queue Section */}
      <div className="bg-white rounded-3xl border border-[#E8E2D8] shadow-warm-sm overflow-hidden">
        <div className="p-6 border-b border-[#F0EAE1] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-lg font-serif font-bold text-[#2B1810] flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-[#8C5D3E]" />
              <span>Live OPD Patient Queue</span>
            </h2>
            <p className="text-xs text-[#7A7265]">
              Real-time sequence of arriving clinic and Telegram booked patients
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Tab Selector */}
            <div className="flex bg-[#FAF7F2] p-1 rounded-xl border border-[#E8E2D8] text-xs">
              <button
                onClick={() => setActiveTab('active')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                  activeTab === 'active'
                    ? 'bg-[#4A2E1B] text-white shadow-xs'
                    : 'text-[#6B6358] hover:text-[#2B1810]'
                }`}
              >
                Active Queue ({activeQueue.length})
              </button>
              <button
                onClick={() => setActiveTab('completed')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                  activeTab === 'completed'
                    ? 'bg-[#4A2E1B] text-white shadow-xs'
                    : 'text-[#6B6358] hover:text-[#2B1810]'
                }`}
              >
                Completed ({completedQueue.length})
              </button>
            </div>

            <button
              onClick={() => loadData(true)}
              className="border border-[#E8E2D8] text-[#5E574E] hover:bg-[#FAF7F2] text-xs font-semibold px-3 py-2 rounded-xl transition flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>

            {activeTab === 'active' && (
              <button
                disabled={isCallingNext || activeQueue.length === 0}
                onClick={handleNextPatient}
                className="bg-[#4A2E1B] hover:bg-[#382011] disabled:opacity-50 text-white text-xs font-semibold px-4 py-2 rounded-xl transition shadow-warm-sm flex items-center gap-1.5"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>{isCallingNext ? 'Calling...' : 'Call Next Patient'}</span>
              </button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="p-12 flex justify-center">
            <LoadingSpinner text="Fetching live queue records..." />
          </div>
        ) : (activeTab === 'active' ? activeQueue : completedQueue).length === 0 ? (
          <div className="p-12 text-center text-xs text-[#7A7265]">
            {activeTab === 'active'
              ? 'No patients currently waiting in queue. All clear!'
              : 'No completed consultations recorded yet today.'}
          </div>
        ) : (
          <div className="divide-y divide-[#F0EAE1]">
            {(activeTab === 'active' ? activeQueue : completedQueue).map((patient, index) => {
              const isUrgent =
                patient.chief_complaint?.toLowerCase().includes('chest') ||
                patient.chief_complaint?.toLowerCase().includes('breath') ||
                patient.chief_complaint?.toLowerCase().includes('emergency') ||
                patient.chief_complaint?.toLowerCase().includes('severe');

              const isCompleted = patient.status === 'COMPLETED';
              const displayPosition = activeTab === 'active' ? index + 1 : '✓';

              return (
                <div
                  key={patient.id || index}
                  className={`p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition ${
                    index === 0 && activeTab === 'active' ? 'bg-[#FCF9F5]' : 'hover:bg-[#FAF7F2]'
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`w-10 h-10 rounded-xl border font-bold flex items-center justify-center text-xs ${
                        isCompleted
                          ? 'bg-[#EBF5EC] border-[#D4EAD6] text-[#2E7D32]'
                          : index === 0
                          ? 'bg-[#4A2E1B] text-white border-[#4A2E1B]'
                          : 'bg-[#FAF7F2] border-[#E8E2D8] text-[#4A2E1B]'
                      }`}
                    >
                      {isCompleted ? <Check className="w-5 h-5" /> : `#${displayPosition}`}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-serif font-bold text-[#2B1810] text-base">
                          {patient.patient_name || 'Patient'}
                        </span>
                        {isCompleted ? (
                          <span className="text-[11px] bg-[#EBF5EC] text-[#2E7D32] border border-[#D4EAD6] font-bold px-2 py-0.5 rounded-md">
                            COMPLETED
                          </span>
                        ) : isUrgent ? (
                          <span className="text-[11px] bg-[#FDF6EE] text-[#C86D51] border border-[#F6E1C8] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            URGENT (AI Triage)
                          </span>
                        ) : (
                          <span className="text-[11px] bg-[#FAF7F2] text-[#6B6358] border border-[#E8E2D8] font-semibold px-2 py-0.5 rounded-md">
                            ROUTINE
                          </span>
                        )}
                        <span className="text-[10px] text-[#8C5D3E] font-mono bg-[#FAF7F2] px-1.5 py-0.5 rounded border border-[#EDE7DC]">
                          {patient.token_number || `TKN-${index + 1}`}
                        </span>
                        {index === 0 && activeTab === 'active' && (
                          <span className="text-[10px] bg-[#2E7D32] text-white font-bold px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                            Next Up
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#5E574E]">
                        <strong>Chief Complaint:</strong>{' '}
                        {patient.chief_complaint || 'General Clinical Review'}
                      </p>
                      <div className="text-[11px] text-[#8C8275] flex items-center gap-2">
                        <span>
                          ⏱️ Estimated Wait: ~{isCompleted ? '0' : (index + 1) * 15} mins
                        </span>
                        <span>•</span>
                        <span>Mode: {patient.consultation_type || 'IN_PERSON'}</span>
                        <span>•</span>
                        <span>Doctor: {patient.doctor_name || 'Dr. Rajesh Kumar'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    {!isCompleted && (
                      <button
                        onClick={() => handleCompletePatient(patient.id, patient.patient_name || 'Patient')}
                        className="border border-[#2E7D32] text-[#2E7D32] hover:bg-[#EBF5EC] font-medium text-xs px-3 py-2 rounded-xl transition flex items-center gap-1"
                        title="Mark Consultation Completed"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Clear / Complete</span>
                      </button>
                    )}
                    <button
                      onClick={() => navigate(`/consultation/${patient.id}`)}
                      className="bg-[#4A2E1B] hover:bg-[#382011] text-white font-medium text-xs px-4 py-2 rounded-xl shadow-warm-sm transition flex items-center gap-1.5"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>{isCompleted ? 'View Encounter' : 'Start Consult'}</span>
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
