// app/api/analyze/route.js
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { generateEmbedding } from '@/lib/embeddings';
import { createClient } from '@/lib/supabase/server';
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function POST(request) {
  try {
    const { user } = await requireAuth();
    const supabase = await createClient();
    const { title, description } = await request.json();

    // 1. Fetch student's department AND adviser — silently links report to adviser
    const { data: profile } = await supabase
      .from('profiles')
      .select('department_id, adviser_id')
      .eq('id', user.id)
      .single();

    // 2. Generate Embedding
    const embedding = await generateEmbedding(`${title} ${description}`);

    // 3. Search filtered by student's department
    const { data: matches, error: matchError } = await supabase.rpc('match_abstracts', {
      query_embedding: embedding,
      filter_dept: profile?.department_id ?? null,
      match_threshold: 0.3,
      match_count: 5
    });

    if (matchError) throw matchError;

    // 4. Calculate Risk
    const topScore = matches && matches.length > 0 ? matches[0].similarity : 0;
    let risk = "GREEN";
    if (topScore > 0.85) risk = "RED";
    else if (topScore > 0.70) risk = "ORANGE";
    else if (topScore > 0.50) risk = "YELLOW";

    // 5. Gemini AI Advice
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const prompt = `
      As a research assistant, analyze this proposed title: "${title}".
      The highest similarity found in our library is ${Math.round(topScore * 100)}%.
      The matches found are: ${matches.map(m => m.title).join(', ')}.
      Provide exactly 3 sentences of professional advice on how to make this research more unique or improve its focus.
    `;

    const result = await model.generateContent(prompt);
    const aiAdvice = result.response.text();

    // 6. Save Report — adviser_id silently attached from student's profile
    const { data: report, error: reportError } = await supabase
      .from('similarity_reports')
      .insert([{
        student_id: user.id,
        adviser_id: profile?.adviser_id ?? null,
        input_title: title,
        input_description: description,
        similarity_score: topScore,
        risk_level: risk,
        results_json: matches,
        ai_recommendations: aiAdvice,
        status: 'pending'
      }])
      .select()
      .single();

    if (reportError) {
      console.error("Database Insert Error:", reportError);
      throw reportError;
    }

    return NextResponse.json(report);

  } catch (error) {
    console.error("API Analysis Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}