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
  const [lastId, setLastId] = useState(null);

  const supabase = createClient();

  // Fetch departments (using UUID for value)
  useEffect(() => {
    async function getDepts() {
      const { data } = await supabase.from('departments').select('*').order('code');
      if (data) setDepartments(data);
    }
    getDepts();
  }, [supabase]);

  // Fetch last Accession ID to help the librarian with sequencing
  useEffect(() => {
    async function fetchLastId() {
      if (!selectedDept) { setLastId(null); return; }
      
      const { data, error } = await supabase
        .from('abstracts')
        .select('accession_id')
        .eq('department_id', selectedDept) // UUID filter 
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error("Fetch Error:", error);
        setLastId('Error fetching');
      } else {
        setLastId(data.length > 0 ? data[0].accession_id : 'None (First Entry)');
      }
    }
    fetchLastId();
  }, [selectedDept, supabase]);

  const handleArchive = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: 'info', text: '📡 GENERATING SEMANTIC VECTOR...' });

    const formData = new FormData(e.target);

    try {
      const title = formData.get('title');
      const abstract_text = formData.get('abstract_text');

      // Generate 384-dim embedding
      const embedding = await generateEmbedding(`${title}: ${abstract_text}`);

      if (!embedding || embedding.length !== 384) {
        throw new Error("Vector generation failed dimension check (Required: 384).");
      }

      const { error } = await supabase.from('abstracts').insert([{
        title,
        abstract_text,
        authors: formData.get('authors'),
        accession_id: formData.get('accession_id'),
        year: parseInt(formData.get('year')),
        department_id: selectedDept, // UUID from state
        embedding,
        status: 'archived'
      }]);

      if (error) throw error;

      setMessage({ type: 'success', text: '✅ RESEARCH ARCHIVED AND INDEXED SUCCESSFULLY!' });
      e.target.reset();
      setSelectedDept('');
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
              placeholder="e.g. SUSTAINABLE ARCHITECTURE IN TROPICAL CLIMATES" 
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
                placeholder="e.g. BSCS-2024-001" 
                className="w-full p-4 bg-white border-4 border-black font-bold text-black focus:bg-[#FFCC00] outline-none placeholder:text-gray-300" 
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
                placeholder="Lastname, Firstname; Doe, Jane" 
                className="w-full p-4 bg-white border-4 border-black font-bold text-black focus:bg-[#FFCC00] outline-none placeholder:text-gray-300" 
              />
            </div>
          </div>

          {/* Abstract */}
          <div className="space-y-2">
            <label className="text-xs font-black text-black uppercase tracking-widest">Abstract Text</label>
            <textarea 
              name="abstract_text" 
              required 
              rows={8} 
              placeholder="Paste the full research abstract here for semantic analysis..." 
              className="w-full p-5 bg-white border-4 border-black font-medium text-black outline-none resize-none focus:bg-[#FFCC00] placeholder:text-gray-300" 
            />
          </div>

          <button 
            disabled={loading} 
            className="w-full py-6 bg-[#003366] text-white border-4 border-black font-black uppercase tracking-[0.3em] text-lg hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none transition-all shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50"
          >
            {loading ? 'ARCHIVING...' : '🚀 ADD TO ARCHIVE'}
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