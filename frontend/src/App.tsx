import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useEffect } from 'react';
import { useAuthStore } from './stores/authStore';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import DashboardPage from './pages/patient/DashboardPage';
import TriagePage from './pages/patient/TriagePage';
import FacilityResultsPage from './pages/patient/FacilityResultsPage';
import BookingPage from './pages/patient/BookingPage';
import AppointmentsListPage from './pages/patient/AppointmentsListPage';
import QueuePage from './pages/patient/QueuePage';
import ConsultationPage from './pages/patient/ConsultationPage';
import HealthRecordsPage from './pages/patient/HealthRecordsPage';
import FamilyLinkPage from './pages/patient/FamilyLinkPage';
import DoctorDashboard from './pages/doctor/DoctorDashboard';
import PatientQueuePage from './pages/doctor/PatientQueuePage';
import FacilityDashboard from './pages/facility/FacilityDashboard';
import BedManagement from './pages/facility/BedManagement';
import MedicineInventory from './pages/facility/MedicineInventory';
import Navbar from './components/common/Navbar';

export default function App() {
  const { loadFromStorage, isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  const role = user?.role;
  const defaultHome = role === 'DOCTOR' 
    ? '/doctor/dashboard' 
    : role === 'FACILITY_ADMIN' 
    ? '/facility/dashboard' 
    : '/dashboard';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <Routes>
          <Route path="/" element={isAuthenticated ? <Navigate to={defaultHome} /> : <Navigate to="/login" />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          {/* Patient Routes */}
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/triage" element={<TriagePage />} />
          <Route path="/triage/results" element={<FacilityResultsPage />} />
          <Route path="/appointments" element={<AppointmentsListPage />} />
          <Route path="/appointments/book" element={<BookingPage />} />
          <Route path="/appointments/book/:facilityId" element={<BookingPage />} />
          <Route path="/queue" element={<QueuePage />} />
          <Route path="/consultation/:appointmentId" element={<ConsultationPage />} />
          <Route path="/health-records" element={<HealthRecordsPage />} />
          <Route path="/family" element={<FamilyLinkPage />} />
          
          {/* Doctor Routes */}
          <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
          <Route path="/doctor/queue" element={<PatientQueuePage />} />
          
          {/* Facility Routes */}
          <Route path="/facility/dashboard" element={<FacilityDashboard />} />
          <Route path="/facility/beds" element={<BedManagement />} />
          <Route path="/facility/medicines" element={<MedicineInventory />} />
        </Routes>
      </main>
      <Toaster position="top-right" />
    </div>
  );
}
