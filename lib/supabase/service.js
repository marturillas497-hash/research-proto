// lib/supabase/service.js
import { createClient } from '@supabase/supabase-js';

export const getSupabaseAdmin = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    // During build, this will just log instead of crashing the whole process
    console.warn("Supabase Admin credentials missing during build worker execution.");
    return null; 
  }

  return createClient(url, key);
};