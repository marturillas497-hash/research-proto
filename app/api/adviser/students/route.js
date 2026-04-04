// app/api/adviser/students/route.js
import { NextResponse } from 'next/server';
import { requireAdviser } from '@/lib/api-auth';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    // 1. Ensure the user is an authorized Adviser
    const { profile } = await requireAdviser();
    const supabase = await createClient();

    // 2. Fetch all students in the Adviser's department
    const { data: students, error } = await supabase
      .from('profiles')
      .select(`
        id, 
        full_name, 
        email, 
        year_level, 
        section, 
        student_id,
        similarity_reports (
          id,
          input_title,
          similarity_score,
          risk_level,
          created_at
        )
      `)
      .eq('role', 'student')
      .eq('department_id', profile.department_id)
      .order('full_name');

    if (error) throw error;

    return NextResponse.json(students);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }
}