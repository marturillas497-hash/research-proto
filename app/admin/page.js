// app/admin/page.js
import { requireAdmin } from '@/lib/api-auth';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function AdminDashboardHome() {
  await requireAdmin();
  const supabase = await createClient();

  const { count: studentCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'student');

  const { count: libraryCount } = await supabase
    .from('abstracts')
    .select('*', { count: 'exact', head: true });

  const { count: pendingCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'research_adviser')
    .eq('status', 'pending');

  const { count: reportCount } = await supabase
    .from('similarity_reports')
    .select('*', { count: 'exact', head: true });

  return (
    <div className="max-w-7xl mx-auto p-6 sm:p-10 min-h-screen bg-[#F0F0F0]">

      {/* HEADER */}
      <div className="mb-12">
        <span className="bg-[#FFCC00] border-2 border-black px-3 py-1 text-[10px] font-black uppercase mb-4 inline-block shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          System Administrator
        </span>
        <h1 className="text-6xl font-black text-[#003366] tracking-tighter uppercase leading-none italic">
          Admin Control Center
        </h1>
        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-2">
          Manage institutional research data and faculty access
        </p>
      </div>

      {/* STATS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        <div className="bg-white p-8 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Students</p>
          <p className="text-6xl font-black text-[#003366] italic">{studentCount || 0}</p>
        </div>
        <div className="bg-[#003366] p-8 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-[10px] font-black text-[#FFCC00] uppercase tracking-widest mb-2">Library Abstracts</p>
          <p className="text-6xl font-black text-white italic">{libraryCount || 0}</p>
        </div>
        <div className={`p-8 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] ${pendingCount > 0 ? 'bg-[#FFCC00]' : 'bg-white'}`}>
          <p className="text-[10px] font-black text-black uppercase tracking-widest mb-2">Pending Advisers</p>
          <p className="text-6xl font-black text-black italic">{pendingCount || 0}</p>
        </div>
        <div className="bg-white p-8 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Reports</p>
          <p className="text-6xl font-black text-[#003366] italic">{reportCount || 0}</p>
        </div>
      </div>

      {/* QUICK ACTIONS + SYSTEM STATUS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

        {/* QUICK ACTIONS */}
        <div className="bg-white border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
          <div className="bg-black p-5">
            <h2 className="text-[#FFCC00] font-black uppercase tracking-[0.2em] text-sm">Quick Actions</h2>
          </div>
          <div className="p-8 space-y-4">
            <Link href="/admin/archive"
              className="flex justify-between items-center w-full bg-[#FFCC00] border-4 border-black p-5 font-black uppercase text-sm shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none transition-all">
              <span>Add Abstract to Library</span>
              <span>→</span>
            </Link>
            <Link href="/admin/approvals"
              className={`flex justify-between items-center w-full border-4 border-black p-5 font-black uppercase text-sm shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none transition-all ${pendingCount > 0 ? 'bg-red-500 text-white' : 'bg-white text-black'}`}>
              <span>Review Faculty Applications {pendingCount > 0 ? `(${pendingCount})` : ''}</span>
              <span>→</span>
            </Link>
            <Link href="/admin/advisers"
              className="flex justify-between items-center w-full bg-white border-4 border-black p-5 font-black uppercase text-sm shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none transition-all">
              <span>Manage Advisers</span>
              <span>→</span>
            </Link>
            <Link href="/library"
              className="flex justify-between items-center w-full bg-[#003366] text-white border-4 border-black p-5 font-black uppercase text-sm shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none transition-all">
              <span>View Research Library</span>
              <span>→</span>
            </Link>
          </div>
        </div>

        {/* SYSTEM STATUS */}
        <div className="bg-white border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
          <div className="bg-black p-5">
            <h2 className="text-[#FFCC00] font-black uppercase tracking-[0.2em] text-sm">System Status</h2>
          </div>
          <div className="p-8 space-y-4">
            {[
              { label: 'Vector Engine', value: 'MiniLM-L6 (384-dim)', status: 'ONLINE' },
              { label: 'Reasoning Engine', value: 'Gemini 1.5 Flash', status: 'ONLINE' },
              { label: 'Database', value: 'Supabase + pgvector', status: 'ONLINE' },
              { label: 'Embedding Mode', value: 'Local / Client-side', status: 'ACTIVE' },
            ].map((item, i) => (
              <div key={i} className="flex justify-between items-center border-4 border-black p-4 bg-slate-50">
                <div>
                  <p className="font-black uppercase text-xs text-[#003366]">{item.label}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">{item.value}</p>
                </div>
                <span className="bg-[#00FF66] border-2 border-black px-3 py-1 font-black text-[10px] uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}