import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Users, Plus, UserCheck, Phone, HeartHandshake } from 'lucide-react';
import toast from 'react-hot-toast';

export default function FamilyLinkPage() {
  const { t: _t } = useTranslation();
  const [members, setMembers] = useState([
    { id: '1', name: 'Ramesh Sharma (Father)', age: 68, relation: 'Parent', phone: '9876500001', recordsCount: 4 },
    { id: '2', name: 'Kavita Sharma (Mother)', age: 62, relation: 'Parent', phone: '9876500002', recordsCount: 6 },
  ]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newRelation, setNewRelation] = useState('');
  const [newPhone, setNewPhone] = useState('');

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setMembers([
      ...members,
      {
        id: Date.now().toString(),
        name: newName,
        age: 30,
        relation: newRelation || 'Dependent',
        phone: newPhone || '9876500099',
        recordsCount: 0
      }
    ]);
    setShowAddModal(false);
    setNewName('');
    setNewRelation('');
    setNewPhone('');
    toast.success('Family member linked successfully');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-7 rounded-2xl border border-[#E8E2D8] shadow-warm-sm">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#F4EFE6] text-[#7A5438] text-[11px] font-bold tracking-wider uppercase mb-1.5">
            <HeartHandshake className="w-3.5 h-3.5 text-[#C86D51]" />
            <span>Caregiver Proxy Support</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#2B1810]">
            Linked Family Members
          </h1>
          <p className="text-xs sm:text-sm text-[#7A7265] mt-0.5">
            Manage appointments, tokens, and records for dependents or elderly relatives
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 bg-[#4A2E1B] hover:bg-[#382011] text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-warm-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add Family Member</span>
        </button>
      </div>

      {/* Family Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {members.map((m) => (
          <div key={m.id} className="bg-white p-6 rounded-2xl border border-[#E8E2D8] shadow-warm-sm space-y-4">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#FAF7F2] border border-[#E8E2D8] text-[#4A2E1B] flex items-center justify-center font-bold">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-[#2B1810] text-base">{m.name}</h3>
                  <span className="text-[11px] text-[#8C5D3E] font-semibold">{m.relation} • {m.age} yrs</span>
                </div>
              </div>
              <span className="text-xs bg-[#EBF5EC] text-[#2E7D32] px-2 py-0.5 rounded font-medium">
                Active
              </span>
            </div>

            <div className="text-xs text-[#6B6358] space-y-1">
              <div className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-[#8C8275]" />
                <span>{m.phone}</span>
              </div>
              <div className="text-[11px] text-[#7A7265]">
                {m.recordsCount} Medical Records Available
              </div>
            </div>

            <div className="pt-3 border-t border-[#F0EAE1] flex justify-between items-center text-xs">
              <button 
                onClick={() => toast.success(`Switched proxy to ${m.name}`)}
                className="text-[#4A2E1B] hover:text-[#382011] font-bold"
              >
                Book for Them →
              </button>
              <button 
                onClick={() => toast.success(`Viewing records for ${m.name}`)}
                className="text-[#7A7265] hover:underline"
              >
                View History
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white p-7 rounded-2xl border border-[#E8E2D8] shadow-warm-lg max-w-md w-full space-y-4">
            <h2 className="text-xl font-serif font-bold text-[#2B1810]">Link New Family Member</h2>
            <form onSubmit={handleAddMember} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-[#5E574E] mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Sharma"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full p-2.5 border border-[#D8D1C5] rounded-xl outline-none focus:border-[#4A2E1B]"
                />
              </div>
              <div>
                <label className="block font-semibold text-[#5E574E] mb-1">Relationship</label>
                <input
                  type="text"
                  placeholder="e.g. Parent, Child, Spouse"
                  value={newRelation}
                  onChange={(e) => setNewRelation(e.target.value)}
                  className="w-full p-2.5 border border-[#D8D1C5] rounded-xl outline-none focus:border-[#4A2E1B]"
                />
              </div>
              <div>
                <label className="block font-semibold text-[#5E574E] mb-1">Phone Number</label>
                <input
                  type="text"
                  placeholder="e.g. 9876543210"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="w-full p-2.5 border border-[#D8D1C5] rounded-xl outline-none focus:border-[#4A2E1B]"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="w-1/2 p-2.5 border rounded-xl text-[#6B6358]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 p-2.5 bg-[#4A2E1B] text-white rounded-xl font-semibold"
                >
                  Save Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
