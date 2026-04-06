// app/adviser/report/[id]/page.js
import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/api-auth';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import StatusActionButtons from './StatusActionButtons';

export default async function AdviserReportView({ params }) {
  const { id } = await params;
  const { user } = await requireAuth();
  const supabase = await createClient();

  // 1. Fetch Report with Student Profile + student_metadata
  const { data: report } = await supabase
    .from('similarity_reports')
    .select(`
      *,
      profiles!student_id (
        full_name,
        departments (name),
        student_metadata (lrn, year_level, section)
      )
    `)
    .eq('id', id)
    .single();

  if (!report) notFound();

  // 2. Security Gate: Only the assigned adviser can view
  if (report.adviser_id !== user.id) redirect('/adviser');

  const score = Math.round((report.similarity_score || 0) * 100);
  const student = report.profiles;

  return (
    <div className="max-w-7xl mx-auto p-6 sm:p-10 font-sans bg-[#F0F0F0] min-h-screen">
      <Link href="/adviser" className="inline-block border-4 border-black bg-white px-6 py-2 font-black text-xs uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-[#FFCC00] mb-10 transition-all">
        ← Back to Queue
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

        {/* LEFT COLUMN: Proposal & AI Analysis */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white border-4 border-black p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
            <h1 className="text-[10px] font-black bg-black text-white px-2 py-1 uppercase tracking-widest inline-block mb-4">
              Student Proposal
            </h1>
            <h2 className="text-4xl font-black text-[#003366] uppercase italic leading-tight mb-6">
              {report.input_title}
            </h2>
            <div className="space-y-4">
              <h3 className="font-black uppercase text-xs text-slate-400 border-b-2 border-slate-100 pb-1">Abstract / Description</h3>
              <p className="text-lg font-medium leading-relaxed text-slate-700">
                {report.input_description}
              </p>
            </div>
          </div>

          <div className="bg-[#003366] text-white border-4 border-black p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="text-xl font-black mb-4 uppercase flex items-center">
              <span className="bg-[#FFCC00] text-black px-2 mr-2">✨</span> AI Technical Assessment
            </h3>
            <p className="text-lg font-bold leading-relaxed italic text-blue-50">
              {report.ai_recommendations}
            </p>
          </div>

          <div className="bg-white border-4 border-black p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="text-2xl font-black uppercase mb-8 italic border-b-4 border-black pb-2">Top Library Matches</h3>
            <div className="space-y-4">
              {report.results_json?.length > 0 ? report.results_json.map((match, idx) => (
                <div key={idx} className="border-4 border-black p-4 flex justify-between items-center bg-slate-50 hover:bg-yellow-50 transition-colors">
                  <div>
                    <h4 className="font-black text-[#003366] uppercase text-sm">{match.title}</h4>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">
                      {match.authors} ({match.year})
                    </p>
                  </div>
                  <div className="bg-black text-[#FFCC00] px-3 py-1 font-black text-sm ml-4">
                    {Math.round(match.similarity * 100)}%
                  </div>
                </div>
              )) : (
                <p className="text-slate-300 font-black uppercase text-xs text-center py-8">No matches found in library.</p>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Adviser Actions */}
        <div className="space-y-8">
          <div className="bg-white border-4 border-black p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] sticky top-10">
            <h3 className="font-black uppercase text-xs mb-6 border-b-2 border-black pb-2">Review Summary</h3>

            <div className="mb-6">
              <p className="text-[10px] font-black uppercase text-slate-400">Student Name</p>
              <p className="font-black text-lg uppercase">{student?.full_name || '—'}</p>
              <p className="text-xs font-bold text-slate-500 uppercase">
                {student?.student_metadata?.lrn || 'No LRN'}
              </p>
              <p className="text-xs font-bold text-slate-400 uppercase mt-1">
                {student?.student_metadata?.year_level} — {student?.student_metadata?.section}
              </p>
              <p className="text-xs font-bold text-slate-400 uppercase">
                {student?.departments?.name}
              </p>
            </div>

            <div className={`border-4 border-black p-6 text-center mb-8 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${
              report.risk_level === 'RED'    ? 'bg-red-500 text-white' :
              report.risk_level === 'ORANGE' ? 'bg-orange-500 text-black' :
              report.risk_level === 'YELLOW' ? 'bg-yellow-300 text-black' :
                                               'bg-green-400 text-black'
            }`}>
              <div className="text-5xl font-black">{score}%</div>
              <div className="text-[10px] font-black uppercase tracking-widest border-t-2 border-current mt-1 pt-1">
                Similarity Risk: {report.risk_level}
              </div>
            </div>

            <StatusActionButtons
              reportId={report.id}
              currentStatus={report.status}
              initialRemarks={report.adviser_remarks}
            />
          </div>
        </div>

      </div>
    </div>
  );
}