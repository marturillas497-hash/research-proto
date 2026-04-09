// app/admin/analytics/page.js
import { createClient } from '@/lib/supabase/server';
import AdminNavbar from '@/components/admin/Navbar';
import Link from 'next/link';

export default async function AdminAnalyticsPage() {
  const supabase = await createClient();

  // 1. Fetch Top 10 "Famous" (All-time views)
  const { data: famous } = await supabase
    .from('similarity_reports')
    .select('id, input_title, view_count, student_id, profiles(full_name)')
    .order('view_count', { ascending: false })
    .limit(10);

  // 2. Fetch "Trending" (Views in the last 7 days)
  const { data: trending } = await supabase
    .from('abstract_views')
    .select(`
      abstract_id,
      similarity_reports(input_title, view_count)
    `)
    .gte('viewed_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

  // Aggregate trending counts in JS for simplicity, or use a complex RPC
  const trendingMap = {};
  trending?.forEach(v => {
    const id = v.abstract_id;
    trendingMap[id] = (trendingMap[id] || 0) + 1;
    trendingMap[id + '_title'] = v.similarity_reports?.input_title;
  });

  const sortedTrending = Object.keys(trendingMap)
    .filter(key => !key.endsWith('_title'))
    .map(id => ({
      id,
      title: trendingMap[id + '_title'],
      recent_views: trendingMap[id]
    }))
    .sort((a, b) => b.recent_views - a.recent_views)
    .slice(0, 5);

  // 3. Fetch Recent Audit Log (Last 20 views)
  const { data: history } = await supabase
    .from('abstract_views')
    .select(`
      viewed_at,
      profiles(full_name),
      similarity_reports(input_title)
    `)
    .order('viewed_at', { ascending: false })
    .limit(20);

  return (
    <div className="min-h-screen bg-[#F0F0F0]">
      <AdminNavbar />
      <main className="max-w-7xl mx-auto p-6 sm:p-10">
        
        <header className="mb-12 border-b-8 border-black pb-8 flex justify-between items-end">
          <div>
            <h1 className="text-7xl font-black text-[#003366] uppercase italic tracking-tighter leading-none">
              Library_Analytics
            </h1>
            <p className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] mt-2">
              Engagement Metrics // Abstract Velocity Log
            </p>
          </div>
          <Link href="/admin" className="bg-black text-white px-6 py-3 font-black uppercase text-xs shadow-[4px_4px_0px_0px_#FFCC00] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all">
            ← Return to Control
          </Link>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* TRENDING SECTION */}
          <div className="lg:col-span-1 space-y-8">
            <section className="bg-[#FFCC00] p-6 border-4 border-black shadow-[8px_8px_0px_0px_black]">
              <h2 className="font-black uppercase text-xl mb-4 italic underline">Trending_Now</h2>
              <p className="text-[10px] font-bold uppercase mb-4 opacity-70">(Last 7 Days Activity)</p>
              <div className="space-y-4">
                {sortedTrending.map((item, i) => (
                  <div key={i} className="flex justify-between items-center border-b-2 border-black/20 pb-2">
                    <span className="text-xs font-black uppercase truncate pr-4">{item.title}</span>
                    <span className="bg-black text-white px-2 py-1 text-[10px] font-mono">+{item.recent_views}</span>
                  </div>
                ))}
                {sortedTrending.length === 0 && <p className="text-xs italic font-bold">No recent velocity detected.</p>}
              </div>
            </section>

            <section className="bg-[#003366] p-6 border-4 border-black shadow-[8px_8px_0px_0px_black] text-white">
              <h2 className="font-black uppercase text-xl mb-4 italic text-[#FFCC00]">Total_Interactions</h2>
              <p className="text-6xl font-black italic">{trending?.length || 0}</p>
              <p className="text-[10px] font-black uppercase mt-2 text-[#FFCC00]/60 tracking-widest text-right">Events_Logged</p>
            </section>
          </div>

          {/* FAMOUS (ALL TIME) SECTION */}
          <div className="lg:col-span-2">
            <section className="bg-white border-4 border-black shadow-[12px_12px_0px_0px_black] overflow-hidden">
              <div className="bg-black p-4">
                <h2 className="text-[#FFCC00] font-black uppercase tracking-widest text-sm italic">The_Famous_List // All-Time Highs</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 border-b-4 border-black">
                    <tr>
                      <th className="p-4 text-[10px] font-black uppercase">Rank</th>
                      <th className="p-4 text-[10px] font-black uppercase">Project Title</th>
                      <th className="p-4 text-[10px] font-black uppercase text-right">Total Views</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-2 divide-slate-200">
                    {famous?.map((item, i) => (
                      <tr key={item.id} className="hover:bg-[#FFCC00]/10 group">
                        <td className="p-4 font-mono text-xl font-black italic text-slate-300">#0{i+1}</td>
                        <td className="p-4 text-xs font-black uppercase group-hover:text-[#003366]">{item.input_title}</td>
                        <td className="p-4 text-right font-black text-2xl italic text-[#003366]">{item.view_count || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </div>

        {/* AUDIT LOG TABLE */}
        <section className="bg-white border-4 border-black shadow-[15px_15px_0px_0px_black] overflow-hidden">
          <div className="bg-black p-4 flex justify-between items-center">
            <h2 className="text-[#FFCC00] font-black uppercase tracking-widest text-sm italic">System_Audit_Ledger</h2>
            <span className="text-[9px] font-mono text-white/40 uppercase">Streaming_Data_Active</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b-2 border-black">
                  <th className="p-4 text-[10px] font-black uppercase">Timestamp</th>
                  <th className="p-4 text-[10px] font-black uppercase">Viewer</th>
                  <th className="p-4 text-[10px] font-black uppercase">Resource Accessed</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-slate-100">
                {history?.map((log, i) => (
                  <tr key={i} className="text-[11px] font-bold uppercase tracking-tight">
                    <td className="p-4 font-mono text-slate-400">
                      {new Date(log.viewed_at).toLocaleString()}
                    </td>
                    <td className="p-4 text-[#003366]">
                      {log.profiles?.full_name || 'System_User'}
                    </td>
                    <td className="p-4 italic">
                      {log.similarity_reports?.input_title}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

      </main>
    </div>
  );
}