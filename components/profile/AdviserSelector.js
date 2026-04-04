'use client';
import { useState, useEffect } from 'react';

export default function AdviserSelector({ initialAdviserId }) {
  const [advisers, setAdvisers] = useState([]);
  const [selectedId, setSelectedId] = useState(initialAdviserId || '');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function fetchAdvisers() {
      const response = await fetch('/api/adviser'); // We'll create this simple GET route next
      const data = await response.json();
      setAdvisers(data);
    }
    fetchAdvisers();
  }, []);

  const handleUpdate = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adviser_id: selectedId }),
      });

      if (res.ok) {
        setMessage('Adviser updated successfully!');
      } else {
        setMessage('Failed to update adviser.');
      }
    } catch (err) {
      setMessage('An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
      <label className="block text-sm font-medium text-slate-700 mb-2">
        {initialAdviserId ? 'Change Research Adviser' : 'Assign Research Adviser'}
      </label>
      <div className="flex gap-2">
        <select 
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          className="block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
        >
          <option value="">Select an adviser...</option>
          {advisers.map((adv) => (
            <option key={adv.id} value={adv.id}>
              {adv.name} ({adv.department})
            </option>
          ))}
        </select>
        <button
          onClick={handleUpdate}
          disabled={loading || !selectedId}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400"
        >
          {loading ? 'Saving...' : 'Save'}
        </button>
      </div>
      {message && (
        <p className={`mt-2 text-xs font-medium ${message.includes('success') ? 'text-green-600' : 'text-red-600'}`}>
          {message}
        </p>
      )}
    </div>
  );
}