// app/admin/approvals/page.js
import { createClient } from '@/lib/supabase/server';
import AdminNavbar from '@/components/admin/Navbar';
import ApprovalButtons from './ApprovalButtons';

export default async function ApprovalsPage() {
  // Manual check for now since we're handling page-level security
  const supabase = await createClient();

  const { data: pending } = await supabase
    .from('profiles')
    .select('*, departments(name, code)')
    .eq('role', 'research_adviser')
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  return (
    <div className="min-h-screen bg-[#F0F0F0]">
      {/* 1. Added the Navbar back since it's not in the root layout */}
      <AdminNavbar />

      <div className="max-w-7xl mx-auto p-6 sm:p-10">
        {/* HEADER */}
        <div className="mb-12">
          <span className="bg-[#FFCC00] border-2 border-black px-3 py-1 text-[10px] font-black uppercase mb-4 inline-block shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            Admin Management
          </span>
          <h1 className="text-6xl font-black text-[#003366] tracking-tighter uppercase leading-none italic">
            Faculty Approvals
          </h1>
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-2">
            {pending?.length || 0} pending application{pending?.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* LIST */}
        <div className="space-y-4">
          {pending?.length > 0 ? (
            pending.map((adviser) => (
              <div 
                key={adviser.id} 
                className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8 transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[10px_10px_0px_0px_rgba(0,0,0,1)]"
              >
                <div className="flex flex-col md:flex-row justify-between gap-6 items-center">
                  <div className="space-y-2 w-full">
                    <h2 className="text-2xl font-black text-[#003366] uppercase">
                      {adviser.full_name || 'Unnamed Faculty'}
                    </h2>
                    <div className="flex flex-wrap gap-4 text-[10px] font-black uppercase">
                      <span className="bg-black text-[#FFCC00] px-2 py-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        {adviser.departments?.code || 'NO-DEPT'}
                      </span>
                      <span className="text-slate-500 py-1 border-b-2 border-black">
                        {adviser.departments?.name || 'Department Not Set'}
                      </span>
                      <span className="text-slate-400 py-1">
                        Applied: {new Date(adviser.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                  </div>
                  
                  {/* CLIENT COMPONENT FOR ACTIONS */}
                  <div className="flex-shrink-0">
                    <ApprovalButtons adviserId={adviser.id} />
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="border-4 border-dashed border-slate-300 p-24 text-center bg-white/50">
              <p className="font-black uppercase text-slate-300 text-lg tracking-[0.2em]">
                No pending applications
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}