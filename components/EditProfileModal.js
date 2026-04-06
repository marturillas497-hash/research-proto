// components/EditProfileModal.js
'use client';
import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function EditProfileModal({ profile, onClose, onRefresh }) {
  const [advisers, setAdvisers] = useState([]);
  const [selectedAdviser, setSelectedAdviser] = useState(profile.adviser_id || '');
  const [loading, setLoading] = useState(false);
  
  // Memoize the supabase client to prevent unnecessary re-renders/effect triggers
  const supabase = useMemo(() => createClient(), []);

  // Fetch advisers for the student's department
  useEffect(() => {
    async function fetchAdvisers() {
      if (!profile?.department_id) return;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('role', 'research_adviser')
        .eq('department_id', profile.department_id)
        .eq('status', 'active');
        
      if (!error && data) setAdvisers(data);
    }
    fetchAdvisers();
  }, [profile.department_id, supabase]);

  const handleUpdate = async () => {
    setLoading(true);
    const { error } = await supabase
      .from('profiles')
      .update({ adviser_id: selectedAdviser || null })
      .eq('id', profile.id);

    if (!error) {
      onRefresh(); 
      onClose();   
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      {/* Container with Neo-Brutalist Shadow */}
      <div className="bg-[#F0F0F0] w-full max-w-md border-4 border-black p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
        
        {/* Accent Corner Stamped Pattern */}
        <div className="absolute -top-6 -right-6 font-black text-6xl italic opacity-5 select-none pointer-events-none">
          EDIT
        </div>

        <h2 className="text-3xl font-black text-black uppercase italic tracking-tighter mb-8 flex items-center gap-3">
          <span className="w-3 h-8 bg-[#FFCC00] border-2 border-black"></span>
          Update Profile
        </h2>
        
        <div className="space-y-8">
          <div className="relative">
            <label className="text-[10px] font-black text-black uppercase tracking-[0.2em] mb-3 block">
              Assign Research Adviser
            </label>
            
            <div className="relative group">
              <select 
                className="w-full p-4 bg-white border-4 border-black rounded-none text-sm font-black text-black uppercase outline-none appearance-none focus:bg-[#FFCC00] transition-colors cursor-pointer pr-10 shadow-[4px_4px_0px_0px_black] active:translate-x-1 active:translate-y-1 active:shadow-none"
                value={selectedAdviser}
                onChange={(e) => setSelectedAdviser(e.target.value)}
              >
                <option value="" className="bg-white">-- NO ADVISER ASSIGNED --</option>
                {advisers.map(adv => (
                  <option key={adv.id} value={adv.id} className="bg-white">
                    {adv.full_name}
                  </option>
                ))}
              </select>
              {/* Custom Arrow */}
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none font-black">
                ▼
              </div>
            </div>

            <div className="mt-4 p-3 bg-black text-white text-[9px] font-bold uppercase tracking-widest leading-tight">
              Scope: {profile.department_code || 'N/A'} DEPARTMENT ONLY
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button 
              onClick={onClose}
              className="flex-1 py-4 border-4 border-black font-black uppercase text-xs tracking-widest hover:bg-red-500 hover:text-white transition-all active:translate-x-1 active:translate-y-1"
            >
              Cancel
            </button>
            <button 
              onClick={handleUpdate}
              disabled={loading}
              className="flex-[2] py-4 bg-[#FFCC00] border-4 border-black text-black font-black uppercase text-xs tracking-widest shadow-[6px_6px_0px_0px_black] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : 'Sync Changes'}
            </button>
          </div>
        </div>

        {/* System ID Footer */}
        <div className="mt-8 pt-4 border-t-2 border-black/10 flex justify-between text-[8px] font-black opacity-30 uppercase tracking-[0.3em]">
          <span>Ref: {profile.id?.slice(0, 12)}</span>
          <span>Proto-Research v2.0</span>
        </div>
      </div>
    </div>
  );
}