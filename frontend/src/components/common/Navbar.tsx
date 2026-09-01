import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';
import OfflineBadge from './OfflineBadge';
import BrandLogo from './BrandLogo';
import { Menu, X, LogOut, ArrowRight } from 'lucide-react';
import { useState } from 'react';

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuthStore();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const role = user?.role || 'PATIENT';

  return (
    <nav className="bg-[#FAF7F2]/90 backdrop-blur-md border-b border-[#E8E2D8] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-18 py-3">
          {/* Brand Logo */}
          <div className="flex items-center gap-8">
            <Link
              to={
                role === 'DOCTOR'
                  ? '/doctor/dashboard'
                  : role === 'FACILITY_ADMIN'
                  ? '/facility/dashboard'
                  : '/dashboard'
              }
              className="flex-shrink-0 flex items-center gap-2 group"
            >
              <BrandLogo size="md" />
            </Link>

            {/* Desktop Navigation Links */}
            {isAuthenticated && (
              <div className="hidden md:flex items-center space-x-1 text-xs font-semibold tracking-wide text-[#6B6358]">
                {role === 'PATIENT' && (
                  <>
                    <Link
                      to="/dashboard"
                      className="px-3.5 py-2 hover:text-[#2B1810] hover:bg-[#F4EFE6] rounded-xl transition"
                    >
                      Overview
                    </Link>
                    <Link
                      to="/triage"
                      className="px-3.5 py-2 hover:text-[#2B1810] hover:bg-[#F4EFE6] rounded-xl transition"
                    >
                      AI Triage
                    </Link>
                    <Link
                      to="/appointments"
                      className="px-3.5 py-2 hover:text-[#2B1810] hover:bg-[#F4EFE6] rounded-xl transition"
                    >
                      Appointments
                    </Link>
                    <Link
                      to="/queue"
                      className="px-3.5 py-2 hover:text-[#2B1810] hover:bg-[#F4EFE6] rounded-xl transition"
                    >
                      My Queue
                    </Link>
                    <Link
                      to="/health-records"
                      className="px-3.5 py-2 hover:text-[#2B1810] hover:bg-[#F4EFE6] rounded-xl transition"
                    >
                      Health Records
                    </Link>
                  </>
                )}

                {role === 'DOCTOR' && (
                  <>
                    <Link
                      to="/doctor/dashboard"
                      className="px-3.5 py-2 hover:text-[#2B1810] hover:bg-[#F4EFE6] rounded-xl transition"
                    >
                      Doctor Portal
                    </Link>
                    <Link
                      to="/doctor/queue"
                      className="px-3.5 py-2 hover:text-[#2B1810] hover:bg-[#F4EFE6] rounded-xl transition"
                    >
                      Patient Queue
                    </Link>
                  </>
                )}

                {role === 'FACILITY_ADMIN' && (
                  <>
                    <Link
                      to="/facility/dashboard"
                      className="px-3.5 py-2 hover:text-[#2B1810] hover:bg-[#F4EFE6] rounded-xl transition"
                    >
                      Facility Overview
                    </Link>
                    <Link
                      to="/facility/beds"
                      className="px-3.5 py-2 hover:text-[#2B1810] hover:bg-[#F4EFE6] rounded-xl transition"
                    >
                      Bed Management
                    </Link>
                    <Link
                      to="/facility/medicines"
                      className="px-3.5 py-2 hover:text-[#2B1810] hover:bg-[#F4EFE6] rounded-xl transition"
                    >
                      Medicine Stock
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Right Action Tools */}
          <div className="hidden sm:flex sm:items-center space-x-3.5">
            <OfflineBadge />
            <LanguageSwitcher />

            {isAuthenticated ? (
              <div className="flex items-center gap-3 pl-3 border-l border-[#E8E2D8]">
                <div className="text-right">
                  <div className="text-xs font-bold text-[#2B1810] leading-tight font-serif">
                    {user?.full_name}
                  </div>
                  <span className="text-[10px] font-bold text-[#8C5D3E] uppercase tracking-wider">
                    {role.replace('_', ' ')}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  title="Log out"
                  className="flex items-center gap-1 text-xs text-[#8C8275] hover:text-[#DC2626] hover:bg-[#F8EBEB] p-2 rounded-xl font-medium transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{t('auth.logout')}</span>
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="bg-[#4A2E1B] hover:bg-[#382011] text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-warm-sm transition flex items-center gap-1.5"
              >
                <span>{t('auth.login')}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>

          {/* Mobile hamburger menu toggle */}
          <div className="flex items-center sm:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-[#6B6358] hover:text-[#2B1810] p-2"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden px-4 pt-2 pb-4 space-y-3 border-t border-[#E8E2D8] bg-[#FAF7F2]">
          <div className="flex items-center justify-between pb-2 border-b border-[#E8E2D8]">
            <OfflineBadge />
            <LanguageSwitcher />
          </div>

          {isAuthenticated ? (
            <div className="space-y-2">
              <div className="py-1">
                <div className="font-bold text-[#2B1810] font-serif">{user?.full_name}</div>
                <div className="text-xs text-[#8C5D3E] font-medium">{role}</div>
              </div>

              {role === 'PATIENT' && (
                <>
                  <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)} className="block py-1.5 text-sm text-[#5E574E] font-medium">Dashboard</Link>
                  <Link to="/triage" onClick={() => setMobileMenuOpen(false)} className="block py-1.5 text-sm text-[#5E574E] font-medium">AI Triage</Link>
                  <Link to="/appointments" onClick={() => setMobileMenuOpen(false)} className="block py-1.5 text-sm text-[#5E574E] font-medium">Appointments</Link>
                  <Link to="/queue" onClick={() => setMobileMenuOpen(false)} className="block py-1.5 text-sm text-[#5E574E] font-medium">My Queue</Link>
                  <Link to="/health-records" onClick={() => setMobileMenuOpen(false)} className="block py-1.5 text-sm text-[#5E574E] font-medium">Health Records</Link>
                </>
              )}

              {role === 'DOCTOR' && (
                <>
                  <Link to="/doctor/dashboard" onClick={() => setMobileMenuOpen(false)} className="block py-1.5 text-sm text-[#5E574E] font-medium">Doctor Portal</Link>
                  <Link to="/doctor/queue" onClick={() => setMobileMenuOpen(false)} className="block py-1.5 text-sm text-[#5E574E] font-medium">Patient Queue</Link>
                </>
              )}

              {role === 'FACILITY_ADMIN' && (
                <>
                  <Link to="/facility/dashboard" onClick={() => setMobileMenuOpen(false)} className="block py-1.5 text-sm text-[#5E574E] font-medium">Facility Overview</Link>
                  <Link to="/facility/beds" onClick={() => setMobileMenuOpen(false)} className="block py-1.5 text-sm text-[#5E574E] font-medium">Bed Management</Link>
                  <Link to="/facility/medicines" onClick={() => setMobileMenuOpen(false)} className="block py-1.5 text-sm text-[#5E574E] font-medium">Medicine Stock</Link>
                </>
              )}

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full text-left text-[#DC2626] font-semibold py-2 mt-2 border-t border-[#E8E2D8] text-sm flex items-center gap-1"
              >
                <LogOut className="w-4 h-4" />
                <span>{t('auth.logout')}</span>
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="block w-full text-center bg-[#4A2E1B] text-white font-semibold py-2.5 rounded-xl shadow-warm-sm"
            >
              {t('auth.login')}
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
