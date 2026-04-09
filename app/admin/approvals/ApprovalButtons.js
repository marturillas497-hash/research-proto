// app/admin/approvals/ApprovalButtons.js
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ApprovalButtons({ adviserId }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const updateStatus = async (status) => {
    // Basic confirmation for rejections to prevent accidental clicks
    if (status === 'rejected' && !confirm('Are you sure you want to reject this faculty application?')) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/admin/approvals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adviserId, status }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'Failed to update status');
      }

      // Force Next.js to re-fetch the server-side data (the pending list)
      router.refresh();
      
    } catch (err) {
      console.error('Approval Action Error:', err);
      alert(`System Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-center">
      {/* APPROVE BUTTON */}
      <button
        onClick={() => updateStatus('active')}
        disabled={loading}
        className="w-full sm:w-auto bg-[#00FF66] border-4 border-black px-8 py-3 font-black uppercase text-xs tracking-widest shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed group flex items-center justify-center gap-2"
      >
        <span>{loading ? 'PROCESSING...' : 'Approve Faculty'}</span>
        {!loading && <span className="text-lg">✓</span>}
      </button>

      {/* REJECT BUTTON */}
      <button
        onClick={() => updateStatus('rejected')}
        disabled={loading}
        className="w-full sm:w-auto bg-white text-red-600 border-4 border-black px-8 py-3 font-black uppercase text-xs tracking-widest shadow-[6px_6px_0px_0px_rgba(220,38,38,1)] hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        <span>{loading ? '...' : 'Reject'}</span>
        {!loading && <span className="text-lg">✕</span>}
      </button>
    </div>
  );
}