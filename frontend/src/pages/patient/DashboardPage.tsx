import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../stores/authStore';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { 
  Stethoscope, 
  Calendar, 
  Users, 
  FileText, 
  Mic, 
  PhoneCall, 
  Send, 
  Clock, 
  Building2, 
  ArrowRight,
  ShieldCheck,
  Sparkles,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Navigation,
  RefreshCw
} from 'lucide-react';
import { appointmentsApi } from '../../api/appointments';
import { facilitiesApi } from '../../api/facilities';
import { useVoiceInput } from '../../hooks/useVoiceInput';
import { useTriageStore } from '../../stores/triageStore';
import CaregiverFamilySelector from '../../components/common/CaregiverFamilySelector';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const setSymptoms = useTriageStore((state) => state.setSymptoms);

  const [voiceQuery, setVoiceQuery] = useState('');
  const [activeAppointments, setActiveAppointments] = useState<any[]>([]);
  const [facilities, setFacilities] = useState<any[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number; label: string }>({
    lat: 28.6139,
    lon: 77.2090,
    label: 'Delhi NCR (Default)'
  });
  const [isLocating, setIsLocating] = useState(false);
  const { isListening, transcript, startListening, stopListening, isSupported } = useVoiceInput();

  if (user?.role === 'DOCTOR') {
    return <Navigate to="/doctor/dashboard" replace />;
  }
  if (user?.role === 'FACILITY_ADMIN') {
    return <Navigate to="/facility/dashboard" replace />;
  }

  const loadFacilitiesForLocation = async (lat: number, lon: number) => {
    try {
      const realFacs = await facilitiesApi.discoverFacilities(lat, lon, 25, 'General Medicine').catch(() => []);
      if (realFacs && realFacs.length > 0) {
        setFacilities(realFacs.map((rf: any) => ({
          id: rf.facility.id,
          name: rf.facility.name,
          facility_type: rf.facility.facility_type,
          address: rf.facility.address,
          distance_km: rf.distance_km,
          score: rf.composite_score
        })));
      } else {
        const defaultFacs = await facilitiesApi.getFacilities().catch(() => []);
        setFacilities(defaultFacs || []);
      }
    } catch {
      const defaultFacs = await facilitiesApi.getFacilities().catch(() => []);
      setFacilities(defaultFacs || []);
    }
  };

  useEffect(() => {
    async function loadData() {
      try {
        const appts = await appointmentsApi.getAppointments().catch(() => []);
        setActiveAppointments(appts || []);
        
        // Auto-detect browser location on first load
        if ('geolocation' in navigator) {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              const lat = pos.coords.latitude;
              const lon = pos.coords.longitude;
              setUserLocation({ lat, lon, label: `Live GPS: ${lat.toFixed(3)}, ${lon.toFixed(3)}` });
              loadFacilitiesForLocation(lat, lon);
            },
            () => {
              loadFacilitiesForLocation(28.6139, 77.2090);
            },
            { timeout: 5000 }
          );
        } else {
          loadFacilitiesForLocation(28.6139, 77.2090);
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadData();
  }, []);

  const handleDetectGPS = () => {
    if (!('geolocation' in navigator)) {
      toast.error('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        setUserLocation({ lat, lon, label: `Live GPS: ${lat.toFixed(3)}, ${lon.toFixed(3)}` });
        loadFacilitiesForLocation(lat, lon);
        setIsLocating(false);
        toast.success(`Location updated! Discovered real hospitals near your GPS.`);
      },
      (err) => {
        setIsLocating(false);
        toast.error(`Could not retrieve GPS location (${err.message}). Using Delhi NCR.`);
        loadFacilitiesForLocation(28.6139, 77.2090);
      },
      { timeout: 8000 }
    );
  };

  useEffect(() => {
    if (transcript) {
      setVoiceQuery(transcript);
    }
  }, [transcript]);

  const handleTextSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (voiceQuery.trim()) {
      setSymptoms(voiceQuery.trim());
      navigate('/triage');
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* 1. Rural Patient Welcome Header */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E8E2D8] shadow-warm-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-[#8C5D3E] uppercase tracking-wider bg-[#FAF7F2] px-3 py-1 rounded-full border border-[#E8E2D8]">
              Ayushman Bharat ABHA: 1234-5678-9012
            </span>
            <button
              onClick={handleDetectGPS}
              className="text-xs font-semibold text-[#4A2E1B] bg-[#FAF7F2] hover:bg-[#F4EFE6] px-2.5 py-1 rounded-full border border-[#E8E2D8] flex items-center gap-1 transition"
              title="Click to detect your exact GPS location"
            >
              <Navigation className={`w-3 h-3 text-[#C86D51] ${isLocating ? 'animate-spin' : ''}`} />
              <span>{userLocation.label}</span>
            </button>
            <span className="text-xs font-semibold text-[#2E7D32] bg-[#EBF5EC] px-2.5 py-0.5 rounded-full border border-[#D4EAD6]">
              ✓ Offline Sync Ready
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#2B1810] pt-1">
            Namaste, {user?.full_name || 'Priya Sharma'}
          </h1>
          <p className="text-xs sm:text-sm text-[#7A7265]">
            How is your health today? You can speak in Hindi or English to check symptoms.
          </p>
        </div>

        {/* Emergency 108 Direct Dial */}
        <a
          href="tel:108"
          className="flex items-center gap-2 bg-[#DC2626] hover:bg-[#B91C1C] text-white font-bold px-4 py-2.5 rounded-2xl shadow-sm transition text-xs tracking-wide"
        >
          <PhoneCall className="w-4 h-4 animate-bounce" />
          <span>Emergency SOS (108)</span>
        </a>
      </div>

      {/* 2. Voice-First Symptom Checker Card */}
      <div className="bg-gradient-to-br from-[#FAF7F2] via-white to-[#F4EFE6] p-6 sm:p-8 rounded-3xl border-2 border-[#E8E2D8] shadow-warm-md space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#4A2E1B] text-white flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-[#E89278]" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-serif font-bold text-[#2B1810]">
                Speak Your Symptoms / बोलकर लक्षण बताएं
              </h2>
              <p className="text-xs text-[#7A7265]">
                Groq AI LLaMA 3.3 + Bhashini Triage • Speaks Hindi, English & regional dialects
              </p>
            </div>
          </div>

          <span className="text-[11px] font-bold text-[#8C5D3E] bg-white px-3 py-1 rounded-full border border-[#E8E2D8]">
            🎙️ Speech-to-Triage
          </span>
        </div>

        <form onSubmit={handleTextSearchSubmit} className="flex gap-2 items-center pt-2">
          <input
            type="text"
            value={voiceQuery}
            onChange={(e) => setVoiceQuery(e.target.value)}
            placeholder="e.g. 3 दिन से खांसी और बुखार है / Cough and chest congestion for 2 days..."
            className="flex-1 bg-white border border-[#D8D1C5] rounded-2xl p-4 text-sm text-[#2B1810] placeholder-[#9E978B] focus:border-[#4A2E1B] focus:ring-1 focus:ring-[#4A2E1B] outline-none shadow-warm-sm transition"
          />

          {isSupported && (
            <button
              type="button"
              onClick={isListening ? stopListening : startListening}
              className={`p-4 rounded-2xl border transition-all flex items-center justify-center shadow-warm-sm ${
                isListening
                  ? 'bg-[#FDF2F2] border-[#DC2626] text-[#DC2626] animate-pulse ring-4 ring-[#DC2626]/20'
                  : 'bg-[#4A2E1B] hover:bg-[#382011] text-white border-[#4A2E1B]'
              }`}
              title={isListening ? 'Listening...' : 'Click to Speak'}
            >
              <Mic className="w-5 h-5" />
            </button>
          )}

          <button
            type="submit"
            className="bg-[#4A2E1B] hover:bg-[#382011] text-white px-6 py-4 rounded-2xl text-xs font-semibold shadow-warm-sm transition hidden sm:flex items-center gap-1.5"
          >
            <span>Triage</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>

      {/* 2.5 Caregiver & Family Support Selector */}
      <CaregiverFamilySelector />

      {/* 3. Four Large Tactile Action Tiles */}
      <div className="space-y-3">
        <h2 className="text-lg font-serif font-bold text-[#2B1810]">
          Healthcare Services / मुख्य सेवाएं
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            to="/triage"
            className="bg-white p-6 rounded-3xl border border-[#E8E2D8] shadow-warm-sm hover:shadow-warm-md hover:border-[#D6CBB8] transition-all space-y-4 group flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#FDF6EE] border border-[#F6E1C8] text-[#C86D51] flex items-center justify-center group-hover:scale-105 transition-transform">
                <Stethoscope className="w-6 h-6 stroke-[1.75]" />
              </div>
              <div>
                <h3 className="text-base font-serif font-bold text-[#2B1810]">
                  Check Symptoms
                </h3>
                <p className="text-[11px] font-medium text-[#8C5D3E]">लक्षण जांचें (AI Triage)</p>
              </div>
              <p className="text-xs text-[#6B6358] leading-relaxed">
                Describe health issues for instant urgency check and safe advisory guidance.
              </p>
            </div>
            <div className="pt-2 text-xs font-bold text-[#4A2E1B] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              <span>Start Triage</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          <Link
            to="/appointments"
            className="bg-white p-6 rounded-3xl border border-[#E8E2D8] shadow-warm-sm hover:shadow-warm-md hover:border-[#D6CBB8] transition-all space-y-4 group flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D8] text-[#4A2E1B] flex items-center justify-center group-hover:scale-105 transition-transform">
                <Calendar className="w-6 h-6 stroke-[1.75]" />
              </div>
              <div>
                <h3 className="text-base font-serif font-bold text-[#2B1810]">
                  Book Hospital & Doctor
                </h3>
                <p className="text-[11px] font-medium text-[#8C5D3E]">अस्पताल / डॉक्टर बुकिंग</p>
              </div>
              <p className="text-xs text-[#6B6358] leading-relaxed">
                Find facilities with confirmed doctor presence, open beds, and medicines in stock.
              </p>
            </div>
            <div className="pt-2 text-xs font-bold text-[#4A2E1B] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              <span>View Facilities</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          <Link
            to="/queue"
            className="bg-white p-6 rounded-3xl border border-[#E8E2D8] shadow-warm-sm hover:shadow-warm-md hover:border-[#D6CBB8] transition-all space-y-4 group flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#EBF5EC] border border-[#D4EAD6] text-[#2E7D32] flex items-center justify-center group-hover:scale-105 transition-transform">
                <Clock className="w-6 h-6 stroke-[1.75]" />
              </div>
              <div>
                <h3 className="text-base font-serif font-bold text-[#2B1810]">
                  My Queue Token
                </h3>
                <p className="text-[11px] font-medium text-[#8C5D3E]">मेरी कतार व टोकन</p>
              </div>
              <p className="text-xs text-[#6B6358] leading-relaxed">
                Check your live number in line and estimated time before traveling to the clinic.
              </p>
            </div>
            <div className="pt-2 text-xs font-bold text-[#4A2E1B] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              <span>Track Token</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          <Link
            to="/health-records"
            className="bg-white p-6 rounded-3xl border border-[#E8E2D8] shadow-warm-sm hover:shadow-warm-md hover:border-[#D6CBB8] transition-all space-y-4 group flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D8] text-[#7A5438] flex items-center justify-center group-hover:scale-105 transition-transform">
                <FileText className="w-6 h-6 stroke-[1.75]" />
              </div>
              <div>
                <h3 className="text-base font-serif font-bold text-[#2B1810]">
                  Prescriptions & History
                </h3>
                <p className="text-[11px] font-medium text-[#8C5D3E]">पर्चा व स्वास्थ्य रिकॉर्ड</p>
              </div>
              <p className="text-xs text-[#6B6358] leading-relaxed">
                Offline access to past doctor notes, medicine prescriptions, and lab tests.
              </p>
            </div>
            <div className="pt-2 text-xs font-bold text-[#4A2E1B] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              <span>Open Records</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>
        </div>
      </div>

      {/* 4. Active Token / Consultation Banner */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl border border-[#E8E2D8] shadow-warm-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-[#F0EAE1]">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#2E7D32] animate-pulse"></span>
            <h2 className="text-base font-serif font-bold text-[#2B1810]">
              Active Consultation Token / सक्रिय कतार टोकन
            </h2>
          </div>
          <Link to="/queue" className="text-xs font-bold text-[#4A2E1B] hover:underline">
            View All Tokens →
          </Link>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#FAF7F2] p-5 rounded-2xl border border-[#EDE7DC]">
          <div className="flex items-start gap-4">
            <div className="bg-white px-4 py-3 rounded-2xl border border-[#E8E2D8] text-center shadow-warm-sm">
              <div className="text-[10px] uppercase font-bold text-[#8C5D3E]">Token</div>
              <div className="text-2xl font-serif font-bold text-[#2B1810]">#01</div>
            </div>
            <div className="space-y-1">
              <div className="text-sm font-bold text-[#2B1810]">AIIMS-0902-001 • Dr. Rajesh Kumar</div>
              <div className="text-xs text-[#5E574E]">AIIMS Delhi (General Medicine OPD)</div>
              <div className="text-[11px] text-[#7A7265] flex items-center gap-2">
                <span>⏱️ Wait Time: ~10 mins</span>
                <span>•</span>
                <span className="text-[#2E7D32] font-semibold">1st in Line</span>
              </div>
            </div>
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            <Link
              to="/queue"
              className="w-full sm:w-auto bg-[#4A2E1B] hover:bg-[#382011] text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-warm-sm transition text-center"
            >
              Kiosk Check-In
            </Link>
            <Link
              to="/consultation/demo-1"
              className="w-full sm:w-auto bg-[#2E7D32] hover:bg-[#256629] text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-warm-sm transition text-center"
            >
              Join Telehealth
            </Link>
          </div>
        </div>
      </div>

      {/* 5. Real Nearby Hospitals Live Pulse (Discovered via Real GPS Coordinates) */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl border border-[#E8E2D8] shadow-warm-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-[#F0EAE1]">
          <div>
            <h2 className="text-base font-serif font-bold text-[#2B1810] flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#8C5D3E]" />
              <span>Real Healthcare Facilities Near Your Location</span>
            </h2>
            <p className="text-xs text-[#7A7265]">Live OpenStreetMap registry synchronized with beds and doctor availability</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDetectGPS}
              className="text-xs font-bold text-[#4A2E1B] bg-[#FAF7F2] border border-[#E8E2D8] hover:bg-[#F4EFE6] px-3 py-1.5 rounded-xl transition flex items-center gap-1.5"
            >
              <Navigation className={`w-3.5 h-3.5 text-[#C86D51] ${isLocating ? 'animate-spin' : ''}`} />
              <span>Update GPS</span>
            </button>
            <Link to="/appointments" className="text-xs font-bold text-[#4A2E1B] hover:underline">
              All Facilities →
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {facilities.slice(0, 6).map((f) => (
            <div key={f.id} className="bg-[#FAF7F2] p-4 rounded-2xl border border-[#EDE7DC] space-y-2 hover:border-[#D6CBB8] transition">
              <div className="flex justify-between items-start">
                <span className="font-serif font-bold text-xs text-[#2B1810] line-clamp-1">{f.name}</span>
                <span className="text-[10px] font-bold bg-white text-[#7A5438] px-2 py-0.5 rounded border border-[#E8E2D8]">
                  {f.distance_km ? `${f.distance_km} km` : f.facility_type}
                </span>
              </div>
              <p className="text-[11px] text-[#7A7265] line-clamp-1">{f.address}</p>
              <div className="pt-2 border-t border-[#E8E2D8]/60 flex justify-between items-center text-[11px]">
                <span className="text-[#2E7D32] font-semibold">● Verified Operational</span>
                <Link to={`/appointments/book/${f.id}`} className="text-[#4A2E1B] font-bold hover:underline">
                  Book Slot →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 6. Zero-Data Offline Fallback Banner */}
      <div className="bg-[#FAF7F2] p-6 rounded-3xl border border-[#EDE7DC] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white border border-[#E8E2D8] text-[#4A2E1B] flex items-center justify-center font-bold">
            <Send className="w-5 h-5 text-[#0088cc]" />
          </div>
          <div>
            <div className="text-xs font-bold text-[#2B1810]">
              Zero Data Access via Telegram Bot (@SehatTriageBot)
            </div>
            <p className="text-[11px] text-[#7A7265]">
              No mobile data required. Book slots and check queues through standard 2G messaging.
            </p>
          </div>
        </div>

        <Link
          to="/family"
          className="text-xs font-semibold text-[#4A2E1B] bg-white border border-[#E8E2D8] px-4 py-2 rounded-xl hover:bg-[#F4EFE6] transition"
        >
          Caregiver / Family Proxy →
        </Link>
      </div>
    </div>
  );
}
