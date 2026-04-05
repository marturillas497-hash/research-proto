'use client';

// --- SEMANTIC SEARCH PROTOCOL: 3+ WORDS ON ENTER ---
import { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { generateEmbedding } from '@/lib/embeddings';

export default function LibraryPage() {
  const [allAbstracts, setAllAbstracts] = useState([]); // Master list for live filtering
  const [displayAbstracts, setDisplayAbstracts] = useState([]); // What the user actually sees
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ dept: '', year: '' });
  
  const [profile, setProfile] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  const supabase = createClient();

  // --- FUNCTION 1: LIVE FILTERING (No API Calls) ---
  // This runs instantly as the user types or changes department
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

  // --- FUNCTION 2: SEMANTIC SEARCH (Requires Enter + 3 Words) ---
  const handleSemanticSearch = async (e) => {
    if (e) e.preventDefault();

    const words = search.trim().split(/\s+/);
    
    // Only call Voyage AI if there are 3+ words
    if (words.length >= 3) {
      setLoading(true);
      try {
        const queryVector = await generateEmbedding(search, 'query');

        const { data, error } = await supabase.rpc('match_abstracts', {
          query_embedding: queryVector,
          match_threshold: 0.3, 
          match_count: 20
        });

        if (error) throw error;
        
        // We update displayAbstracts directly with the "Smart" results
        setDisplayAbstracts(data || []);
      } catch (error) {
        console.error("SEMANTIC_SEARCH_ERROR:", error.message);
        // Fallback: If AI fails (rate limits), just stay with live filtering
      } finally {
        setLoading(false);
      }
    } else {
      console.log("Semantic search skipped: Requirement is 3+ words.");
    }
  };

  // --- FUNCTION 3: INITIAL DATA LOAD ---
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
        
        // Load initial batch for the "Normal" view
        const { data: initial } = await supabase
          .from('abstracts')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100);
        
        setAllAbstracts(initial || []);
      } catch (err) {
        console.error("Initial Load Error:", err);
      } finally {
        setLoading(false);
      }
    }
    getInitialData();
  }, [supabase]);

  // --- FUNCTION 4: DELETE RESEARCH ---
  const handleDelete = async (id) => {
    if (!confirm("🚨 WARNING: Are you sure you want to permanently delete this research?")) return;
    const { error } = await supabase.from('abstracts').delete().eq('id', id);
    if (!error) {
      setSelectedItem(null);
      // Refresh the master list
      const { data } = await supabase.from('abstracts').select('*').limit(100);
      setAllAbstracts(data || []);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 sm:p-10">
      <h1 className="text-4xl font-black text-[#003366] uppercase tracking-tighter mb-8 italic">Research Library</h1>

      {/* --- SEARCH FORM --- */}
      <form onSubmit={handleSemanticSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10 bg-white p-4 rounded-[2rem] border-4 border-[#003366] shadow-[8px_8px_0px_0px_rgba(0,51,102,1)]">
        <input
          type="text"
          placeholder="Type to filter... (3+ words + Enter for AI Search)"
          className="md:col-span-2 p-4 bg-slate-50 border-none rounded-xl font-bold text-[#003366] outline-none"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select 
          className="p-4 bg-slate-50 border-none rounded-xl font-bold text-[#003366] outline-none appearance-none"
          value={filters.dept}
          onChange={(e) => setFilters({...filters, dept: e.target.value})}
        >
          <option value="">All Departments</option>
          {departments.map(d => <option key={d.id} value={d.id}>{d.code}</option>)}
        </select>
        <button type="submit" className="bg-[#003366] text-[#FFCC00] font-black uppercase tracking-widest rounded-xl hover:bg-[#FFCC00] hover:text-[#003366] transition-all">
          {loading ? '...' : 'Search'}
        </button>
      </form>

      {/* --- RESULTS GRID --- */}
      {loading ? (
        <div className="text-center py-20 font-black text-[#003366] uppercase animate-pulse">Loading Archives...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {displayAbstracts.map((item) => (
            <div 
              key={item.id} 
              onClick={() => setSelectedItem(item)}
              className="cursor-pointer bg-white p-8 rounded-[2rem] border-4 border-[#003366] shadow-[8px_8px_0px_0px_rgba(0,51,102,1)] hover:translate-y-[-4px] transition-all flex flex-col group"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-black text-white bg-[#003366] px-3 py-1 rounded-full uppercase w-fit">
                    {departments.find(d => d.id === item.department_id)?.code || 'RESEARCH'}
                  </span>
                  {item.similarity && (
                    <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 w-fit">
                      {Math.round(item.similarity * 100)}% AI Match
                    </span>
                  )}
                </div>
                <span className="font-mono text-sm font-bold text-[#003366] opacity-50">{item.year}</span>
              </div>
              <h3 className="text-xl font-black text-[#003366] uppercase leading-tight mb-4 group-hover:underline line-clamp-2">{item.title}</h3>
              <p className="text-slate-500 text-sm line-clamp-3 mb-6 font-medium leading-relaxed">{item.abstract_text}</p>
              <div className="mt-auto pt-4 border-t-2 border-slate-100 flex items-center justify-between">
                <p className="text-[10px] font-black uppercase text-slate-400 truncate w-2/3">By {item.authors}</p>
                <span className="text-[#003366] font-black text-xs">VIEW →</span>
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

      {/* --- MODAL (Kept Exactly Same) --- */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[#003366]/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-[3rem] border-4 border-[#003366] shadow-[20px_20px_0px_0px_rgba(255,204,0,1)] p-10 relative">
            <button onClick={() => {setSelectedItem(null); setIsEditing(false);}} className="absolute top-6 right-6 font-black text-2xl text-[#003366]">✕</button>

            <form onSubmit={async (e) => {
              e.preventDefault();
              setSaveLoading(true);
              const formData = new FormData(e.target);
              const newTitle = formData.get('title');
              const newAbstract = formData.get('abstract_text');

              try {
                const embedding = await generateEmbedding(`${newTitle}: ${newAbstract}`, 'document');
                const { error } = await supabase
                  .from('abstracts')
                  .update({
                    title: newTitle,
                    abstract_text: newAbstract,
                    authors: formData.get('authors'),
                    year: parseInt(formData.get('year')),
                    embedding 
                  })
                  .eq('id', selectedItem.id);

                if (error) throw error;
                setIsEditing(false);
                setSelectedItem({ ...selectedItem, title: newTitle, abstract_text: newAbstract, authors: formData.get('authors'), year: formData.get('year') });
                
                // Refresh master list after edit
                const { data } = await supabase.from('abstracts').select('*').limit(100);
                setAllAbstracts(data || []);
              } catch (err) {
                alert(err.message);
              } finally {
                setSaveLoading(false);
              }
            }}>
              <div className="mb-8">
                {isEditing ? (
                  <input name="title" defaultValue={selectedItem.title} className="w-full text-2xl font-black text-[#003366] uppercase mt-4 border-b-4 border-[#FFCC00] outline-none" />
                ) : (
                  <h2 className="text-3xl font-black text-[#003366] uppercase tracking-tighter mt-4 leading-none">{selectedItem.title}</h2>
                )}
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Abstract</h4>
                  {isEditing ? (
                    <textarea name="abstract_text" rows={8} defaultValue={selectedItem.abstract_text} className="w-full p-6 bg-slate-50 border-2 border-[#003366] rounded-3xl outline-none" />
                  ) : (
                    <p className="text-slate-700 leading-relaxed font-medium bg-slate-50 p-6 rounded-3xl whitespace-pre-wrap">{selectedItem.abstract_text}</p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div className="flex flex-col">
                      <span className="text-[10px] font-black text-slate-400 uppercase">Authors</span>
                      {isEditing ? <input name="authors" defaultValue={selectedItem.authors} className="border-b-2 font-bold" /> : <span className="font-bold">{selectedItem.authors}</span>}
                   </div>
                   <div className="flex flex-col">
                      <span className="text-[10px] font-black text-slate-400 uppercase">Year</span>
                      {isEditing ? <input name="year" defaultValue={selectedItem.year} className="border-b-2 font-bold" /> : <span className="font-bold">{selectedItem.year}</span>}
                   </div>
                </div>
              </div>

              {profile?.role === 'admin' && (
                <div className="mt-10 pt-8 border-t-4 border-slate-100 flex gap-4">
                  {!isEditing ? (
                    <>
                      <button type="button" onClick={() => handleDelete(selectedItem.id)} className="px-6 py-3 bg-red-50 text-red-600 rounded-xl font-black uppercase text-xs">Delete</button>
                      <button type="button" onClick={() => setIsEditing(true)} className="flex-1 px-6 py-3 bg-[#003366] text-white rounded-xl font-black uppercase text-xs">Edit</button>
                    </>
                  ) : (
                    <>
                      <button type="button" onClick={() => setIsEditing(false)} className="px-6 py-3 bg-slate-100 text-slate-500 rounded-xl font-black uppercase text-xs">Cancel</button>
                      <button type="submit" disabled={saveLoading} className="flex-1 px-6 py-3 bg-green-600 text-white rounded-xl font-black uppercase text-xs">
                        {saveLoading ? 'Saving...' : 'Save'}
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