// app/api/admin/abstracts/route.js
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-auth';
import { generateEmbedding } from '@/lib/embeddings';
import { supabaseAdmin } from '@/lib/supabase/service';

export async function POST(request) {
  try {
    // 1. Auth Check
    await requireAdmin();
    
    // 2. Parse Body
    const body = await request.json();
    const { title, abstract_text, authors, year, department_id, accession_id } = body;

    if (!title || !abstract_text) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 3. Generate 384-dimension vector
    const embedding = await generateEmbedding(`${title} ${abstract_text}`);

    // 4. Insert to Supabase
    const { data, error } = await supabaseAdmin
      .from('abstracts')
      .insert([{
        title,
        abstract_text,
        authors,
        year: parseInt(year),
        department_id,
        accession_id,
        embedding // Vector data
      }])
      .select();

    if (error) throw error;
    
    return NextResponse.json({ 
      message: 'Abstract successfully indexed', 
      data: data[0] 
    });

  } catch (error) {
    console.error("Library Indexing Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" }, 
      { status: 500 }
    );
  }
}