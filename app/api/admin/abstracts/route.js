// app/api/admin/abstracts/route.js
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-auth';
import { generateEmbedding } from '@/lib/embeddings';
import { createClient } from '@supabase/supabase-js'; 

export async function POST(request) {
  try {
    // 1. Auth Check (Must be an Admin to index)
    await requireAdmin();
    
    // 2. Initialize Supabase Admin inside the handler
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // 3. Early exit if env vars are missing at runtime
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing Supabase environment variables on server.");
    }

    // 4. Parse Body
    const body = await request.json();
    const { title, abstract_text, authors, year, department_id, accession_id } = body;

    if (!title || !abstract_text) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 5. Generate 384-dimension vector (Matches your Vector DB config)
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