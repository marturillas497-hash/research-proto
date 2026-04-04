'use client';

import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export function useSignOut() {
  const supabase = createClient();
  const router = useRouter();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    // Refresh to clear the Next.js server cache and redirect to login
    router.refresh();
    router.push('/login');
  };

  return handleSignOut;
}