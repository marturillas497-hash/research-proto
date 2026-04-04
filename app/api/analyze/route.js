// app/api/analyze/route.js
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { generateEmbedding } from '@/lib/embeddings';
import { createClient } from '@/lib/supabase/server';
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function POST(request) {
  try {
    // 1. Ensure user is logged in
    const { user } = await requireAuth();
    const supabase = await createClient();
    const { title, description } = await request.json();

    // 2. Generate Embedding (Vector) for the new title
    // This turns words into a list of 512 numbers
    const embedding = await generateEmbedding(`${title} ${description}`, 'query');

    // 3. Search Database for similar research
    // This calls the 'match_abstracts' function we created in the SQL step
    const { data: matches, error: matchError } = await supabase.rpc('match_abstracts', {
      query_embedding: embedding,
      match_count: 5
    });

    if (matchError) throw matchError;

    // 4. Calculate the highest similarity score
    const topScore = matches.length > 0 ? matches[0].similarity : 0;

    // 5. Determine Risk Level based on percentage
    let risk = "GREEN";
    if (topScore > 0.85) risk = "RED";
    else if (topScore > 0.70) risk = "ORANGE";
    else if (topScore > 0.50) risk = "YELLOW";

    // 6. Get AI Recommendations from Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const prompt = `
      As a research assistant, analyze this proposed title: "${title}".
      The highest similarity found in our library is ${Math.round(topScore * 100)}%.
      The matches are: ${matches.map(m => m.title).join(', ')}.
      Provide a brief 3-sentence advice on how to make this research more unique.
    `;

    const result = await model.generateContent(prompt);
    const aiAdvice = result.response.text();

    // 7. Save the report to the database
    const { data: report, error: reportError } = await supabase
      .from('similarity_reports')
      .insert([{
        student_id: user.id,
        input_title: title,
        input_description: description,
        similarity_score: topScore,
        risk_level: risk,
        results_json: matches,
        ai_recommendations: aiAdvice
      }])
      .select()
      .single();

    if (reportError) throw reportError;

    return NextResponse.json(report);

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}