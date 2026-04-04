// app/api/auth/register/route.js
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
      department, // CHANGED: v3 uses 'department' (text), not department_id
      year_level,
      section,
      student_id 
    } = body;

    // 1. Create user in Supabase Auth with METADATA
    // We pass all the extra info into user_metadata so the TRIGGER can grab it
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name,
        role,
        department,
        year_level,
        section,
        student_id,
        status: role === 'research_adviser' ? 'pending' : 'active'
      }
    });

    if (authError) throw authError;

    // NOTE: We REMOVED Step 3 (manual insert). 
    // The Database Trigger 'handle_new_user' now creates the profile automatically 
    // using the user_metadata we just sent above.

    return NextResponse.json({ 
      message: 'Registration successful', 
      user: authData.user 
    });

  } catch (error) {
    console.error('Registration Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}