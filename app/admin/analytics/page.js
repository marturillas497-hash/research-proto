// app/admin/analytics/page.js
import { createClient } from '@/lib/supabase/server';
import AdminNavbar from '@/components/admin/Navbar';
import Link from 'next/link';

/**
 * Helper to calculate the 30-day window.
 * Moving this outside the component prevents the 'impure function' error 
 * during the React render cycle in Next.js build.
 */
function getThirtyDaysAgo() {
  return new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
}

export default async function AdminAnalyticsPage() {
  const supabase = await createClient();
  const thirtyDaysAgo = getThirtyDaysAgo();

  // 1. Fetch All-Time Highs
  // We pull from 'abstracts' and join the 'abstract_stats' view
  const { data: famousRaw } = await supabase
    .from('abstracts')
    .select(`
      id, 
      title, 
      abstract_stats(unique_readers)
    `);

  const famous = (famousRaw || [])
    .map(item => ({
      id: item.id,
      title: item.title,
      views: item.abstract_stats?.[0]?.unique_readers || 0
    }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 10);

  // 2. Fetch Trending Velocity (Last 30 Days)
  const { data: trendingRaw } = await supabase
    .from('abstract_views')
    .select(`
      abstract_id,
      abstracts(title)
    `)
    .gte('viewed_at', thirtyDaysAgo);

  // Aggregate trending counts manually
  const trendingMap = {};
  trendingRaw?.forEach(v => {
    const id = v.abstract_id;
    if (!trendingMap[id]) {
      trendingMap[id] = { title: v.abstracts?.title || 'Untitled Research', count: 0 };
    }
    trendingMap[id].count++;
  });

  const sortedTrending = Object.values(trendingMap)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const maxTrendingCount = sortedTrending[0]?.count || 1;

  // 3. System Audit Ledger
  const { data: history } = await supabase
    .from('abstract_views')
    .select(`
      viewed_at,
      profiles(full_name),
      abstracts(title)
    `)
    .order('viewed_at', { ascending: false })
    .limit(20);

  return (
    <div className="min-h-screen bg-[#F0F0F0] selection:bg-[#FFCC00]">
      <AdminNavbar />
      
      <main className="max-w-7xl mx-auto p-6 sm:p-10">
        
        <header className="mb-12 border-b-8 border-black pb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <h1 className="text-6xl md:text-7xl font-black text-[#003366] uppercase italic tracking-tighter leading-[0.8]">
              Library_Analytics
            </h1>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-4">
              Engagement Metrics // Abstract Velocity Log
            </p>
          </div>
          <Link href="/admin" className="bg-black text-white px-8 py-4 font-black uppercase text-xs shadow-[6px_6px_0px_0px_#FFCC00] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all">
            ← Return to Control
          </Link>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          
          {/* TRENDING SECTION */}
          <div className="lg:col-span-1 space-y-8">
            <section className="bg-[#FFCC00] p-8 border-4 border-black shadow-[10px_10px_0px_0px_black]">
              <h2 className="font-black uppercase text-2xl mb-2 italic underline">Trending_Now</h2>
              <p className="text-[10px] font-black uppercase mb-8 opacity-60">Trailing 30-Day Activity Window</p>
              
              <div className="space-y-8">
                {sortedTrending.map((item, i) => (
                  <div key={i} className="group">
                    <div className="flex justify-between items-end text-[10px] font-black uppercase mb-2">
                      <span className="truncate w-3/4 group-hover:italic transition-all">{item.title}</span>
                      <span className="bg-black text-white px-2 py-0.5">+{item.count}</span>
                    </div>
                    <div className="w-full h-4 bg-black/5 border-2 border-black/20">
                      <div 
                        className="h-full bg-black transition-all duration-1000 ease-out"
                        style={{ width: `${(item.count / maxTrendingCount) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
                {sortedTrending.length === 0 && (
                  <p className="text-xs font-black uppercase italic opacity-40 py-10 text-center border-2 border-dashed border-black/20">
                    No velocity detected.
                  </p>
                )}
              </div>
            </section>

            <section className="bg-[#003366] p-8 border-4 border-black shadow-[10px_10px_0px_0px_black] text-white">
              <h2 className="font-black uppercase text-sm mb-4 tracking-widest text-[#FFCC00]">Total_Interactions</h2>
              <div className="flex items-end justify-between">
                <p className="text-7xl font-black italic leading-none">{trendingRaw?.length || 0}</p>
                <div className="text-right">
                    <p className="text-[10px] font-black uppercase text-[#FFCC00]/60 leading-tight">Events_Logged</p>
                    <p className="text-[10px] font-black uppercase text-[#FFCC00]/60 leading-tight">Last_30_Days</p>
                </div>
              </div>
            </section>
          </div>

          {/* ALL-TIME HIGHS */}
          <div className="lg:col-span-2">
            <section className="bg-white border-4 border-black shadow-[15px_15px_0px_0px_black] overflow-hidden flex flex-col h-full">
              <div className="bg-black p-5 flex justify-between items-center">
                <h2 className="text-[#FFCC00] font-black uppercase tracking-[0.2em] text-xs italic">The_Famous_List // Global Highs</h2>
                <div className="h-2 w-2 bg-[#00FF66] rounded-full animate-ping"></div>
              </div>
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b-4 border-black">
                    <tr>
                      <th className="p-5 text-[10px] font-black uppercase">Rank</th>
                      <th className="p-5 text-[10px] font-black uppercase">Research Title</th>
                      <th className="p-5 text-[10px] font-black uppercase text-right">Unique Readers</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-4 divide-[#F0F0F0]">
                    {famous.map((item, i) => (
                      <tr key={item.id} className="hover:bg-[#FFCC00]/10 transition-colors group">
                        <td className="p-5 font-mono text-2xl font-black italic text-slate-200 group-hover:text-black transition-colors">
                          #{String(i + 1).padStart(2, '0')}
                        </td>
                        <td className="p-5 text-xs font-black uppercase leading-tight max-w-md">
                          {item.title}
                        </td>
                        <td className="p-5 text-right font-black text-3xl italic text-[#003366]">
                          {item.views}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </div>

        {/* AUDIT LEDGER */}
        <section className="bg-white border-4 border-black shadow-[20px_20px_0px_0px_black] overflow-hidden mb-20">
          <div className="bg-black p-5 flex justify-between items-center">
            <h2 className="text-[#FFCC00] font-black uppercase tracking-[0.2em] text-xs italic">System_Audit_Ledger</h2>
            <div className="flex gap-2 items-center">
              <span className="text-[8px] font-mono text-white/40 uppercase tracking-widest">Live_Feed_Authorized</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b-2 border-black">
                  <th className="p-5 text-[10px] font-black uppercase">Timestamp</th>
                  <th className="p-5 text-[10px] font-black uppercase">Authorized Viewer</th>
                  <th className="p-5 text-[10px] font-black uppercase">Resource Node</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-slate-100">
                {history?.map((log, i) => (
                  <tr key={i} className="text-[11px] font-bold uppercase tracking-tight hover:bg-slate-50 transition-colors">
                    <td className="p-5 font-mono text-slate-400">
                      [{new Date(log.viewed_at).toLocaleTimeString()}] 
                      <span className="ml-2 opacity-50">{new Date(log.viewed_at).toLocaleDateString()}</span>
                    </td>
                    <td className="p-5 text-[#003366] font-black">
                      {log.profiles?.full_name || 'Anonymous_Node'}
                    </td>
                    <td className="p-5 italic opacity-80 max-w-xs truncate">
                      "{log.abstracts?.title}"
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