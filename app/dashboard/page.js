// app/dashboard/page.js
import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/api-auth';
import Link from 'next/link';

export default async function DashboardPage() {
  const { user, profile } = await requireAuth();
  const supabase = await createClient();

  const { data: reports } = await supabase
    .from('similarity_reports')
    .select('*')
    .eq('student_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <div className="max-w-7xl mx-auto p-6 sm:p-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div>
          <h1 className="text-4xl font-black text-[--mist-blue] tracking-tight">
            STUDENT PORTAL
          </h1>
          <p className="text-slate-600 font-bold mt-1 uppercase tracking-wide">
            {profile.full_name} | {profile.student_id || 'No ID Set'}
          </p>
        </div>
        <Link 
          href="/submit" 
          className="bg-[--mist-yellow] text-[--mist-blue] px-8 py-4 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-white border-2 border-[--mist-blue] shadow-[4px_4px_0px_0px_rgba(0,51,102,1)] active:translate-y-1 active:shadow-none transition-all"
        >
          + New Research Check
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        <div className="bg-white p-8 rounded-2xl border-2 border-[--mist-blue] shadow-sm">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Submissions</p>
          <p className="text-4xl font-black text-[--mist-blue]">{reports?.length || 0}</p>
        </div>
        <div className="bg-[--mist-blue] p-8 rounded-2xl shadow-lg border-2 border-[--mist-blue]">
          <p className="text-xs font-black text-slate-300 uppercase tracking-widest mb-1">Latest Score</p>
          <p className="text-4xl font-black text-[--mist-yellow]">
            {reports?.[0] ? `${Math.round(reports[0].similarity_score * 100)}%` : '0%'}
          </p>
        </div>
        <div className="bg-white p-8 rounded-2xl border-2 border-[--mist-blue] shadow-sm">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Account Status</p>
          <p className="text-2xl font-black text-[--mist-blue] uppercase">{profile.status}</p>
        </div>
      </div>

      {/* Reports Section */}
      <div className="bg-white rounded-2xl border-2 border-[--mist-blue] overflow-hidden shadow-xl">
        <div className="bg-[--mist-blue] p-4 border-b-2 border-[--mist-blue]">
          <h2 className="text-white font-black uppercase tracking-widest text-sm">Recent Similarity Reports</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b-2 border-slate-200">
                <th className="p-5 font-black text-[--mist-blue] text-xs uppercase">Date Filed</th>
                <th className="p-5 font-black text-[--mist-blue] text-xs uppercase">Research Title</th>
                <th className="p-5 font-black text-[--mist-blue] text-xs uppercase">Risk Level</th>
                <th className="p-5 font-black text-[--mist-blue] text-xs uppercase">Match %</th>
                <th className="p-5 font-black text-[--mist-blue] text-xs uppercase text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-slate-100">
              {reports?.map((report) => (
                <tr key={report.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-5 text-sm font-bold text-slate-600">
                    {new Date(report.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-5 font-black text-[--mist-blue] max-w-xs truncate">
                    {report.input_title}
                  </td>
                  <td className="p-5">
                    <span className={`px-4 py-1.5 rounded-full text-xs font-black border-2 ${
                      report.risk_level === 'RED' ? 'bg-red-50 text-red-700 border-red-700' :
                      report.risk_level === 'ORANGE' ? 'bg-orange-50 text-orange-700 border-orange-700' :
                      report.risk_level === 'YELLOW' ? 'bg-yellow-50 text-yellow-700 border-yellow-700' :
                      'bg-green-50 text-green-700 border-green-700'
                    }`}>
                      {report.risk_level}
                    </span>
                  </td>
                  <td className="p-5 font-mono font-black text-lg text-[--mist-blue]">
                    {Math.round(report.similarity_score * 100)}%
                  </td>
                  <td className="p-5 text-right">
                    <Link 
                      href={`/dashboard/report/${report.id}`}
                      className="inline-block bg-[--mist-blue] text-white px-4 py-2 rounded-lg font-bold text-xs uppercase hover:bg-[--mist-yellow] hover:text-[--mist-blue] transition-all"
                    >
                      View Report
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {(!reports || reports.length === 0) && (
            <div className="p-20 text-center">
              <p className="text-slate-400 font-bold italic">No research records found in your profile.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}