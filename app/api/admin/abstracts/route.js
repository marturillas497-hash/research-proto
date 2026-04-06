// app/api/admin/abstracts/route.js
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-auth';
import { generateEmbedding } from '@/lib/embeddings';
// 1. Import the creation function instead of the static instance
import { createClient } from '@supabase/supabase-js'; 

export async function POST(request) {
  try {
    // 2. Auth Check
    await requireAdmin();
    
    // 3. Initialize Supabase Admin ONLY inside the request handler
    // This prevents the "supabaseUrl is required" error during build time
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      throw new Error("Database configuration is missing.");
    }

    // 4. Parse Body
    const body = await request.json();
    const { title, abstract_text, authors, year, department_id, accession_id } = body;

    if (!title || !abstract_text) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 5. Generate 384-dimension vector
    const embedding = await generateEmbedding(`${title} ${abstract_text}`);

    // 6. Insert to Supabase
    const { data, error } = await supabaseAdmin
      .from('abstracts')
      .insert([{
        title,
        abstract_text,
        authors,
        year: parseInt(year),
        department_id,
        accession_id,
        embedding 
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