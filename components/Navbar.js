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
        <Link href="/" className="flex items-center space-x-2">
          <span className="text-[#FFCC00] font-black text-2xl tracking-tighter italic">MIST</span>
          <span className="font-bold border-l-2 border-[#FFCC00] pl-2 text-sm uppercase leading-tight">
            Research<br/>System
          </span>
        </Link>
        
        <div className="flex items-center space-x-8">
          {profile.role === 'student' && (
            <>
              <Link href="/dashboard" className="text-sm font-bold hover:text-[#FFCC00] transition uppercase">My Reports</Link>
              <Link href="/submit" className="text-sm font-bold bg-[#FFCC00] text-[#003366] px-4 py-2 rounded-lg hover:bg-white transition uppercase">New Check</Link>
            </>
          )}
          
          {profile.role === 'research_adviser' && (
            <Link href="/adviser" className="text-sm font-bold hover:text-[#FFCC00] transition uppercase">Monitoring</Link>
          )}

          {profile.role === 'admin' && (
            <Link href="/admin" className="text-sm font-bold hover:text-[#FFCC00] transition uppercase">Admin Panel</Link>
          )}

          <Link href="/library" className="text-sm font-bold hover:text-[#FFCC00] transition uppercase">Library</Link>

          <button onClick={handleSignOut} className="ml-4 text-xs font-black bg-red-700 hover:bg-red-800 px-3 py-2 rounded uppercase border border-red-500">
            Log Out
          </button>
        </div>
      </div>
    </nav>
  );
}