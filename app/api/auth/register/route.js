// app/api/auth/register/route.js
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request) {
  try {
    // 1. Initialize Supabase Admin INSIDE the handler
    // This prevents the build-time error "supabaseUrl is required"
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const body = await request.json();
    
    const { 
      email, 
      password, 
      full_name, 
      role, 
      department_id, 
      id_number,           
      adviser_id,   
      year_level, 
      section 
    } = body;

    // 2. Validation Check
    if (!email || !password || !full_name || !department_id) {
      return NextResponse.json({ error: "Missing required profile fields" }, { status: 400 });
    }

    // 3. The "UUID Shield" Logic
    const cleanAdviserId = (adviser_id && adviser_id.trim() !== "") ? adviser_id : null;

    // 4. Create Auth User via Admin Service Role
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name,
        role,
        department_id,
        id_number: id_number || null, 
        adviser_id: cleanAdviserId,
        year_level: parseInt(year_level) || 1,
        section: section || 'N/A',
        status: role === 'research_adviser' ? 'pending' : 'active'
      }
    });

    if (authError) {
      console.error('Auth Error:', authError.message);
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    return NextResponse.json({ 
      message: 'Registration successful', 
      status: role === 'research_adviser' ? 'pending' : 'active' 
    });

  } catch (error) {
    console.error('Registration Crash:', error.message);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}