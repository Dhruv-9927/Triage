import { useTranslation } from 'react-i18next';
import { MapPin, UserCheck, Bed, Pill, ArrowRight } from 'lucide-react';

export default function FacilityCard({ facility, onBook }: { facility: any, onBook: () => void }) {
  const { t } = useTranslation();

  const fac = facility.facility || facility;
  const name = fac.name || 'Healthcare Facility';
  const type = fac.facility_type || fac.type || 'Hospital';
  const distance = facility.distance_km || facility.distance || '3.2';
  const doctors = facility.available_doctors || [];
  const beds = facility.available_beds || {};
  const totalBeds = Object.values(beds).reduce((a: any, b: any) => Number(a) + Number(b), 0);
  const medicines = facility.medicine_availability || [];

  return (
    <div className="bg-white rounded-2xl border border-[#E8E2D8] shadow-warm-sm hover:shadow-warm-md hover:border-[#D6CBB8] transition flex flex-col justify-between overflow-hidden">
      <div className="p-6 space-y-4">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <span className="text-[11px] font-bold bg-[#F4EFE6] text-[#7A5438] px-2.5 py-0.5 rounded-lg uppercase tracking-wider">
              {type}
            </span>
            <h3 className="text-xl font-serif font-bold text-[#2B1810] mt-1.5">{name}</h3>
            <p className="text-xs text-[#7A7265] line-clamp-1">{fac.address}</p>
          </div>
          <div className="flex items-center text-xs font-bold text-[#4A2E1B] bg-[#FAF7F2] border border-[#E8E2D8] px-2.5 py-1 rounded-xl">
            <MapPin size={13} className="mr-1 text-[#C86D51]"/>
            {distance} km
          </div>
        </div>

        {/* Live Metrics Grid */}
        <div className="grid grid-cols-3 gap-2.5 py-2">
          {/* Doctor Metric */}
          <div className="bg-[#FAF7F2] p-3 rounded-xl border border-[#EDE7DC] text-center space-y-1">
            <div className="flex justify-center text-[#4A2E1B]">
              <UserCheck className="w-4 h-4" />
            </div>
            <div className="text-xs font-bold text-[#2B1810]">
              {doctors.length > 0 ? `${doctors.length} On Duty` : 'Available'}
            </div>
            <div className="text-[10px] text-[#7A7265]">Clinicians</div>
          </div>

          {/* Bed Metric */}
          <div className="bg-[#FAF7F2] p-3 rounded-xl border border-[#EDE7DC] text-center space-y-1">
            <div className="flex justify-center text-[#4A2E1B]">
              <Bed className="w-4 h-4" />
            </div>
            <div className="text-xs font-bold text-[#2B1810]">
              {Number(totalBeds) > 0 ? `${totalBeds} Beds` : 'Open'}
            </div>
            <div className="text-[10px] text-[#7A7265]">Capacity</div>
          </div>

          {/* Medicine Metric */}
          <div className="bg-[#FAF7F2] p-3 rounded-xl border border-[#EDE7DC] text-center space-y-1">
            <div className="flex justify-center text-[#4A2E1B]">
              <Pill className="w-4 h-4" />
            </div>
            <div className="text-xs font-bold text-[#2B1810]">
              {medicines.length > 0 ? `${medicines.length} Types` : 'In Stock'}
            </div>
            <div className="text-[10px] text-[#7A7265]">Medicines</div>
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="p-4 bg-[#FAF7F2] border-t border-[#EDE7DC] flex justify-end">
        <button 
          onClick={onBook}
          className="w-full bg-[#4A2E1B] hover:bg-[#382011] text-white py-3 rounded-xl font-medium text-xs shadow-warm-sm transition flex items-center justify-center gap-1.5 tracking-wide"
        >
          <span>{t('facility.bookHere')}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
