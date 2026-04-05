// app/api/search/route.js
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateEmbedding } from '@/lib/embeddings';

export async function GET(request) {
  const supabase = await createClient();
  
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const dept = searchParams.get('dept'); 
    const year = searchParams.get('year');

    if (query && query.trim() !== '') {
      // Generate 384-dim embedding
      const embedding = await generateEmbedding(query);
      
      const { data: rpcData, error: rpcError } = await supabase.rpc('match_abstracts', {
        query_embedding: embedding, // RPC must accept vector(384)
        match_count: 20,
        filter_dept: dept || null, 
        filter_year: year ? parseInt(year) : null
      });

      if (!rpcError && rpcData) return NextResponse.json(rpcData);
    }

    // Fallback to simple keyword search if AI fails
    let dbQuery = supabase.from('abstracts').select('*').limit(20);
    if (dept) dbQuery = dbQuery.eq('department_id', dept);
    const { data, error } = await dbQuery;
    
    return NextResponse.json(data || []);
  } catch (error) {
    return NextResponse.json([], { status: 500 });
  }
}