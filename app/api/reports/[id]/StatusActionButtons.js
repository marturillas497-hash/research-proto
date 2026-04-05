// app/adviser/report/[id]/StatusActionButtons.js
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function StatusActionButtons({ reportId, currentStatus, initialRemarks }) {
  const [remarks, setRemarks] = useState(initialRemarks || "");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const updateStatus = async (newStatus) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports/${reportId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, adviser_remarks: remarks }),
      });

      if (!res.ok) throw new Error("Failed to update");
      
      router.refresh();
      alert(`Status updated to ${newStatus.toUpperCase()}`);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-[10px] font-black uppercase mb-2">Adviser Remarks (Optional)</label>
        <textarea 
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          className="w-full border-4 border-black p-3 font-bold text-sm focus:bg-yellow-50 outline-none h-32"
          placeholder="Enter feedback for the student..."
        />
      </div>

      <div className="grid grid-cols-1 gap-3">
        <button
          onClick={() => updateStatus('approved')}
          disabled={loading}
          className="bg-green-400 border-4 border-black py-3 font-black uppercase text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50"
        >
          {loading ? "PROCESSING..." : "✅ Approve Proposal"}
        </button>

        <button
          onClick={() => updateStatus('revision')}
          disabled={loading}
          className="bg-orange-500 border-4 border-black py-3 font-black uppercase text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50"
        >
          {loading ? "PROCESSING..." : "⚠️ Needs Revision"}
        </button>
      </div>

      <div className="pt-4 border-t-2 border-slate-100">
        <p className="text-[10px] font-black text-slate-400 uppercase">Current Status</p>
        <p className="font-black uppercase text-[#003366] italic">{currentStatus}</p>
      </div>
    </div>
  );
}