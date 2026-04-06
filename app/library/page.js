// app/library/page.js
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
  const [filters, setFilters] = useState({ dept: '' });
  
  const [profile, setProfile] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [isSemanticActive, setIsSemanticActive] = useState(false);

  const supabase = createClient();

  // --- 1. THE HYBRID SEARCH LOGIC ---
  useEffect(() => {
    if (isSemanticActive) return;

    const query = search.trim();
    const wordCount = query.split(/\s+/).filter(w => w.length > 0).length;

    if (wordCount < 3) {
      const filtered = allAbstracts.filter(item => {
        const searchTerm = query.toLowerCase();
        const matchesKeyword = 
          item.title.toLowerCase().includes(searchTerm) || 
          item.abstract_text.toLowerCase().includes(searchTerm) ||
          (item.authors && item.authors.toLowerCase().includes(searchTerm));
        
        const matchesDept = filters.dept ? item.department_id === filters.dept : true;
        return matchesKeyword && matchesDept;
      });
      setDisplayAbstracts(filtered);
    }
  }, [search, filters.dept, allAbstracts, isSemanticActive]);

  const handleSearchTrigger = async (e) => {
    if (e) e.preventDefault();
    
    const query = search.trim();
    const wordCount = query.split(/\s+/).filter(w => w.length > 0).length;

    if (wordCount >= 3) {
      setLoading(true);
      setIsSemanticActive(true);
      try {
        const queryVector = await generateEmbedding(query);

        const { data, error } = await supabase.rpc('match_abstracts', {
          query_embedding: queryVector,
          match_threshold: 0.18, 
          match_count: 25,
          filter_dept: filters.dept || null
        });

        if (error) throw error;
        setDisplayAbstracts(data || []);
      } catch (err) {
        console.error("SEARCH_ERROR:", err.message);
        setIsSemanticActive(false);
      } finally {
        setLoading(false);
      }
    }
  };

  // --- 2. INITIAL DATA LOAD ---
  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        setProfile(prof);
      }
      const { data: depts } = await supabase.from('departments').select('*').order('code');
      setDepartments(depts || []);
      
      const { data: initial } = await supabase.from('abstracts').select('*').order('created_at', { ascending: false }).limit(50);
      setAllAbstracts(initial || []);
      setLoading(false);
    }
    loadData();
  }, [supabase]);

  // --- 3. ADMIN ACTIONS ---
  const handleDelete = async (id) => {
    if (!confirm("🚨 Delete this research permanently?")) return;
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
      const embedding = await generateEmbedding(`${updatedFields.title}: ${updatedFields.abstract_text}`);
      const { error } = await supabase.from('abstracts').update({ ...updatedFields, embedding }).eq('id', selectedItem.id);
      if (error) throw error;
      setIsEditing(false);
      setSelectedItem(null);
      setAllAbstracts(prev => prev.map(item => item.id === selectedItem.id ? { ...item, ...updatedFields, embedding } : item));
    } catch (err) {
      alert(err.message);
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 sm:p-10 font-sans text-[#003366]">
      <header className="mb-10 flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-black uppercase italic tracking-tighter">Research Library</h1>
          <div className="flex items-center gap-2 mt-2">
            <div className={`h-2 w-2 rounded-full ${isSemanticActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              {isSemanticActive ? 'Deep Topic Search Active' : 'Live Filtering'}
            </p>
          </div>
        </div>
        {isSemanticActive && (
          <button 
            onClick={() => {setSearch(''); setIsSemanticActive(false);}}
            className="text-[10px] font-black border-2 border-[#003366] px-3 py-1 uppercase hover:bg-[#FFCC00] transition-colors"
          >
            Clear Results ✕
          </button>
        )}
      </header>

      {/* --- SEARCH FORM --- */}
      <form onSubmit={handleSearchTrigger} className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 bg-white p-4 border-4 border-[#003366] shadow-[8px_8px_0px_0px_rgba(0,51,102,1)]">
        <input
          type="text"
          placeholder="Search topics or titles..."
          className="md:col-span-2 p-4 font-bold outline-none bg-slate-50 text-[#003366]"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            if (e.target.value === '') setIsSemanticActive(false);
          }}
        />
        <select 
          className="p-4 font-bold outline-none bg-slate-50 text-[#003366]"
          value={filters.dept}
          onChange={(e) => setFilters({dept: e.target.value})}
        >
          <option value="">All Departments</option>
          {departments.map(d => <option key={d.id} value={d.id}>{d.code}</option>)}
        </select>
        <button type="submit" className="bg-[#003366] text-[#FFCC00] font-black uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all">
          {loading ? '...' : 'Search'}
        </button>
      </form>

      {/* --- RE-WRITTEN USER NOTE --- */}
      <div className="px-4 mb-10 flex items-center gap-3">
        <div className="flex space-x-1">
          <div className="w-1 h-1 bg-[#003366] rounded-full animate-bounce"></div>
          <div className="w-1 h-1 bg-[#003366] rounded-full animate-bounce [animation-delay:0.2s]"></div>
        </div>
        <p className="text-[10px] font-bold uppercase tracking-tight text-slate-500">
          💡 <span className="text-[#003366]">Pro Tip:</span> Enter <span className="bg-[#FFCC00] text-black px-1 font-black">3+ words</span> to search by topic relevance instead of just exact matches.
        </p>
      </div>

      {/* --- RESULTS --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {displayAbstracts.map((item) => (
          <div 
            key={item.id} 
            onClick={() => setSelectedItem(item)}
            className="cursor-pointer bg-white p-8 border-4 border-[#003366] shadow-[6px_6px_0px_0px_rgba(0,51,102,1)] hover:translate-y-[-4px] hover:shadow-[10px_10px_0px_0px_rgba(0,51,102,1)] transition-all flex flex-col h-full"
          >
            <div className="flex justify-between items-start mb-4">
              <span className="text-[9px] font-black bg-[#003366] text-white px-2 py-1 uppercase">
                {departments.find(d => d.id === item.department_id)?.code}
              </span>
              {item.similarity && (
                <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 border border-emerald-200 uppercase italic">
                  {Math.round(item.similarity * 100)}% Topic Match
                </span>
              )}
            </div>
            <h3 className="font-black uppercase text-base mb-4 leading-tight text-[#003366] line-clamp-2">{item.title}</h3>
            <p className="text-xs text-slate-500 line-clamp-4 leading-relaxed mb-6">{item.abstract_text}</p>
            <div className="mt-auto pt-4 border-t-2 border-slate-50 flex justify-between items-center">
              <span className="text-[9px] font-black text-slate-300 uppercase truncate w-2/3">By {item.authors}</span>
              <span className="text-[#003366] font-black text-[10px]">READ MORE →</span>
            </div>
          </div>
        ))}
        {displayAbstracts.length === 0 && (
          <div className="col-span-full py-20 text-center border-4 border-dashed border-slate-200 rounded-xl">
             <p className="font-black text-slate-300 uppercase tracking-widest">No matching research found</p>
          </div>
        )}
      </div>

      {/* --- MODAL VIEW / EDIT (Remains unchanged for admin) --- */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[#003366]/90 backdrop-blur-sm">
          <div className="bg-white w-full max-w-3xl max-h-[90vh] overflow-y-auto border-4 border-[#003366] shadow-[15px_15px_0px_0px_rgba(255,204,0,1)] p-10 relative">
            <button onClick={() => {setSelectedItem(null); setIsEditing(false);}} className="absolute top-6 right-6 font-black text-xl hover:rotate-90 transition-transform">✕</button>
            
            <form onSubmit={handleUpdate}>
              <div className="mb-8">
                {isEditing ? (
                  <input name="title" defaultValue={selectedItem.title} className="w-full text-2xl font-black text-[#003366] uppercase p-4 bg-slate-50 border-b-4 border-[#FFCC00] outline-none" />
                ) : (
                  <h2 className="text-3xl font-black text-[#003366] uppercase leading-tight">{selectedItem.title}</h2>
                )}
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-2">Research Abstract</h4>
                  {isEditing ? (
                    <textarea name="abstract_text" rows={10} defaultValue={selectedItem.abstract_text} className="w-full p-6 bg-slate-50 border-2 border-[#003366] outline-none text-sm" />
                  ) : (
                    <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-6 whitespace-pre-wrap italic">{selectedItem.abstract_text}</p>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-slate-300 uppercase mb-1">Authors</span>
                    {isEditing ? <input name="authors" defaultValue={selectedItem.authors} className="p-3 bg-slate-50 font-bold outline-none" /> : <span className="font-bold text-[#003366] uppercase">{selectedItem.authors}</span>}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-slate-300 uppercase mb-1">Year</span>
                    {isEditing ? <input name="year" defaultValue={selectedItem.year} className="p-3 bg-slate-50 font-bold outline-none" /> : <span className="font-bold text-[#003366]">{selectedItem.year}</span>}
                  </div>
                </div>
              </div>

              {profile?.role === 'admin' && (
                <div className="mt-10 pt-8 border-t-4 border-slate-50 flex gap-4">
                  {!isEditing ? (
                    <>
                      <button type="button" onClick={() => handleDelete(selectedItem.id)} className="px-6 py-3 bg-red-50 text-red-600 font-black uppercase text-[10px] hover:bg-red-600 hover:text-white transition-all">Delete Record</button>
                      <button type="button" onClick={() => setIsEditing(true)} className="flex-1 px-6 py-3 bg-[#003366] text-white font-black uppercase text-[10px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">Edit Details</button>
                    </>
                  ) : (
                    <>
                      <button type="button" onClick={() => setIsEditing(false)} className="px-6 py-3 bg-slate-100 text-slate-500 font-black uppercase text-[10px]">Cancel</button>
                      <button type="submit" disabled={saveLoading} className="flex-1 px-6 py-3 bg-green-600 text-white font-black uppercase text-[10px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                        {saveLoading ? 'Updating Topic Map...' : 'Save Updates'}
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