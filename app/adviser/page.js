// app/adviser/page.js
import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/api-auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function AdviserDashboard() {
  const { user } = await requireAuth();
  const supabase = await createClient();

  // 1. Gatekeeper: Ensure only research_advisers can enter
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name, status, departments(name, code)')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'research_adviser') redirect('/dashboard');
  
  // 2. Account Approval Check
  if (profile?.status === 'pending') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-6">
        <div className="bg-white border-8 border-black p-12 shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] text-center max-w-lg">
          <h1 className="text-4xl font-black uppercase mb-4 italic">Access Restricted</h1>
          <p className="font-bold text-slate-600 uppercase tracking-tight mb-6">
            Your Faculty account is currently in the "Pending" state. Please wait for an administrator to verify your credentials.
          </p>
          <div className="h-2 bg-black w-full" />
        </div>
      </div>
    );
  }

  // 3. Fetch Reports assigned to THIS adviser
  const { data: reports } = await supabase
    .from('similarity_reports')
    .select('*, profiles(full_name, year_level, section)')
    .eq('adviser_id', user.id)
    .order('created_at', { ascending: false });

  const stats = {
    pending: reports?.filter(r => r.status === 'pending').length || 0,
    approved: reports?.filter(r => r.status === 'approved').length || 0,
    revision: reports?.filter(r => r.status === 'revision').length || 0,
  };

  return (
    <div className="max-w-7xl mx-auto p-6 sm:p-10 font-sans">
      <div className="flex justify-between items-end mb-12 border-b-8 border-black pb-8">
        <div>
          <h1 className="text-7xl font-black uppercase italic tracking-tighter leading-none">
            Faculty Portal
          </h1>
          <p className="font-black text-xl text-[#003366] uppercase mt-2">
            Adviser: {profile.full_name} <span className="text-slate-300 ml-2">[{profile.departments?.code}]</span>
          </p>
        </div>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        <div className="bg-[#FFCC00] border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <p className="font-black uppercase text-xs mb-1">Awaiting Review</p>
          <p className="text-6xl font-black italic">{stats.pending}</p>
        </div>
        <div className="bg-green-400 border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <p className="font-black uppercase text-xs mb-1">Approved Proposals</p>
          <p className="text-6xl font-black italic">{stats.approved}</p>
        </div>
        <div className="bg-orange-500 border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <p className="font-black uppercase text-xs mb-1">Needs Revision</p>
          <p className="text-6xl font-black italic">{stats.revision}</p>
        </div>
      </div>

      {/* Main Queue */}
      <div className="bg-white border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
        <div className="bg-black text-white p-4 font-black uppercase tracking-widest text-sm italic">
          Active Submission Queue
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-4 border-black bg-slate-50">
                <th className="p-6 font-black uppercase text-xs">Student Info</th>
                <th className="p-6 font-black uppercase text-xs">Proposed Research Title</th>
                <th className="p-6 font-black uppercase text-xs">Risk</th>
                <th className="p-6 font-black uppercase text-xs">Status</th>
                <th className="p-6 font-black uppercase text-xs text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-black">
              {reports?.map((item) => (
                <tr key={item.id} className="hover:bg-yellow-50 transition-colors">
                  <td className="p-6">
                    <p className="font-black uppercase text-sm">{item.profiles?.full_name}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                      {item.profiles?.year_level} - {item.profiles?.section}
                    </p>
                  </td>
                  <td className="p-6">
                    <p className="font-bold text-[#003366] uppercase leading-tight line-clamp-2 max-w-md">
                      {item.input_title}
                    </p>
                    <p className="text-[9px] font-black text-slate-400 mt-1 uppercase italic">
                      Submitted: {new Date(item.created_at).toLocaleDateString()}
                    </p>
                  </td>
                  <td className="p-6">
                    <div className={`inline-block px-3 py-1 border-2 border-black font-black text-[10px] uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
                      item.risk_level === 'RED' ? 'bg-red-500 text-white' : 
                      item.risk_level === 'ORANGE' ? 'bg-orange-500' :
                      item.risk_level === 'YELLOW' ? 'bg-yellow-300' : 'bg-green-400'
                    }`}>
                      {item.risk_level} {Math.round(item.similarity_score * 100)}%
                    </div>
                  </td>
                  <td className="p-6">
                    <span className="font-black text-[10px] uppercase border-b-2 border-black pb-0.5">
                      {item.status}
                    </span>
                  </td>
                  <td className="p-6 text-right">
                    <Link 
                      href={`/adviser/report/${item.id}`} 
                      className="bg-black text-white px-4 py-2 font-black uppercase text-[10px] hover:bg-[#003366] transition-all"
                    >
                      Open Dossier →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {(!reports || reports.length === 0) && (
            <div className="p-20 text-center italic font-black text-slate-300 uppercase text-3xl">
              Zero Requests Found
            </div>
          )}
        </div>
      </div>
    </div>
  );
}