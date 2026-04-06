//app/api/auth/register/ route.js

import { supabaseAdmin } from '@/lib/supabase/service';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    
    const { 
      email, 
      password, 
      full_name, 
      role, 
      department_id, 
      lrn,           
      adviser_id,   
      year_level, 
      section 
    } = body;

    // 1. Validation Check
    if (!email || !password || !full_name || !department_id) {
      return NextResponse.json({ error: "Missing required profile fields" }, { status: 400 });
    }

    // 2. The "UUID Shield" Logic
    // If the string is empty or just whitespace, explicitly set to null
    const cleanAdviserId = (adviser_id && adviser_id.trim() !== "") ? adviser_id : null;

    // 3. Create Auth User via Admin Service Role
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name,
        role,
        department_id,
        lrn: lrn || null, 
        adviser_id: cleanAdviserId, // Crucial for optional UUID columns
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