//app/api/adviser/route.js
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET: Fetches the master list of advisers.
 * Used by: Student Profile (Adviser Selection) and Admin Dashboard.
 */
export async function GET() {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('research_advisers')
    .select('id, name, department')
    .order('name', { ascending: true });

  if (error) {
    console.error('MIST-RDS: Error fetching advisers:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  return NextResponse.json(data);
}

/**
 * POST: Registers a new research adviser.
 * Expected Body: { name: string, department: string }
 */
export async function POST(request) {
  const supabase = await createClient();
  
  try {
    const { name, department } = await request.json();

    if (!name || !department) {
      return NextResponse.json({ error: 'Name and Department are required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('research_advisers')
      .insert([{ name, department }])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
    
  } catch (error) {
    console.error('MIST-RDS: Error creating adviser:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}