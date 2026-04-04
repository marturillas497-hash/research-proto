// app/admin/abstracts/page.js
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function AddAbstractPage() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  
  const [formData, setFormData] = useState({
    title: '',
    abstract_text: '',
    authors: '',
    year: new Date().getFullYear(),
    department_id: '',
    accession_id: ''
  });

  const supabase = createClient();

  useEffect(() => {
    async function getDepts() {
      const { data } = await supabase.from('departments').select('*').order('code');
      if (data) setDepartments(data);
    }
    getDepts();
  }, [supabase]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });

    const res = await fetch('/api/admin/abstracts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    const result = await res.json();

    if (res.ok) {
      setMessage({ text: 'Abstract added and indexed successfully!', type: 'success' });
      setFormData({
        title: '', abstract_text: '', authors: '',
        year: new Date().getFullYear(), department_id: '', accession_id: ''
      });
    } else {
      setMessage({ text: result.error || 'Failed to add abstract', type: 'error' });
    }
    setLoading(false);
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="bg-white p-8 rounded-2xl shadow-sm border">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Add Research to Library</h1>
        
        {message.text && (
          <div className={`p-4 mb-6 rounded-lg font-medium ${
            message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-1">Research Title</label>
              <input
                type="text"
                required
                className="w-full p-3 border rounded-xl"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Accession/ID Number</label>
              <input
                type="text"
                required
                placeholder="e.g. 2024-IS-001"
                className="w-full p-3 border rounded-xl"
                value={formData.accession_id}
                onChange={(e) => setFormData({...formData, accession_id: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Year</label>
              <input
                type="number"
                required
                className="w-full p-3 border rounded-xl"
                value={formData.year}
                onChange={(e) => setFormData({...formData, year: e.target.value})}
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-1">Authors</label>
              <input
                type="text"
                required
                placeholder="Lastname, Firstname; Lastname, Firstname"
                className="w-full p-3 border rounded-xl"
                value={formData.authors}
                onChange={(e) => setFormData({...formData, authors: e.target.value})}
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-1">Department</label>
              <select
                required
                className="w-full p-3 border rounded-xl"
                value={formData.department_id}
                onChange={(e) => setFormData({...formData, department_id: e.target.value})}
              >
                <option value="">Select Department</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.code} - {d.name}</option>
                ))}
              </select>
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-1">Abstract Text</label>
              <textarea
                required
                rows={6}
                className="w-full p-3 border rounded-xl"
                value={formData.abstract_text}
                onChange={(e) => setFormData({...formData, abstract_text: e.target.value})}
              ></textarea>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white p-4 rounded-xl font-bold hover:bg-blue-700 disabled:bg-gray-400 transition"
          >
            {loading ? 'Generating Vectors & Saving...' : 'Add to Research Library'}
          </button>
        </form>
      </div>
    </div>
  );
}