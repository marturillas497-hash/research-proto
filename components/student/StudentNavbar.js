// components/student/StudentNavbar.js
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function StudentNavbar({ profile }) {
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <nav className="bg-white border-b-4 border-black p-4 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="text-black font-black uppercase italic tracking-tighter text-xl hover:text-[#003366] transition-colors">
            PROTO-RESEARCH // STUDENT
          </Link>
          
          <div className="hidden md:flex gap-6">
            <Link href="/dashboard" className="text-black font-black uppercase text-[10px] tracking-widest hover:bg-[#FFCC00] px-2 transition-all">
              My Dashboard
            </Link>
            <Link href="/submit" className="text-black font-black uppercase text-[10px] tracking-widest hover:bg-[#FFCC00] px-2 transition-all">
              New Scan
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2">
             <span className="w-2 h-2 bg-[#00FF66] border border-black rounded-full animate-pulse"></span>
             <span className="text-[9px] font-black text-black uppercase tracking-tighter">
              {profile?.full_name}
            </span>
          </div>
          <button 
            onClick={handleLogout}
            className="bg-black text-white border-2 border-black px-4 py-1.5 font-black uppercase text-[10px] shadow-[3px_3px_0px_0px_#FFCC00] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}