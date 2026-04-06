// app/admin/advisers/page.js
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/api-auth';
import Link from 'next/link';

export default async function AdminAdvisersPage() {
  await requireAdmin();
  const supabase = await createClient();

  // Fetch all active advisers
  const { data: advisers } = await supabase
    .from('profiles')
    .select('*, departments(name, code)')
    .eq('role', 'research_adviser')
    .eq('status', 'active')
    .order('full_name');

  // Fetch all students with their metadata and assigned adviser
  const { data: students } = await supabase
    .from('profiles')
    .select(`
      id, full_name,
      departments(code),
      student_metadata!student_metadata_profile_id_fkey(lrn, adviser_id, year_level, section)
    `)
    .eq('role', 'student');

  // Group students by adviser_id
  const studentsByAdviser = {};
  students?.forEach((s) => {
    const adviserId = s.student_metadata?.[0]?.adviser_id || s.student_metadata?.adviser_id;
    if (!adviserId) return;
    if (!studentsByAdviser[adviserId]) studentsByAdviser[adviserId] = [];
    studentsByAdviser[adviserId].push(s);
  });

  const unassigned = students?.filter((s) => {
    const adviserId = s.student_metadata?.[0]?.adviser_id || s.student_metadata?.adviser_id;
    return !adviserId;
  });

  return (
    <div className="max-w-7xl mx-auto p-6 sm:p-10 min-h-screen bg-[#F0F0F0]">
      <div className="mb-12">
        <span className="bg-[#FFCC00] border-2 border-black px-3 py-1 text-[10px] font-black uppercase mb-4 inline-block shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          Admin
        </span>
        <h1 className="text-6xl font-black text-[#003366] tracking-tighter uppercase leading-none italic">
          Adviser Registry
        </h1>
        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-2">
          {advisers?.length || 0} active adviser{advisers?.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* STATS */}
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

      {/* ADVISER LIST */}
      <div className="space-y-6">
        {advisers?.length === 0 ? (
          <div className="border-4 border-dashed border-slate-300 p-24 text-center">
            <p className="font-black uppercase text-slate-300 text-lg tracking-widest">
              No active advisers yet
            </p>
            <Link href="/admin/approvals" className="inline-block mt-6 bg-[#FFCC00] border-4 border-black px-6 py-3 font-black uppercase text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
              Review Pending Applications →
            </Link>
          </div>
        ) : advisers.map((adviser) => {
          const assigned = studentsByAdviser[adviser.id] || [];
          return (
            <div key={adviser.id} className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
              {/* Adviser Header */}
              <div className="bg-[#003366] p-6 flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-black text-white uppercase">{adviser.full_name}</h2>
                  <p className="text-[10px] font-black text-[#FFCC00] uppercase tracking-widest mt-1">
                    {adviser.departments?.code} — {adviser.departments?.name}
                  </p>
                </div>
                <span className="bg-[#FFCC00] border-2 border-black px-4 py-2 font-black text-sm uppercase shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                  {assigned.length} Student{assigned.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Student List */}
              {assigned.length > 0 ? (
                <div className="divide-y-2 divide-slate-100">
                  {assigned.map((student) => {
                    const meta = Array.isArray(student.student_metadata)
                      ? student.student_metadata[0]
                      : student.student_metadata;
                    return (
                      <div key={student.id} className="p-5 flex justify-between items-center hover:bg-slate-50">
                        <div>
                          <p className="font-black text-[#003366] uppercase text-sm">{student.full_name}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">
                            {meta?.lrn || 'No LRN'} — {meta?.year_level} {meta?.section}
                          </p>
                        </div>
                        <span className="text-[10px] font-black uppercase text-slate-300">
                          {student.departments?.code}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <p className="text-slate-300 font-black uppercase text-xs tracking-widest">
                    No students assigned
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* UNASSIGNED STUDENTS */}
      {unassigned?.length > 0 && (
        <div className="mt-12 bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
          <div className="bg-black p-5">
            <h2 className="text-[#FFCC00] font-black uppercase tracking-widest text-sm">
              ⚠️ Unassigned Students ({unassigned.length})
            </h2>
          </div>
          <div className="divide-y-2 divide-slate-100">
            {unassigned.map((student) => {
              const meta = Array.isArray(student.student_metadata)
                ? student.student_metadata[0]
                : student.student_metadata;
              return (
                <div key={student.id} className="p-5 flex justify-between items-center">
                  <div>
                    <p className="font-black text-[#003366] uppercase text-sm">{student.full_name}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">
                      {meta?.lrn || 'No LRN'} — {meta?.year_level} {meta?.section}
                    </p>
                  </div>
                  <span className="text-[10px] font-black uppercase text-slate-300">
                    {student.departments?.code}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}