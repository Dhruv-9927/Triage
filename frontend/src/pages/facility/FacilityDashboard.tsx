import { Link } from 'react-router-dom';
import { Bed, Pill, Users, AlertTriangle, Building2, ArrowRight } from 'lucide-react';

export default function FacilityDashboard() {
  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white p-7 rounded-2xl border border-[#E8E2D8] shadow-warm-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#F4EFE6] text-[#7A5438] text-[11px] font-bold tracking-wider uppercase mb-1.5">
            <Building2 className="w-3.5 h-3.5 text-[#C86D51]" />
            <span>Facility Operations Station</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#2B1810]">
            AIIMS Delhi (Hospital Hub)
          </h1>
          <p className="text-xs sm:text-sm text-[#7A7265] mt-0.5">
            Real-time Bed Capacity, Specialist Presence, and Medicine Pharmacy Controls
          </p>
        </div>

        <div className="inline-flex items-center gap-2 bg-[#EBF5EC] text-[#2E7D32] border border-[#D4EAD6] px-3.5 py-1.5 rounded-full text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-[#2E7D32] animate-pulse"></span>
          <span>Live WebSocket Feed Connected</span>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-[#E8E2D8] shadow-warm-sm text-center space-y-1">
          <div className="text-3xl font-serif font-bold text-[#2B1810]">20</div>
          <div className="text-xs text-[#7A7265]">Total Hospital Beds</div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-[#E8E2D8] shadow-warm-sm text-center space-y-1">
          <div className="text-3xl font-serif font-bold text-[#2E7D32]">8</div>
          <div className="text-xs text-[#7A7265]">Available Beds</div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-[#E8E2D8] shadow-warm-sm text-center space-y-1">
          <div className="text-3xl font-serif font-bold text-[#4A2E1B]">6</div>
          <div className="text-xs text-[#7A7265]">Doctors On Duty</div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-[#E8E2D8] shadow-warm-sm text-center space-y-1">
          <div className="text-3xl font-serif font-bold text-[#C86D51]">3</div>
          <div className="text-xs text-[#7A7265]">Low Stock Meds</div>
        </div>
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <Link
          to="/facility/beds"
          className="bg-white p-7 rounded-2xl border border-[#E8E2D8] shadow-warm-sm hover:shadow-warm-md hover:border-[#D6CBB8] transition flex flex-col justify-between space-y-4 group"
        >
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-[#FAF7F2] border border-[#E8E2D8] flex items-center justify-center text-[#4A2E1B] group-hover:bg-[#4A2E1B] group-hover:text-white transition-colors">
              <Bed className="w-5 h-5 stroke-[1.75]" />
            </div>
            <h2 className="text-xl font-serif font-bold text-[#2B1810]">
              Bed Management Controller
            </h2>
            <p className="text-xs text-[#6B6358] leading-relaxed">
              Toggle ICU, Emergency, and General ward bed allocations with real-time sync to the patient routing engine.
            </p>
          </div>
          <div className="pt-2 text-xs font-bold text-[#4A2E1B] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
            <span>Manage Wards & Beds</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </Link>

        <Link
          to="/facility/medicines"
          className="bg-white p-7 rounded-2xl border border-[#E8E2D8] shadow-warm-sm hover:shadow-warm-md hover:border-[#D6CBB8] transition flex flex-col justify-between space-y-4 group"
        >
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-[#FAF7F2] border border-[#E8E2D8] flex items-center justify-center text-[#4A2E1B] group-hover:bg-[#4A2E1B] group-hover:text-white transition-colors">
              <Pill className="w-5 h-5 stroke-[1.75]" />
            </div>
            <h2 className="text-xl font-serif font-bold text-[#2B1810]">
              Medicine & Pharmacy Inventory
            </h2>
            <p className="text-xs text-[#6B6358] leading-relaxed">
              Track essential medicine batches, update stock quantities, and resolve critical shortage alerts for triage matching.
            </p>
          </div>
          <div className="pt-2 text-xs font-bold text-[#4A2E1B] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
            <span>View Pharmacy Inventory</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </Link>
      </div>
    </div>
  );
}
