// app/api/profile/route.js
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PATCH(request) {
  const supabase = await createClient();
  
  try {
    const { adviser_id } = await request.json();
    
    // Get the current logged-in user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Update the profile table
    const { data, error } = await supabase
      .from('profiles')
      .update({ adviser_id })
      .eq('id', user.id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('Profile Update Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}