// app/dashboard/report/[id]/page.js
import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/api-auth';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export default async function ReportDetailPage({ params }) {
  const { id } = await params;
  const { user } = await requireAuth();
  const supabase = await createClient();

  const { data: report } = await supabase
    .from('similarity_reports')
    .select('*')
    .eq('id', id)
    .eq('student_id', user.id) 
    .single();

  if (!report) notFound();

  const score = Math.round(report.similarity_score * 100);

  // Configuration for the 4-Tier Visual Badge System
  const config = {
    RED: { 
      bg: "bg-red-500", 
      text: "text-white", 
      label: "Very High Similarity",
      interpretation: "80-100% Match"
    },
    ORANGE: { 
      bg: "bg-orange-500", 
      text: "text-black", 
      label: "High Similarity",
      interpretation: "60-79% Match"
    },
    YELLOW: { 
      bg: "bg-yellow-300", 
      text: "text-black", 
      label: "Some Similarity",
      interpretation: "40-59% Match"
    },
    GREEN: { 
      bg: "bg-green-400", 
      text: "text-black", 
      label: "Highly Original",
      interpretation: "0-39% Match"
    }
  };

  const current = config[report.risk_level] || config.GREEN;

  return (
    <div className="max-w-5xl mx-auto p-6 sm:p-10 bg-[#F0F0F0] min-h-screen font-sans">
      <Link href="/dashboard" className="inline-block border-4 border-black bg-white px-6 py-2 font-black text-xs uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-[#FFCC00] transition-all mb-10">
        ← Back to Dashboard
      </Link>

      <div className="space-y-8">
        {/* Header with Visual Badge */}
        <div className="bg-white border-4 border-black p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex-1 w-full text-center md:text-left">
            <h1 className="text-[10px] font-black bg-black text-white px-2 py-1 uppercase tracking-widest inline-block mb-4">
              Academic Radar Report
            </h1>
            <h2 className="text-4xl font-black text-[#003366] uppercase italic leading-none break-words">
              {report.input_title}
            </h2>
          </div>
          
          <div className={`border-4 border-black p-6 text-center min-w-[220px] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] ${current.bg} ${current.text}`}>
            <div className="text-5xl font-black leading-none">{score}%</div>
            <div className="text-[10px] font-black uppercase tracking-tighter mt-1 border-t-2 border-current pt-1">
              {current.label}
            </div>
            <div className="text-[8px] font-bold uppercase opacity-80 mt-1">{current.interpretation}</div>
          </div>
        </div>

        {/* AI Recommendations Card */}
        <div className="bg-[#003366] text-white border-4 border-black p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
          <h3 className="text-xl font-black mb-4 uppercase flex items-center">
            <span className="bg-[#FFCC00] text-black px-2 mr-2">✨</span> AI Consultant Advice
          </h3>
          <p className="text-lg font-bold leading-relaxed italic border-l-4 border-[#FFCC00] pl-6 py-2 bg-blue-900/30">
            {report.ai_recommendations}
          </p>
        </div>

        {/* Library Matches Section */}
        <div className="bg-white border-4 border-black p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
          <h3 className="text-2xl font-black text-black uppercase mb-8 border-b-4 border-black pb-2 italic">
            Top Library Matches
          </h3>
          <div className="grid grid-cols-1 gap-6">
            {report.results_json?.slice(0, 3).map((match, index) => (
              <div key={index} className="group border-4 border-black p-6 hover:bg-slate-50 transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex-1">
                  <h4 className="font-black text-lg text-[#003366] uppercase leading-tight group-hover:underline">
                    {match.title}
                  </h4>
                  <p className="text-xs font-bold text-slate-500 uppercase mt-1">
                    Authors: {match.authors} • {match.year}
                  </p>
                </div>
                <div className="bg-black text-[#FFCC00] border-2 border-black px-4 py-2 text-center min-w-[80px]">
                  <div className="text-xl font-black leading-none">
                    {Math.round(match.similarity * 100)}%
                  </div>
                  <div className="text-[8px] font-black uppercase tracking-tighter">Similarity</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}