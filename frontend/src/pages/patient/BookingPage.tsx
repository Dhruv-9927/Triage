import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { facilitiesApi } from '../../api/facilities';
import { appointmentsApi } from '../../api/appointments';
import { apiClient } from '../../api/client';
import { useTriageStore } from '../../stores/triageStore';
import { useAuthStore } from '../../stores/authStore';
import { Building2, User, Clock, CheckCircle2, ArrowRight, ArrowLeft, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

export default function BookingPage() {
  const { facilityId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { symptoms, assessment } = useTriageStore();
  const user = useAuthStore((state) => state.user);

  const [facilities, setFacilities] = useState<any[]>([]);
  const [selectedFacility, setSelectedFacility] = useState<string>(facilityId && facilityId !== 'default' ? facilityId : '');
  const [doctors, setDoctors] = useState<any[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>('10:00 AM - 10:30 AM');
  const [consultationType, setConsultationType] = useState<string>('IN_PERSON');
  const [patientName, setPatientName] = useState(user?.full_name || 'Priya Sharma');
  const [patientAge, setPatientAge] = useState('34');
  const [contactNumber, setContactNumber] = useState(user?.phone || '9876543210');
  const [chiefComplaint, setChiefComplaint] = useState(
    symptoms || (assessment?.primary_symptoms ? assessment.primary_symptoms.join(', ') : 'General Clinical Triage')
  );
  const [isLoading, setIsLoading] = useState(false);

  const slots = [
    '09:00 AM - 09:30 AM',
    '10:00 AM - 10:30 AM',
    '11:00 AM - 11:30 AM',
    '02:00 PM - 02:30 PM',
    '03:30 PM - 04:00 PM',
    '04:30 PM - 05:00 PM',
  ];

  useEffect(() => {
    async function loadInitialData() {
      try {
        let liveFacs: any[] = [];
        
        // Try getting live GPS coordinates
        if ('geolocation' in navigator) {
          try {
            const pos: any = await new Promise((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 3500 });
            });
            const disc = await facilitiesApi.discoverFacilities(
              pos.coords.latitude,
              pos.coords.longitude,
              25,
              assessment?.recommended_specialty || 'General Medicine'
            );
            if (disc && disc.length > 0) {
              liveFacs = disc.map((d: any) => ({
                id: d.facility.id,
                name: d.facility.name,
                facility_type: d.facility.facility_type,
                address: d.facility.address,
                phone: d.facility.phone,
                distance_km: d.distance_km
              }));
            }
          } catch {
            // fallback to active facilities
          }
        }

        if (liveFacs.length === 0) {
          liveFacs = await facilitiesApi.getFacilities().catch(() => []);
        }

        // Deduplicate facilities by name
        const uniqueFacsMap = new Map();
        for (const f of liveFacs) {
          if (!uniqueFacsMap.has(f.name.toLowerCase())) {
            uniqueFacsMap.set(f.name.toLowerCase(), f);
          }
        }
        const uniqueFacs = Array.from(uniqueFacsMap.values());
        setFacilities(uniqueFacs);

        const targetFacId = (facilityId && facilityId !== 'default') 
          ? facilityId 
          : (uniqueFacs && uniqueFacs.length > 0 ? uniqueFacs[0].id : '');
        
        setSelectedFacility(targetFacId);

        const docs = await apiClient.get('/doctors').then(r => r.data).catch(() => []);

        if (targetFacId) {
          const filtered = (docs || []).filter((d: any) => d.facility_id === targetFacId);
          setDoctors(filtered.length > 0 ? filtered : docs || []);
          if (filtered.length > 0) {
            const matchedDoc = assessment?.recommended_specialty 
              ? filtered.find((d: any) => d.specialization?.toLowerCase().includes(assessment.recommended_specialty.toLowerCase()))
              : null;
            setSelectedDoctor(matchedDoc ? matchedDoc.id : filtered[0].id);
          }
        } else {
          setDoctors(docs || []);
          if (docs && docs.length > 0) setSelectedDoctor(docs[0].id);
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadInitialData();
  }, [facilityId, assessment]);

  const handleFacilitySelect = async (facId: string) => {
    setSelectedFacility(facId);
    setSelectedDoctor(null);
    try {
      const res = await apiClient.get('/doctors');
      const filtered = (res.data || []).filter((d: any) => d.facility_id === facId);
      setDoctors(filtered.length > 0 ? filtered : res.data || []);
      if (filtered.length > 0) setSelectedDoctor(filtered[0].id);
    } catch {
      // Fallback
    }
  };

  const handleConfirm = async () => {
    if (!selectedDoctor || !selectedFacility) {
      toast.error('Please select a facility and doctor');
      return;
    }

    setIsLoading(true);
    try {
      const startTime = new Date();
      startTime.setHours(startTime.getHours() + 1);
      const endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + 30);

      const res = await appointmentsApi.createAppointment({
        doctor_id: selectedDoctor,
        facility_id: selectedFacility,
        scheduled_start: startTime.toISOString(),
        scheduled_end: endTime.toISOString(),
        consultation_type: consultationType,
        chief_complaint: chiefComplaint.trim() || 'General Consultation'
      });

      toast.success(`Appointment Confirmed! Token #${res.token_number || 'TKN-001'} Issued.`);
      navigate('/queue');
    } catch (err: any) {
      toast.error('Booking failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-7 rounded-3xl border border-[#E8E2D8] shadow-warm-sm">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#F4EFE6] text-[#7A5438] text-[11px] font-bold tracking-wider uppercase mb-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#C86D51]" />
            <span>End-to-End Hospital Dispatch</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#2B1810]">
            Schedule Consultation / समय बुक करें
          </h1>
          <p className="text-xs sm:text-sm text-[#7A7265] mt-0.5">
            Cross-verifies clinician presence, bed capacity, and pharmacy stock
          </p>
        </div>

        {assessment && (
          <div className="bg-[#FAF7F2] border border-[#E8E2D8] px-3.5 py-2 rounded-2xl text-xs space-y-0.5">
            <span className="text-[10px] font-bold text-[#8C5D3E] uppercase block">AI Triage Acuity</span>
            <span className="font-bold text-[#2B1810]">
              {assessment.urgency_level || 'ROUTINE'} • {assessment.recommended_specialty || 'General'}
            </span>
          </div>
        )}
      </div>

      {/* 2-Column Clinical Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Left Card: Patient Information */}
        <div className="bg-white p-7 rounded-3xl border border-[#E8E2D8] shadow-warm-sm space-y-5">
          <div className="pb-3 border-b border-[#F0EAE1]">
            <h2 className="text-xl font-serif font-bold text-[#2B1810]">
              Patient Information / रोगी विवरण
            </h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#5E574E] mb-1.5">
                Patient Name <span className="text-[#DC2626]">*</span>
              </label>
              <input
                type="text"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                className="w-full bg-[#FAF7F2] border border-[#D8D1C5] rounded-xl p-3 text-sm text-[#2B1810] focus:border-[#4A2E1B] focus:ring-1 focus:ring-[#4A2E1B] outline-none transition"
                placeholder="e.g. Priya Sharma"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#5E574E] mb-1.5">
                  Age <span className="text-[#DC2626]">*</span>
                </label>
                <input
                  type="text"
                  value={patientAge}
                  onChange={(e) => setPatientAge(e.target.value)}
                  className="w-full bg-[#FAF7F2] border border-[#D8D1C5] rounded-xl p-3 text-sm text-[#2B1810] focus:border-[#4A2E1B] focus:ring-1 focus:ring-[#4A2E1B] outline-none transition"
                  placeholder="e.g. 34"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#5E574E] mb-1.5">
                  Contact Number <span className="text-[#DC2626]">*</span>
                </label>
                <input
                  type="text"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  className="w-full bg-[#FAF7F2] border border-[#D8D1C5] rounded-xl p-3 text-sm text-[#2B1810] focus:border-[#4A2E1B] focus:ring-1 focus:ring-[#4A2E1B] outline-none transition"
                  placeholder="e.g. 9876543210"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#5E574E] mb-1.5">
                Target Facility <span className="text-[#DC2626]">*</span>
              </label>
              <select
                value={selectedFacility}
                onChange={(e) => handleFacilitySelect(e.target.value)}
                className="w-full bg-[#FAF7F2] border border-[#D8D1C5] rounded-xl p-3 text-sm text-[#2B1810] focus:border-[#4A2E1B] focus:ring-1 focus:ring-[#4A2E1B] outline-none transition cursor-pointer"
              >
                <option value="">-- Choose Healthcare Facility --</option>
                {facilities.map((fac) => (
                  <option key={fac.id} value={fac.id}>
                    {fac.distance_km ? `📍 ${fac.distance_km} km • ` : ''}{fac.name} ({fac.facility_type}) - {fac.address.slice(0, 45)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#5E574E] mb-1.5">
                Symptoms / Chief Complaint
              </label>
              <input
                type="text"
                value={chiefComplaint}
                onChange={(e) => setChiefComplaint(e.target.value)}
                className="w-full bg-[#FAF7F2] border border-[#D8D1C5] rounded-xl p-3 text-sm text-[#2B1810] focus:border-[#4A2E1B] focus:ring-1 focus:ring-[#4A2E1B] outline-none transition"
                placeholder="e.g. Fever, chest congestion, diabetes checkup"
              />
            </div>
          </div>
        </div>

        {/* Right Card: Clinician & Slot Selection */}
        <div className="bg-white p-7 rounded-3xl border border-[#E8E2D8] shadow-warm-sm space-y-5">
          <div className="pb-3 border-b border-[#F0EAE1]">
            <h2 className="text-xl font-serif font-bold text-[#2B1810]">
              Clinician & Slot Allocation
            </h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#5E574E] mb-1.5">
                Consultation Mode <span className="text-[#DC2626]">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'IN_PERSON', label: '🏥 IN-PERSON' },
                  { id: 'VIDEO', label: '📹 TELEHEALTH' },
                  { id: 'VOICE', label: '📞 VOICE ONLY' },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setConsultationType(mode.id)}
                    className={`py-2.5 px-2 rounded-xl text-xs font-bold transition ${
                      consultationType === mode.id
                        ? 'bg-[#4A2E1B] text-white shadow-sm'
                        : 'bg-[#FAF7F2] border border-[#D8D1C5] text-[#5E574E] hover:bg-[#F9F6F0]'
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#5E574E] mb-1.5">
                Select Clinician <span className="text-[#DC2626]">*</span>
              </label>
              {doctors.length === 0 ? (
                <div className="p-4 bg-[#FAF7F2] rounded-2xl text-xs text-[#7A7265] text-center">
                  Select a facility on the left to load available doctors
                </div>
              ) : (
                <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                  {doctors.map((doc) => {
                    const isSelected = selectedDoctor === doc.id;
                    return (
                      <div
                        key={doc.id}
                        onClick={() => setSelectedDoctor(doc.id)}
                        className={`p-3 rounded-2xl border cursor-pointer transition flex justify-between items-center ${
                          isSelected
                            ? 'border-[#4A2E1B] bg-[#F4EFE6] ring-1 ring-[#4A2E1B]'
                            : 'border-[#E8E2D8] hover:bg-[#FAF7F2]'
                        }`}
                      >
                        <div>
                          <div className="font-bold text-xs text-[#2B1810]">{doc.full_name || doc.name}</div>
                          <div className="text-[11px] text-[#8C5D3E] font-medium">{doc.specialization}</div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-bold text-[#2B1810]">₹{doc.consultation_fee || 500}</span>
                          <span className="block text-[10px] text-[#2E7D32] font-semibold">Verified On Duty</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#5E574E] mb-1.5">
                Time Slot <span className="text-[#DC2626]">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {slots.map((slot) => {
                  const isSelected = selectedSlot === slot;
                  return (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setSelectedSlot(slot)}
                      className={`p-2.5 rounded-xl border text-[11px] font-semibold transition ${
                        isSelected
                          ? 'border-[#4A2E1B] bg-[#F4EFE6] text-[#4A2E1B] font-bold'
                          : 'border-[#E8E2D8] text-[#6B6358] hover:bg-[#FAF7F2]'
                      }`}
                    >
                      {slot}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom CTA Button */}
      <button
        type="button"
        disabled={isLoading || !selectedFacility || !selectedDoctor}
        onClick={handleConfirm}
        className="w-full bg-[#4A2E1B] hover:bg-[#382011] text-white font-medium py-4 px-6 rounded-2xl shadow-warm-md disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2 text-sm tracking-wide"
      >
        <span>{isLoading ? 'Allocating Queue Token...' : 'Confirm Appointment & Generate Token →'}</span>
      </button>
    </div>
  );
}
