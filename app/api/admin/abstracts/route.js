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

    // 1. Generate the Embedding (Vector) for semantic search
    // We combine title and abstract text for a richer vector
    const embedding = await generateEmbedding(`${title} ${abstract_text}`, 'document');

    // 2. Save to library
    const { data, error } = await supabaseAdmin
      .from('abstracts')
      .insert([{
        title,
        abstract_text,
        authors,
        year: parseInt(year),
        department_id,
        accession_id,
        embedding // The 512-float array
      }])
      .select();

    if (error) throw error;
    return NextResponse.json({ message: 'Abstract successfully indexed', data });
  } catch (error) {
    console.error("Library Indexing Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}