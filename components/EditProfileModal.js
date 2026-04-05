// components/EditProfileModal.js
'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function EditProfileModal({ profile, onClose, onRefresh }) {
  const [advisers, setAdvisers] = useState([]);
  const [selectedAdviser, setSelectedAdviser] = useState(profile.adviser_id || '');
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  // Fetch advisers for the student's department
  useEffect(() => {
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
  }, [profile.department_id]);

  const handleUpdate = async () => {
    setLoading(true);
    const { error } = await supabase
      .from('profiles')
      .update({ adviser_id: selectedAdviser || null })
      .eq('id', profile.id);

    if (!error) {
      onRefresh(); // Refresh the dashboard data
      onClose();   // Close modal
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl border-b-4 border-slate-200">
        <h2 className="text-2xl font-black text-[--mist-blue] uppercase mb-6">Update Profile</h2>
        
        <div className="space-y-6">
          <div>
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">
              Research Adviser
            </label>
            <select 
              className="w-full p-4 bg-slate-50 border-none rounded-2xl text-sm font-medium text-slate-600 outline-none focus:ring-2 focus:ring-[#003366]"
              value={selectedAdviser}
              onChange={(e) => setSelectedAdviser(e.target.value)}
            >
              <option value="">No Adviser Assigned</option>
              {advisers.map(adv => (
                <option key={adv.id} value={adv.id}>{adv.full_name}</option>
              ))}
            </select>
            <p className="mt-2 text-[10px] text-slate-400 font-bold uppercase">
              Note: You can only select advisers from the {profile.department_code} department.
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button 
              onClick={onClose}
              className="flex-1 py-4 font-black text-slate-400 uppercase text-xs tracking-widest hover:text-red-500 transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleUpdate}
              disabled={loading}
              className="flex-[2] py-4 bg-[#FFCC00] text-[#003366] rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-yellow-100 active:scale-95 transition-all"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}