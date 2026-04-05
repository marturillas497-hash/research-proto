'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { generateEmbedding } from '@/lib/embeddings';

export default function LibraryPage() {
  const [allAbstracts, setAllAbstracts] = useState([]); 
  const [displayAbstracts, setDisplayAbstracts] = useState([]); 
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ dept: '', year: '' });
  
  const [profile, setProfile] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  const supabase = createClient();

  // --- 1. INSTANT CLIENT-SIDE FILTER ---
  // This handles basic keyword filtering as the user types
  useEffect(() => {
    const filtered = allAbstracts.filter(item => {
      const searchTerm = search.toLowerCase();
      const matchesSearch = 
        item.title.toLowerCase().includes(searchTerm) || 
        item.abstract_text.toLowerCase().includes(searchTerm) ||
        (item.authors && item.authors.toLowerCase().includes(searchTerm));
      
      const matchesDept = filters.dept ? item.department_id === filters.dept : true;
      return matchesSearch && matchesDept;
    });
    setDisplayAbstracts(filtered);
  }, [search, filters.dept, allAbstracts]);

  // --- 2. SEMANTIC SEARCH (Local AI 384-dim) ---
  const handleSemanticSearch = async (e) => {
    if (e) e.preventDefault();
    const words = search.trim().split(/\s+/);
    
    // Trigger AI search only if query is substantial (3+ words)
    if (words.length >= 3) {
      setLoading(true);
      try {
        console.log("🧠 Generating local 384-dim embedding...");
        const queryVector = await generateEmbedding(search);

        const { data, error } = await supabase.rpc('match_abstracts', {
          query_embedding: queryVector,
          match_threshold: 0.2, 
          match_count: 25,
          filter_dept: (filters.dept && filters.dept !== "") ? filters.dept : null, 
          filter_year: filters.year ? parseInt(filters.year) : null
        });

        if (error) throw error;
        setDisplayAbstracts(data || []);
      } catch (error) {
        console.error("SEMANTIC_SEARCH_ERROR:", error.message);
      } finally {
        setLoading(false);
      }
    }
  };

  // --- 3. INITIAL DATA LOAD ---
  useEffect(() => {
    async function getInitialData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
          setProfile(prof);
        }
        
        const { data: depts } = await supabase.from('departments').select('*').order('code');
        setDepartments(depts || []);
        
        const { data: initial } = await supabase
          .from('abstracts')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50);
        
        setAllAbstracts(initial || []);
      } catch (err) {
        console.error("Initial Load Error:", err);
      } finally {
        setLoading(false);
      }
    }
    getInitialData();
  }, [supabase]);

  // --- 4. ADMIN ACTIONS (DELETE / EDIT) ---
  const handleDelete = async (id) => {
    if (!confirm("🚨 Permanently delete this research?")) return;
    const { error } = await supabase.from('abstracts').delete().eq('id', id);
    if (!error) {
      setSelectedItem(null);
      setAllAbstracts(prev => prev.filter(item => item.id !== id));
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaveLoading(true);
    const formData = new FormData(e.target);
    const updatedFields = {
      title: formData.get('title'),
      abstract_text: formData.get('abstract_text'),
      authors: formData.get('authors'),
      year: parseInt(formData.get('year')),
    };

    try {
      // Re-generate embedding because text content changed
      const embedding = await generateEmbedding(`${updatedFields.title} ${updatedFields.abstract_text}`);
      
      const { error } = await supabase
        .from('abstracts')
        .update({ ...updatedFields, embedding })
        .eq('id', selectedItem.id);

      if (error) throw error;
      
      setIsEditing(false);
      setSelectedItem(null);
      // Refresh the master list
      const { data } = await supabase.from('abstracts').select('*').limit(50);
      setAllAbstracts(data || []);
    } catch (err) {
      alert(err.message);
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 sm:p-10 font-sans text-[#003366]">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tighter italic leading-none">Research Library</h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-2">Semantic Archive v2.0 (Local AI Enabled)</p>
        </div>
      </div>

      {/* --- SEARCH INTERFACE --- */}
      <form onSubmit={handleSemanticSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10 bg-white p-4 rounded-[2rem] border-4 border-[#003366] shadow-[8px_8px_0px_0px_rgba(0,51,102,1)]">
        <input
          type="text"
          placeholder="Keyword filter... (Type 3+ words & Enter for AI)"
          className="md:col-span-2 p-4 bg-slate-50 border-none rounded-xl font-bold text-[#003366] outline-none"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select 
          className="p-4 bg-slate-50 border-none rounded-xl font-bold text-[#003366] outline-none"
          value={filters.dept}
          onChange={(e) => setFilters({...filters, dept: e.target.value})}
        >
          <option value="">All Departments</option>
          {departments.map(d => <option key={d.id} value={d.id}>{d.code}</option>)}
        </select>
        <button type="submit" className="bg-[#003366] text-[#FFCC00] font-black uppercase tracking-widest rounded-xl hover:scale-[1.02] active:scale-95 transition-all">
          {loading ? '...' : 'Search'}
        </button>
      </form>

      {/* --- RESULTS GRID --- */}
      {loading && allAbstracts.length === 0 ? (
        <div className="text-center py-20 font-black text-[#003366] uppercase animate-pulse tracking-widest">Waking up AI...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {displayAbstracts.map((item) => (
            <div 
              key={item.id} 
              onClick={() => setSelectedItem(item)}
              className="cursor-pointer bg-white p-8 rounded-[2rem] border-4 border-[#003366] shadow-[8px_8px_0px_0px_rgba(0,51,102,1)] hover:translate-y-[-4px] transition-all flex flex-col group relative"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] font-black text-white bg-[#003366] px-3 py-1 rounded-full uppercase w-fit">
                    {departments.find(d => d.id === item.department_id)?.code || 'N/A'}
                  </span>
                  {item.similarity && (
                    <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded border-2 border-emerald-200 w-fit italic">
                      {Math.round(item.similarity * 100)}% Match
                    </span>
                  )}
                </div>
                <span className="font-mono text-sm font-black text-[#003366] opacity-30">{item.year}</span>
              </div>
              <h3 className="text-xl font-black text-[#003366] uppercase leading-tight mb-4 group-hover:underline line-clamp-2">{item.title}</h3>
              <p className="text-slate-500 text-sm line-clamp-3 mb-6 font-medium leading-relaxed">{item.abstract_text}</p>
              <div className="mt-auto pt-4 border-t-2 border-slate-100 flex items-center justify-between">
                <p className="text-[10px] font-black uppercase text-slate-400 truncate w-2/3">By {item.authors}</p>
                <span className="text-[#003366] font-black text-xs">OPEN →</span>
              </div>
            </div>
          ))}
          
          {displayAbstracts.length === 0 && (
            <div className="col-span-full text-center py-20 bg-slate-50 rounded-[3rem] border-4 border-dashed border-slate-200">
               <p className="font-black text-slate-400 uppercase tracking-widest">No matching research found.</p>
            </div>
          )}
        </div>
      )}

      {/* --- MODAL VIEW/EDIT --- */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[#003366]/80 backdrop-blur-md">
          <div className="bg-white w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-[3rem] border-4 border-[#003366] shadow-[20px_20px_0px_0px_rgba(255,204,0,1)] p-10 relative">
            <button onClick={() => {setSelectedItem(null); setIsEditing(false);}} className="absolute top-8 right-8 font-black text-2xl text-[#003366] hover:rotate-90 transition-transform">✕</button>

            <form onSubmit={handleUpdate}>
              <div className="mb-8">
                {isEditing ? (
                  <input name="title" defaultValue={selectedItem.title} className="w-full text-2xl font-black text-[#003366] uppercase mt-4 p-4 bg-slate-50 rounded-xl border-b-4 border-[#FFCC00] outline-none" />
                ) : (
                  <h2 className="text-3xl font-black text-[#003366] uppercase tracking-tighter mt-4 leading-[1.1]">{selectedItem.title}</h2>
                )}
              </div>

              <div className="space-y-8">
                <div>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Research Abstract</h4>
                  {isEditing ? (
                    <textarea name="abstract_text" rows={10} defaultValue={selectedItem.abstract_text} className="w-full p-6 bg-slate-50 border-2 border-[#003366] rounded-3xl outline-none font-medium text-slate-700" />
                  ) : (
                    <p className="text-slate-700 leading-relaxed font-medium bg-slate-50 p-8 rounded-[2rem] whitespace-pre-wrap text-sm shadow-inner">{selectedItem.abstract_text}</p>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                   <div className="flex flex-col">
                      <span className="text-[10px] font-black text-slate-300 uppercase mb-1">Lead Authors</span>
                      {isEditing ? <input name="authors" defaultValue={selectedItem.authors} className="p-3 bg-slate-50 rounded-lg font-bold" /> : <span className="font-black text-[#003366] uppercase">{selectedItem.authors}</span>}
                   </div>
                   <div className="flex flex-col">
                      <span className="text-[10px] font-black text-slate-300 uppercase mb-1">Academic Year</span>
                      {isEditing ? <input name="year" defaultValue={selectedItem.year} className="p-3 bg-slate-50 rounded-lg font-bold" /> : <span className="font-black text-[#003366]">{selectedItem.year}</span>}
                   </div>
                </div>
              </div>

              {profile?.role === 'admin' && (
                <div className="mt-12 pt-8 border-t-4 border-slate-50 flex gap-4">
                  {!isEditing ? (
                    <>
                      <button type="button" onClick={() => handleDelete(selectedItem.id)} className="px-8 py-4 bg-red-50 text-red-600 rounded-2xl font-black uppercase text-xs hover:bg-red-600 hover:text-white transition-all">Delete</button>
                      <button type="button" onClick={() => setIsEditing(true)} className="flex-1 px-8 py-4 bg-[#003366] text-white rounded-2xl font-black uppercase text-xs hover:brightness-110 transition-all shadow-lg">Edit Record</button>
                    </>
                  ) : (
                    <>
                      <button type="button" onClick={() => setIsEditing(false)} className="px-8 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black uppercase text-xs">Cancel</button>
                      <button type="submit" disabled={saveLoading} className="flex-1 px-8 py-4 bg-green-600 text-white rounded-2xl font-black uppercase text-xs hover:bg-green-700 transition-all shadow-lg">
                        {saveLoading ? 'RE-INDEXING AI...' : 'SAVE & UPDATE'}
                      </button>
                    </>
                  )}
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}