// app/api/analyze/route.js
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { createClient } from '@/lib/supabase/server';
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function POST(request) {
  try {
    const { user } = await requireAuth();
    const supabase = await createClient();

    // Accept pre-computed embedding from client to avoid server-side WASM
    const { title, description, embedding } = await request.json();

    if (!embedding || !Array.isArray(embedding) || embedding.length !== 384) {
      return NextResponse.json({ error: 'Invalid or missing embedding vector' }, { status: 400 });
    }

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

    const metadata = Array.isArray(profile.student_metadata)
      ? profile.student_metadata[0]
      : profile.student_metadata || {};

    const deptCode = profile.departments?.code || 'GEN';
    const deptName = profile.departments?.name || 'General Academic';
    const adviserId = metadata?.adviser_id || null;

    // 2. RESEARCH TYPE LOGIC
    const isCapstone = ['BSIS', 'ACT', 'BSE'].includes(deptCode);
    const researchType = isCapstone ? "Capstone Project" : "Undergraduate Thesis";

    // 3. VECTOR SEARCH — using client-provided embedding
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

    // 5. DEPARTMENTAL CONTEXT
    const deptContext = {
      'BSIS': "System Architecture, SDLC, NPC Data Privacy, and DICT standards.",
      'ACT': "Algorithm efficiency, Backend Scalability, and technical documentation.",
      'BSCRIM': "Criminological Theory, PNP procedures, and urban safety protocols.",
      'BSA': "Agricultural yield, sustainable farming, and DA guidelines.",
      'BPA': "Local Policy, Civil Service efficiency, and LGU Bureaucracy.",
      'BSE': "Venture Strategy, DTI registration, and Market Scalability."
    };

    // 6. AI PANEL EVALUATION
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
        Closest Match: "${matches[0]?.title || 'No direct match'}"

        --- PANEL INSTRUCTIONS ---
        Use "---" between sections as page breaks.

        1. **VERDICT**: One authoritative sentence. If similarity >65%, warn about academic integrity.
        
        ---

        2. **CRITICAL ANALYSIS & PIVOT STRATEGY**: 
           - Explain WHY the project is similar to the closest match.
           - Suggest a geographic pivot to a specific LGU (e.g., Makilala, Kidapawan, or M'lang).
           - Suggest a technical "Value-Add" (e.g., IoT, ML, SMS-gateways) to differentiate.
           - Incorporate: ${deptContext[deptCode] || 'Philippine academic standards.'}.

        ---

        3. **PROPOSED UNIQUE TITLES**: 
           - Provide 3 distinct titles with a technical or unique twist.
           - Ensure they sound like high-level ${deptCode} research.

        ---

        4. **EXPANDED RESEARCH PATHWAYS**: 
           - Suggest 2 alternative topics using completely different methodologies.

        --- STYLE GUIDE ---
        - NO "As an AI". Use "The Panel finds...", "The Researcher is directed to...", "The Board recommends...".
        - Tone: ${risk === 'RED' ? 'Firm, Warning, and Academic' : 'Strict but Mentoring'}.
        - Use **Bold Headers**.
      `;

      const result = await model.generateContent(prompt);
      aiAdvice = result.response.text().trim();
    } catch (aiError) {
      console.error("AI Fallback Logic Fired:", aiError.message);
      const fallbacks = {
        RED: `**VERDICT**: Critical overlap detected. --- **ANALYSIS**: This study is too close to "${matches[0]?.title}". The Panel directs a total pivot. Narrow scope to your LGU and add a technical differentiator. --- **TITLES**: 1. Modified ${deptCode} Framework for Makilala 2. Enhanced ${title} with ML Integration 3. Localized ${deptName} Study.`,
        ORANGE: `**VERDICT**: Significant pivot required. --- **ANALYSIS**: Focus on a specific LGU to narrow scope and ensure RA 10173 compliance. --- **TITLES**: 1. ${deptCode} Integration for PH Rural Areas 2. Technical Analysis of ${title} 3. LGU-Based ${deptName} Study.`,
        YELLOW: `**VERDICT**: Proceed with minor refinements. --- **ANALYSIS**: Ensure strict compliance with the Data Privacy Act (RA 10173) and CHED guidelines. --- **TITLES**: 1. Advanced ${deptCode} Implementation 2. Regional ${title} Evaluation 3. Enhanced ${deptName} Framework.`,
        GREEN: `**VERDICT**: Original concept — proceed to full proposal. --- **ANALYSIS**: Validate methodology against current Philippine standards and CHED guidelines. Add a localized data collection strategy. --- **TITLES**: 1. Novel ${title} Approach 2. ${deptCode} Innovation for Local Industry 3. Community-Based ${deptName} Study.`
      };
      aiAdvice = fallbacks[risk] || fallbacks.GREEN;
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
      .select()
      .single();

    if (reportError) throw reportError;
    return NextResponse.json(report);

  } catch (error) {
    console.error("Critical API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}