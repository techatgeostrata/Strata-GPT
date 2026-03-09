import { OpenAIStream, StreamingTextResponse } from 'ai';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

// Initialize OpenAI & Supabase
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const runtime = 'edge';

export async function POST(req: Request) {
  const { messages } = await req.json();
  const lastMessage = messages[messages.length - 1].content;

  // 1. QUERY OPTIMIZATION: Convert "Tell me about..." into "Geostrata team composition"
  const searchOptimization = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { 
        role: 'system', 
        content: 'You are a search optimizer. Extract the core keywords from the user message to create a search query for a vector database. Remove conversational filler like "tell me about", "give me info", or "what is". Example: "Tell me about Geostrata team" -> "Geostrata team composition members". Output ONLY the optimized string.' 
      },
      { role: 'user', content: lastMessage },
    ],
  });
  
  const optimizedQuery = searchOptimization.choices[0].message.content || lastMessage;
  console.log("🔍 Optimized Search Query:", optimizedQuery);

  // 2. Embed the OPTIMIZED query
  const embeddingResponse = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: optimizedQuery,
  });

  // 3. Search Supabase for relevant Articles AND Videos
  const { data: documents, error } = await supabase.rpc('match_documents', {
    query_embedding: embeddingResponse.data[0].embedding,
    match_threshold: 0.25, 
    match_count: 25,
  });

  if (error) console.error("Database Search Error:", error);

  // 🚀 DEBUG LOG: See exactly what Supabase found in your terminal
  console.log("--- DATABASE RETURNED ---");
  documents?.forEach((doc: any, i: number) => {
    console.log(`Result ${i + 1}: ${doc.metadata.title} (Type: ${doc.metadata.type})`);
  });
  console.log("-------------------------");

  // 4. Conditional Prompting (The "Brain" Fork)
  let systemPrompt = '';

  if (documents && documents.length > 0) {
    // ==========================================
    // PATH A: WE FOUND GEOSTRATA DATA
    // ==========================================
    let contextText = '';
    documents.forEach((doc: any, i: number) => {
      contextText += `\n[Source ${i + 1}] Type: ${doc.metadata.type} | Title: ${doc.metadata.title} | URL: ${doc.metadata.url}\nContent: ${doc.content}\n`;
    });

    systemPrompt = `
You are STRATA GPT, the flagship AI for The Geostrata think tank.
Your primary directive is to provide high-accuracy intelligence based STRICTLY on the provided CONTEXT.

PRIORITY INSTRUCTION:
You have been provided with internal organizational documents and public video archives. 
If the user asks about the organization, team, staff, or internal composition, PRIORITIZE the information in sources labeled "Type: article" or "Type: private_doc".

CONTEXT FROM GEOSTRATA ARCHIVES:
${contextText}

STRICT PRODUCTION RULES:
1. EXACT DETAILS: If the context contains specific numbers, statistics, or facts (e.g., "200+ members", specific names, universities like IIT/IIM, dates), you MUST extract and use them. Do not give vague summaries if the specific data is right there.
2. NO HALLUCINATION: Answer using ONLY the provided context. If the context does not contain the answer, explicitly state: "I do not have that specific information in my current archives." Do not invent or assume details.
3. INLINE CITATIONS: Cite your sources inline using brackets corresponding to the source number, e.g., [1] or [2].
4. SMART REFERENCES: You MUST append a "### References" section at the end of your response, BUT ONLY list the sources you actually used to formulate your answer. Do NOT just dump all provided context links.
5. URL FORMATTING (CRITICAL):
   - For Text Articles/Private Docs: Format as a clickable markdown link: [Title](URL)
   - For Videos: If the source 'Type' is 'video' or the 'URL' contains 'youtube.com', you MUST provide the exact raw youtube.com URL (e.g., https://www.youtube.com/watch?v=...). Do NOT change it to a thegeostrata.com link. The frontend strictly requires the raw 'youtube.com' URL to trigger the video player UI.
`;
  } else {
    // ==========================================
    // PATH B: NO DATA FOUND -> USE GENERAL LLM
    // ==========================================
    systemPrompt = `
You are STRATA GPT, the flagship AI for The Geostrata think tank.
The user asked a question that is NOT covered in your internal archives.
Please answer the question accurately and comprehensively using your general knowledge.

RULES:
1. Maintain a diplomatic, analytical, and professional tone suitable for a geopolitical think tank.
2. Do NOT invent fake Geostrata articles, links, or internal team details.
3. You do not need to provide a References section unless you are citing well-known public facts or external links you are certain of.
`;
  }

  // 5. Generate and Stream the Response
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    stream: true,
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages,
    ],
  });

  // 6. Return the stream
  const stream = OpenAIStream(response as any);
  return new StreamingTextResponse(stream);
}