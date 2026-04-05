// app/api/adviser/route.js
/**
 * MIST-RDS v3: Research Library System (Reference)
 * Project: Research-Proto
 */
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('research_advisers')
    .select('id, name, department')
    .order('name', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request) {
  const supabase = await createClient();
  try {
    const { name, department } = await request.json();
    const { data, error } = await supabase
      .from('research_advisers')
      .insert([{ name, department }])
      .select().single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}