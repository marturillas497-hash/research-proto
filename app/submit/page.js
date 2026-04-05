// app/submit/page.js
'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SubmitProposal() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    abstract: '',
    keywords: '',
  });
  
  const supabase = createClient();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase.from('researches').insert([
      {
        title: formData.title,
        abstract: formData.abstract,
        keywords: formData.keywords,
        student_id: user.id,
        status: 'pending', // Default status
      }
    ]);

    if (!error) {
      router.push('/dashboard');
      router.refresh();
    } else {
      alert(error.message);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 sm:p-10">
      <Link href="/dashboard" className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-[#003366] transition-colors">
        ← Back to Dashboard
      </Link>
      
      <div className="mt-8 bg-white rounded-[2rem] border-2 border-[#003366] p-8 md:p-12 shadow-xl">
        <h1 className="text-4xl font-black text-[#003366] uppercase tracking-tighter mb-2">New Proposal</h1>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-10">Submit your research abstract for review</p>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Title Input */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-[#003366] uppercase tracking-[0.2em] ml-2">Research Title</label>
            <input
              required
              type="text"
              placeholder="Enter full research title..."
              className="w-full p-5 bg-slate-50 border-none rounded-2xl font-bold text-[#003366] focus:ring-2 focus:ring-[#FFCC00] outline-none placeholder:text-slate-300"
              onChange={(e) => setFormData({...formData, title: e.target.value})}
            />
          </div>

          {/* Abstract Textarea */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-[#003366] uppercase tracking-[0.2em] ml-2">Abstract</label>
            <textarea
              required
              rows={10}
              placeholder="Summarize your research (Problem, Methodology, Expected Outcome)..."
              className="w-full p-5 bg-slate-50 border-none rounded-2xl font-medium text-slate-700 focus:ring-2 focus:ring-[#FFCC00] outline-none placeholder:text-slate-300 resize-none"
              onChange={(e) => setFormData({...formData, abstract: e.target.value})}
            />
          </div>

          {/* Keywords */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-[#003366] uppercase tracking-[0.2em] ml-2">Keywords (Comma Separated)</label>
            <input
              type="text"
              placeholder="e.g. Public Policy, Governance, Urban Planning"
              className="w-full p-5 bg-slate-50 border-none rounded-2xl font-bold text-[#003366] focus:ring-2 focus:ring-[#FFCC00] outline-none placeholder:text-slate-300"
              onChange={(e) => setFormData({...formData, keywords: e.target.value})}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-6 bg-[#FFCC00] text-[#003366] rounded-2xl font-black uppercase tracking-[0.3em] shadow-lg shadow-yellow-100 hover:brightness-105 active:scale-[0.98] transition-all"
          >
            {loading ? 'Submitting...' : 'Submit Proposal'}
          </button>
        </form>
      </div>
    </div>
  );
}