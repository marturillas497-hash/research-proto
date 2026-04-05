// app/submit/page.js
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function StudentSubmitPage() {
  const [loading, setLoading] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [formData, setFormData] = useState({ title: '', abstract: '' });

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    async function getProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, department_id, departments(code)')
          .eq('id', user.id)
          .single();
        setUserProfile({
          ...profile,
          department_code: profile?.departments?.code || 'N/A',
        });
      }
    }
    getProfile();
  }, [supabase]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userProfile?.department_id) return alert("Profile error: Department not found.");
    setLoading(true);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.abstract,
        }),
      });

      const report = await res.json();
      if (report.error) throw new Error(report.error);

      router.push(`/dashboard/report/${report.id}`);
    } catch (error) {
      console.error("Consultation Error:", error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 sm:p-10 bg-[#F0F0F0] min-h-screen font-sans">
      <Link href="/dashboard" className="inline-block border-4 border-black bg-white px-6 py-2 font-black text-xs uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-[#FFCC00] transition-all mb-8">
        ← Back to Dashboard
      </Link>

      <div className="bg-white border-4 border-black p-8 md:p-12 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
        <header className="mb-10 border-b-4 border-black pb-6">
          <h1 className="text-5xl font-black text-[#003366] uppercase tracking-tighter italic leading-none">Research Consultant</h1>
          <p className="mt-4 text-xs font-black uppercase text-black">
            Analyzing for:{' '}
            <span className="bg-[#FFCC00] px-2 border-2 border-black ml-1">
              {userProfile?.department_code || '...'}
            </span>
          </p>
          {userProfile?.full_name && (
            <p className="mt-1 text-[10px] font-bold uppercase text-slate-400">
              Logged in as: {userProfile.full_name}
            </p>
          )}
        </header>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-slate-500">
              Proposed Research Title
            </label>
            <input
              required
              placeholder="ENTER YOUR TITLE..."
              className="w-full p-4 border-4 border-black font-bold uppercase outline-none focus:bg-[#FFCC00] placeholder:text-slate-200"
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-slate-500">
              Your Idea / Problem Statement
            </label>
            <textarea
              required
              rows={10}
              placeholder="DESCRIBE WHAT YOU WANT TO STUDY..."
              className="w-full p-4 border-4 border-black font-medium outline-none focus:bg-[#FFCC00] resize-none placeholder:text-slate-200"
              onChange={(e) => setFormData({ ...formData, abstract: e.target.value })}
            />
          </div>

          <button
            disabled={loading || !userProfile}
            className="w-full py-6 bg-[#003366] text-white border-4 border-black font-black uppercase tracking-[0.3em] text-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none transition-all disabled:opacity-50"
          >
            {loading ? 'CONSULTING ARCHIVES...' : 'START AI ANALYSIS'}
          </button>
        </form>
      </div>

      <div className="mt-8 text-center">
        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
          Powered by Semantic Vector Search & Gemini AI
        </p>
      </div>
    </div>
  );
}