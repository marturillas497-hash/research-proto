// app/dashboard/report/[id]/page.js
'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function ResearchReportPage() {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchReport() {
      if (!id) return;
      const { data } = await supabase
        .from('similarity_reports')
        .select('*, profiles!student_id(full_name)')
        .eq('id', id)
        .single();
      if (data) setReport(data);
      setLoading(false);
    }
    fetchReport();
  }, [id, supabase]);

  const formatSection = (text) => {
    if (!text) return "";
    return text
      .trim()
      .replace(/\*\*(.*?)\*\*/g, '<span class="text-[#FFCC00] font-black uppercase tracking-widest text-[10px] block mb-1">$1</span>')
      .replace(/\n/g, '<br/>')
      .replace(/•\s/g, '<span class="text-[#FFCC00] mr-2 text-xs">█</span>');
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-[#F0F0F0]">
      <div className="text-center">
        <div className="w-16 h-16 border-8 border-black border-t-[#FFCC00] rounded-full animate-spin mx-auto mb-4"></div>
        <div className="font-black uppercase tracking-[0.4em] text-[#003366] animate-pulse">Decrypting Archive...</div>
      </div>
    </div>
  );

  if (!report) return (
    <div className="p-20 font-black text-center uppercase text-red-600">Report Redacted or Not Found</div>
  );

  const riskStyles = {
    GREEN:  { bg: 'bg-[#00FF66]', label: 'LOW CONFLICT', text: 'text-black' },
    YELLOW: { bg: 'bg-[#FFFF00]', label: 'MINOR OVERLAP', text: 'text-black' },
    ORANGE: { bg: 'bg-[#FF9900]', label: 'SIGNIFICANT SIMILARITY', text: 'text-black' },
    RED:    { bg: 'bg-[#FF3333]', label: 'CRITICAL DUPLICATE', text: 'text-white' }
  };
  const currentRisk = riskStyles[report.risk_level] || riskStyles.GREEN;
  const adviceSections = report.ai_recommendations?.split('---') || [];

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-10 bg-[#F0F0F0] min-h-screen font-sans selection:bg-[#FFCC00] selection:text-black">
      
      {/* TOP NAVIGATION */}
      <div className="flex justify-between items-center mb-10 border-b-4 border-black pb-6">
        <Link href="/dashboard" className="group flex items-center gap-2 bg-white border-4 border-black px-6 py-3 font-black text-xs uppercase shadow-[6px_6px_0px_0px_black] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all">
          <span className="group-hover:-translate-x-1 transition-transform">←</span> Return to Terminal
        </Link>
        <div className="text-right font-mono">
          <div className="text-[10px] font-black uppercase text-slate-400 italic">Auth: {report.profiles?.full_name}</div>
          <div className="text-[10px] font-black uppercase text-slate-500">Ref: {id.slice(0,12)}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* RADAR STATS CARD */}
        <div className="lg:col-span-4">
          <div className={`relative overflow-hidden border-4 border-black p-10 shadow-[10px_10px_0px_0px_black] ${currentRisk.bg} ${currentRisk.text} h-full flex flex-col justify-center group`}>
            
            {/* LARGE WATERMARK */}
            <div className="absolute top-2 right-4 pointer-events-none select-none">
              <div className="font-black text-7xl italic opacity-[0.08] leading-none tracking-tighter group-hover:scale-110 transition-transform duration-500">
                SCAN
              </div>
            </div>

            <div className="relative z-10">
              <p className="text-[11px] font-black uppercase tracking-[0.3em] mb-4 border-b border-black/20 pb-2">SIMILARITY_INDEX</p>
              <h2 className="text-8xl md:text-9xl font-black italic tracking-tighter leading-[0.85] mb-6 pr-8">
                {Math.round((report.similarity_score || 0) * 100)}<span className="text-4xl italic ml-1">%</span>
              </h2>
              <div className="bg-black text-white px-4 py-2 self-start font-black text-sm uppercase italic tracking-widest">
                {currentRisk.label}
              </div>
            </div>
          </div>
        </div>

        {/* ABSTRACT BOX */}
        <div className="lg:col-span-8">
          <div className="bg-white border-4 border-black p-10 shadow-[10px_10px_0px_0px_black] h-full flex flex-col">
            <p className="text-[11px] font-black uppercase text-slate-400 tracking-widest mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-[#003366]"></span> SUBMITTED_RECORDS
            </p>
            <h1 className="text-4xl md:text-5xl font-black uppercase text-[#003366] tracking-tighter italic mb-6 leading-[1.1] pr-6">
              {report.input_title}
            </h1>
            <div className="bg-[#f2f2f2] p-8 border-l-[12px] border-black italic font-bold text-slate-800 leading-relaxed text-lg flex-grow relative">
              <span className="text-4xl text-slate-300 block mb-2 leading-none">“</span>
              <div className="px-4">{report.input_description}</div>
              <span className="text-4xl text-slate-300 block text-right mt-2 leading-none">”</span>
            </div>
          </div>
        </div>

        {/* THE DOSSIER SECTION - REWRITTEN FOR BETTER LAYOUT */}
        <div className="lg:col-span-12">
          <div className="bg-black border-4 border-black shadow-[15px_15px_0px_0px_#FFCC00] overflow-hidden">
            
            {/* HEADER */}
            <div className="bg-[#FFCC00] text-black px-6 py-4 border-b-4 border-black flex items-center justify-between">
              <h3 className="font-black uppercase text-sm tracking-[0.3em] italic flex items-center gap-3">
                <span className="w-3 h-5 bg-black"></span>
                Panel Advisory Dossier
              </h3>
              <div className="font-mono text-[10px] font-black opacity-40 uppercase">System_Ver: Proto_v2.0</div>
            </div>
            
            {/* DOSSIER GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-[2px] bg-white/10"> 
              {adviceSections.map((section, index) => (
                <div 
                  key={index} 
                  className={`p-10 bg-black group hover:bg-zinc-900 transition-colors ${
                    index === 0 ? 'md:col-span-2 border-b-2 border-white/5' : ''
                  }`}
                >
                  <div className="flex items-start gap-4 mb-6">
                    <span className="bg-white/10 text-white px-2 py-1 text-[10px] font-black font-mono">
                      SEC_0{index + 1}
                    </span>
                    <div className="h-[2px] bg-white/5 flex-grow mt-2.5"></div>
                  </div>

                  <div 
                    className="text-white font-medium italic leading-relaxed text-lg font-mono selection:bg-white selection:text-black"
                    dangerouslySetInnerHTML={{ __html: formatSection(section) }}
                  />
                </div>
              ))}
            </div>

            {/* SYSTEM FOOTER */}
            <div className="p-4 bg-zinc-900 flex justify-between items-center text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-[#00FF66] rounded-full animate-pulse"></span>
                  ANALYSIS_COMPLETE
                </span>
                <span>SECURE_ENCRYPTION_ACTIVE</span>
              </div>
              <span className="font-mono">TIMESTAMP: {new Date().toLocaleTimeString()}</span>
            </div>
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div className="lg:col-span-12 flex flex-wrap gap-4 mt-4 mb-20">
          <button onClick={() => window.print()} className="bg-white border-4 border-black px-8 py-4 font-black uppercase text-sm shadow-[6px_6px_0px_0px_black] hover:bg-[#FFCC00] transition-all">
            🖨️ Export PDF Report
          </button>
          <Link href="/submit" className="bg-[#003366] text-white border-4 border-black px-8 py-4 font-black uppercase text-sm shadow-[6px_6px_0px_0px_black] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all">
            + Start Fresh Analysis
          </Link>
        </div>

      </div>
    </div>
  );
}