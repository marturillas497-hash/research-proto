// app/page.js
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // If logged in, send them to the correct place immediately
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role === 'admin') redirect('/admin');
    if (profile?.role === 'research_adviser') redirect('/adviser');
    redirect('/dashboard');
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-4">
      <h1 className="text-5xl font-black text-blue-900 mb-6">
        MIST Proto-Research
      </h1>
      <p className="text-xl text-gray-600 max-w-2xl mb-10">
        AI-powered semantic search and similarity checking for institutional research archives.
      </p>
      <div className="flex gap-4">
        <Link href="/login" className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold text-lg hover:bg-blue-700 transition">
          Get Started
        </Link>
        <Link href="/library" className="bg-white text-blue-600 border border-blue-600 px-8 py-3 rounded-xl font-bold text-lg hover:bg-blue-50 transition">
          Browse Library
        </Link>
      </div>
    </div>
  );
}