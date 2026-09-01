import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../stores/authStore';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import LanguageSwitcher from '../../components/common/LanguageSwitcher';
import BrandLogo from '../../components/common/BrandLogo';
import { ArrowRight, User, Stethoscope, Building2 } from 'lucide-react';

export default function RegisterPage() {
  const { t } = useTranslation();
  const register = useAuthStore((state) => state.register);
  const navigate = useNavigate();
  
  const [role, setRole] = useState<'PATIENT' | 'DOCTOR' | 'FACILITY_ADMIN'>('PATIENT');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    specialization: 'General Medicine',
    licenseNumber: '',
    consultationFee: 350,
    facilityName: '',
    facilityType: 'Hospital',
    facilityAddress: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await register({
        full_name: formData.fullName,
        email: formData.email,
        phone: formData.phone || "9876543210",
        password: formData.password,
        role: role,
        specialization: formData.specialization,
        license_number: formData.licenseNumber || undefined,
        consultation_fee: Number(formData.consultationFee) || 350,
        facility_name: formData.facilityName || undefined,
        facility_type: formData.facilityType || "Hospital",
        facility_address: formData.facilityAddress || undefined
      });
      
      toast.success(`Account created as ${role}! Redirecting...`);
      
      if (role === 'DOCTOR') {
        navigate('/doctor/dashboard');
      } else if (role === 'FACILITY_ADMIN') {
        navigate('/facility/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Registration failed. Please check details.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto mt-6 sm:mt-10 p-7 sm:p-9 bg-white rounded-3xl shadow-warm-lg border border-[#E8E2D8] space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center pb-3 border-b border-[#F0EAE1]">
        <BrandLogo size="lg" />
        <LanguageSwitcher />
      </div>

      <div>
        <h1 className="text-2xl font-serif font-bold text-[#2B1810]">
          Create Triage+ Account
        </h1>
        <p className="text-xs text-[#7A7265] mt-0.5">
          Join the decentralized low-bandwidth healthcare access network
        </p>
      </div>

      {/* Role Selection Tabs */}
      <div className="space-y-1.5">
        <label className="block text-[11px] font-bold text-[#5E574E] uppercase tracking-wider">
          Select Account Type / खाता प्रकार
        </label>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => setRole('PATIENT')}
            className={`p-3 rounded-2xl border text-xs font-bold transition flex flex-col items-center gap-1.5 ${
              role === 'PATIENT'
                ? 'bg-[#4A2E1B] text-white border-[#4A2E1B] shadow-warm-sm'
                : 'bg-[#FAF7F2] border-[#E8E2D8] text-[#6B6358] hover:bg-[#F4EFE6]'
            }`}
          >
            <User className="w-4 h-4" />
            <span>🧑 Patient</span>
          </button>

          <button
            type="button"
            onClick={() => setRole('DOCTOR')}
            className={`p-3 rounded-2xl border text-xs font-bold transition flex flex-col items-center gap-1.5 ${
              role === 'DOCTOR'
                ? 'bg-[#4A2E1B] text-white border-[#4A2E1B] shadow-warm-sm'
                : 'bg-[#FAF7F2] border-[#E8E2D8] text-[#6B6358] hover:bg-[#F4EFE6]'
            }`}
          >
            <Stethoscope className="w-4 h-4" />
            <span>🩺 Doctor</span>
          </button>

          <button
            type="button"
            onClick={() => setRole('FACILITY_ADMIN')}
            className={`p-3 rounded-2xl border text-xs font-bold transition flex flex-col items-center gap-1.5 ${
              role === 'FACILITY_ADMIN'
                ? 'bg-[#4A2E1B] text-white border-[#4A2E1B] shadow-warm-sm'
                : 'bg-[#FAF7F2] border-[#E8E2D8] text-[#6B6358] hover:bg-[#F4EFE6]'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>🏥 Hospital</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleRegister} className="space-y-3.5 text-xs">
        {/* Full Name */}
        <div>
          <label className="block font-semibold text-[#5E574E] uppercase tracking-wider mb-1">
            {role === 'DOCTOR' ? 'Doctor Full Name' : role === 'FACILITY_ADMIN' ? 'Administrator Name' : 'Full Name'} <span className="text-[#DC2626]">*</span>
          </label>
          <input 
            type="text" 
            className="w-full rounded-xl border border-[#D8D1C5] bg-[#FAF7F2] p-3 text-sm text-[#2B1810] focus:ring-1 focus:ring-[#4A2E1B] focus:border-[#4A2E1B] focus:bg-white outline-none transition" 
            placeholder={role === 'DOCTOR' ? 'e.g. Dr. Ananya Sharma' : 'e.g. Priya Sharma'}
            value={formData.fullName} 
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} 
            required 
          />
        </div>

        {/* Doctor-Specific Fields */}
        {role === 'DOCTOR' && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#5E574E] uppercase tracking-wider mb-1">
                Specialization <span className="text-[#DC2626]">*</span>
              </label>
              <select
                value={formData.specialization}
                onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                className="w-full rounded-xl border border-[#D8D1C5] bg-[#FAF7F2] p-3 text-xs text-[#2B1810] focus:ring-1 focus:ring-[#4A2E1B] outline-none cursor-pointer"
              >
                <option value="General Medicine">General Medicine</option>
                <option value="Pediatrics">Pediatrics</option>
                <option value="Cardiology">Cardiology</option>
                <option value="Orthopedics">Orthopedics</option>
                <option value="Gynecology & Obstetrics">Gynecology</option>
                <option value="Emergency Medicine">Emergency Medicine</option>
                <option value="Pulmonology">Pulmonology</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-[#5E574E] uppercase tracking-wider mb-1">
                Medical License # <span className="text-[#DC2626]">*</span>
              </label>
              <input 
                type="text" 
                className="w-full rounded-xl border border-[#D8D1C5] bg-[#FAF7F2] p-3 text-sm text-[#2B1810] focus:ring-1 focus:ring-[#4A2E1B] outline-none transition" 
                placeholder="e.g. MCI-98241"
                value={formData.licenseNumber} 
                onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })} 
                required 
              />
            </div>
          </div>
        )}

        {/* Facility Admin-Specific Fields */}
        {role === 'FACILITY_ADMIN' && (
          <div className="space-y-3">
            <div>
              <label className="block font-semibold text-[#5E574E] uppercase tracking-wider mb-1">
                Healthcare Facility / Hospital Name <span className="text-[#DC2626]">*</span>
              </label>
              <input 
                type="text" 
                className="w-full rounded-xl border border-[#D8D1C5] bg-[#FAF7F2] p-3 text-sm text-[#2B1810] focus:ring-1 focus:ring-[#4A2E1B] outline-none transition" 
                placeholder="e.g. Rohini Community Health Center (CHC)"
                value={formData.facilityName} 
                onChange={(e) => setFormData({ ...formData, facilityName: e.target.value })} 
                required 
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-[#5E574E] uppercase tracking-wider mb-1">
                  Facility Type
                </label>
                <select
                  value={formData.facilityType}
                  onChange={(e) => setFormData({ ...formData, facilityType: e.target.value })}
                  className="w-full rounded-xl border border-[#D8D1C5] bg-[#FAF7F2] p-3 text-xs text-[#2B1810] focus:ring-1 focus:ring-[#4A2E1B] outline-none cursor-pointer"
                >
                  <option value="Hospital">Hospital</option>
                  <option value="Primary Health Center (PHC)">Primary Health Center (PHC)</option>
                  <option value="Community Health Center (CHC)">Community Health Center (CHC)</option>
                  <option value="Clinical Dispensary">Dispensary / Clinic</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-[#5E574E] uppercase tracking-wider mb-1">
                  Area / City <span className="text-[#DC2626]">*</span>
                </label>
                <input 
                  type="text" 
                  className="w-full rounded-xl border border-[#D8D1C5] bg-[#FAF7F2] p-3 text-sm text-[#2B1810] focus:ring-1 focus:ring-[#4A2E1B] outline-none transition" 
                  placeholder="e.g. Sector 14, Delhi"
                  value={formData.facilityAddress} 
                  onChange={(e) => setFormData({ ...formData, facilityAddress: e.target.value })} 
                  required 
                />
              </div>
            </div>
          </div>
        )}

        {/* Email & Phone */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-[#5E574E] uppercase tracking-wider mb-1">
              Email Address <span className="text-[#DC2626]">*</span>
            </label>
            <input 
              type="email" 
              className="w-full rounded-xl border border-[#D8D1C5] bg-[#FAF7F2] p-3 text-sm text-[#2B1810] focus:ring-1 focus:ring-[#4A2E1B] focus:bg-white outline-none transition" 
              placeholder="e.g. user@demo.com"
              value={formData.email} 
              onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
              required 
            />
          </div>
          <div>
            <label className="block font-semibold text-[#5E574E] uppercase tracking-wider mb-1">
              Phone Number <span className="text-[#DC2626]">*</span>
            </label>
            <input 
              type="tel" 
              className="w-full rounded-xl border border-[#D8D1C5] bg-[#FAF7F2] p-3 text-sm text-[#2B1810] focus:ring-1 focus:ring-[#4A2E1B] focus:bg-white outline-none transition" 
              placeholder="e.g. 9876543210"
              value={formData.phone} 
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })} 
              required 
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="block font-semibold text-[#5E574E] uppercase tracking-wider mb-1">
            Password (Min. 6 Characters) <span className="text-[#DC2626]">*</span>
          </label>
          <input 
            type="password" 
            className="w-full rounded-xl border border-[#D8D1C5] bg-[#FAF7F2] p-3 text-sm text-[#2B1810] focus:ring-1 focus:ring-[#4A2E1B] focus:bg-white outline-none transition" 
            placeholder="••••••••"
            value={formData.password} 
            onChange={(e) => setFormData({ ...formData, password: e.target.value })} 
            required 
          />
        </div>

        <button 
          type="submit" 
          disabled={isLoading}
          className="w-full bg-[#4A2E1B] hover:bg-[#382011] text-white font-medium p-3.5 rounded-xl shadow-warm-md disabled:opacity-50 transition text-sm flex justify-center items-center gap-1.5 tracking-wide mt-2"
        >
          <span>{isLoading ? 'Creating Account...' : `Register as ${role === 'DOCTOR' ? 'Doctor' : role === 'FACILITY_ADMIN' ? 'Hospital Admin' : 'Patient'} →`}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      <div className="text-center pt-2 border-t border-[#F0EAE1]">
        <Link to="/login" className="text-xs font-semibold text-[#4A2E1B] hover:underline">
          {t('auth.hasAccount')}
        </Link>
      </div>
    </div>
  );
}
