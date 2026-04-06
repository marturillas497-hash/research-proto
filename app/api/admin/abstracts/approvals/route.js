// app/api/admin/approvals/route.js
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-auth';
import { supabaseAdmin } from '@/lib/supabase/service';

export async function PATCH(request) {
  try {
    await requireAdmin();
    const { adviserId, status } = await request.json();

    if (!['active', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('profiles')
      .update({ status })
      .eq('id', adviserId)
      .eq('role', 'research_adviser');

    if (error) throw error;

    return NextResponse.json({ message: `Adviser ${status}` });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}