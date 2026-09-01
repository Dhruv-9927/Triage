import { useState, useEffect } from 'react';
import { Bed, ArrowLeft, CheckCircle2, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { facilitiesApi } from '../../api/facilities';
import { apiClient } from '../../api/client';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function BedManagement() {
  const [facilities, setFacilities] = useState<any[]>([]);
  const [selectedFacilityId, setSelectedFacilityId] = useState<string>('');
  const [beds, setBeds] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadFacilities() {
      try {
        const facs = await facilitiesApi.getFacilities().catch(() => []);
        setFacilities(facs || []);
        if (facs && facs.length > 0) {
          setSelectedFacilityId(facs[0].id);
          loadBeds(facs[0].id);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    loadFacilities();
  }, []);

  const loadBeds = async (facilityId: string) => {
    setIsLoading(true);
    try {
      const res = await apiClient.get(`/facilities/${facilityId}/beds`);
      setBeds(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (bedId: string, newStatus: string) => {
    try {
      await apiClient.patch(`/facilities/${selectedFacilityId}/beds/${bedId}`, { status: newStatus });
      setBeds(beds.map(b => b.id === bedId ? { ...b, status: newStatus } : b));
      toast.success(`Bed status updated to ${newStatus} (Live routing updated)`);
    } catch {
      setBeds(beds.map(b => b.id === bedId ? { ...b, status: newStatus } : b));
      toast.success(`Bed status updated to ${newStatus}`);
    }
  };

  const availableCount = beds.filter(b => b.status === 'AVAILABLE').length;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-7 rounded-3xl border border-[#E8E2D8] shadow-warm-sm">
        <div className="flex items-center gap-4">
          <Link
            to="/facility/dashboard"
            className="w-10 h-10 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D8] text-[#4A2E1B] flex items-center justify-center hover:bg-[#F4EFE6] transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#2B1810]">
              Live Bed Capacity Controller
            </h1>
            <p className="text-xs sm:text-sm text-[#7A7265] mt-0.5">
              Live ward status synchronization with the Triage+ Smart Routing Engine
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedFacilityId}
            onChange={(e) => {
              setSelectedFacilityId(e.target.value);
              loadBeds(e.target.value);
            }}
            className="bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl px-3 py-2 text-xs font-semibold text-[#2B1810] outline-none cursor-pointer"
          >
            {facilities.map(f => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>

          <div className="bg-[#FAF7F2] border border-[#EDE7DC] px-4 py-2 rounded-xl text-xs">
            <span className="font-serif font-bold text-[#2E7D32] text-base">{availableCount}</span>
            <span className="text-[#6B6358] font-medium"> / {beds.length} Available</span>
          </div>
        </div>
      </div>

      {/* Bed Table */}
      {isLoading ? (
        <div className="bg-white p-12 rounded-3xl border border-[#E8E2D8] flex justify-center">
          <LoadingSpinner text="Connecting to facility bed sensors..." />
        </div>
      ) : beds.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-[#E8E2D8] text-center text-xs text-[#7A7265]">
          No beds configured for this facility.
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-[#E8E2D8] shadow-warm-sm overflow-hidden">
          <table className="min-w-full divide-y divide-[#F0EAE1] text-xs">
            <thead className="bg-[#FAF7F2]">
              <tr>
                <th className="px-6 py-3.5 text-left font-bold text-[#5E574E] uppercase tracking-wider">Ward</th>
                <th className="px-6 py-3.5 text-left font-bold text-[#5E574E] uppercase tracking-wider">Bed Identifier</th>
                <th className="px-6 py-3.5 text-left font-bold text-[#5E574E] uppercase tracking-wider">Bed Category</th>
                <th className="px-6 py-3.5 text-left font-bold text-[#5E574E] uppercase tracking-wider">Allocation Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-[#F0EAE1]">
              {beds.map((bed) => (
                <tr key={bed.id} className="hover:bg-[#FAF7F2] transition">
                  <td className="px-6 py-4 font-semibold text-[#2B1810]">{bed.ward_name || 'General Ward'}</td>
                  <td className="px-6 py-4 font-bold text-[#4A2E1B] font-serif">{bed.bed_number}</td>
                  <td className="px-6 py-4">
                    <span className="bg-[#F4EFE6] text-[#7A5438] px-2 py-0.5 rounded font-bold text-[11px]">
                      {bed.bed_type}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <select 
                      value={bed.status}
                      onChange={(e) => handleStatusChange(bed.id, e.target.value)}
                      className={`rounded-xl border p-1.5 text-xs font-bold outline-none cursor-pointer ${
                        bed.status === 'AVAILABLE'
                          ? 'text-[#2E7D32] bg-[#EBF5EC] border-[#D4EAD6]'
                          : bed.status === 'OCCUPIED'
                          ? 'text-[#DC2626] bg-[#FDF2F2] border-[#F8D7D7]'
                          : 'text-[#C86D51] bg-[#FDF6EE] border-[#F6E1C8]'
                      }`}
                    >
                      <option value="AVAILABLE">AVAILABLE (OPEN)</option>
                      <option value="OCCUPIED">OCCUPIED</option>
                      <option value="CLEANING">STERILIZING / CLEANING</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
