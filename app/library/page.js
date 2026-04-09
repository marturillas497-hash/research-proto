// app/library/page.js
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { generateEmbedding } from '@/lib/embeddings';

// Component Imports
import AdminNavbar from '@/components/admin/Navbar';
import AdviserNavbar from '@/components/adviser/AdviserNavbar';
import StudentNavbar from '@/components/student/StudentNavbar';

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

  // --- 1. INITIAL DATA LOAD ---
  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        setProfile(prof);
      }
      
      const { data: depts } = await supabase.from('departments').select('*').order('code');
      setDepartments(depts || []);

      const { data: initial } = await supabase
        .from('abstracts')
        .select('*, abstract_stats(unique_readers)')
        .order('created_at', { ascending: false })
        .limit(50);
      
      setAllAbstracts(initial || []);
      setDisplayAbstracts(initial || []);
      setLoading(false);
    }
    loadData();
  }, [supabase]);

  // --- 2. UNIQUE VIEW TRACKING (3-SECOND DWELL LOGIC) ---
  useEffect(() => {
    // We only trigger this if an item is selected and a profile exists
    if (!selectedItem || !profile) return;

    const logTimer = setTimeout(async () => {
      try {
        const { error } = await supabase
          .from('abstract_views')
          .upsert(
            { 
              abstract_id: selectedItem.id, 
              viewer_id: profile.id // Updated to match your ERD (viewer_id)
            },
            { onConflict: 'abstract_id, viewer_id' }
          );

        if (error) throw error;
        console.log("3s dwell reached: Unique view verified for", selectedItem.title);
      } catch (err) {
        console.error("Tracking error:", err.message);
      }
    }, 3000);

    return () => clearTimeout(logTimer);
  }, [selectedItem, profile, supabase]);

  const handleOpenItem = (item) => {
    setSelectedItem(item);
  };

  // --- 3. HYBRID SEARCH LOGIC ---
  useEffect(() => {
    if (isSemanticActive) return;

    const query = search.trim().toLowerCase();
    const wordCount = query.split(/\s+/).filter(w => w.length > 0).length;

    // Fast local filter for short queries
    if (wordCount < 3) {
      const filtered = allAbstracts.filter(item => {
        const matchesKeyword =
          item.title.toLowerCase().includes(query) ||
          item.abstract_text.toLowerCase().includes(query) ||
          (item.authors && item.authors.toLowerCase().includes(query));

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

  // --- 4. ADMIN ACTIONS ---
  const handleDelete = async (id) => {
    if (!confirm("🚨 Delete this research permanently?")) return;
    const { error } = await supabase.from('abstracts').delete().eq('id', id);
    if (!error) {
      setSelectedItem(null);
      setAllAbstracts(prev => prev.filter(item => item.id !== id));
      setDisplayAbstracts(prev => prev.filter(item => item.id !== id));
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
      
      // Update local state to reflect changes instantly
      const updatedList = allAbstracts.map(item => 
        item.id === selectedItem.id ? { ...item, ...updatedFields, embedding } : item
      );
      setAllAbstracts(updatedList);
      setDisplayAbstracts(updatedList);
      
    } catch (err) {
      alert(err.message);
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F0F0] selection:bg-[#FFCC00]">
      {profile?.role === 'admin' && <AdminNavbar />}
      {profile?.role === 'research_adviser' && <AdviserNavbar profile={profile} />}
      {profile?.role === 'student' && <StudentNavbar profile={profile} />}

      <main className="max-w-7xl mx-auto p-6 sm:p-10">
        
        <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b-8 border-black pb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="bg-[#FFCC00] border-2 border-black px-3 py-1 text-[10px] font-black uppercase shadow-[3px_3px_0px_0px_black]">
                Library Access: {profile?.role?.replace('_', ' ') || 'Guest'}
              </span>
              <div className={`h-2 w-2 border border-black ${isSemanticActive ? 'bg-[#00FF66] animate-pulse' : 'bg-slate-300'}`}></div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 font-mono">
                {isSemanticActive ? 'Semantic_Engine_Online' : 'Standard_Filter_Mode'}
              </p>
            </div>
            <h1 className="text-7xl md:text-8xl font-black text-[#003366] tracking-tighter uppercase leading-[0.8] italic">
              Research_Archive
            </h1>
          </div>

          {isSemanticActive && (
            <button 
              onClick={() => {setSearch(''); setIsSemanticActive(false); setDisplayAbstracts(allAbstracts);}}
              className="bg-black text-white px-6 py-3 text-xs font-black uppercase shadow-[4px_4px_0px_0px_#FFCC00] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all"
            >
              Reset Archive ✕
            </button>
          )}
        </header>

        {/* SEARCH FORM */}
        <section className="mb-12">
          <form onSubmit={handleSearchTrigger} className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-6 border-4 border-black shadow-[10px_10px_0px_0px_black]">
            <div className="md:col-span-2 relative">
              <input
                type="text"
                placeholder="Query topics, titles, or authors..."
                className="w-full p-4 font-black uppercase text-sm outline-none bg-slate-50 border-2 border-black focus:bg-white transition-colors"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  if (e.target.value === '') {
                    setIsSemanticActive(false);
                    setDisplayAbstracts(allAbstracts);
                  }
                }}
              />
            </div>
            <select 
              className="p-4 font-black uppercase text-xs outline-none bg-slate-50 border-2 border-black appearance-none cursor-pointer"
              value={filters.dept}
              onChange={(e) => setFilters({dept: e.target.value})}
            >
              <option value="">All Departments</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.code}</option>)}
            </select>
            <button type="submit" className="bg-[#003366] text-[#FFCC00] border-2 border-black font-black uppercase tracking-widest hover:bg-black transition-all shadow-[4px_4px_0px_0px_black] active:shadow-none active:translate-x-1 active:translate-y-1">
              {loading ? 'Processing...' : 'Execute Search'}
            </button>
          </form>

          <div className="mt-4 px-2 flex items-center gap-3">
             <span className="text-[10px] font-black bg-[#FFCC00] border border-black px-2 italic">PRO TIP</span>
             <p className="text-[10px] font-black uppercase tracking-tight text-slate-500 font-mono">
               Input <span className="text-black underline">3+ words</span> to activate Neural Semantic Mapping.
             </p>
          </div>
        </section>

        {/* RESULTS GRID */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          {displayAbstracts.map((item) => (
            <div 
              key={item.id} 
              onClick={() => handleOpenItem(item)}
              className="group cursor-pointer bg-white p-8 border-4 border-black shadow-[8px_8px_0px_0px_black] hover:translate-y-[-4px] hover:shadow-[12px_12px_0px_0px_#FFCC00] transition-all flex flex-col h-full relative overflow-hidden"
            >
              <div className="flex justify-between items-start mb-6">
                <span className="text-[9px] font-black bg-black text-white px-2 py-1 uppercase tracking-tighter">
                  {departments.find(d => d.id === item.department_id)?.code || 'GEN'}
                </span>
                {item.similarity && (
                  <span className="text-[9px] font-black text-[#003366] bg-[#FFCC00] px-2 py-1 border border-black uppercase italic shadow-[2px_2px_0px_0px_black]">
                    {Math.round(item.similarity * 100)}% Match
                  </span>
                )}
              </div>
              
              <h3 className="font-black uppercase text-lg mb-4 leading-[1.1] text-[#003366] group-hover:italic transition-all">
                {item.title}
              </h3>
              
              <p className="text-xs text-black font-medium line-clamp-4 leading-relaxed mb-8 border-l-2 border-slate-200 pl-4">
                {item.abstract_text}
              </p>
              
              <div className="mt-auto pt-4 border-t-4 border-black flex justify-between items-center">
                <span className="text-[9px] font-black text-slate-400 uppercase truncate w-2/3 font-mono">
                  REF://{item.authors}
                </span>
                <span className="text-black font-black text-[10px] group-hover:translate-x-2 transition-transform">
                  VIEW_FILE →
                </span>
              </div>
            </div>
          ))}
        </section>

        {/* MODAL VIEW / EDIT */}
        {selectedItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#003366]/80 backdrop-blur-md">
            <div className="bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto border-4 border-black shadow-[20px_20px_0px_0px_#FFCC00] p-6 sm:p-12 relative">
              <button 
                onClick={() => {setSelectedItem(null); setIsEditing(false);}} 
                className="absolute top-6 right-6 font-black text-2xl hover:rotate-90 transition-transform bg-black text-white w-10 h-10 flex items-center justify-center"
              >
                ✕
              </button>
              
              <form onSubmit={handleUpdate}>
                <div className="mb-10 border-b-8 border-black pb-6">
                  <span className="text-[10px] font-black text-slate-400 uppercase font-mono block mb-2">Research Dossier #{selectedItem.id.slice(0,8)}</span>
                  {isEditing ? (
                    <input 
                      name="title" 
                      defaultValue={selectedItem.title} 
                      className="w-full text-3xl font-black text-[#003366] uppercase p-4 bg-slate-50 border-4 border-black outline-none" 
                    />
                  ) : (
                    <h2 className="text-4xl sm:text-5xl font-black text-[#003366] uppercase leading-[0.9] italic tracking-tighter">
                      {selectedItem.title}
                    </h2>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                  <div className="md:col-span-2 space-y-8">
                    <div>
                      <h4 className="text-[10px] font-black text-black bg-[#FFCC00] border border-black inline-block px-2 uppercase tracking-widest mb-4">
                        Executive Summary
                      </h4>
                      {isEditing ? (
                        <textarea 
                          name="abstract_text" 
                          rows={12} 
                          defaultValue={selectedItem.abstract_text} 
                          className="w-full p-6 bg-slate-50 border-4 border-black outline-none text-sm font-medium leading-relaxed" 
                        />
                      ) : (
                        <p className="text-sm sm:text-base text-black leading-relaxed font-medium bg-[#F9F9F9] p-8 border-2 border-black italic">
                          {selectedItem.abstract_text}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="bg-black text-white p-6 border-4 border-black shadow-[6px_6px_0px_0px_#003366]">
                      <span className="text-[9px] font-black text-[#FFCC00] uppercase block mb-4 tracking-[0.2em]">Metadata_Stats</span>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="text-[9px] font-black text-slate-400 uppercase block">Principal Authors</label>
                          {isEditing ? (
                            <input name="authors" defaultValue={selectedItem.authors} className="w-full p-2 bg-white text-black font-bold outline-none border-2 border-[#FFCC00] text-xs mt-1" />
                          ) : (
                            <p className="font-black uppercase text-sm tracking-tight">{selectedItem.authors}</p>
                          )}
                        </div>
                        <div>
                          <label className="text-[9px] font-black text-slate-400 uppercase block">Publication Year</label>
                          {isEditing ? (
                            <input name="year" defaultValue={selectedItem.year} className="w-full p-2 bg-white text-black font-bold outline-none border-2 border-[#FFCC00] text-xs mt-1" />
                          ) : (
                            <p className="font-black text-2xl italic">{selectedItem.year}</p>
                          )}
                        </div>
                        
                        {!isEditing && (
                          <div className="pt-4 border-t border-slate-700">
                             <label className="text-[9px] font-black text-[#00FF66] uppercase block">Unique Citations</label>
                             <p className="text-xl font-black font-mono">
                               {selectedItem.abstract_stats?.[0]?.unique_readers || 0}
                             </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {profile?.role === 'admin' && (
                  <div className="mt-12 pt-8 border-t-8 border-black flex flex-col sm:flex-row gap-4">
                    {!isEditing ? (
                      <>
                        <button type="button" onClick={() => handleDelete(selectedItem.id)} className="px-8 py-4 bg-[#FF3333] text-white border-4 border-black font-black uppercase text-xs shadow-[6px_6px_0px_0px_black] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all">
                          Purge Record
                        </button>
                        <button type="button" onClick={() => setIsEditing(true)} className="flex-1 px-8 py-4 bg-white text-black border-4 border-black font-black uppercase text-xs shadow-[6px_6px_0px_0px_black] hover:bg-[#FFCC00] transition-all">
                          Modify Documentation
                        </button>
                      </>
                    ) : (
                      <>
                        <button type="button" onClick={() => setIsEditing(false)} className="px-8 py-4 bg-slate-200 border-4 border-black font-black uppercase text-xs">
                          Abort Changes
                        </button>
                        <button type="submit" disabled={saveLoading} className="flex-1 px-8 py-4 bg-[#00FF66] text-black border-4 border-black font-black uppercase text-xs shadow-[6px_6px_0px_0px_black]">
                          {saveLoading ? 'Re-Mapping Neural Vectors...' : 'Commit Updates to Archive'}
                        </button>
                      </>
                    )}
                  </div>
                )}
              </form>
            </div>
          </div>
        )}

        <footer className="mt-20 mb-10 text-center border-t-2 border-slate-200 pt-10">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em]">
            System_Library_Access // Proto-Research_Node_01
          </p>
        </footer>
      </main>
    </div>
  );
}