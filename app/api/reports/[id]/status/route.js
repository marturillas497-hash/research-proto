// app/api/reports/[id]/status/route.js
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { createClient } from '@/lib/supabase/server';

export async function PATCH(request, { params }) {
  try {
    const { user } = await requireAuth();
    const supabase = await createClient();
    const { id } = await params;
    const { status, adviser_remarks } = await request.json();

    // 1. Role Verification
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'research_adviser') {
      return NextResponse.json({ error: 'Unauthorized: Advisor Role Required' }, { status: 403 });
    }

    // 2. Ownership Verification (Security check)
    const { data: report } = await supabase
      .from('similarity_reports')
      .select('adviser_id')
      .eq('id', id)
      .single();

    if (report?.adviser_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden: This student is not assigned to you' }, { status: 403 });
    }

    // 3. Execution
    const { data, error } = await supabase
      .from('similarity_reports')
      .update({
        status,
        ...(adviser_remarks !== undefined && { adviser_remarks }),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);

  } catch (error) {
    console.error('Status Update Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}