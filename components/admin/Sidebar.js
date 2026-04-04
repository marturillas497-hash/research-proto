//components/admin/Sidebar.js

'use client';
import { useSignOut } from '@/lib/auth-actions';
import { LogOut } from 'lucide-react'; // If using lucide-react icons

export function Sidebar() {
  const signOut = useSignOut();

  return (
    <aside className="bg-[#003366] text-white w-64 min-h-screen flex flex-col p-4">
      <div className="flex-grow">
        {/* Your other Navy/Gold Nav Links here */}
      </div>

      {/* The Missing Logout Button */}
      <button 
        onClick={signOut}
        className="flex items-center gap-2 p-3 mt-auto text-red-100 hover:bg-red-900/30 rounded-lg transition-colors border border-transparent hover:border-red-400"
      >
        <LogOut size={20} />
        <span>Sign Out</span>
      </button>
    </aside>
  );
}