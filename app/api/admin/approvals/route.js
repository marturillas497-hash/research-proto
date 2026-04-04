// app/api/admin/approvals/route.js
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-auth';
import { supabaseAdmin } from '@/lib/supabase/service';

export async function GET() {
  try {
    await requireAdmin();
    // Fetch advisers that are NOT active (pending or rejected)
    const { data: pending, error } = await supabaseAdmin
      .from('profiles')
      .select('*, departments(code, name)')
      .eq('role', 'research_adviser')
      .neq('status', 'active');

    if (error) throw error;
    return NextResponse.json(pending);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }
}

export async function PATCH(request) {
  try {
    await requireAdmin();
    const { id, status } = await request.json(); // status should be 'active' or 'rejected'

    const { error } = await supabaseAdmin
      .from('profiles')
      .update({ status })
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ message: `Adviser status updated to ${status}` });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}