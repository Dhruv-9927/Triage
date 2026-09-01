import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../stores/authStore';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import LanguageSwitcher from '../../components/common/LanguageSwitcher';
import BrandLogo from '../../components/common/BrandLogo';
import { ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const { t } = useTranslation();
  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login({ email, password });
      toast.success('Logged in successfully');
      
      const currentUser = useAuthStore.getState().user;
      const role = currentUser?.role;
      
      if (role === 'DOCTOR') {
        navigate('/doctor/dashboard');
      } else if (role === 'FACILITY_ADMIN') {
        navigate('/facility/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemo = async (roleType: 'PATIENT' | 'DOCTOR' | 'ADMIN') => {
    let demoEmail = 'patient@demo.com';
    if (roleType === 'DOCTOR') demoEmail = 'doctor@demo.com';
    if (roleType === 'ADMIN') demoEmail = 'admin@demo.com';

    setEmail(demoEmail);
    setPassword('demo1234');
    setIsLoading(true);
    try {
      await login({ email: demoEmail, password: 'demo1234' });
      toast.success(`Logged in as Demo ${roleType}`);
      if (roleType === 'DOCTOR') {
        navigate('/doctor/dashboard');
      } else if (roleType === 'ADMIN') {
        navigate('/facility/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      toast.error('Quick login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-6 sm:mt-12 p-7 sm:p-9 bg-white rounded-3xl shadow-warm-lg border border-[#E8E2D8] space-y-6">
      <div className="flex justify-between items-center pb-3 border-b border-[#F0EAE1]">
        <BrandLogo size="lg" />
        <LanguageSwitcher />
      </div>

      <div>
        <h1 className="text-2xl font-serif font-bold text-[#2B1810]">{t('auth.login')}</h1>
        <p className="text-xs text-[#7A7265] mt-0.5">Enter your credentials to access your clinical portal</p>
      </div>

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-[#5E574E] uppercase tracking-wider mb-1.5">
            {t('auth.email')}
          </label>
          <input 
            type="email" 
            className="w-full rounded-xl border border-[#D8D1C5] bg-[#FAF7F2] p-3 text-sm text-[#2B1810] focus:ring-1 focus:ring-[#4A2E1B] focus:border-[#4A2E1B] focus:bg-white outline-none transition" 
            placeholder="e.g. patient@demo.com or doctor@demo.com"
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-[#5E574E] uppercase tracking-wider mb-1.5">
            {t('auth.password')}
          </label>
          <input 
            type="password" 
            className="w-full rounded-xl border border-[#D8D1C5] bg-[#FAF7F2] p-3 text-sm text-[#2B1810] focus:ring-1 focus:ring-[#4A2E1B] focus:border-[#4A2E1B] focus:bg-white outline-none transition" 
            placeholder="••••••••"
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
          />
        </div>
        <button 
          type="submit" 
          disabled={isLoading}
          className="w-full bg-[#4A2E1B] hover:bg-[#382011] text-white font-medium p-3.5 rounded-xl shadow-warm-md disabled:opacity-50 transition text-sm flex justify-center items-center gap-1.5 tracking-wide"
        >
          <span>{isLoading ? 'Authenticating...' : t('auth.loginButton')}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      {/* Quick Demo Login Presets */}
      <div className="pt-4 border-t border-[#F0EAE1] space-y-2.5">
        <span className="text-[11px] font-bold text-[#8C5D3E] uppercase tracking-wider block text-center">
          ⚡ 1-Click Demo Portals
        </span>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => handleQuickDemo('PATIENT')}
            className="p-2.5 border border-[#E8E2D8] bg-[#FAF7F2] hover:bg-[#F4EFE6] rounded-xl text-xs font-semibold text-[#2B1810] text-center transition shadow-warm-sm"
          >
            🧑 Patient
          </button>
          <button
            type="button"
            onClick={() => handleQuickDemo('DOCTOR')}
            className="p-2.5 border border-[#E8E2D8] bg-[#FAF7F2] hover:bg-[#F4EFE6] rounded-xl text-xs font-semibold text-[#2B1810] text-center transition shadow-warm-sm"
          >
            🩺 Doctor
          </button>
          <button
            type="button"
            onClick={() => handleQuickDemo('ADMIN')}
            className="p-2.5 border border-[#E8E2D8] bg-[#FAF7F2] hover:bg-[#F4EFE6] rounded-xl text-xs font-semibold text-[#2B1810] text-center transition shadow-warm-sm"
          >
            🏥 Admin
          </button>
        </div>
      </div>

      <div className="text-center pt-2">
        <Link to="/register" className="text-xs font-semibold text-[#4A2E1B] hover:underline">
          {t('auth.noAccount')}
        </Link>
      </div>
    </div>
  );
}
