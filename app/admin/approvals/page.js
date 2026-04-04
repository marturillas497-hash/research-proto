// app/admin/approvals/page.js
'use client';

import { useState, useEffect } from 'react';

export default function AdminApprovals() {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadPending = async () => {
    const res = await fetch('/api/admin/approvals');
    const data = await res.json();
    if (res.ok) setPending(data);
    setLoading(false);
  };

  useEffect(() => { loadPending(); }, []);

  const handleAction = async (id, status) => {
    const res = await fetch('/api/admin/approvals', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status })
    });
    
    if (res.ok) {
      loadPending(); // Refresh the list after action
    } else {
      alert("Failed to update status");
    }
  };

  if (loading) return <div className="p-10 text-center">Loading pending requests...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-blue-900 mb-6">Faculty Approvals</h1>
      <div className="space-y-4">
        {pending.map(adviser => (
          <div key={adviser.id} className="bg-white p-6 rounded-xl shadow-sm border flex justify-between items-center">
            <div>
              <p className="font-bold text-lg text-gray-900">{adviser.full_name}</p>
              <p className="text-sm text-gray-500">{adviser.email}</p>
              <p className="text-xs font-bold text-blue-600 mt-1 uppercase">
                Dept: {adviser.departments?.code || 'N/A'}
              </p>
            </div>
            <div className="flex space-x-3">
              <button 
                onClick={() => handleAction(adviser.id, 'active')}
                className="bg-green-600 text-white px-5 py-2 rounded-lg hover:bg-green-700 font-bold transition"
              >
                Approve
              </button>
              <button 
                onClick={() => handleAction(adviser.id, 'rejected')}
                className="bg-red-50 text-red-600 px-5 py-2 rounded-lg hover:bg-red-100 font-bold transition"
              >
                Reject
              </button>
            </div>
          </div>
        ))}
        {pending.length === 0 && (
          <div className="text-center py-20 bg-gray-50 rounded-xl border-2 border-dashed">
            <p className="text-gray-400">No pending adviser applications.</p>
          </div>
        )}
      </div>
    </div>
  );
}