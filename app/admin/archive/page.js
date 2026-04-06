// app/admin/archive/page.js
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
  const [suggestedId, setSuggestedId] = useState('');
  const [lastId, setLastId] = useState(null);

  const supabase = createClient();

  // 1. Fetch departments on mount
  useEffect(() => {
    async function getDepts() {
      const { data } = await supabase.from('departments').select('*').order('code');
      if (data) setDepartments(data);
    }
    getDepts();
  }, [supabase]);

  // 2. Fetch last Accession ID and calculate next suggestion
  useEffect(() => {
    async function fetchLastId() {
      if (!selectedDept) { 
        setLastId(null); 
        setSuggestedId('');
        return; 
      }
      
      const { data, error } = await supabase
        .from('abstracts')
        .select('accession_id')
        .eq('department_id', selectedDept)
        .order('created_at', { ascending: false })
        .limit(1);

      if (!error && data.length > 0) {
        const last = data[0].accession_id;
        setLastId(last);
        
        // Auto-increment logic: Find trailing numbers (e.g., "CS-001" -> "CS-002")
        const match = last.match(/(\d+)$/);
        if (match) {
          const nextNum = parseInt(match[1]) + 1;
          const padding = match[1].length;
          const nextStr = last.replace(/\d+$/, String(nextNum).padStart(padding, '0'));
          setSuggestedId(nextStr);
        }
      } else {
        setLastId('None (First Entry)');
        setSuggestedId('');
      }
    }
    fetchLastId();
  }, [selectedDept, supabase]);

  const handleArchive = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const abstract_text = formData.get('abstract_text');
    const title = formData.get('title').trim();
    const accession_id = formData.get('accession_id').trim();

    setLoading(true);
    // Notify librarian that the first run takes longer due to model download
    setMessage({ type: 'info', text: '📡 INITIALIZING SEMANTIC ENGINE (45MB DOWNLOAD ON FIRST RUN)...' });

    try {
      // Generate 384-dim embedding via Xenova/Transformers
      const embedding = await generateEmbedding(`${title}: ${abstract_text}`);

      if (!embedding || embedding.length !== 384) {
        throw new Error("Vector dimension mismatch. Expected 384 dimensions.");
      }

      const { error } = await supabase.from('abstracts').insert([{
        title,
        abstract_text,
        authors: formData.get('authors'),
        accession_id: formData.get('accession_id'),
        year: parseInt(formData.get('year')),
        department_id: selectedDept,
        embedding: embedding, // pgvector handles the array conversion
        status: 'archived'
      }]);

      if (error) {
        if (error.code === '23505') throw new Error("Title or Accession ID already exists in archive.");
        throw error;
      }

      setMessage({ type: 'success', text: '✅ RESEARCH ARCHIVED AND SEMANTICALLY INDEXED.' });
      e.target.reset();
      setSelectedDept('');
      setSuggestedId('');
    } catch (err) {
      console.error("Archive Error:", err);
      setMessage({ type: 'error', text: `❌ ERROR: ${err.message}` });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 sm:p-10 bg-[#F0F0F0] min-h-screen font-sans">
      <Link href="/dashboard" className="inline-block border-2 border-black bg-white px-4 py-2 font-black text-[10px] uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-[#FFCC00] transition-all mb-8">
        ← Return to Portal
      </Link>

      <div className="bg-white border-4 border-black p-8 md:p-12 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
        <header className="mb-10 border-b-4 border-black pb-4">
          <h1 className="text-5xl font-black text-[#003366] uppercase tracking-tighter italic">Research Archive</h1>
          <p className="text-xs font-black text-black uppercase tracking-widest mt-2">
            Librarian Tools: Manual Semantic Indexing
          </p>
        </header>

        <form onSubmit={handleArchive} className="space-y-8">
          {/* Title */}
          <div className="space-y-2">
            <label className="text-xs font-black text-black uppercase tracking-widest">Research Title</label>
            <input 
              name="title" 
              required 
              placeholder="e.g. BLOCKCHAIN-BASED VOTING SYSTEM" 
              className="w-full p-4 bg-white border-4 border-black font-bold text-black focus:bg-[#FFCC00] outline-none placeholder:text-gray-300" 
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Department */}
            <div className="space-y-2">
              <label className="text-xs font-black text-black uppercase tracking-widest">Department</label>
              <select
                name="department" 
                required 
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="w-full p-4 bg-white border-4 border-black font-bold text-black focus:bg-[#FFCC00] outline-none appearance-none"
              >
                <option value="">-- SELECT DEPT --</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.id}>{dept.code} - {dept.name}</option>
                ))}
              </select>
            </div>

            {/* Accession ID */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-black text-black uppercase tracking-widest">Accession ID</label>
                {selectedDept && (
                  <span className="text-[10px] font-black bg-black text-[#FFCC00] px-2 py-0.5 uppercase shadow-[2px_2px_0px_0px_rgba(255,204,0,1)]">
                    Last: {lastId}
                  </span>
                )}
              </div>
              <input 
                name="accession_id" 
                required 
                defaultValue={suggestedId}
                key={suggestedId} // Force re-render when suggestion changes
                placeholder="e.g. BSCS-2024-001" 
                className="w-full p-4 bg-white border-4 border-black font-bold text-black focus:bg-[#FFCC00] outline-none placeholder:text-gray-300 uppercase" 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-xs font-black text-black uppercase tracking-widest">Year Published</label>
              <input 
                name="year" 
                type="number" 
                required 
                defaultValue={new Date().getFullYear()} 
                className="w-full p-4 bg-white border-4 border-black font-bold text-black focus:bg-[#FFCC00] outline-none" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-black uppercase tracking-widest">Authors</label>
              <input 
                name="authors" 
                required 
                placeholder="Doe, John; Smith, Jane" 
                className="w-full p-4 bg-white border-4 border-black font-bold text-black focus:bg-[#FFCC00] outline-none placeholder:text-gray-300" 
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-black uppercase tracking-widest">Abstract Text</label>
            <textarea 
              name="abstract_text" 
              required 
              rows={8} 
              placeholder="Paste the full research abstract for vector mapping..." 
              className="w-full p-5 bg-white border-4 border-black font-medium text-black outline-none resize-none focus:bg-[#FFCC00] placeholder:text-gray-300" 
            />
          </div>

          <button 
            disabled={loading} 
            className="w-full py-6 bg-[#003366] text-white border-4 border-black font-black uppercase tracking-[0.3em] text-lg hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none transition-all shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50"
          >
            {loading ? 'PROCESSING VECTOR...' : '🚀 ADD TO ARCHIVE'}
          </button>
        </form>

        {message.text && (
          <div className={`mt-10 p-6 border-4 border-black font-black uppercase text-xs tracking-widest shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] ${
            message.type === 'error' ? 'bg-red-500 text-white' : 
            message.type === 'info' ? 'bg-[#FFCC00] text-black' : 
            'bg-green-500 text-white'
          }`}>
            {message.text}
          </div>
        )}
      </div>
    </div>
  );
}