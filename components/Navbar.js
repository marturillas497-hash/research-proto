// components/Navbar.js
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function Navbar({ profile }) {
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  if (!profile) return null;

  return (
    <nav className="bg-[#003366] border-b-4 border-[#FFCC00] text-white shadow-xl">
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-20">
        {/* Branding */}
        <Link href="/" className="flex items-center space-x-2 group">
          <span className="text-[#FFCC00] font-black text-2xl tracking-tighter italic group-hover:scale-105 transition-transform">
            MIST
          </span>
          <span className="font-bold border-l-2 border-[#FFCC00] pl-2 text-sm uppercase leading-tight">
            Research<br/>System
          </span>
        </Link>
        
        <div className="flex items-center space-x-8">
          {/* Student Links */}
          {profile.role === 'student' && (
            <>
              <Link href="/dashboard" className="text-sm font-bold hover:text-[#FFCC00] transition uppercase tracking-widest">My Reports</Link>
              <Link href="/profile" className="text-sm font-bold hover:text-[#FFCC00] transition uppercase tracking-widest">Profile</Link>
              <Link href="/submit" className="text-sm font-bold bg-[#FFCC00] text-[#003366] px-4 py-2 rounded-lg hover:bg-white transition uppercase shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] active:shadow-none">New Check</Link>
            </>
          )}
          
          {/* Adviser Links */}
          {profile.role === 'research_adviser' && (
            <Link href="/adviser" className="text-sm font-bold hover:text-[#FFCC00] transition uppercase tracking-widest">Monitoring</Link>
          )}

          {/* Admin Links - Updated to Archive */}
          {profile.role === 'admin' && (
            <>
              <Link href="/admin" className="text-sm font-bold hover:text-[#FFCC00] transition uppercase tracking-widest">Dashboard</Link>
              <Link href="/admin/archive" className="text-sm font-bold border-2 border-[#FFCC00] px-3 py-1.5 rounded-lg hover:bg-[#FFCC00] hover:text-[#003366] transition uppercase tracking-widest">
                Archive
              </Link>
            </>
          )}

          {/* Global Library Link */}
          <Link href="/library" className="text-sm font-bold hover:text-[#FFCC00] transition uppercase tracking-widest">Library</Link>

          {/* Logout Button */}
          <button 
            onClick={handleSignOut} 
            className="ml-4 text-[10px] font-black bg-red-600 hover:bg-red-700 px-4 py-2 rounded-xl uppercase border-2 border-red-800 shadow-[4px_4px_0px_0px_rgba(153,27,27,1)] active:shadow-none active:translate-y-1 transition-all"
          >
            Log Out
          </button>
        </div>
      </div>
    </nav>
  );
}