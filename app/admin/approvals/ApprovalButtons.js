// app/admin/approvals/ApprovalButtons.js
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ApprovalButtons({ adviserId }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const updateStatus = async (status) => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/approvals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adviserId, status }),
      });
      if (!res.ok) throw new Error('Failed to update');
      router.refresh();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-3 items-center">
      <button
        onClick={() => updateStatus('active')}
        disabled={loading}
        className="bg-green-400 border-4 border-black px-6 py-3 font-black uppercase text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all disabled:opacity-50"
      >
        ✅ Approve
      </button>
      <button
        onClick={() => updateStatus('rejected')}
        disabled={loading}
        className="bg-red-500 text-white border-4 border-black px-6 py-3 font-black uppercase text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all disabled:opacity-50"
      >
        ✕ Reject
      </button>
    </div>
  );
}