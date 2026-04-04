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

    // --- OPTION 1: SEMANTIC SEARCH (Voyage AI 512-dim) ---
    if (query && query.trim() !== '') {
      try {
        // Line 17: generateEmbedding logic
        const embedding = await generateEmbedding(query, 'query');
        
        //RPC call
        const { data: rpcData, error: rpcError } = await supabase.rpc('match_abstracts', {
          query_embedding: embedding,
          match_count: 20,
          filter_dept: dept || null, 
          filter_year: year ? parseInt(year) : null
        });

        if (!rpcError && rpcData) {
          return NextResponse.json(rpcData);
        }
      } catch (embedError) {
        console.error("MIST-RDS: Search logic failure:", embedError.message);
      }

      // --- OPTION 2: KEYWORD FALLBACK ---
      let textQuery = supabase
        .from('abstracts')
        .select('*')
        .or(`title.ilike.%${query}%,abstract_text.ilike.%${query}%`)
        .order('created_at', { ascending: false })
        .limit(20);

      // Manual Filters
      if (dept) textQuery = textQuery.eq('department', dept);
      if (year) textQuery = textQuery.eq('year', parseInt(year));

      const { data: textData, error: textError } = await textQuery;
      if (textError) throw textError;
      
      return NextResponse.json(textData || []);
    }

    let dbQuery = supabase
      .from('abstracts')
      .select('*') 
      .order('created_at', { ascending: false })
      .limit(20);

    if (dept) dbQuery = dbQuery.eq('department', dept);
    if (year) dbQuery = dbQuery.eq('year', parseInt(year));

    const { data, error } = await dbQuery;
    if (error) throw error;

    return NextResponse.json(data || []);

  } catch (error) {
    console.error('MIST-RDS API Error:', error.message);
    return NextResponse.json([], { status: 500 });
  }
}