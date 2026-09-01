import { useState } from 'react';

export default function PatientQueuePage() {
  const [patients] = useState([
    { id: 1, name: 'John Doe', token: '001', time: '10:00 AM', urgency: 'urgent', complaint: 'Fever and cough', status: 'Waiting' },
    { id: 2, name: 'Jane Smith', token: '002', time: '10:15 AM', urgency: 'routine', complaint: 'Regular checkup', status: 'Waiting' }
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Patient Queue</h1>
      
      <div className="bg-white rounded-lg shadow-sm divide-y">
        {patients.map(p => (
          <div key={p.id} className="p-4 flex justify-between items-center hover:bg-gray-50">
            <div className="flex gap-4 items-center">
              <div className="text-2xl font-bold text-gray-400 w-16">#{p.token}</div>
              <div>
                <div className="font-semibold text-lg">{p.name} <span className="text-sm text-gray-500 font-normal">({p.time})</span></div>
                <div className="text-gray-600">{p.complaint}</div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${p.urgency === 'urgent' ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'}`}>
                {p.urgency}
              </span>
              <button className="bg-primary text-white px-4 py-2 rounded">Call</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
