// lib/supabase/service.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Log a warning during build if variables are missing, but don't crash the process
if (!supabaseUrl || !supabaseServiceKey) {
  console.warn("⚠️ Supabase Service Role credentials missing. This is expected during some build phases but will fail in production if not set in Vercel.");
}

// Export as 'supabaseAdmin' so your API route can find it
export const supabaseAdmin = createClient(
  supabaseUrl || '', 
  supabaseServiceKey || '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);