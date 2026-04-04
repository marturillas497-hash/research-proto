'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function LibraryPage() {
  const [abstracts, setAbstracts] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ dept: '', year: '' });

  const supabase = createClient();

  // Wrap handleSearch in useCallback to prevent infinite loops in useEffect
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
      
      if (!res.ok) throw new Error('Failed to fetch');
      
      const data = await res.json();
      
      // CRITICAL FIX: Ensure data is always an array
      setAbstracts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("research-proto Library Error:", error);
      setAbstracts([]); // Fallback to empty array on error
    } finally {
      setLoading(false);
    }
  }, [search, filters, supabase]);

  // Load departments and trigger initial search
  useEffect(() => {
    async function init() {
      const { data: depts } = await supabase.from('departments').select('*').order('code');
      setDepartments(depts || []);
      // Initial load of all research
      handleSearch();
    }
    init();
  }, [handleSearch, supabase]);

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-[#003366] mb-8">Research Library</h1>

      {/* Search Bar & Filters */}
      <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
        <input
          type="text"
          placeholder="Search by topic (e.g. 'AI in farming')..."
          className="md:col-span-2 p-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-[#FFCC00] outline-none"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select 
          className="p-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-[#FFCC00] outline-none"
          value={filters.dept}
          onChange={(e) => setFilters({...filters, dept: e.target.value})}
        >
          <option value="">All Departments</option>
          {departments.map(d => (
            <option key={d.id} value={d.id}>{d.code}</option>
          ))}
        </select>
        <button 
          type="submit" 
          className="bg-[#003366] text-[#FFCC00] font-bold rounded-lg hover:bg-[#002244] transition shadow-md"
        >
          Search Library
        </button>
      </form>

      {/* Results Grid */}
      {loading ? (
        <div className="text-center py-20 text-gray-500 animate-pulse">
          Searching the research-proto archives...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Added Array.isArray check to prevent the .map crash */}
          {Array.isArray(abstracts) && abstracts.map((item) => (
            <div key={item.id} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition flex flex-col justify-between group">
              <div>
                <div className="flex justify-between items-start mb-3">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-[#003366] bg-blue-50 px-2 py-1 rounded border border-blue-100">
                    {item.department_code || item.departments?.code || 'General'}
                  </span>
                  <span className="text-xs text-gray-400 font-mono">{item.year || '2026'}</span>
                </div>
                <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-[#003366] transition-colors">
                  {item.title}
                </h3>
                <p className="text-sm text-gray-600 line-clamp-4 mb-4 leading-relaxed">
                  {item.abstract_text || "No abstract available for this entry."}
                </p>
              </div>
              <div className="pt-4 border-t border-gray-50">
                <p className="text-xs text-gray-500 italic">
                  <span className="font-semibold not-italic text-gray-700">Authors:</span> {item.authors || 'Unknown'}
                </p>
              </div>
            </div>
          ))}

          {(!abstracts || abstracts.length === 0) && (
            <div className="col-span-full text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
              <p className="text-gray-400">No matching research found in the archives.</p>
              <button 
                onClick={() => {setSearch(''); setFilters({dept:'', year:''}); handleSearch();}}
                className="text-[#003366] font-semibold text-sm mt-2 underline"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}