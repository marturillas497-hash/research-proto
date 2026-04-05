// app/api/admin/abstracts/route.js
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-auth';
import { generateEmbedding } from '@/lib/embeddings';
import { supabaseAdmin } from '@/lib/supabase/service';

export async function POST(request) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { title, abstract_text, authors, year, department_id, accession_id } = body;

    // This now generates a 384-dimension vector locally on the server
    const embedding = await generateEmbedding(`${title} ${abstract_text}`);

    const { data, error } = await supabaseAdmin
      .from('abstracts')
      .insert([{
        title,
        abstract_text,
        authors,
        year: parseInt(year),
        department_id,
        accession_id,
        embedding // Now 384 dimensions
      }])
      .select();

    if (error) throw error;
    return NextResponse.json({ message: 'Abstract successfully indexed', data });
  } catch (error) {
    console.error("Library Indexing Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}