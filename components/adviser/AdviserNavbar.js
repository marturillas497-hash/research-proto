// components/adviser/AdviserNavbar.js
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function AdviserNavbar({ profile }) {
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <nav className="bg-[#003366] border-b-4 border-black p-4 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="text-[#FFCC00] font-black uppercase italic tracking-tighter text-xl hover:opacity-80 transition-opacity">
            PROTO-RESEARCH // ADVISER
          </Link>
          <div className="hidden md:flex gap-6">
            <Link href="/dashboard" className="text-white font-black uppercase text-[10px] tracking-widest hover:text-[#FFCC00] transition-colors">
              Dashboard
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="hidden sm:block text-[9px] font-black text-white uppercase bg-black/20 px-3 py-1 border border-white/10">
            {profile?.full_name}
          </span>
          <button 
            onClick={handleLogout}
            className="bg-[#FFCC00] border-2 border-black px-4 py-1.5 font-black uppercase text-[10px] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}