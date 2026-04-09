// app/api/abstracts/[id]/view/route.js
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // UPSERT ensures uniqueness: if (abstract_id + viewer_id) exists, it just updates the timestamp
    const { error } = await supabase
      .from('abstract_views')
      .upsert({ 
        abstract_id: id, 
        viewer_id: user.id,
        viewed_at: new Date().toISOString()
      }, { 
        onConflict: 'abstract_id, viewer_id' 
      });

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}