// components/EditAdviserTrigger.js
'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function EditAdviserTrigger({ profile }) {
  const [isOpen, setIsOpen] = useState(false);
  const [advisers, setAdvisers] = useState([]);
  const [selectedAdviser, setSelectedAdviser] = useState(profile.adviser_id || '');
  const [loading, setLoading] = useState(false);
  
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    if (isOpen) {
      async function fetchAdvisers() {
        const { data } = await supabase
          .from('profiles')
          .select('id, full_name')
          .eq('role', 'research_adviser')
          .eq('department_id', profile.department_id)
          .eq('status', 'active');
        if (data) setAdvisers(data);
      }
      fetchAdvisers();
    }
  }, [isOpen, profile.department_id, supabase]);

  const handleUpdate = async () => {
    setLoading(true);
    const { error } = await supabase
      .from('profiles')
      .update({ adviser_id: selectedAdviser || null })
      .eq('id', profile.id);

    if (!error) {
      setIsOpen(false);
      router.refresh();
    }
    setLoading(false);
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="bg-slate-100 hover:bg-[#FFCC00] text-[#003366]/60 hover:text-[#003366] px-3 py-1 rounded-full transition-all text-[10px] font-black tracking-tighter border border-slate-200 uppercase"
      >
        {profile.adviser_full_name ? 'Change Adviser' : 'Assign Adviser'}
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-[2rem] p-8 shadow-2xl border-b-4 border-slate-200">
            <h2 className="text-xl font-black text-[#003366] uppercase mb-1 tracking-tighter">Research Adviser</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase mb-6 tracking-widest">
              Dept: {profile.department_code}
            </p>
            
            <select 
              className="w-full p-4 bg-slate-50 border-none rounded-2xl text-sm font-medium text-slate-600 outline-none focus:ring-2 focus:ring-[#003366] mb-6 appearance-none"
              value={selectedAdviser}
              onChange={(e) => setSelectedAdviser(e.target.value)}
            >
              <option value="">No Adviser Assigned</option>
              {advisers.map(adv => (
                <option key={adv.id} value={adv.id}>{adv.full_name}</option>
              ))}
            </select>

            <div className="flex gap-2">
              <button 
                onClick={() => setIsOpen(false)}
                className="flex-1 py-3 text-xs font-black text-slate-400 uppercase tracking-widest"
              >
                Cancel
              </button>
              <button 
                onClick={handleUpdate}
                disabled={loading}
                className="flex-[2] py-3 bg-[#FFCC00] text-[#003366] rounded-xl font-black uppercase text-xs tracking-widest shadow-md active:scale-95 transition-all"
              >
                {loading ? 'Wait...' : 'Save Change'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}