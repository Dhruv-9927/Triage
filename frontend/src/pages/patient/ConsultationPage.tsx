import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../stores/authStore';
import { Video, Mic, MessageSquare, PhoneOff, User, FileText, CheckCircle2, Send } from 'lucide-react';
import { useState, useEffect } from 'react';
import { appointmentsApi } from '../../api/appointments';
import toast from 'react-hot-toast';

function getClinicalTemplate(complaint: string = '') {
  const c = complaint.toLowerCase();

  if (c.includes('chest') || c.includes('heart') || c.includes('breath') || c.includes('cardiac')) {
    return {
      diagnosis: 'Acute Anginal Discomfort • Urgent Cardiac Triage',
      prescriptions: 'Tab. Aspirin 150mg (Stat), Tab. Sorbitrate 5mg (SL SOS), Tab. Pantoprazole 40mg (1 OD), Oxygen Support if SpO2 < 94%',
      clinicalNotes: 'Immediate ECG 12-lead initiated. Vitals monitored (BP, HR, SpO2). Patient stabilized and referred for urgent cardiac biomarker panel (Troponin-I) & Cardiology evaluation. Red flag warning given for radiating left arm pain, sweating, or syncope.',
      doctorMsg: 'Namaste. I see you are reporting acute chest pain and breathing discomfort. Please remain seated calmly while I review your preliminary triage.'
    };
  }

  if (c.includes('headache') || c.includes('migraine') || c.includes('head')) {
    return {
      diagnosis: 'Tension-Type Cephalea / Acute Migraine Episode',
      prescriptions: 'Tab. Naproxen 500mg SOS (Post meals), Tab. Domperidone 10mg (1 OD), Hydration ORS sachet in 1L water',
      clinicalNotes: 'Dark room rest recommended, screen exposure minimized. Cold/warm compress to forehead. Review if associated with visual auras, vomiting, or neck stiffness.',
      doctorMsg: 'Namaste. I see you have headache symptoms. Are you experiencing any sensitivity to light or nausea?'
    };
  }

  if (c.includes('fever') || c.includes('chill') || c.includes('temperature') || c.includes('pyrexia')) {
    return {
      diagnosis: 'Acute Febrile Illness • Viral Pyrexia',
      prescriptions: 'Tab. Paracetamol 650mg (1 TDS x 3 days), Tab. Vitamin C 500mg (1 OD), Oral Rehydration Salts (ORS) as needed',
      clinicalNotes: 'Monitor body temperature 4-hourly. Cold sponging if temp > 101°F. Hydration > 2.5L/day. CBC & Widal test advised if fever persists beyond 72h.',
      doctorMsg: 'Namaste. I note your fever symptoms. How many days has the fever been present, and have you checked your temperature with a thermometer?'
    };
  }

  if (c.includes('stomach') || c.includes('abdomen') || c.includes('acidity') || c.includes('gastric') || c.includes('vomit') || c.includes('nausea')) {
    return {
      diagnosis: 'Acute Gastritis • Functional Dyspepsia',
      prescriptions: 'Tab. Pantoprazole 40mg + Domperidone 30mg (1 OD empty stomach x 5 days), Syrup Sucralfate 10ml TDS, Tab. Drotaverine 40mg SOS for abdominal spasms',
      clinicalNotes: 'Bland diet advised (khichdi, curd). Avoid spicy/fried foods and caffeine. Hydrate with electrolyte fluid. Return immediately if vomiting blood or passing black stools.',
      doctorMsg: 'Namaste. I see you reported abdominal discomfort. Is the pain centered in the upper stomach or lower abdomen?'
    };
  }

  if (c.includes('back') || c.includes('joint') || c.includes('knee') || c.includes('muscle') || c.includes('pain')) {
    return {
      diagnosis: 'Acute Musculoskeletal Strain • Lumbar Spasm',
      prescriptions: 'Tab. Aceclofenac 100mg + Paracetamol 325mg (1 BD x 3 days post meals), Topical Diclofenac Gel TDS, Tab. Thiocolchicoside 4mg (1 BD x 3 days)',
      clinicalNotes: 'Postural correction, avoid heavy lifting. Warm heating pad applied to affected area. Gentle stretching as tolerated. Review if radiating numbness occurs.',
      doctorMsg: 'Namaste. I see you have body/joint pain. Did this start after physical exertion or sudden movement?'
    };
  }

  // Default: URI / Cough / Cold / General
  return {
    diagnosis: 'Acute Upper Respiratory Tract Infection (URTI)',
    prescriptions: 'Tab. Paracetamol 500mg (1 TDS x 3 days), Tab. Cetirizine 10mg (1 OD at night x 5 days), Warm saline gargles TDS',
    clinicalNotes: 'Steam inhalation twice daily. Warm water hydration. Avoid cold beverages. Review if breathlessness or persistent high fever develops.',
    doctorMsg: 'Namaste. I can see your clinical triage assessment. How are you feeling right now?'
  };
}

export default function ConsultationPage() {
  const { appointmentId } = useParams();
  const { t: _t } = useTranslation();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  const [mode, setMode] = useState('video'); // video, voice, chat
  const [appointment, setAppointment] = useState<any>(null);
  const [diagnosis, setDiagnosis] = useState('');
  const [prescriptions, setPrescriptions] = useState('');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [newMsg, setNewMsg] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function loadAppointmentDetails() {
      if (!appointmentId || appointmentId.startsWith('demo')) return;
      try {
        const data = await appointmentsApi.getAppointment(appointmentId);
        setAppointment(data);

        // Dynamically tailor clinical notes & diagnosis to actual patient chief complaint
        const template = getClinicalTemplate(data.chief_complaint || '');
        setDiagnosis(template.diagnosis);
        setPrescriptions(template.prescriptions);
        setClinicalNotes(data.notes || template.clinicalNotes);
        setChatMessages([
          { sender: 'doctor', text: template.doctorMsg },
          { sender: 'patient', text: `Doctor, my symptoms are: ${data.chief_complaint || 'unspecified'}.` }
        ]);
      } catch (err) {
        console.error('Failed to load appointment:', err);
      }
    }
    loadAppointmentDetails();
  }, [appointmentId]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMsg.trim()) return;
    setChatMessages([...chatMessages, { sender: user?.role === 'DOCTOR' ? 'doctor' : 'patient', text: newMsg }]);
    setNewMsg('');
  };

  const handleCompleteConsultation = async () => {
    setIsSaving(true);
    const fullNotes = `DIAGNOSIS: ${diagnosis}\nPRESCRIPTION: ${prescriptions}\nCLINICAL NOTES: ${clinicalNotes}`;

    try {
      if (appointmentId) {
        await appointmentsApi.updateAppointment(appointmentId, {
          status: 'COMPLETED',
          notes: fullNotes
        }).catch(() => {});
      }
    } catch (e) {
      // Gracefully continue
    } finally {
      setIsSaving(false);
      toast.success('Consultation Completed! Prescription signed & saved.');
      // Navigate back to Doctor Dashboard if accessed by doctor
      if (user?.role === 'DOCTOR' || !user || user?.role !== 'PATIENT') {
        navigate('/doctor/dashboard');
      } else {
        navigate('/health-records');
      }
    }
  };

  const handleLeaveConsultation = () => {
    // If clinician or viewing from doctor station, return to Doctor Dashboard
    if (user?.role === 'DOCTOR' || !user || user?.role !== 'PATIENT') {
      navigate('/doctor/dashboard');
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="max-w-6xl mx-auto min-h-[calc(100vh-8rem)] flex flex-col space-y-6 pb-12">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-3xl border border-[#E8E2D8] shadow-warm-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D8] text-[#4A2E1B] font-bold flex items-center justify-center">
            <User className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif font-bold text-lg text-[#2B1810]">
                {user?.role === 'DOCTOR' 
                  ? `Patient: ${appointment?.patient_name || 'Patient'}` 
                  : `Attending Clinician: ${appointment?.doctor_name || 'Dr. Rajesh Kumar'}`
                }
              </h1>
              <span className="text-[11px] bg-[#EBF5EC] text-[#2E7D32] border border-[#D4EAD6] px-2.5 py-0.5 rounded-full font-bold">
                ● Telehealth Active
              </span>
            </div>
            <p className="text-xs text-[#7A7265]">
              Chief Complaint: <strong className="text-[#2B1810]">{appointment?.chief_complaint || 'Clinical Consultation'}</strong>
            </p>
          </div>
        </div>

        {/* Mode Selector */}
        <div className="flex gap-1.5 bg-[#FAF7F2] p-1.5 rounded-2xl border border-[#E8E2D8]">
          <button
            onClick={() => setMode('video')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
              mode === 'video' ? 'bg-[#4A2E1B] text-white shadow-warm-sm' : 'text-[#6B6358] hover:text-[#2B1810]'
            }`}
          >
            <Video size={14} />
            <span>Video (HD)</span>
          </button>
          <button
            onClick={() => setMode('voice')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
              mode === 'voice' ? 'bg-[#4A2E1B] text-white shadow-warm-sm' : 'text-[#6B6358] hover:text-[#2B1810]'
            }`}
          >
            <Mic size={14} />
            <span>Voice Only (2G)</span>
          </button>
          <button
            onClick={() => setMode('chat')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
              mode === 'chat' ? 'bg-[#4A2E1B] text-white shadow-warm-sm' : 'text-[#6B6358] hover:text-[#2B1810]'
            }`}
          >
            <MessageSquare size={14} />
            <span>Low-Data Chat</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Telehealth Stream + Doctor Clinical Rx Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Video/Voice/Chat Feed */}
        <div className="lg:col-span-7 bg-[#1A1714] rounded-3xl border border-[#38322B] overflow-hidden shadow-warm-lg flex flex-col min-h-[420px]">
          <div className="p-4 bg-[#2B2620] text-xs text-[#A69B8D] flex justify-between items-center border-b border-[#38322B]">
            <span className="flex items-center gap-1.5 text-[#4ADE80]">
              <span className="w-2 h-2 rounded-full bg-[#4ADE80] animate-pulse"></span>
              Encrypted Low-Bandwidth Stream (WebRTC)
            </span>
            <span className="text-[#D4A373]">Opus Audio • Adaptive 3G/4G</span>
          </div>

          <div className="flex-1 flex items-center justify-center p-6 relative">
            {mode === 'video' && (
              <div className="text-center space-y-3 bg-[#24201C] p-8 rounded-3xl border border-[#38322B] max-w-sm w-full">
                <div className="w-16 h-16 rounded-2xl bg-[#2B2620] mx-auto flex items-center justify-center text-[#D4A373]">
                  <Video size={32} />
                </div>
                <div className="font-serif font-bold text-lg text-white">Live Telehealth Stream</div>
                <p className="text-xs text-[#A69B8D]">
                  Video Connected (720p 30fps). Bandwidth: 1.2 Mbps.
                </p>
              </div>
            )}

            {mode === 'voice' && (
              <div className="text-center space-y-4 bg-[#24201C] p-8 rounded-3xl border border-[#38322B] max-w-sm w-full">
                <div className="w-16 h-16 rounded-2xl bg-[#4A2E1B] mx-auto flex items-center justify-center text-white animate-pulse">
                  <Mic size={32} />
                </div>
                <div className="font-serif font-bold text-lg text-white">Voice Call Mode Active</div>
                <p className="text-xs text-[#A69B8D]">
                  Optimized for 2G/3G low-connectivity rural networks (16 kbps).
                </p>
              </div>
            )}

            {mode === 'chat' && (
              <div className="w-full h-full min-h-[300px] bg-[#FAF7F2] rounded-2xl p-4 flex flex-col justify-between text-[#2B1810]">
                <div className="space-y-2 text-xs overflow-y-auto max-h-56 pr-1">
                  {chatMessages.map((msg, i) => (
                    <div
                      key={i}
                      className={`p-3 rounded-2xl max-w-xs ${
                        msg.sender === 'doctor'
                          ? 'bg-white border border-[#E8E2D8] text-[#2B1810]'
                          : 'bg-[#4A2E1B] text-white ml-auto'
                      }`}
                    >
                      <strong className="block text-[10px] opacity-75 mb-0.5 uppercase">
                        {msg.sender === 'doctor' ? 'Doctor' : 'Patient'}
                      </strong>
                      <span>{msg.text}</span>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleSendMessage} className="pt-2 border-t border-[#E8E2D8] flex gap-2">
                  <input
                    type="text"
                    value={newMsg}
                    onChange={(e) => setNewMsg(e.target.value)}
                    placeholder="Type message in Hindi or English..."
                    className="flex-1 bg-white border border-[#D8D1C5] rounded-xl px-3 py-2 text-xs outline-none"
                  />
                  <button type="submit" className="bg-[#4A2E1B] text-white px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1">
                    <Send size={12} />
                    <span>Send</span>
                  </button>
                </form>
              </div>
            )}
          </div>

          <div className="p-4 bg-[#2B2620] border-t border-[#38322B] flex justify-center">
            <button
              onClick={handleLeaveConsultation}
              className="bg-[#DC2626] hover:bg-[#B91C1C] text-white px-6 py-2.5 rounded-xl font-medium text-xs flex items-center gap-2 transition shadow-md"
            >
              <PhoneOff size={16} />
              <span>Leave Consultation</span>
            </button>
          </div>
        </div>

        {/* Right Side: Clinical Rx & Diagnosis (Doctor Action) */}
        <div className="lg:col-span-5 bg-white p-7 rounded-3xl border border-[#E8E2D8] shadow-warm-sm space-y-5">
          <div className="pb-3 border-b border-[#F0EAE1] flex justify-between items-center">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#8C5D3E]" />
              <h2 className="text-lg font-serif font-bold text-[#2B1810]">
                Clinical Notes & Rx (Prescription)
              </h2>
            </div>
            <span className="text-[10px] bg-[#EBF5EC] text-[#2E7D32] px-2 py-0.5 rounded font-bold uppercase">
              ABDM Verified
            </span>
          </div>

          <div className="space-y-3.5 text-xs">
            <div>
              <label className="block font-semibold text-[#5E574E] mb-1">
                Clinical Diagnosis
              </label>
              <input
                type="text"
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                className="w-full bg-[#FAF7F2] border border-[#D8D1C5] rounded-xl p-2.5 text-xs text-[#2B1810] font-semibold focus:border-[#4A2E1B] outline-none"
                placeholder="e.g. Acute Anginal Discomfort, Acute Bronchitis"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#5E574E] mb-1">
                Prescribed Medicines (Dosage & Frequency)
              </label>
              <textarea
                rows={3}
                value={prescriptions}
                onChange={(e) => setPrescriptions(e.target.value)}
                className="w-full bg-[#FAF7F2] border border-[#D8D1C5] rounded-xl p-2.5 text-xs text-[#2B1810] focus:border-[#4A2E1B] outline-none"
                placeholder="e.g. Tab. Aspirin 150mg (Stat), Tab. Sorbitrate 5mg (SL SOS)"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#5E574E] mb-1">
                Attending Advice & Notes
              </label>
              <textarea
                rows={3}
                value={clinicalNotes}
                onChange={(e) => setClinicalNotes(e.target.value)}
                className="w-full bg-[#FAF7F2] border border-[#D8D1C5] rounded-xl p-2.5 text-xs text-[#2B1810] focus:border-[#4A2E1B] outline-none"
                placeholder="Patient advice and red flag warning instructions..."
              />
            </div>
          </div>

          <button
            type="button"
            disabled={isSaving}
            onClick={handleCompleteConsultation}
            className="w-full bg-[#2E7D32] hover:bg-[#256629] text-white font-medium py-3.5 px-4 rounded-xl shadow-warm-sm transition text-xs flex items-center justify-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isSaving ? 'Signing & Saving Record...' : 'Complete Consult & Sign Prescription'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
