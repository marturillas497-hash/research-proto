// app/dashboard/report/[id]/page.js
import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/api-auth';
import { notFound } from 'next/navigation';

export default async function ReportDetailPage({ params }) {
  const { id } = await params;
  const { user } = await requireAuth();
  const supabase = await createClient();

  const { data: report } = await supabase
    .from('similarity_reports')
    .select('*')
    .eq('id', id)
    .eq('student_id', user.id) // Security: Ensure student owns this report
    .single();

  if (!report) notFound();

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="bg-white p-8 rounded-2xl shadow-sm border">
        <h1 className="text-sm font-bold text-blue-600 uppercase tracking-widest mb-2">Similarity Report</h1>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">{report.input_title}</h2>
        <p className="text-gray-600 italic">"{report.input_description}"</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* AI Section */}
        <div className="bg-blue-900 text-white p-6 rounded-2xl shadow-lg">
          <h3 className="text-xl font-bold mb-4 flex items-center">
            <span className="mr-2">✨</span> AI Recommendations
          </h3>
          <p className="leading-relaxed opacity-90">{report.ai_recommendations}</p>
        </div>

        {/* Risk Score Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border flex flex-col items-center justify-center">
          <h3 className="text-gray-500 font-bold uppercase text-xs mb-4">Risk Assessment</h3>
          <div className={`text-5xl font-black mb-2 ${
            report.risk_level === 'RED' ? 'text-red-600' : 'text-green-600'
          }`}>
            {Math.round(report.similarity_score * 100)}%
          </div>
          <div className="font-bold text-lg">{report.risk_level} LEVEL</div>
        </div>
      </div>

      {/* Top 3 Matches */}
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-4">Top Matches in Library</h3>
        <div className="space-y-4">
          {report.results_json?.slice(0, 3).map((match, index) => (
            <div key={index} className="bg-white p-4 rounded-xl border flex justify-between items-center">
              <div>
                <p className="font-bold text-gray-800">{match.title}</p>
                <p className="text-sm text-gray-500">{match.authors} ({match.year})</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-gray-400 uppercase">Match</p>
                <p className="font-mono font-bold text-blue-600">{Math.round(match.similarity * 100)}%</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}