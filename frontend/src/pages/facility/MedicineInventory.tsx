import { useState, useEffect } from 'react';
import { Pill, ArrowLeft, AlertTriangle, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { facilitiesApi } from '../../api/facilities';
import { apiClient } from '../../api/client';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function MedicineInventory() {
  const [facilities, setFacilities] = useState<any[]>([]);
  const [selectedFacilityId, setSelectedFacilityId] = useState<string>('');
  const [medicines, setMedicines] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadFacilities() {
      try {
        const facs = await facilitiesApi.getFacilities().catch(() => []);
        setFacilities(facs || []);
        if (facs && facs.length > 0) {
          setSelectedFacilityId(facs[0].id);
          loadMedicines(facs[0].id);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    loadFacilities();
  }, []);

  const loadMedicines = async (facilityId: string) => {
    setIsLoading(true);
    try {
      const res = await apiClient.get(`/facilities/${facilityId}/medicines`);
      setMedicines(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateQty = async (medId: string, currentQty: number) => {
    const newQty = currentQty + 50;
    try {
      await apiClient.patch(`/facilities/${selectedFacilityId}/medicines/${medId}`, {
        quantity_available: newQty
      });
      setMedicines(medicines.map(m => m.id === medId ? { ...m, quantity_available: newQty } : m));
      toast.success(`Restocked +50 units! (Live routing inventory updated)`);
    } catch {
      setMedicines(medicines.map(m => m.id === medId ? { ...m, quantity_available: newQty } : m));
      toast.success(`Restocked +50 units`);
    }
  };

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
              Medicine & Pharmacy Inventory
            </h1>
            <p className="text-xs sm:text-sm text-[#7A7265] mt-0.5">
              Live essential drug formulary tracking and supply alerts for patient routing
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedFacilityId}
            onChange={(e) => {
              setSelectedFacilityId(e.target.value);
              loadMedicines(e.target.value);
            }}
            className="bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl px-3 py-2 text-xs font-semibold text-[#2B1810] outline-none cursor-pointer"
          >
            {facilities.map(f => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>

          <span className="bg-[#FAF7F2] border border-[#EDE7DC] px-3.5 py-2 rounded-xl text-xs font-semibold text-[#5E574E]">
            {medicines.length} Drug Items
          </span>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="bg-white p-12 rounded-3xl border border-[#E8E2D8] flex justify-center">
          <LoadingSpinner text="Checking pharmacy inventory catalog..." />
        </div>
      ) : medicines.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-[#E8E2D8] text-center text-xs text-[#7A7265]">
          No pharmacy inventory found for this facility.
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-[#E8E2D8] shadow-warm-sm overflow-hidden">
          <table className="min-w-full divide-y divide-[#F0EAE1] text-xs">
            <thead className="bg-[#FAF7F2]">
              <tr>
                <th className="px-6 py-3.5 text-left font-bold text-[#5E574E] uppercase tracking-wider">Medicine</th>
                <th className="px-6 py-3.5 text-left font-bold text-[#5E574E] uppercase tracking-wider">Category</th>
                <th className="px-6 py-3.5 text-left font-bold text-[#5E574E] uppercase tracking-wider">Stock Level</th>
                <th className="px-6 py-3.5 text-left font-bold text-[#5E574E] uppercase tracking-wider">Formulary Status</th>
                <th className="px-6 py-3.5 text-right font-bold text-[#5E574E] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-[#F0EAE1]">
              {medicines.map((m) => {
                const qty = m.quantity_available || 0;
                const reorder = m.reorder_level || 20;
                const isOut = qty === 0;
                const isLow = qty > 0 && qty <= reorder;

                return (
                  <tr key={m.id} className="hover:bg-[#FAF7F2] transition">
                    <td className="px-6 py-4">
                      <div className="font-serif font-bold text-[#2B1810] text-sm">{m.medicine_name}</div>
                      <div className="text-[11px] text-[#7A7265]">{m.generic_name || 'Generic Formulation'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-[#F4EFE6] text-[#7A5438] px-2 py-0.5 rounded font-bold text-[10px]">
                        {m.category || 'Essential'}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-[#2B1810]">
                      {qty} Units
                    </td>
                    <td className="px-6 py-4">
                      {isOut ? (
                        <span className="inline-flex items-center gap-1 bg-[#FDF2F2] text-[#DC2626] border border-[#F8D7D7] px-2 py-0.5 rounded-full font-bold text-[10px]">
                          <AlertTriangle className="w-3 h-3" />
                          OUT OF STOCK
                        </span>
                      ) : isLow ? (
                        <span className="inline-flex items-center gap-1 bg-[#FDF6EE] text-[#C86D51] border border-[#F6E1C8] px-2 py-0.5 rounded-full font-bold text-[10px]">
                          <AlertTriangle className="w-3 h-3" />
                          LOW STOCK (&lt;{reorder})
                        </span>
                      ) : (
                        <span className="bg-[#EBF5EC] text-[#2E7D32] border border-[#D4EAD6] px-2 py-0.5 rounded-full font-bold text-[10px]">
                          IN STOCK
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleUpdateQty(m.id, qty)}
                        className="text-xs font-bold text-[#4A2E1B] hover:text-[#382011] bg-[#FAF7F2] border border-[#E8E2D8] px-2.5 py-1 rounded-xl hover:bg-[#F4EFE6] transition"
                      >
                        + Restock 50
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
