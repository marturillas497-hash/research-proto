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
  const [statusMessage, setStatusMessage] = useState('');

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    async function getProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // FIX: Explicitly specifying the relationship to avoid ambiguity
        // If your foreign key column in student_metadata is named differently, 
        // change '!profile_id' to match your column name.
        const { data: profile, error } = await supabase
          .from('profiles')
          .select(`
            full_name, 
            department_id, 
            departments(code),
            student_metadata!profile_id(lrn, year_level)
          `)
          .eq('id', user.id)
          .single();

        if (error) {
          console.error("Profile Fetch Error:", error.message);
          return;
        }

        setUserProfile({
          ...profile,
          department_code: profile?.departments?.code || 'N/A',
          // Accessing metadata from the joined object
          metadata: profile?.student_metadata?.[0] || null
        });
      }
    }
    getProfile();
  }, [supabase]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userProfile?.department_id) return alert("Profile error: Department not found.");
    
    setLoading(true);
    setStatusMessage('MAPPING TOPIC VECTORS...');

    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      setStatusMessage('CROSS-REFERENCING ARCHIVES...');

      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.abstract,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Analysis failed");
      }

      setStatusMessage('CALCULATING RELEVANCE...');
      const report = await res.json();

      router.push(`/dashboard/report/${report.id}`);
    } catch (error) {
      console.error("Consultation Error:", error);
      alert(error.message);
      setLoading(false);
      setStatusMessage('');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 sm:p-10 bg-[#F0F0F0] min-h-screen font-sans selection:bg-[#FFCC00]">
      <Link 
        href="/dashboard" 
        className="inline-block border-4 border-black bg-white px-6 py-2 font-black text-xs uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-[#FFCC00] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all mb-8"
      >
        ← Back to Dashboard
      </Link>

      <div className="bg-white border-4 border-black p-8 md:p-12 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
        <header className="mb-10 border-b-4 border-black pb-6">
          <div className="flex justify-between items-start">
            <h1 className="text-5xl font-black text-[#003366] uppercase tracking-tighter italic leading-none">
              Research <br /> Consultant
            </h1>
            <div className="text-right">
               <span className="bg-black text-white px-3 py-1 font-black text-[10px] uppercase tracking-widest italic">
                v2.0 Beta
              </span>
            </div>
          </div>
          
          <div className="mt-6 flex flex-wrap gap-4">
            <p className="text-xs font-black uppercase text-black">
              Scope: 
              <span className="bg-[#FFCC00] px-2 border-2 border-black ml-2 inline-block">
                {userProfile?.department_code || 'LOADING...'}
              </span>
            </p>
            {userProfile?.full_name && (
              <p className="text-xs font-black uppercase text-slate-400">
                Author: <span className="text-black">{userProfile.full_name}</span>
              </p>
            )}
          </div>
        </header>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
              Proposed Research Title
            </label>
            <input
              required
              disabled={loading}
              placeholder="E.G., CLOUD-BASED DATA SYNCHRONIZATION..."
              className="w-full p-5 border-4 border-black font-black uppercase outline-none focus:bg-[#FFCC00] placeholder:text-slate-300 transition-colors disabled:opacity-50 text-[#003366]"
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
              Extended Abstract / Problem Statement
            </label>
            <textarea
              required
              disabled={loading}
              rows={8}
              placeholder="DESCRIBE THE CORE PROBLEM, THE TECHNOLOGY USED, AND THE TARGET BENEFICIARIES..."
              className="w-full p-5 border-4 border-black font-bold outline-none focus:bg-[#FFCC00] resize-none placeholder:text-slate-300 transition-colors disabled:opacity-50 text-sm leading-relaxed"
              onChange={(e) => setFormData({ ...formData, abstract: e.target.value })}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !userProfile}
            className={`w-full py-6 border-4 border-black font-black uppercase tracking-[0.3em] text-xl transition-all relative overflow-hidden
              ${loading 
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                : 'bg-[#003366] text-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none'
              }`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-3">
                <span className="animate-spin text-2xl">⚙️</span>
                {statusMessage}
              </span>
            ) : (
              'RUN SEMANTIC SCAN'
            )}
          </button>
        </form>
      </div>

      <div className="mt-8 flex flex-col items-center gap-2">
        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest text-center">
          Powered by Semantic Vector Search
        </p>
        <div className="flex gap-2">
          <div className="h-2 w-2 bg-green-500 border border-black rounded-full animate-pulse" />
          <div className="h-2 w-2 bg-[#003366] border border-black rounded-full" />
          <div className="h-2 w-2 bg-[#FFCC00] border border-black rounded-full" />
        </div>
      </div>
    </div>
  );
}