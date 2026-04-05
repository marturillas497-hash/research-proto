// app/dashboard/page.js
import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/api-auth';
import { getFullProfile } from '@/lib/supabase/queries';
import Link from 'next/link';
import EditAdviserTrigger from '@/components/EditAdviserTrigger';

export default async function DashboardPage() {
  const { user } = await requireAuth();
  const supabase = await createClient();
  const profile = await getFullProfile(supabase, user.id);

  if (profile?.role === 'research_adviser' && profile?.status === 'pending') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <div className="bg-white p-10 rounded-3xl border-4 border-[--mist-blue] shadow-[8px_8px_0px_0px_rgba(0,51,102,1)]">
          <h1 className="text-3xl font-black text-[--mist-blue] uppercase mb-4">Account Pending</h1>
          <p className="text-slate-600 font-bold max-w-md mx-auto uppercase">
            Your Adviser account is currently being reviewed. 
            Please contact the admin for activation.
          </p>
        </div>
      </div>
    );
  }

  let query = supabase.from('researches').select('*');
  if (profile?.role === 'student') {
    query = query.eq('student_id', user.id);
  }

  const { data: researches } = await query.order('created_at', { ascending: false });

  return (
    <div className="max-w-7xl mx-auto p-6 sm:p-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div>
          <h1 className="text-5xl font-black text-[#003366] tracking-tighter uppercase mb-2">
            {profile?.role === 'research_adviser' ? 'Adviser Portal' : 'Student Portal'}
          </h1>
          
          <div className="flex flex-wrap items-center gap-3 text-slate-500 font-bold uppercase tracking-wide text-xs">
            <span className="text-[#003366]">{profile?.full_name}</span>
            
            {profile?.role === 'student' && (
              <div className="flex items-center gap-3">
                <EditAdviserTrigger profile={profile} />
                <span className="text-slate-300">|</span>
              </div>
            )}
            
            <span>{profile?.department_code}</span>
            <span className="text-slate-300">|</span>
            <span>{profile?.student_id || 'FACULTY'}</span>
            
            {profile?.role === 'student' && (
               <>
                <span className="text-slate-300">|</span>
                <span className="bg-slate-100 px-2 py-0.5 rounded text-[#003366]">{profile?.year_level}-{profile?.section}</span>
               </>
            )}
          </div>
        </div>
        
        {profile?.role === 'student' && (
          <Link 
            href="/submit" 
            className="bg-white text-[#003366] px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest border-2 border-[#003366] shadow-[4px_4px_0px_0px_rgba(0,51,102,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
          >
            + New Research Proposal
          </Link>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        <div className="bg-white p-8 rounded-[2rem] border-2 border-[#003366] shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
            {profile?.role === 'student' ? 'My Submissions' : 'Total Proposals'}
          </p>
          <p className="text-5xl font-black text-[#003366]">{researches?.length || 0}</p>
        </div>

        <div className="bg-white p-8 rounded-[2rem] border-2 border-[#003366] shadow-sm flex flex-col justify-center">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Department</p>
          <p className="text-lg font-black text-[#003366] leading-tight uppercase">
            {profile?.department_name}
          </p>
        </div>

        <div className="bg-white p-8 rounded-[2rem] border-2 border-[#003366] shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Account Status</p>
          <p className="text-2xl font-black text-[#003366] uppercase flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            {profile?.status}
          </p>
        </div>
      </div>

      {/* Proposals Table */}
      <div className="bg-white rounded-[2rem] border-2 border-[#003366] overflow-hidden shadow-xl">
        <div className="bg-[#003366] p-6 border-b-2 border-[#003366]">
          <h2 className="text-white font-black uppercase tracking-widest text-sm">
             {profile?.role === 'student' ? 'Recent Proposals' : 'Incoming Proposals'}
          </h2>
        </div>
        <div className="overflow-x-auto p-4">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-100">
                <th className="p-5 font-black text-slate-400 text-[10px] uppercase tracking-widest">Date</th>
                <th className="p-5 font-black text-slate-400 text-[10px] uppercase tracking-widest">Title</th>
                <th className="p-5 font-black text-slate-400 text-[10px] uppercase tracking-widest">Status</th>
                <th className="p-5 font-black text-slate-400 text-[10px] uppercase tracking-widest text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {researches?.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-5 text-xs font-bold text-slate-500">
                    {new Date(item.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-5 font-black text-[#003366] text-sm uppercase truncate max-w-[200px]">
                    {item.title}
                  </td>
                  <td className="p-5">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black border ${
                      item.status === 'approved' ? 'bg-green-50 text-green-600 border-green-200' :
                      item.status === 'rejected' ? 'bg-red-50 text-red-600 border-red-200' :
                      'bg-yellow-50 text-yellow-600 border-yellow-200'
                    }`}>
                      {item.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-5 text-right">
                    <Link 
                      href={`/dashboard/report/${item.id}`}
                      className="text-[10px] font-black uppercase text-[#003366] hover:underline"
                    >
                      {profile?.role === 'research_adviser' ? 'Review' : 'View'}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {(!researches || researches.length === 0) && (
            <div className="p-20 text-center">
              <p className="text-slate-300 font-black uppercase text-xs tracking-widest">No proposals found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}