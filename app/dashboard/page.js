// app/dashboard/page.js
import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/api-auth';
import { getFullProfile } from '@/lib/supabase/queries';
import Link from 'next/link';
import EditAdviserTrigger from '@/components/EditAdviserTrigger';

export default async function DashboardPage() {
  const { user } = await requireAuth();
  const supabase = await createClient();
  const profile = await getFullProfile(supabase, user.id);

  // --- ACCOUNT PENDING VIEW ---
  if (profile?.role === 'research_adviser' && profile?.status === 'pending') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center p-6 bg-[#F0F0F0]">
        <div className="bg-white p-12 border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] max-w-lg">
          <h1 className="text-4xl font-black text-[#003366] uppercase mb-4 italic">Account Pending</h1>
          <p className="text-black font-bold uppercase tracking-tight leading-tight">
            Your Adviser account is currently under review. 
            Access will be granted once an administrator verifies your credentials.
          </p>
          <div className="mt-8 pt-6 border-t-4 border-black">
            <Link href="/" className="text-xs font-black uppercase underline hover:bg-[#FFCC00]">Return to Home</Link>
          </div>
        </div>
      </div>
    );
  }

  // --- DATA FETCHING LOGIC ---
  let reports = [];
  if (profile?.role === 'student') {
    const { data } = await supabase
      .from('similarity_reports')
      .select('*')
      .eq('student_id', user.id)
      .order('created_at', { ascending: false });
    reports = data || [];
  } else if (profile?.role === 'research_adviser') {
    const { data: students } = await supabase
      .from('profiles')
      .select('id')
      .eq('adviser_id', user.id);
    const studentIds = (students || []).map(s => s.id);
    if (studentIds.length > 0) {
      const { data } = await supabase
        .from('similarity_reports')
        .select('*, profiles(full_name, student_id)')
        .in('student_id', studentIds)
        .order('created_at', { ascending: false });
      reports = data || [];
    }
  } else if (profile?.role === 'admin') {
    const { data } = await supabase
      .from('similarity_reports')
      .select('*, profiles(full_name, student_id)')
      .order('created_at', { ascending: false });
    reports = data || [];
  }

  return (
    <div className="max-w-7xl mx-auto p-6 sm:p-10 min-h-screen bg-[#F0F0F0]">
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
        <div>
          <span className="bg-[#FFCC00] border-2 border-black px-3 py-1 text-[10px] font-black uppercase mb-4 inline-block shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            Verified {profile?.role}
          </span>
          <h1 className="text-6xl font-black text-[#003366] tracking-tighter uppercase leading-none">
            {profile?.role === 'research_adviser' ? 'Adviser Hub' : 
             profile?.role === 'admin' ? 'System Admin' : 'Student Hub'}
          </h1>
          <div className="flex flex-wrap items-center gap-4 mt-4 text-black font-black uppercase text-xs">
            <span className="bg-white border-2 border-black px-2">{profile?.full_name}</span>
            <span className="text-slate-400">/</span>
            <span>{profile?.department_code}</span>
            <span className="text-slate-400">/</span>
            <span>{profile?.student_id || 'FACULTY_ID'}</span>
            {profile?.role === 'student' && <EditAdviserTrigger profile={profile} />}
          </div>
        </div>

        <div className="flex gap-4">
          {profile?.role === 'student' && (
            <Link href="/submit"
              className="bg-[#FFCC00] text-black px-8 py-4 border-4 border-black font-black text-sm uppercase tracking-widest shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all">
              + New Similarity Check
            </Link>
          )}
          {profile?.role === 'admin' && (
            <Link href="/library"
              className="bg-[#003366] text-white px-8 py-4 border-4 border-black font-black text-sm uppercase tracking-widest shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all">
              Manage Library →
            </Link>
          )}
        </div>
      </div>

      {/* --- STATS GRID --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        <div className="bg-white p-8 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-xs font-black text-slate-400 uppercase mb-2">Total Reports</p>
          <p className="text-6xl font-black text-[#003366]">{reports.length}</p>
        </div>
        <div className="bg-[#003366] p-8 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-white">
          <p className="text-xs font-black text-[#FFCC00] uppercase mb-2">Department</p>
          <p className="text-2xl font-black uppercase leading-tight">{profile?.department_name || 'N/A'}</p>
        </div>
        <div className="bg-white p-8 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-xs font-black text-slate-400 uppercase mb-2">System Status</p>
          <p className="text-3xl font-black text-black uppercase flex items-center gap-3">
            <span className="w-4 h-4 bg-green-500 border-2 border-black" />
            {profile?.status}
          </p>
        </div>
      </div>

      {/* --- REPORTS TABLE --- */}
      <div className="bg-white border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
        <div className="bg-black p-4">
          <h2 className="text-[#FFCC00] font-black uppercase tracking-[0.2em] text-sm">
            Recent Activity Log
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-4 border-black bg-slate-50">
                <th className="p-5 font-black text-black text-xs uppercase">Date</th>
                {profile?.role !== 'student' && <th className="p-5 font-black text-black text-xs uppercase">Student</th>}
                <th className="p-5 font-black text-black text-xs uppercase">Research Title</th>
                <th className="p-5 font-black text-black text-xs uppercase text-center">Match Score</th>
                <th className="p-5 font-black text-black text-xs uppercase">Risk Level</th>
                <th className="p-5 font-black text-black text-xs uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-black">
              {reports.map((item) => (
                <tr key={item.id} className="hover:bg-[#FFCC00]/10 transition-colors">
                  <td className="p-5 text-xs font-bold text-black uppercase">
                    {new Date(item.created_at).toLocaleDateString()}
                  </td>
                  {profile?.role !== 'student' && (
                    <td className="p-5 text-xs font-black text-[#003366] uppercase">
                      {item.profiles?.full_name || '—'}
                    </td>
                  )}
                  <td className="p-5 font-bold text-black text-sm uppercase truncate max-w-[300px]">
                    {item.input_title}
                  </td>
                  <td className="p-5 text-center">
                    <span className="text-xl font-black text-[#003366]">
                      {/* Fix for NaN%: Check for existence and valid number */}
                      {typeof item.similarity_score === 'number' && !isNaN(item.similarity_score) 
                        ? Math.round(item.similarity_score * 100) 
                        : 0}%
                    </span>
                  </td>
                  <td className="p-5">
                    <span className={`px-4 py-1 border-2 border-black text-[10px] font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
                      item.risk_level === 'RED'    ? 'bg-red-500 text-white' :
                      item.risk_level === 'ORANGE' ? 'bg-orange-400 text-black' :
                      item.risk_level === 'YELLOW' ? 'bg-yellow-300 text-black' :
                                                     'bg-green-400 text-black'
                    }`}>
                      {item.risk_level}
                    </span>
                  </td>
                  <td className="p-5 text-right">
                    <Link href={`/dashboard/report/${item.id}`}
                      className="inline-block px-4 py-2 border-2 border-black bg-white font-black text-[10px] uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-black hover:text-white transition-all">
                      Open Report
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {reports.length === 0 && (
            <div className="p-20 text-center border-t-2 border-black">
              <p className="text-slate-400 font-black uppercase text-sm italic">No records found in database.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}