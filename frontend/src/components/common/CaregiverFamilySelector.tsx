import React, { useState, useEffect } from 'react';
import { Users, Plus, Check, HeartHandshake, X } from 'lucide-react';
import toast from 'react-hot-toast';

export interface FamilyMember {
  id: string;
  name: string;
  relation: string;
  age: number;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  abha_id?: string;
}

const DEFAULT_MEMBERS: FamilyMember[] = [
  { id: 'self', name: 'Priya Sharma', relation: 'Self (स्वयं)', age: 34, gender: 'FEMALE', abha_id: '1234-5678-9012' },
  { id: 'father', name: 'Ramesh Sharma', relation: 'Father (पिताजी)', age: 62, gender: 'MALE', abha_id: '9876-5432-1098' },
  { id: 'mother', name: 'Sita Devi', relation: 'Mother (माताजी)', age: 58, gender: 'FEMALE', abha_id: '4567-8901-2345' },
  { id: 'child', name: 'Aarav Sharma', relation: 'Son (पुत्र)', age: 6, gender: 'MALE', abha_id: '7890-1234-5678' },
];

interface CaregiverFamilySelectorProps {
  selectedMemberId?: string;
  onSelectMember?: (member: FamilyMember) => void;
}

export default function CaregiverFamilySelector({
  selectedMemberId = 'self',
  onSelectMember
}: CaregiverFamilySelectorProps) {
  const [members, setMembers] = useState<FamilyMember[]>(() => {
    const saved = localStorage.getItem('sehat_family_members');
    return saved ? JSON.parse(saved) : DEFAULT_MEMBERS;
  });

  const [activeId, setActiveId] = useState<string>(selectedMemberId);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newMember, setNewMember] = useState({
    name: '',
    relation: 'Parent',
    age: '',
    gender: 'MALE' as const,
    abha_id: ''
  });

  useEffect(() => {
    localStorage.setItem('sehat_family_members', JSON.stringify(members));
  }, [members]);

  const handleSelect = (member: FamilyMember) => {
    setActiveId(member.id);
    if (onSelectMember) {
      onSelectMember(member);
    }
    toast.success(`Switched active patient to ${member.name} (${member.relation})`);
  };

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMember.name.trim() || !newMember.age) {
      toast.error('Please enter name and age');
      return;
    }

    const created: FamilyMember = {
      id: `fam_${Date.now()}`,
      name: newMember.name.trim(),
      relation: newMember.relation,
      age: parseInt(newMember.age) || 30,
      gender: newMember.gender,
      abha_id: newMember.abha_id.trim() || `${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`
    };

    const updated = [...members, created];
    setMembers(updated);
    setIsAddModalOpen(false);
    setNewMember({ name: '', relation: 'Parent', age: '', gender: 'MALE', abha_id: '' });
    handleSelect(created);
    toast.success(`Family member ${created.name} added successfully!`);
  };

  return (
    <div className="bg-white p-5 sm:p-6 rounded-3xl border border-[#E8E2D8] shadow-warm-sm space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#F4EFE6] text-[#7A5438] flex items-center justify-center">
            <HeartHandshake className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-sm text-[#2B1810]">
              Caregiver & Family Support / परिवार व देखभालकर्ता
            </h3>
            <p className="text-[11px] text-[#7A7265]">
              Select who you are checking symptoms or booking for (ASHA / Family Proxy)
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#4A2E1B] bg-[#FAF7F2] border border-[#E8E2D8] hover:bg-[#F4EFE6] px-3 py-1.5 rounded-xl transition shadow-warm-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Member</span>
        </button>
      </div>

      {/* Member Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {members.map((m) => {
          const isSelected = m.id === activeId;
          return (
            <button
              key={m.id}
              onClick={() => handleSelect(m)}
              className={`p-3.5 rounded-2xl border text-left transition relative flex flex-col justify-between ${
                isSelected
                  ? 'bg-[#4A2E1B] text-white border-[#4A2E1B] shadow-warm-md'
                  : 'bg-[#FAF7F2] border-[#E8E2D8] text-[#2B1810] hover:bg-[#F4EFE6]'
              }`}
            >
              {isSelected && (
                <div className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full bg-white text-[#4A2E1B] flex items-center justify-center">
                  <Check className="w-2.5 h-2.5" />
                </div>
              )}
              <div className="space-y-0.5">
                <span className={`text-[10px] font-bold uppercase tracking-wider block ${
                  isSelected ? 'text-[#EDE7DC]' : 'text-[#8C5D3E]'
                }`}>
                  {m.relation}
                </span>
                <h4 className="font-serif font-bold text-xs truncate">{m.name}</h4>
              </div>

              <div className={`pt-2 mt-2 border-t text-[10px] flex justify-between items-center ${
                isSelected ? 'border-white/20 text-white/80' : 'border-[#EDE7DC] text-[#7A7265]'
              }`}>
                <span>{m.age} Y • {m.gender === 'MALE' ? 'Male' : 'Female'}</span>
                {m.abha_id && <span className="font-mono text-[9px]">ABDM ✓</span>}
              </div>
            </button>
          );
        })}
      </div>

      {/* Add Member Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 border border-[#E8E2D8] shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-[#F0EAE1]">
              <h3 className="font-serif font-bold text-base text-[#2B1810]">
                Add Family Member / Dependant
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="w-7 h-7 rounded-xl bg-[#FAF7F2] text-[#5E574E] hover:bg-[#F4EFE6] flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddMember} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-[#5E574E] uppercase mb-1">
                  Full Name <span className="text-[#DC2626]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={newMember.name}
                  onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                  className="w-full rounded-xl border border-[#D8D1C5] bg-[#FAF7F2] p-2.5 text-xs text-[#2B1810] focus:ring-1 focus:ring-[#4A2E1B] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#5E574E] uppercase mb-1">
                    Relationship
                  </label>
                  <select
                    value={newMember.relation}
                    onChange={(e) => setNewMember({ ...newMember, relation: e.target.value })}
                    className="w-full rounded-xl border border-[#D8D1C5] bg-[#FAF7F2] p-2.5 text-xs text-[#2B1810] outline-none cursor-pointer"
                  >
                    <option value="Father">Father (पिता)</option>
                    <option value="Mother">Mother (माता)</option>
                    <option value="Spouse">Spouse (पति/पत्नी)</option>
                    <option value="Child">Child (बच्चा)</option>
                    <option value="Grandparent">Grandparent (दादा/दादी)</option>
                    <option value="Community Member">Community (ग्रामीण)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#5E574E] uppercase mb-1">
                    Age <span className="text-[#DC2626]">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    max="120"
                    placeholder="e.g. 58"
                    value={newMember.age}
                    onChange={(e) => setNewMember({ ...newMember, age: e.target.value })}
                    className="w-full rounded-xl border border-[#D8D1C5] bg-[#FAF7F2] p-2.5 text-xs text-[#2B1810] focus:ring-1 focus:ring-[#4A2E1B] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#5E574E] uppercase mb-1">
                    Gender
                  </label>
                  <select
                    value={newMember.gender}
                    onChange={(e) => setNewMember({ ...newMember, gender: e.target.value as any })}
                    className="w-full rounded-xl border border-[#D8D1C5] bg-[#FAF7F2] p-2.5 text-xs text-[#2B1810] outline-none cursor-pointer"
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#5E574E] uppercase mb-1">
                    ABHA ID (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="1234-5678-9012"
                    value={newMember.abha_id}
                    onChange={(e) => setNewMember({ ...newMember, abha_id: e.target.value })}
                    className="w-full rounded-xl border border-[#D8D1C5] bg-[#FAF7F2] p-2.5 text-xs text-[#2B1810] focus:ring-1 focus:ring-[#4A2E1B] outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#E8E2D8] text-xs font-semibold text-[#6B6358] hover:bg-[#FAF7F2]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#4A2E1B] hover:bg-[#382011] text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-warm-sm"
                >
                  Save & Select
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
