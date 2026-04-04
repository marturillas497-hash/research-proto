// lib/api-auth.js
import { createClient } from '@/lib/supabase/server';

/**
 * Validates the user session and retrieves their profile from the DB.
 * System: research-proto (MIST)
 * Logic: Multi-step fetch to bypass "Relationship/Schema Cache" errors.
 */
async function getAuthenticatedUser() {
  const supabase = await createClient();
  
  // 1. Identify the Auth User
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { user: null, profile: null };

  // 2. Fetch Core Profile (Bypasses joins to prevent crash)
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    console.error("research-proto Auth Error:", profileError?.message);
    return { user, profile: null };
  }

  // 3. Attach Department Metadata (Optional Step)
  // This ensures the UI gets the 'BSIS' or 'BSIT' labels without crashing the login
  if (profile.department) {
    const { data: deptData } = await supabase
      .from('departments')
      .select('code, name')
      .eq('id', profile.department)
      .single();
    
    if (deptData) {
      profile.departments = deptData; 
    }
  }

  return { user, profile };
}

/**
 * research-proto: Basic Authentication Guard
 */
export async function requireAuth() {
  const { user, profile } = await getAuthenticatedUser();
  
  if (!user || !profile || profile.status !== 'active') {
    throw new Error('Unauthorized or account pending');
  }
  
  return { user, profile };
}

/**
 * research-proto: Admin Security Guard (Navy & Gold Dashboard)
 */
export async function requireAdmin() {
  const { user, profile } = await getAuthenticatedUser();

  // Console logging for debugging the "Forbidden" state
  if (!profile) {
    console.log("research-proto Security: No profile for UID", user?.id);
  } else if (profile.role !== 'admin') {
    console.log("research-proto Security: Role mismatch -", profile.role);
  }

  if (!profile || profile.role !== 'admin' || profile.status !== 'active') {
    throw new Error('Forbidden: Admin access required');
  }
  
  return { user, profile };
}

/**
 * research-proto: Adviser Security Guard
 */
export async function requireAdviser() {
  const { user, profile } = await getAuthenticatedUser();
  
  if (!profile || profile.role !== 'research_adviser' || profile.status !== 'active') {
    throw new Error('Forbidden: Adviser access required');
  }
  
  return { user, profile };
}