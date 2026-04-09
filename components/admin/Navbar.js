// components/admin/Navbar.js
'use client';

import Link from 'next/link';
import { useSignOut } from '@/lib/auth-actions';
import { usePathname } from 'next/navigation';

export default function AdminNavbar() {
  const signOut = useSignOut();
  const pathname = usePathname();

  const navLinks = [
    { name: 'Control Center', href: '/admin' },
    { name: 'Approvals', href: '/admin/approvals' },
    { name: 'Archive', href: '/admin/archive' },
    { name: 'Advisers', href: '/admin/advisers' },
  ];

  return (
    <nav className="w-full bg-[#003366] border-b-4 border-black sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        
        {/* LOGO SECTION */}
        <div className="flex items-center gap-8">
          <Link href="/admin" className="text-white font-black italic text-xl tracking-tighter uppercase">
            ADMIN<span className="text-[#FFCC00]">PROTO</span>
          </Link>

          {/* NAV LINKS */}
          <div className="hidden md:flex gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest border-2 transition-all ${
                  pathname === link.href
                    ? 'bg-[#FFCC00] text-black border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                    : 'text-white border-transparent hover:border-[#FFCC00]'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>
        </div>

        {/* ACTIONS */}
        <div className="flex items-center gap-4">
          <Link 
            href="/library" 
            className="hidden sm:block text-[10px] font-black text-[#FFCC00] uppercase hover:underline"
          >
            Public Library
          </Link>
          <button
            onClick={signOut}
            className="bg-red-600 text-white border-2 border-black px-4 py-2 text-[10px] font-black uppercase shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
          >
            Sign Out
          </button>
        </div>
      </div>
    </nav>
  );
}