// app/profile/page.js
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [metadata, setMetadata] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [formData, setFormData] = useState({ id_number: '', year_level: '', section: '' });

  const supabase = createClient();

  useEffect(() => {
    async function fetchProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: prof } = await supabase
        .from('profiles')
        .select('*, departments(name, code)')
        .eq('id', user.id)
        .single();

      const { data: meta } = await supabase
        .from('student_metadata')
        .select('*, adviser:adviser_id(full_name)')
        .eq('profile_id', user.id)
        .maybeSingle();

      setProfile(prof);
      setMetadata(meta);
      setFormData({
        id_number: meta?.id_number || '',
        year_level: meta?.year_level || '',
        section: meta?.section || '',
      });
      setLoading(false);
    }
    fetchProfile();
  }, [supabase]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (metadata) {
        // Update existing row
        const { error } = await supabase
          .from('student_metadata')
          .update({
            id_number: formData.id_number || null,
            year_level: formData.year_level || null,
            section: formData.section || null,
          })
          .eq('profile_id', user.id);
        if (error) throw error;
      } else {
        // Insert if no row exists yet (edge case)
        const { error } = await supabase
          .from('student_metadata')
          .insert({
            profile_id: user.id,
            id_number: formData.id_number || null,
            year_level: formData.year_level || null,
            section: formData.section || null,
          });
        if (error) throw error;
      }

      setMessage({ type: 'success', text: '✅ Profile updated successfully.' });
    } catch (err) {
      setMessage({ type: 'error', text: `❌ ${err.message}` });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="p-20 font-black animate-pulse text-center uppercase tracking-widest text-[#003366]">
      Loading Profile...
    </div>
  );

  // Only students have editable metadata
  const isStudent = profile?.role === 'student';

  return (
    <div className="max-w-4xl mx-auto p-6 sm:p-10 bg-[#F0F0F0] min-h-screen font-sans">
      <Link href="/dashboard" className="inline-block border-4 border-black bg-white px-6 py-2 font-black text-xs uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-[#FFCC00] mb-8 transition-all">
        ← Back to Dashboard
      </Link>

      <div className="bg-white border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] p-8 md:p-12">
        <header className="mb-10 border-b-4 border-black pb-6">
          <h1 className="text-5xl font-black text-[#003366] uppercase tracking-tighter italic">My Profile</h1>
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-2">
            {profile?.role} — {profile?.departments?.name || 'No Department'}
          </p>
        </header>

        {/* READ-ONLY INFO */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Full Name</p>
            <p className="font-black text-xl text-[#003366] uppercase">{profile?.full_name}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Department</p>
            <p className="font-black text-xl text-[#003366] uppercase">{profile?.departments?.code || 'N/A'}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Role</p>
            <p className="font-black text-xl text-[#003366] uppercase">{profile?.role}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Status</p>
            <p className="font-black text-xl text-[#003366] uppercase flex items-center gap-2">
              <span className="w-3 h-3 bg-[#00FF66] border-2 border-black inline-block" />
              {profile?.status}
            </p>
          </div>
          {isStudent && (
            <div className="space-y-1 md:col-span-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Assigned Adviser</p>
              <p className="font-black text-xl text-[#003366] uppercase">
                {metadata?.adviser?.full_name || (
                  <span className="text-slate-300 italic">No adviser assigned yet</span>
                )}
              </p>
            </div>
          )}
        </div>

        {/* EDITABLE SECTION — students only */}
        {isStudent && (
          <form onSubmit={handleSave} className="space-y-6 border-t-4 border-black pt-8">
            <h2 className="text-xs font-black uppercase tracking-widest text-black mb-6">
              Edit Student Details
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest">id_number</label>
                <input
                  type="text"
                  placeholder="e.g. 123456789012"
                  value={formData.id_number}
                  onChange={(e) => setFormData({ ...formData, id_number: e.target.value })}
                  className="w-full p-4 border-4 border-black font-bold outline-none focus:bg-[#FFCC00] placeholder:text-slate-300"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest">Year Level</label>
                <select
                  value={formData.year_level}
                  onChange={(e) => setFormData({ ...formData, year_level: e.target.value })}
                  className="w-full p-4 border-4 border-black font-bold outline-none focus:bg-[#FFCC00] appearance-none bg-white"
                >
                  <option value="">-- Select --</option>
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                  <option value="4th Year">4th Year</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest">Section</label>
                <input
                  type="text"
                  placeholder="e.g. A"
                  value={formData.section}
                  onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                  className="w-full p-4 border-4 border-black font-bold outline-none focus:bg-[#FFCC00] placeholder:text-slate-300"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-5 bg-[#003366] text-white border-4 border-black font-black uppercase tracking-[0.2em] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none transition-all disabled:opacity-50"
            >
              {saving ? 'SAVING...' : 'SAVE CHANGES'}
            </button>

            {message.text && (
              <div className={`p-4 border-4 border-black font-black uppercase text-xs tracking-widest ${
                message.type === 'error' ? 'bg-red-500 text-white' : 'bg-green-400 text-black'
              }`}>
                {message.text}
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
}