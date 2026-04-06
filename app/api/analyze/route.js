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

    // 1. IDENTITY CHECK
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select(`
        full_name,
        departments (code, name),
        student_metadata!student_metadata_profile_id_fkey (lrn, adviser_id)
      `)
      .eq('id', user.id)
      .single();

    if (profileError) throw profileError;

    const metadata = profile.student_metadata?.[0] || {};
    const deptCode = profile.departments?.code || 'GEN';
    const deptName = profile.departments?.name || 'General Academic';
    const adviserId = metadata.adviser_id || null;
    
    // 2. RESEARCH TYPE LOGIC
    const isCapstone = ['BSIS', 'ACT', 'BSE'].includes(deptCode);
    const researchType = isCapstone ? "Capstone Project" : "Undergraduate Thesis";

    // 3. TRANSFORMER SCAN (GLOBAL)
    const embedding = await generateEmbedding(`${title}: ${description}`);
    const { data: matches, error: matchError } = await supabase.rpc('match_abstracts', {
      query_embedding: embedding,
      match_threshold: 0.3,
      match_count: 5
    });

    if (matchError) throw matchError;

    // 4. RISK MATRIX
    const topScore = matches?.[0]?.similarity || 0;
    let risk = "GREEN";
    if (topScore > 0.80) risk = "RED";
    else if (topScore > 0.65) risk = "ORANGE";
    else if (topScore > 0.45) risk = "YELLOW";

    // 5. DEPARTMENTAL ADVISORY PROTOCOLS
    const deptContext = {
      'BSIS': "System Architecture, SDLC, NPC Data Privacy, and DICT standards.",
      'ACT': "Algorithm efficiency, Backend Scalability, and technical documentation.",
      'BSCRIM': "Criminological Theory, PNP procedures, and urban safety protocols.",
      'BSA': "Agricultural yield, sustainable farming, and DA guidelines.",
      'BPA': "Local Policy, Civil Service efficiency, and LGU Bureaucracy.",
      'BSE': "Venture Strategy, DTI registration, and Market Scalability."
    };

    // 6. AI MIRROR EVALUATION (GEMINI)
    let aiAdvice = "";
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = `
        Role: You are a highly critical and experienced Senior Research Panelist at a Philippine HEI.
        Task: Provide a deep-dive evaluation for a ${deptName} (${deptCode}) student's ${researchType}.
        
        --- STUDENT DOSSIER ---
        Student: ${profile.full_name}
        Proposed Title: "${title}"
        Similarity Index: ${Math.round(topScore * 100)}%
        Closest Match: "${matches[0]?.title || 'No direct match'}" (Dept: ${matches[0]?.dept_code || 'N/A'})

        --- PANEL INSTRUCTIONS ---
        You must be verbose and academic. Use "---" between sections to act as page breaks for the layout.

        1. **VERDICT**: One authoritative sentence. If similarity is >65%, call out the conflict with the ${matches[0]?.dept_code} archive and warn about academic integrity.
        
        ---

        2. **CRITICAL ANALYSIS & PIVOT STRATEGY**: 
           - Explain WHY the project is similar to ${matches[0]?.title}.
           - Suggest a specific geographic pivot. Advise the student to narrow their scope to their own hometown or LGU (e.g., Makilala, Kidapawan, or M'lang) to ensure localized data relevance.
           - For ${deptCode}, suggest adding a technical "Value-Add" (e.g., IoT integration, Machine Learning, or SMS-gateways) to differentiate it from the matched paper.
           - Incorporate: ${deptContext[deptCode]}.

        ---

        3. **PROPOSED UNIQUE TITLES**: 
           - Provide 3 distinct titles that add a technical or unique twist to the student's original topic. 
           - Ensure they sound like high-level ${deptCode} research.

        ---

        4. **EXPANDED RESEARCH PATHWAYS**: 
           - Suggest 2 alternative topics that exist within the same context but use completely different methodologies.
           - This helps the student if their current idea is rejected.

        --- STYLE GUIDE ---
        - NO "As an AI". Use "The Panel finds...", "The Researcher is directed to...", "The Board recommends...".
        - Tone: ${risk === 'RED' ? 'Firm, Warning, and Academic' : 'Strict but Mentoring'}.
        - Use **Bold Headers**.
      `;

      const result = await model.generateContent(prompt);
      aiAdvice = result.response.text().trim();
    } catch (aiError) {
      console.error("AI Fallback Logic Fired.");
      const fallbacks = {
        RED: `**VERDICT**: Critical overlap detected. --- **ANALYSIS**: This study is too close to ${matches[0]?.title}. The Panel directs a total pivot. --- **TITLES**: 1. Modified ${deptCode} Framework.`,
        DEFAULT: `**VERDICT**: Proceed with refinements. --- **ANALYSIS**: Focus on localizing to your LGU and ensuring RA 10173 compliance. --- **TITLES**: 1. Enhanced ${title}.`
      };
      aiAdvice = fallbacks[risk] || fallbacks.DEFAULT;
    }

    // 7. ARCHIVE REPORT
    const { data: report, error: reportError } = await supabase
      .from('similarity_reports')
      .insert([{
        student_id: user.id,
        adviser_id: adviserId,
        input_title: title,
        input_description: description,
        similarity_score: topScore,
        risk_level: risk,
        results_json: matches,
        ai_recommendations: aiAdvice,
        status: 'pending'
      }])
      .select().single();

    if (reportError) throw reportError;
    return NextResponse.json(report);

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}