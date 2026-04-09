// app/admin/advisers/page.js
import { createClient } from '@/lib/supabase/server';
import AdminNavbar from '@/components/admin/Navbar';
import Link from 'next/link';

export default async function AdminAdvisersPage() {
  const supabase = await createClient();

  // 1. Fetch all active advisers
  const { data: advisers } = await supabase
    .from('profiles')
    .select('*, departments(name, code)')
    .eq('role', 'research_adviser')
    .eq('status', 'active')
    .order('full_name');

  // 2. Fetch all students with their metadata and assigned adviser
  // Note: Using the specific fkey for metadata to ensure correct join
  const { data: students } = await supabase
    .from('profiles')
    .select(`
      id, full_name,
      departments(code),
      student_metadata!student_metadata_profile_id_fkey(id_number, adviser_id, year_level, section)
    `)
    .eq('role', 'student');

  // 3. Group students by adviser_id
  const studentsByAdviser = {};
  students?.forEach((s) => {
    // Handle Supabase returning metadata as either an array or single object
    const meta = Array.isArray(s.student_metadata) ? s.student_metadata[0] : s.student_metadata;
    const adviserId = meta?.adviser_id;
    
    if (!adviserId) return;
    if (!studentsByAdviser[adviserId]) studentsByAdviser[adviserId] = [];
    studentsByAdviser[adviserId].push(s);
  });

  const unassigned = students?.filter((s) => {
    const meta = Array.isArray(s.student_metadata) ? s.student_metadata[0] : s.student_metadata;
    return !meta?.adviser_id;
  });

  return (
    <div className="min-h-screen bg-[#F0F0F0]">
      {/* MANUAL NAVBAR INCLUSION */}
      <AdminNavbar />

      <div className="max-w-7xl mx-auto p-6 sm:p-10">
        {/* HEADER */}
        <div className="mb-12">
          <span className="bg-[#FFCC00] border-2 border-black px-3 py-1 text-[10px] font-black uppercase mb-4 inline-block shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            Admin Registry
          </span>
          <h1 className="text-6xl font-black text-[#003366] tracking-tighter uppercase leading-none italic">
            Adviser Registry
          </h1>
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-2">
            {advisers?.length || 0} active adviser{advisers?.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* STATS SUMMARY */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white p-8 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Active Advisers</p>
            <p className="text-6xl font-black text-[#003366] italic">{advisers?.length || 0}</p>
          </div>
          <div className="bg-[#003366] p-8 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <p className="text-[10px] font-black text-[#FFCC00] uppercase tracking-widest mb-2">Total Students</p>
            <p className="text-6xl font-black text-white italic">{students?.length || 0}</p>
          </div>
          <div className={`p-8 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] ${unassigned?.length > 0 ? 'bg-[#FFCC00]' : 'bg-white'}`}>
            <p className="text-[10px] font-black text-black uppercase tracking-widest mb-2">Unassigned Students</p>
            <p className="text-6xl font-black text-black italic">{unassigned?.length || 0}</p>
          </div>
        </div>

        {/* ADVISER CARDS */}
        <div className="space-y-8">
          {advisers?.length === 0 ? (
            <div className="border-4 border-dashed border-slate-300 p-24 text-center bg-white/50">
              <p className="font-black uppercase text-slate-300 text-lg tracking-widest">
                No active advisers yet
              </p>
              <Link href="/admin/approvals" className="inline-block mt-6 bg-[#FFCC00] border-4 border-black px-6 py-3 font-black uppercase text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all">
                Review Pending Applications →
              </Link>
            </div>
          ) : (
            advisers.map((adviser) => {
              const assigned = studentsByAdviser[adviser.id] || [];
              return (
                <div key={adviser.id} className="bg-white border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
                  {/* Adviser Header Section */}
                  <div className="bg-[#003366] p-6 flex flex-col md:flex-row justify-between items-start md:items-center border-b-4 border-black">
                    <div>
                      <h2 className="text-2xl font-black text-white uppercase italic">{adviser.full_name}</h2>
                      <p className="text-[10px] font-black text-[#FFCC00] uppercase tracking-[0.2em] mt-1">
                        {adviser.departments?.code} — {adviser.departments?.name}
                      </p>
                    </div>
                    <div className="mt-4 md:mt-0 bg-white border-2 border-black px-4 py-2 font-black text-sm uppercase shadow-[4px_4px_0px_0px_rgba(255,204,0,1)]">
                      {assigned.length} Student{assigned.length !== 1 ? 's' : ''}
                    </div>
                  </div>

                  {/* Student Sub-list */}
                  <div className="divide-y-2 divide-slate-100">
                    {assigned.length > 0 ? (
                      assigned.map((student) => {
                        const meta = Array.isArray(student.student_metadata) ? student.student_metadata[0] : student.student_metadata;
                        return (
                          <div key={student.id} className="p-5 flex justify-between items-center hover:bg-slate-50 transition-colors">
                            <div>
                              <p className="font-black text-[#003366] uppercase text-sm">{student.full_name}</p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5 tracking-tight">
                                id_number: {meta?.id_number || 'N/A'} • {meta?.year_level} {meta?.section}
                              </p>
                            </div>
                            <span className="text-[10px] font-black uppercase text-slate-300 border border-slate-200 px-2 py-1">
                              {student.departments?.code}
                            </span>
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-8 text-center bg-slate-50/50">
                        <p className="text-slate-300 font-black uppercase text-[10px] tracking-widest">
                          Adviser currently has no assigned students
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* UNASSIGNED SECTION */}
        {unassigned?.length > 0 && (
          <div className="mt-16 bg-white border-4 border-black shadow-[12px_12px_0px_0px_rgba(255,0,0,1)] overflow-hidden">
            <div className="bg-black p-5 flex justify-between items-center">
              <h2 className="text-white font-black uppercase tracking-widest text-sm flex items-center gap-2">
                <span className="bg-red-600 px-2 py-0.5 text-[#FFCC00]">URGENT</span> 
                Unassigned Students ({unassigned.length})
              </h2>
            </div>
            <div className="divide-y-2 divide-slate-100 max-h-96 overflow-y-auto">
              {unassigned.map((student) => {
                const meta = Array.isArray(student.student_metadata) ? student.student_metadata[0] : student.student_metadata;
                return (
                  <div key={student.id} className="p-5 flex justify-between items-center bg-red-50/30">
                    <div>
                      <p className="font-black text-red-900 uppercase text-sm">{student.full_name}</p>
                      <p className="text-[10px] font-bold text-red-400 uppercase mt-0.5">
                        {meta?.id_number || 'No id_number'} • {meta?.year_level} {meta?.section}
                      </p>
                    </div>
                    <span className="text-[10px] font-black uppercase text-red-200">
                      {student.departments?.code}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}