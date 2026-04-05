// app/library/page.js
'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { generateEmbedding } from '@/lib/embeddings'; // Import this to update vectors on edit

export default function LibraryPage() {
  const [abstracts, setAbstracts] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ dept: '', year: '' });
  
  // User Profile State
  const [profile, setProfile] = useState(null);

  // Modal & Edit State
  const [selectedItem, setSelectedItem] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  const supabase = createClient();

  // 1. Fetch User Profile and Departments
  useEffect(() => {
    async function getInitialData() {
      // Get User
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: prof } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        setProfile(prof);
      }

      // Get Departments
      const { data: depts } = await supabase.from('departments').select('*').order('code');
      setDepartments(depts || []);
      
      handleSearch();
    }
    getInitialData();
  }, [supabase]);

  // 2. Search Logic
  const handleSearch = useCallback(async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      const params = new URLSearchParams({
        q: search || '',
        dept: filters.dept || '',
        year: filters.year || ''
      });
      const res = await fetch(`/api/search?${params.toString()}`);
      const data = await res.json();
      setAbstracts(Array.isArray(data) ? data : []);
    } catch (error) {
      setAbstracts([]);
    } finally {
      setLoading(false);
    }
  }, [search, filters]);

  // 3. Delete Logic (Admin)
  const handleDelete = async (id) => {
    if (!confirm("🚨 WARNING: Are you sure you want to permanently delete this research?")) return;
    const { error } = await supabase.from('abstracts').delete().eq('id', id);
    if (!error) {
      setSelectedItem(null);
      handleSearch();
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 sm:p-10">
      <h1 className="text-4xl font-black text-[#003366] uppercase tracking-tighter mb-8 italic">Research Library</h1>

      {/* --- SEARCH FORM --- */}
      <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10 bg-white p-4 rounded-[2rem] border-4 border-[#003366] shadow-[8px_8px_0px_0px_rgba(0,51,102,1)]">
        <input
          type="text"
          placeholder="Search topics (e.g. 'Blockchain')..."
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
          Search
        </button>
      </form>

      {/* --- RESULTS GRID --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {abstracts.map((item) => (
          <div 
            key={item.id} 
            onClick={() => setSelectedItem(item)}
            className="cursor-pointer bg-white p-8 rounded-[2rem] border-4 border-[#003366] shadow-[8px_8px_0px_0px_rgba(0,51,102,1)] hover:translate-y-[-4px] hover:shadow-[12px_12px_0px_0px_rgba(0,51,102,1)] transition-all flex flex-col group"
          >
            <div className="flex justify-between items-center mb-4">
               <span className="text-[10px] font-black text-white bg-[#003366] px-3 py-1 rounded-full uppercase tracking-widest">
                {item.department_code || item.departments?.code || 'ARCHIVE'}
              </span>
              <span className="font-mono text-sm font-bold text-[#003366] opacity-50">{item.year}</span>
            </div>
            <h3 className="text-xl font-black text-[#003366] uppercase leading-tight mb-4 group-hover:underline">{item.title}</h3>
            <p className="text-slate-500 text-sm line-clamp-3 mb-6 font-medium leading-relaxed">{item.abstract_text}</p>
            <div className="mt-auto pt-4 border-t-2 border-slate-100 flex items-center justify-between">
               <p className="text-[10px] font-black uppercase text-slate-400 truncate">By {item.authors}</p>
               <span className="text-[#003366] font-black text-xs">VIEW →</span>
            </div>
          </div>
        ))}
      </div>

      {/* --- THE MODAL (VIEW & EDIT) --- */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[#003366]/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-[3rem] border-4 border-[#003366] shadow-[20px_20px_0px_0px_rgba(255,204,0,1)] p-10 relative">
            
            <button onClick={() => {setSelectedItem(null); setIsEditing(false);}} className="absolute top-6 right-6 font-black text-2xl text-[#003366] hover:rotate-90 transition-all">✕</button>

            <form onSubmit={async (e) => {
              e.preventDefault();
              setSaveLoading(true);
              const formData = new FormData(e.target);
              const newTitle = formData.get('title');
              const newAbstract = formData.get('abstract_text');

              try {
                // IMPORTANT: Re-generate embedding so search stays accurate!
                const embedding = await generateEmbedding(`${newTitle}: ${newAbstract}`, 'document');

                const { error } = await supabase
                  .from('abstracts')
                  .update({
                    title: newTitle,
                    abstract_text: newAbstract,
                    authors: formData.get('authors'),
                    year: parseInt(formData.get('year')),
                    embedding // Update the vector too
                  })
                  .eq('id', selectedItem.id);

                if (error) throw error;

                setIsEditing(false);
                setSelectedItem({ ...selectedItem, title: newTitle, abstract_text: newAbstract, authors: formData.get('authors'), year: formData.get('year') });
                handleSearch();
              } catch (err) {
                alert(err.message);
              } finally {
                setSaveLoading(false);
              }
            }}>

              <div className="mb-8">
                 <span className="text-[10px] font-black bg-[#FFCC00] text-[#003366] px-4 py-1 rounded-full uppercase tracking-[0.2em]">
                  {selectedItem.accession_id}
                </span>
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
                    <textarea name="abstract_text" rows={8} defaultValue={selectedItem.abstract_text} className="w-full p-6 bg-slate-50 border-2 border-[#003366] rounded-3xl font-medium text-slate-700 outline-none" />
                  ) : (
                    <p className="text-slate-700 leading-relaxed font-medium bg-slate-50 p-6 rounded-3xl whitespace-pre-wrap">{selectedItem.abstract_text}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Authors</h4>
                    {isEditing ? (
                      <input name="authors" defaultValue={selectedItem.authors} className="w-full font-bold text-[#003366] border-b-2 border-slate-200 outline-none" />
                    ) : (
                      <p className="font-bold text-[#003366]">{selectedItem.authors}</p>
                    )}
                  </div>
                  <div>
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Year</h4>
                    {isEditing ? (
                      <input name="year" type="number" defaultValue={selectedItem.year} className="w-full font-bold text-[#003366] border-b-2 border-slate-200 outline-none" />
                    ) : (
                      <p className="font-bold text-[#003366]">{selectedItem.year}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* ACTION FOOTER */}
              {profile?.role === 'admin' && (
                <div className="mt-10 pt-8 border-t-4 border-slate-100 flex gap-4">
                  {!isEditing ? (
                    <>
                      <button type="button" onClick={() => handleDelete(selectedItem.id)} className="px-6 py-3 bg-red-50 text-red-600 rounded-xl font-black uppercase text-xs hover:bg-red-600 hover:text-white transition-all">Delete Entry</button>
                      <button type="button" onClick={() => setIsEditing(true)} className="flex-1 px-6 py-3 bg-[#003366] text-white rounded-xl font-black uppercase text-xs hover:bg-[#FFCC00] hover:text-[#003366] transition-all">Edit Information</button>
                    </>
                  ) : (
                    <>
                      <button type="button" onClick={() => setIsEditing(false)} className="px-6 py-3 bg-slate-100 text-slate-500 rounded-xl font-black uppercase text-xs">Cancel</button>
                      <button type="submit" disabled={saveLoading} className="flex-1 px-6 py-3 bg-green-600 text-white rounded-xl font-black uppercase text-xs hover:bg-[#003366] transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]">
                        {saveLoading ? 'UPDATING INDEX...' : 'Save Changes'}
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