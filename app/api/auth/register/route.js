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
      department_id, // Receives UUID from normalized dropdown
      year_level,
      section,
      student_id 
    } = body;

    // 1. Create Auth User with metadata aligned for the SQL Trigger
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name,
        role,
        department_id, // Passing UUID string to metadata
        year_level,
        section,
        student_id,
        status: role === 'research_adviser' ? 'pending' : 'active'
      }
    });

    if (authError) throw authError;

    return NextResponse.json({ 
      message: 'Registration successful', 
      status: role === 'research_adviser' ? 'pending' : 'active' 
    });

  } catch (error) {
    console.error('Research-Proto Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}