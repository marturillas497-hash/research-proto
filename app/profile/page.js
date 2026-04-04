// app/profile/page.js
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import AdviserSelector from '@/components/profile/AdviserSelector';

export default async function ProfilePage() {
  const supabase = await createClient();
  
  // 1. Authenticate
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // 2. Fetch Profile with joined Adviser data
  const { data: profile } = await supabase
    .from('profiles')
    .select('*, research_advisers(name, department)')
    .eq('id', user.id)
    .single();

  // 3. Fetch Similarity Scan History
  const { data: history } = await supabase
    .from('similarity_checks')
    .select('*')
    .eq('student_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <div className="min-h-screen bg-slate-50">
      {/* BRANDING LABEL */}
      <div className="bg-white border-b border-slate-200 px-6 py-2">
        <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">
          MIST-RDS v3: Research Library System
        </p>
      </div>

      <div className="max-w-5xl mx-auto p-8">
        <header className="mb-10">
          <h1 className="text-3xl font-extrabold text-slate-900">Student Dashboard</h1>
          <p className="text-slate-500">Manage your research profile and check scan history.</p>
        </header>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* PERSONAL INFO CARD */}
          <div className="lg:col-span-1 p-6 bg-white rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6">Student Identity</h2>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-slate-500">Full Name</p>
                <p className="font-semibold text-slate-800">{profile?.full_name || 'Not Set'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Student ID</p>
                <p className="font-mono text-sm text-slate-700">{profile?.student_id || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Department</p>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                  {profile?.department || 'General'}
                </span>
              </div>
            </div>
          </div>

          {/* ADVISER SELECTION CARD */}
          <div className="lg:col-span-2 p-6 bg-white rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Research Guidance</h2>
            <div className="flex flex-col h-full justify-between">
              <div>
                {profile?.research_advisers ? (
                  <div className="mb-6">
                    <p className="text-xl font-bold text-slate-900">{profile.research_advisers.name}</p>
                    <p className="text-sm text-slate-500">Assigned Adviser • {profile.research_advisers.department}</p>
                  </div>
                ) : (
                  <div className="mb-6 p-4 bg-amber-50 border border-amber-100 rounded-lg">
                    <p className="text-sm text-amber-700 font-medium italic">No adviser assigned. Please select one below to proceed with research submissions.</p>
                  </div>
                )}
              </div>
              
              {/* THE SELECTOR COMPONENT */}
              <AdviserSelector initialAdviserId={profile?.adviser_id} />
            </div>
          </div>
        </div>

        {/* SIMILARITY TABLE */}
        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-6">Similarity Check History</h2>
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Manuscript Title</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Similarity Score</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Scan Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {history?.length > 0 ? history.map((check) => (
                  <tr key={check.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-slate-800 truncate max-w-md">{check.title}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-slate-100 rounded-full h-1.5">
                          <div 
                            className={`h-1.5 rounded-full ${check.similarity_score > 0.2 ? 'bg-red-500' : 'bg-emerald-500'}`}
                            style={{ width: `${Math.min(check.similarity_score * 100, 100)}%` }}
                          ></div>
                        </div>
                        <span className={`text-xs font-bold ${check.similarity_score > 0.2 ? 'text-red-600' : 'text-emerald-600'}`}>
                          {(check.similarity_score * 100).toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400">
                      {new Date(check.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="3" className="px-6 py-10 text-center text-slate-400 italic text-sm">
                      No scans found. Start by checking a document for similarity.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}