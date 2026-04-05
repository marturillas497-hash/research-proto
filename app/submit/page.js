// app/submit/page.js
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { generateEmbedding } from '@/lib/embeddings'; 
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SubmitProposal() {
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    abstract: '',
    department_id: '', // This MUST be a UUID from the database
    year: new Date().getFullYear(),
  });
  
  const supabase = createClient();
  const router = useRouter();

  // Load actual UUIDs for departments to prevent 400 Bad Request errors
  useEffect(() => {
    async function fetchDepts() {
      const { data, error } = await supabase
        .from('departments')
        .select('id, code')
        .order('code', { ascending: true });
      
      if (error) console.error("Error fetching departments:", error.message);
      if (data) setDepartments(data);
    }
    fetchDepts();
  }, [supabase]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.department_id) return alert("Please select a department");
    
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Auth session missing. Please log in again.");

      // 1. Generate 384-dimension embedding
      // Combining title and abstract ensures the "NaN% Match" error is avoided 
      // by providing enough context for the vector model.
      const textToEmbed = `Title: ${formData.title} Abstract: ${formData.abstract}`;
      const embedding = await generateEmbedding(textToEmbed);

      if (!embedding || embedding.length !== 384) {
        throw new Error("Vector generation failed. Check dimension count.");
      }

      // 2. Insert into 'abstracts' table
      // Note: We avoid 'accession_id' if it's not in your schema to prevent 400 errors
      const { error } = await supabase.from('abstracts').insert([
        {
          title: formData.title,
          abstract_text: formData.abstract, 
          authors: user.user_metadata?.full_name || 'Anonymous Student', 
          year: formData.year,
          department_id: formData.department_id, // This is now a verified UUID
          embedding: embedding, 
          status: 'pending' 
        }
      ]);

      if (error) throw error;

      router.push('/dashboard');
      router.refresh();
    } catch (error) {
      console.error("Submission Error:", error);
      alert(`Submission failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 sm:p-10 bg-[#F0F0F0] min-h-screen font-sans">
      <Link href="/dashboard" className="group text-xs font-black text-black uppercase tracking-widest inline-flex items-center mb-8">
        <span className="p-2 border-4 border-black bg-white group-hover:bg-[#FFCC00] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all">
          ← Back to Dashboard
        </span>
      </Link>
      
      <div className="bg-white border-4 border-black p-8 md:p-12 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
        <header className="mb-10">
          <h1 className="text-5xl font-black text-[#003366] uppercase tracking-tighter mb-2 italic">New Proposal</h1>
          <div className="h-2 w-32 bg-[#FFCC00] border-2 border-black"></div>
        </header>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Title Section */}
          <div className="space-y-2">
            <label className="text-sm font-black text-black uppercase tracking-tight">Research Title</label>
            <input
              required
              type="text"
              placeholder="ENTER RESEARCH TITLE..."
              className="w-full p-4 bg-white border-4 border-black font-bold text-black focus:bg-[#FFCC00] outline-none placeholder:text-gray-300"
              onChange={(e) => setFormData({...formData, title: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Department Selection */}
            <div className="space-y-2">
              <label className="text-sm font-black text-black uppercase tracking-tight">Academic Department</label>
              <select
                required
                className="w-full p-4 bg-white border-4 border-black font-bold text-black focus:bg-[#FFCC00] outline-none appearance-none"
                value={formData.department_id}
                onChange={(e) => setFormData({...formData, department_id: e.target.value})}
              >
                <option value="">-- SELECT DEPT --</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>{dept.code}</option>
                ))}
              </select>
            </div>

            {/* Publication Year */}
            <div className="space-y-2">
              <label className="text-sm font-black text-black uppercase tracking-tight">Target Year</label>
              <input
                type="number"
                required
                className="w-full p-4 bg-white border-4 border-black font-bold text-black focus:bg-[#FFCC00] outline-none"
                value={formData.year}
                onChange={(e) => setFormData({...formData, year: parseInt(e.target.value)})}
              />
            </div>
          </div>

          {/* Abstract Body */}
          <div className="space-y-2">
            <label className="text-sm font-black text-black uppercase tracking-tight">Abstract Summary</label>
            <textarea
              required
              rows={10}
              placeholder="DESCRIBE YOUR PROBLEM STATEMENT, METHODOLOGY, AND GOALS..."
              className="w-full p-4 bg-white border-4 border-black font-medium text-black focus:bg-[#FFCC00] outline-none placeholder:text-gray-300 resize-none"
              onChange={(e) => setFormData({...formData, abstract: e.target.value})}
            />
          </div>

          {/* Action Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-6 bg-[#003366] text-white border-4 border-black font-black uppercase tracking-[0.25em] text-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'CALCULATING VECTORS...' : 'INDEX TO LIBRARY'}
          </button>
        </form>
      </div>
    </div>
  );
}