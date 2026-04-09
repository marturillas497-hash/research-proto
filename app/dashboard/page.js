//app/dashboard/page.js
import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/api-auth';
import { getFullProfile } from '@/lib/supabase/queries';
import Link from 'next/link';

// Component Imports
import EditAdviserTrigger from '@/components/EditAdviserTrigger';
import AdminNavbar from '@/components/admin/Navbar';
import AdviserNavbar from '@/components/adviser/AdviserNavbar';
import StudentNavbar from '@/components/student/StudentNavbar';

export default async function DashboardPage() {
  const { user } = await requireAuth();
  const supabase = await createClient();
  const profile = await getFullProfile(supabase, user.id);

  // --- 1. ACCESS CONTROL: PENDING ADVISERS ---
  if (profile?.role === 'research_adviser' && profile?.status === 'pending') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center p-6 bg-[#F0F0F0]">
        <div className="bg-white p-12 border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] max-w-lg relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-[#FFCC00]"></div>
          <h1 className="text-5xl font-black text-[#003366] uppercase mb-6 italic tracking-tighter leading-none">Access Restricted</h1>
          <p className="text-black font-bold uppercase tracking-tight leading-tight text-sm border-l-4 border-black pl-4 py-2 text-left">
            Your Adviser credentials are currently undergoing neural verification. 
            Access to student dossiers will be granted once an administrator clears your status.
          </p>
          <div className="mt-10 pt-6 border-t-4 border-black flex justify-between items-center">
            <span className="text-[10px] font-black text-slate-400 uppercase font-mono">Status: PENDING_REVIEW</span>
            <Link href="/" className="bg-black text-white px-4 py-2 text-xs font-black uppercase shadow-[4px_4px_0px_0px_#FFCC00] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all">
              Exit Terminal
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // --- 2. DATA ORCHESTRATION ---
  let reports = [];
  try {
    if (profile?.role === 'student') {
      const { data } = await supabase
        .from('similarity_reports')
        .select('*')
        .eq('student_id', user.id)
        .order('created_at', { ascending: false });
      reports = data || [];
    } 
    else if (profile?.role === 'research_adviser') {
      const { data: students } = await supabase
        .from('student_metadata')
        .select('profile_id')
        .eq('adviser_id', user.id);

      const studentIds = (students || []).map(s => s.profile_id);
      if (studentIds.length > 0) {
        const { data } = await supabase
          .from('similarity_reports')
          .select('*, profiles!student_id (full_name, student_metadata!student_metadata_profile_id_fkey(id_number))')
          .in('student_id', studentIds)
          .order('created_at', { ascending: false });
        reports = data || [];
      }
    } 
    else if (profile?.role === 'admin') {
      const { data } = await supabase
        .from('similarity_reports')
        .select('*, profiles!student_id (full_name, student_metadata!student_metadata_profile_id_fkey(id_number))')
        .order('created_at', { ascending: false });
      reports = data || [];
    }
  } catch (err) {
    console.error("Dashboard Data Fetch Error:", err);
  }

  return (
    <div className="min-h-screen bg-[#F0F0F0] selection:bg-[#FFCC00]">
      
      {/* ROLE-SPECIFIC NAVIGATION */}
      {profile?.role === 'admin' && <AdminNavbar />}
      {profile?.role === 'research_adviser' && <AdviserNavbar profile={profile} />}
      {profile?.role === 'student' && <StudentNavbar profile={profile} />}

      <main className="max-w-7xl mx-auto p-6 sm:p-10">
        
        {/* HEADER SECTION */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-8 border-b-8 border-black pb-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="bg-[#FFCC00] border-2 border-black px-3 py-1 text-[10px] font-black uppercase shadow-[3px_3px_0px_0px_black]">
                Active Session: {profile?.role?.replace('_', ' ')}
              </span>
              <span className="text-[10px] font-black text-slate-400 font-mono uppercase tracking-widest animate-pulse">
                ● System_Online
              </span>
            </div>
            
            <h1 className="text-7xl md:text-8xl font-black text-[#003366] tracking-tighter uppercase leading-[0.8] italic">
              {profile?.role === 'research_adviser' ? 'Adviser_Hub' :
               profile?.role === 'admin' ? 'Admin_Root' : 'User_Panel'}
            </h1>

            <div className="flex flex-wrap items-center gap-3 text-black font-black uppercase text-[10px] tracking-tight">
              <div className="bg-white border-2 border-black px-3 py-1 flex items-center gap-2 shadow-[3px_3px_0px_0px_black]">
                <span className="w-2 h-2 bg-[#00FF66] border border-black"></span>
                {profile?.full_name}
              </div>
              <span className="text-slate-300">/</span>
              <span className="bg-white border-2 border-black px-3 py-1 shadow-[3px_3px_0px_0px_black]">
                DEPT: {profile?.department_code || 'GNR'}
              </span>
              {profile?.role === 'student' && (
                <>
                  <EditAdviserTrigger profile={profile} />
                  {profile?.adviser_name && (
                    <span className="bg-black text-[#FFCC00] border-2 border-black px-3 py-1 shadow-[3px_3px_0px_0px_black]">
                      ADVISER: {profile.adviser_name}
                    </span>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3 w-full md:w-auto">
            {profile?.role === 'student' && (
              <>
                <Link href="/submit" className="bg-[#FFCC00] text-black px-10 py-5 border-4 border-black font-black text-sm uppercase tracking-tighter shadow-[8px_8px_0px_0px_black] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all text-center">
                  + Run New Similarity Scan
                </Link>
                <Link href="/library" className="bg-white text-black px-10 py-5 border-4 border-black font-black text-sm uppercase tracking-tighter shadow-[8px_8px_0px_0px_black] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all text-center">
                  Browse Library →
                </Link>
              </>
            )}
            {profile?.role === 'admin' && (
              <Link href="/library" className="bg-[#003366] text-white px-10 py-5 border-4 border-black font-black text-sm uppercase tracking-tighter shadow-[8px_8px_0px_0px_black] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all text-center">
                Access Library Archive →
              </Link>
            )}
          </div>
        </header>

        {/* STATS GRID */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="bg-white p-8 border-4 border-black shadow-[10px_10px_0px_0px_black] relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-2 opacity-5 font-black text-6xl italic group-hover:scale-110 transition-transform">QTY</div>
            <p className="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-[0.2em]">Archived Reports</p>
            <p className="text-7xl font-black text-[#003366] italic leading-none">{reports.length}</p>
          </div>

          <div className="bg-[#003366] p-8 border-4 border-black shadow-[10px_10px_0px_0px_black] text-white relative">
            <p className="text-[10px] font-black text-[#FFCC00] uppercase mb-2 tracking-[0.2em]">Assignment Zone</p>
            <p className="text-3xl font-black uppercase leading-tight italic tracking-tighter pr-4">
              {profile?.department_name || 'General Access'}
            </p>
          </div>

          <div className="bg-white p-8 border-4 border-black shadow-[10px_10px_0px_0px_black] flex flex-col justify-between">
            <p className="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-[0.2em]">Identity Status</p>
            <div className="flex items-center justify-between">
              <p className="text-4xl font-black text-black uppercase italic tracking-tighter">{profile?.status}</p>
              <div className={`w-8 h-8 border-4 border-black ${profile?.status === 'active' ? 'bg-[#00FF66]' : 'bg-[#FFCC00]'} animate-pulse`}></div>
            </div>
          </div>
        </section>

        {/* ACTIVITY TABLE */}
        <section className="bg-white border-4 border-black shadow-[15px_15px_0px_0px_black] overflow-hidden">
          <div className="bg-black p-6 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-4 h-4 bg-[#FFCC00] rotate-45"></div>
              <h2 className="text-[#FFCC00] font-black uppercase tracking-[0.3em] text-xs">Recent_Dossier_Log</h2>
            </div>
            <span className="text-white/30 font-mono text-[9px] uppercase tracking-widest hidden sm:block">
              Database Security: Level_04 // Encrypted
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-4 border-black bg-[#f9f9f9]">
                  <th className="p-6 font-black text-black text-[10px] uppercase tracking-widest">Timestamp</th>
                  {profile?.role !== 'student' && <th className="p-6 font-black text-black text-[10px] uppercase tracking-widest">Researcher</th>}
                  <th className="p-6 font-black text-black text-[10px] uppercase tracking-widest">Project Title</th>
                  <th className="p-6 font-black text-black text-[10px] uppercase text-center tracking-widest">Score</th>
                  <th className="p-6 font-black text-black text-[10px] uppercase tracking-widest">Risk</th>
                  <th className="p-6 font-black text-black text-[10px] uppercase text-right tracking-widest">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y-4 divide-black">
                {reports.map((item) => (
                  <tr key={item.id} className="hover:bg-[#FFCC00]/10 transition-colors group">
                    <td className="p-6 text-[10px] font-black text-slate-500 uppercase font-mono">
                      {new Date(item.created_at).toLocaleDateString()}
                    </td>
                    {profile?.role !== 'student' && (
                      <td className="p-6 text-xs font-black text-[#003366] uppercase">
                        {item.profiles?.full_name || 'ANONYMOUS'}
                      </td>
                    )}
                    <td className="p-6">
                      <p className="font-black text-black text-sm uppercase leading-tight group-hover:italic group-hover:translate-x-1 transition-all">
                        {item.input_title}
                      </p>
                    </td>
                    <td className="p-6 text-center">
                      <span className="text-3xl font-black italic text-[#003366] tracking-tighter">
                        {typeof item.similarity_score === 'number' ? Math.round(item.similarity_score * 100) : 0}%
                      </span>
                    </td>
                    <td className="p-6">
                      <span className={`px-4 py-2 border-2 border-black text-[9px] font-black shadow-[4px_4px_0px_0px_black] inline-block ${
                        item.risk_level === 'RED' ? 'bg-[#FF3333] text-white' :
                        item.risk_level === 'ORANGE' ? 'bg-[#FF9900] text-black' :
                        item.risk_level === 'YELLOW' ? 'bg-[#FFFF00] text-black' : 'bg-[#00FF66] text-black'
                      }`}>
                        {item.risk_level}
                      </span>
                    </td>
                    <td className="p-6 text-right">
                      <Link href={`/dashboard/report/${item.id}`} className="inline-block px-5 py-3 border-4 border-black bg-white font-black text-[10px] uppercase shadow-[5px_5px_0px_0px_black] hover:bg-[#FFCC00] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all">
                        View Dossier
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {reports.length === 0 && (
              <div className="p-24 text-center border-t-4 border-black bg-white">
                <p className="text-slate-300 font-black uppercase text-xl italic tracking-tighter">
                  Archive Empty // No Scans Detected
                </p>
              </div>
            )}
          </div>
        </section>

        <footer className="mt-12 mb-20 text-center">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em]">
            End of Session // Proto-Research 2026
          </p>
        </footer>
      </main>
    </div>
  );
}