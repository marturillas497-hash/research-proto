// app/api/admin/approvals/route.js
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-auth';
import { supabaseAdmin } from '@/lib/supabase/service';

export async function PATCH(request) {
  try {
    // 1. Security Check
    await requireAdmin();

    // 2. Parse and Validate Payload
    const body = await request.json();
    const { adviserId, status } = body;

    if (!adviserId) {
      return NextResponse.json({ error: 'Adviser ID is required' }, { status: 400 });
    }

    // Ensure status matches your database constraints ('active' or 'rejected')
    if (!['active', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status. Use "active" or "rejected"' }, { status: 400 });
    }

    // 3. Update Profile Status
    // Using supabaseAdmin (Service Role) to bypass RLS for administrative actions
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({ 
        status: status,
      })
      .eq('id', adviserId)
      .eq('role', 'research_adviser')
      .select()
      .single();

    if (error) {
      console.error('Database Error:', error);
      throw new Error(error.message);
    }

    if (!data) {
      return NextResponse.json({ error: 'Adviser profile not found' }, { status: 404 });
    }

    // 4. Success Response
    return NextResponse.json({ 
      success: true,
      message: `Adviser ${adviserId} status updated to ${status}`,
      updatedUser: data.full_name
    });

  } catch (error) {
    console.error('Approval API Catch:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' }, 
      { status: 500 }
    );
  }
}