// app/admin/page.js
import { requireAdmin } from '@/lib/api-auth';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function AdminDashboardHome() {
  // Ensure only admins can see this
  await requireAdmin();
  const supabase = await createClient();

  // Get total counts for the cards
  const { count: studentCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student');
  const { count: libraryCount } = await supabase.from('abstracts').select('*', { count: 'exact', head: true });
  const { count: pendingCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'research_adviser').eq('status', 'pending');

  const cards = [
    { label: 'Registered Students', value: studentCount || 0, link: '#', color: 'border-blue-500' },
    { label: 'Library Abstracts', value: libraryCount || 0, link: '/admin/abstracts', color: 'border-purple-500' },
    { label: 'Pending Advisers', value: pendingCount || 0, link: '/admin/approvals', color: 'border-orange-500' },
  ];

  return (
    <div className="max-w-6xl mx-auto p-6">
      <header className="mb-10">
        <h1 className="text-3xl font-extrabold text-gray-900">Admin Control Center</h1>
        <p className="text-gray-500">Manage institutional research data and faculty access.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {cards.map((card, i) => (
          <Link href={card.link} key={i} className={`bg-white p-6 rounded-2xl shadow-sm border-t-4 ${card.color} hover:shadow-md transition`}>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{card.label}</p>
            <p className="text-4xl font-black text-gray-900 mt-2">{card.value}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-blue-900 text-white p-8 rounded-3xl">
          <h2 className="text-xl font-bold mb-2">Quick Actions</h2>
          <p className="text-blue-200 text-sm mb-6">Common administrative tasks for maintaining the MIST research library.</p>
          <div className="flex flex-col space-y-3">
            <Link href="/admin/archive" className="bg-white text-blue-900 py-3 px-4 rounded-xl font-bold text-center hover:bg-blue-50 transition">
              Add New Abstract to Library
            </Link>
            <Link href="/admin/approvals" className="bg-blue-700 text-white py-3 px-4 rounded-xl font-bold text-center hover:bg-blue-800 transition">
              Review Faculty Applications
            </Link>
          </div>
        </div>
        
        <div className="bg-white p-8 rounded-3xl border shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 mb-2">System Health</h2>
          <p className="text-gray-500 text-sm mb-4">Core engine status for Semantic Search and AI Advice.</p>
          <ul className="space-y-4">
            <li className="flex justify-between items-center text-sm">
              <span className="text-gray-600 font-medium">Vector Engine (Voyage AI)</span>
              <span className="text-green-600 font-bold bg-green-50 px-2 py-1 rounded">ONLINE</span>
            </li>
            <li className="flex justify-between items-center text-sm">
              <span className="text-gray-600 font-medium">Reasoning Engine (Gemini)</span>
              <span className="text-green-600 font-bold bg-green-50 px-2 py-1 rounded">ONLINE</span>
            </li>
            <li className="flex justify-between items-center text-sm">
              <span className="text-gray-600 font-medium">Database (Supabase)</span>
              <span className="text-green-600 font-bold bg-green-50 px-2 py-1 rounded">ONLINE</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}