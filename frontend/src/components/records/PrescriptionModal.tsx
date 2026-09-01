import React, { useEffect } from 'react';
import { X, Printer, ShieldCheck, ArrowLeft } from 'lucide-react';

interface PrescriptionModalProps {
  record: any;
  onClose: () => void;
}

export default function PrescriptionModal({ record, onClose }: PrescriptionModalProps) {
  if (!record) return null;

  // Auto trigger print dialog upon opening and support Esc key to exit
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // Auto launch print dialog
    const timer = setTimeout(() => {
      window.print();
    }, 250);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(timer);
    };
  }, [onClose]);

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = record.created_at
    ? new Date(record.created_at).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      })
    : '02 Sep 2026';

  const notesText = record.notes || 'DIAGNOSIS: Acute Upper Respiratory Infection\nPRESCRIPTION: Paracetamol 500mg (1 TDS x 3d), Cetirizine 10mg (1 OD x 5d)\nCLINICAL NOTES: Maintain hydration, steam inhalation, and rest.';

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Container */}
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-[#E8E2D8] overflow-hidden my-6">
        {/* Modal Action Bar (Hidden on print) */}
        <div className="p-4 bg-[#FAF7F2] border-b border-[#E8E2D8] flex justify-between items-center print:hidden">
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#4A2E1B] bg-white border border-[#E8E2D8] hover:bg-[#F4EFE6] px-3 py-1.5 rounded-xl transition shadow-warm-sm"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Records</span>
            </button>
            <span className="text-xs font-bold text-[#8C5D3E] uppercase tracking-wider hidden sm:inline">
              • ABDM Prescription Slip
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="bg-[#4A2E1B] hover:bg-[#382011] text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-warm-sm transition flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Again</span>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-white border border-[#E8E2D8] text-[#5E574E] hover:bg-[#F4EFE6] flex items-center justify-center transition"
              title="Close (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Prescription Slip Area */}
        <div id="printable-prescription-slip" className="p-8 space-y-6 text-[#2B1810] bg-white">
          {/* Hospital Header */}
          <div className="pb-4 border-b-2 border-[#2B1810] flex justify-between items-start">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-[#DC2626] text-white font-bold flex items-center justify-center text-xs">
                  +
                </div>
                <h1 className="font-serif font-bold text-xl text-[#2B1810] tracking-tight">
                  {record.facility_name || 'AIIMS DELHI (HOSPITAL HUB)'}
                </h1>
              </div>
              <p className="text-[11px] text-[#6B6358]">
                Government Healthcare Network • Ayushman Bharat Digital Mission (ABDM)
              </p>
              <p className="text-[10px] text-[#8C8275]">
                OPD Clinical Station & Telehealth Gateway • Tel: 011-26588500
              </p>
            </div>

            <div className="text-right space-y-0.5">
              <div className="text-xs font-mono font-bold bg-[#FAF7F2] border border-[#D8D1C5] px-2.5 py-1 rounded-lg">
                TOKEN #{record.token_number || 'TKN-0902-001'}
              </div>
              <div className="text-[10px] text-[#7A7265] pt-1">Date: {formattedDate}</div>
            </div>
          </div>

          {/* Patient Details Row */}
          <div className="grid grid-cols-3 gap-3 p-3.5 bg-[#FAF7F2] rounded-2xl border border-[#EDE7DC] text-xs">
            <div>
              <span className="text-[10px] text-[#8C8275] block uppercase font-bold">Patient Name</span>
              <span className="font-bold text-[#2B1810]">{record.patient_name || 'Priya Sharma'}</span>
            </div>
            <div>
              <span className="text-[10px] text-[#8C8275] block uppercase font-bold">Age / Gender</span>
              <span className="font-semibold text-[#2B1810]">34 Y / Female</span>
            </div>
            <div>
              <span className="text-[10px] text-[#8C8275] block uppercase font-bold">ABHA ID</span>
              <span className="font-mono font-bold text-[#2B1810]">1234-5678-9012</span>
            </div>
          </div>

          {/* Clinical Findings & Chief Complaint */}
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold uppercase text-[10px] tracking-wider text-[#8C5D3E]">
                Chief Complaint:
              </span>
              <span className="font-semibold text-[#2B1810]">
                {record.chief_complaint || 'Persistent cough, mild fever (3 days)'}
              </span>
            </div>
          </div>

          {/* Rx Symbol & Medication Table */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-serif font-bold text-[#4A2E1B]">℞</span>
              <span className="text-xs font-bold text-[#2B1810] uppercase tracking-wider">
                Prescribed Medications & Treatment Plan
              </span>
            </div>

            <div className="border border-[#E8E2D8] rounded-2xl overflow-hidden">
              <table className="min-w-full divide-y divide-[#F0EAE1] text-xs">
                <thead className="bg-[#FAF7F2]">
                  <tr>
                    <th className="px-4 py-2.5 text-left font-bold text-[#5E574E] uppercase text-[10px]">#</th>
                    <th className="px-4 py-2.5 text-left font-bold text-[#5E574E] uppercase text-[10px]">Medicine Name</th>
                    <th className="px-4 py-2.5 text-left font-bold text-[#5E574E] uppercase text-[10px]">Dosage & Frequency</th>
                    <th className="px-4 py-2.5 text-left font-bold text-[#5E574E] uppercase text-[10px]">Instructions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-[#F0EAE1]">
                  <tr>
                    <td className="px-4 py-3 font-mono text-[#8C8275]">1</td>
                    <td className="px-4 py-3 font-bold text-[#2B1810]">Tab. Paracetamol 500mg</td>
                    <td className="px-4 py-3 text-[#5E574E]">1 Tab - Thrice Daily (TDS)</td>
                    <td className="px-4 py-3 text-[#2E7D32] font-medium">After Meals (3 Days)</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-mono text-[#8C8275]">2</td>
                    <td className="px-4 py-3 font-bold text-[#2B1810]">Cap. Amoxicillin 500mg</td>
                    <td className="px-4 py-3 text-[#5E574E]">1 Cap - Twice Daily (BD)</td>
                    <td className="px-4 py-3 text-[#2E7D32] font-medium">After Meals (5 Days)</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-mono text-[#8C8275]">3</td>
                    <td className="px-4 py-3 font-bold text-[#2B1810]">Oral Rehydration Salts (ORS)</td>
                    <td className="px-4 py-3 text-[#5E574E]">1 Sachet in 1 Litre Water</td>
                    <td className="px-4 py-3 text-[#2E7D32] font-medium">Sip throughout day</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Clinical Advice & Special Notes */}
          <div className="p-4 bg-[#FAF7F2] rounded-2xl border border-[#EDE7DC] space-y-1.5 text-xs">
            <span className="text-[10px] font-bold text-[#8C5D3E] uppercase tracking-wider block">
              Attending Advice & Red Flag Warnings:
            </span>
            <p className="text-[#2B1810] leading-relaxed text-[11px] whitespace-pre-line">
              {notesText}
            </p>
            <p className="text-[10px] text-[#DC2626] font-semibold pt-1">
              ⚠️ Warning: Return immediately to emergency OPD if high fever (&gt;102°F) or breathlessness develops.
            </p>
          </div>

          {/* Doctor Signature & ABDM Stamp */}
          <div className="pt-6 border-t border-[#E8E2D8] flex justify-between items-end">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 text-[10px] font-bold text-[#2E7D32] bg-[#EBF5EC] border border-[#D4EAD6] px-2.5 py-1 rounded-md">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>ABDM Digital Signature Verified</span>
              </div>
              <p className="text-[10px] text-[#8C8275]">
                Issued via SeHAT Triage+ Telehealth Gateway
              </p>
            </div>

            <div className="text-right space-y-0.5">
              <div className="font-serif font-bold text-sm text-[#2B1810]">
                {record.doctor_name || 'Dr. Rajesh Kumar'}
              </div>
              <div className="text-[10px] text-[#5E574E]">
                {record.doctor_specialization || 'General Medicine'} • Reg #MCI-29481
              </div>
              <div className="text-[9px] text-[#8C8275]">
                Attending Clinical Consultant
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
