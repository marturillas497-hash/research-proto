// app/admin/archive/page.js
/**
 * RESEARCH ARCHIVE (Admin)
 * Dynamic Department Loading + Accession tracking + Voyage AI Vectoring
 */

'use client';

import { useState, useEffect } from 'react';
import { generateEmbedding } from '@/lib/embeddings';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function ResearchArchivePage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState(''); 
  const [lastId, setLastId] = useState(null); 
  
  const supabase = createClient();

  // 1. Load Departments from DB
  useEffect(() => {
    async function getDepts() {
      const { data } = await supabase.from('departments').select('*').order('code');
      if (data) setDepartments(data);
    }
    getDepts();
  }, [supabase]);

  // 2. Track Accession ID for the "Prev" hint
  useEffect(() => {
    async function fetchLastId() {
      if (!selectedDept) {
        setLastId(null);
        return;
      }
      const { data, error } = await supabase
        .from('abstracts')
        .select('accession_id')
        .eq('department_id', selectedDept)
        .order('created_at', { ascending: false })
        .limit(1);

      if (!error && data.length > 0) {
        setLastId(data[0].accession_id);
      } else {
        setLastId('None (First Entry)');
      }
    }
    fetchLastId();
  }, [selectedDept, supabase]);

  const handleArchive = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: 'info', text: '📡 Generating 512-dim embedding...' });

    const formData = new FormData(e.target);
    
    try {
      const title = formData.get('title');
      const abstract_text = formData.get('abstract_text');
      
      // Generate Vector
      const embedding = await generateEmbedding(`${title}: ${abstract_text}`, 'document');

      // Direct Insert (No separate API route needed)
      const { error } = await supabase.from('abstracts').insert([
        {
          title,
          abstract_text,
          authors: formData.get('authors'),
          accession_id: formData.get('accession_id'), 
          year: parseInt(formData.get('year')),
          department_id: selectedDept, // Stores the Dept Code (e.g., BSIS)
          embedding,    
          status: 'archived'
        }
      ]);

      if (error) throw error;

      setMessage({ type: 'success', text: '✅ Research successfully archived and indexed!' });
      e.target.reset();
      setSelectedDept(''); 
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 sm:p-10">
      <Link href="/dashboard" className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-[#003366] transition-all">
        ← Return to Portal
      </Link>

      <div className="mt-8 bg-white border-4 border-[#003366] rounded-[2.5rem] p-10 shadow-[12px_12px_0px_0px_rgba(0,51,102,1)]">
        <div className="mb-10">
          <h1 className="text-4xl font-black text-[#003366] uppercase tracking-tighter">Research Archive</h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Librarian Access: Semantic Indexing</p>
        </div>

        <form onSubmit={handleArchive} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <label className="ml-4 text-[10px] font-black text-[#003366] uppercase tracking-widest">Research Title</label>
            <input name="title" required placeholder="Enter Title..." className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-[#003366] outline-none focus:ring-2 focus:ring-[#FFCC00]" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Department (Dynamic) */}
            <div className="space-y-2">
              <label className="ml-4 text-[10px] font-black text-[#003366] uppercase tracking-widest">Department</label>
              <select 
                name="department" required value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-[#003366] outline-none appearance-none"
              >
                <option value="">Select Department</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.code}>{dept.code} - {dept.name}</option>
                ))}
              </select>
            </div>

            {/* Accession ID with "Prev" Hint */}
            <div className="space-y-2">
              <div className="flex justify-between px-4">
                <label className="text-[10px] font-black text-[#003366] uppercase tracking-widest">Accession ID</label>
                {selectedDept && <span className="text-[9px] font-bold text-orange-500 italic">Prev: {lastId}</span>}
              </div>
              <input name="accession_id" required placeholder="e.g. BSIS-001" className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-[#003366] outline-none focus:ring-2 focus:ring-[#FFCC00]" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="ml-4 text-[10px] font-black text-[#003366] uppercase tracking-widest">Year Published</label>
              <input name="year" type="number" required defaultValue={new Date().getFullYear()} className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-[#003366] outline-none focus:ring-2 focus:ring-[#FFCC00]" />
            </div>
            <div className="space-y-2">
              <label className="ml-4 text-[10px] font-black text-[#003366] uppercase tracking-widest">Authors</label>
              <input name="authors" required placeholder="Lastname, Firstname" className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-[#003366] outline-none focus:ring-2 focus:ring-[#FFCC00]" />
            </div>
          </div>

          {/* Abstract */}
          <div className="space-y-2">
            <label className="ml-4 text-[10px] font-black text-[#003366] uppercase tracking-widest">Abstract Text</label>
            <textarea name="abstract_text" required rows={6} placeholder="Paste abstract..." className="w-full p-5 bg-slate-50 border-none rounded-3xl font-medium text-slate-600 outline-none resize-none focus:ring-2 focus:ring-[#FFCC00]" />
          </div>

          <button disabled={loading} className="w-full py-5 bg-[#003366] text-white rounded-2xl font-black uppercase tracking-[0.2em] text-sm hover:bg-[#FFCC00] hover:text-[#003366] transition-all shadow-lg active:scale-95 disabled:opacity-50">
            {loading ? '🚀 ARCHIVING...' : '🚀 ADD TO ARCHIVE'}
          </button>
        </form>

        {message.text && (
          <div className={`mt-8 p-4 rounded-xl text-center font-black uppercase text-[10px] tracking-widest border-2 ${
            message.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
          }`}>
            {message.text}
          </div>
        )}
      </div>
    </div>
  );
}