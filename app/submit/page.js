// app/submit/page.js
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SubmitPage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const res = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description }),
    });

    if (res.ok) {
      // After checking, go to the dashboard to see the result
      router.push('/dashboard');
    } else {
      alert("Something went wrong. Check your API keys.");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6 bg-white shadow rounded-lg">
      <h1 className="text-2xl font-bold mb-6 text-blue-900">New Similarity Check</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Proposed Research Title</label>
          <input
            type="text"
            required
            className="w-full p-3 mt-1 border rounded-md"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter your title here..."
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Short Description / Abstract</label>
          <textarea
            required
            rows={5}
            className="w-full p-3 mt-1 border rounded-md"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Paste your abstract or description..."
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white p-3 rounded-md font-bold hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? "Analyzing with AI..." : "Check Similarity"}
        </button>
      </form>
    </div>
  );
}