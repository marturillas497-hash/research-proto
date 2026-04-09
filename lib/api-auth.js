// app/api-auth.js
import { createClient } from '@/lib/supabase/server';

async function getAuthenticatedUser() {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { user: null, profile: null };

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select(`
      *,
      departments (id, name, code),
      student_metadata!student_metadata_profile_id_fkey (id_number, adviser_id)
    `)
    .eq('id', user.id)
    .maybeSingle();

  if (profileError) {
    console.error("Proto-Research Auth Error:", profileError.message);
    return { user, profile: null };
  }

  if (!profile) {
    console.warn("Proto-Research Security: Profile not found for UID", user.id);
    return { user, profile: null };
  }

  return { user, profile };
}

export async function requireAuth() {
  const { user, profile } = await getAuthenticatedUser();
  if (!user || !profile || profile.status !== 'active') {
    throw new Error('Unauthorized: Active profile required');
  }
  return { user, profile };
}

export async function requireAdmin() {
  const { user, profile } = await getAuthenticatedUser();
  if (!profile || profile.role !== 'admin' || profile.status !== 'active') {
    console.error("Security Breach Attempt: Non-admin tried to access Admin Dashboard", user?.id);
    throw new Error('Forbidden: Admin access required');
  }
  return { user, profile };
}

export async function requireAdviser() {
  const { user, profile } = await getAuthenticatedUser();
  if (!profile || (profile.role !== 'research_adviser' && profile.role !== 'admin') || profile.status !== 'active') {
    throw new Error('Forbidden: Adviser access required');
  }
  return { user, profile };
}