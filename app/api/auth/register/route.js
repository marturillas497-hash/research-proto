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
      department_id,
      year_level,
      section,
      student_id 
    } = body;

    // 1. Create user in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true // Auto-confirm for this build
    });

    if (authError) throw authError;

    // 2. Set initial status (Advisers are pending, others active)
    const initialStatus = role === 'research_adviser' ? 'pending' : 'active';

    // 3. Create the profile record
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert([{
        id: authData.user.id,
        full_name,
        email,
        role,
        department_id, // Using the UUID from your new table
        year_level,
        section,
        student_id,
        status: initialStatus
      }]);

    if (profileError) throw profileError;

    return NextResponse.json({ message: 'Registration successful', status: initialStatus });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}