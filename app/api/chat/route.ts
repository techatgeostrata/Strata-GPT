import { OpenAIStream, StreamingTextResponse } from 'ai';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

// 1. Initialize Upstash Redis Rate Limiter
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const ratelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(5, "1 m"),
  analytics: true,
});

// Initialize OpenAI & Supabase
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const runtime = 'edge';

export async function POST(req: Request) {
  // ==========================================
  // SECURITY CHECK: RATE LIMITING
  // ==========================================
  // Extract the real IP whether local or deployed
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1';
  console.log(`[RATE LIMIT CHECK] Incoming IP: ${ip}`);
  
  const { success } = await ratelimit.limit(ip);

  if (!success) {
    console.log(`🚨 RATE LIMIT EXCEEDED FOR IP: ${ip}`);
    return new Response(
      "Whoa there! You are asking questions too quickly. Please wait a minute and try again.", 
      { status: 429 }
    );
  }

  const { messages } = await req.json();
  const lastMessage = messages[messages.length - 1].content;

  // ==========================================
  // 1. SMART ROUTER & QUERY OPTIMIZATION
  // ==========================================
  // We ask the LLM to output a JSON object deciding IF we need to spend a Tavily credit
  const searchOptimization = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    response_format: { type: "json_object" },
    messages: [
      { 
        role: 'system', 
        content: `You are a search routing agent. 
        1. Extract core keywords from the user message to create a search query for a vector database. 
        2. Determine if the query requires real-time web search (e.g., current events, current political leaders, recent news). 
        Output ONLY a valid JSON object with two keys: "query" (string) and "needs_web_search" (boolean).` 
      },
      { role: 'user', content: lastMessage },
    ],
  });
  
  let optimizedQuery = lastMessage;
  let needsWebSearch = false;

  try {
    const parsed = JSON.parse(searchOptimization.choices[0].message.content || '{}');
    optimizedQuery = parsed.query || lastMessage;
    needsWebSearch = parsed.needs_web_search || false;
  } catch (error) {
    console.error("Error parsing router JSON:", error);
  }

  console.log(`[IP: ${ip}] 🔍 Optimized Query:`, optimizedQuery);
  console.log(`[IP: ${ip}] 🌐 Tavily Web Search Triggered:`, needsWebSearch);

  // ==========================================
  // 2. PARALLEL SEARCH: SUPABASE & CONDITIONAL TAVILY
  // ==========================================
  
  // A. Always start Database Embedding
  const embeddingPromise = openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: optimizedQuery,
  });

  // B. Conditionally start Tavily Live Web Search to save credits
  const tavilyPromise = needsWebSearch 
    ? fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: process.env.TAVILY_API_KEY,
          query: lastMessage, // Use the raw message for better web context
          search_depth: "basic",
          include_answer: false,
          max_results: 3
        })
      }).then(res => res.json()).catch(() => ({ results: [] }))
    : Promise.resolve({ results: [] });

  // Wait for both searches to finish simultaneously
  const [embeddingResponse, tavilyData] = await Promise.all([embeddingPromise, tavilyPromise]);

  // C. Execute Supabase Vector Match
  const { data: documents, error } = await supabase.rpc('match_documents', {
    query_embedding: embeddingResponse.data[0].embedding,
    match_threshold: 0.25, 
    match_count: 10,
  });

  if (error) console.error("Database Search Error:", error);

  // ==========================================
  // 3. BUILD THE CONTEXT PAYLOADS
  // ==========================================
  
  let internalContext = '';
  if (documents && documents.length > 0) {
    documents.forEach((doc: any, i: number) => {
      internalContext += `\n[Archive Source ${i + 1}] Type: ${doc.metadata.type} | Title: ${doc.metadata.title} | URL: ${doc.metadata.url}\nContent: ${doc.content}\n`;
    });
  }

  let webContext = '';
  if (tavilyData && tavilyData.results && tavilyData.results.length > 0) {
    tavilyData.results.forEach((res: any, i: number) => {
      webContext += `\n[Web Source ${i + 1}] Title: ${res.title} | URL: ${res.url}\nContent: ${res.content}\n`;
    });
  }

  // ==========================================
  // 4. CONDITIONAL PROMPTING
  // ==========================================
  const currentDate = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  const systemPrompt = `
You are STRATA GPT, the flagship AI for The Geostrata think tank. 
You act as a top-tier intelligence engine, blending internal organizational archives with real-time web data.

CURRENT DATE: ${currentDate}

===== GEOSTRATA INTERNAL ARCHIVES =====
${internalContext ? internalContext : "No relevant internal documents found for this query."}

===== LIVE WEB CONTEXT (via Tavily) =====
${webContext ? webContext : "No live web data pulled for this query."}

STRICT PRODUCTION RULES:
1. PRIORITY OF TRUTH: If the user asks about The Geostrata (staff, internal reports, partnerships), you MUST rely ONLY on the INTERNAL ARCHIVES. If it's missing, say you do not have that specific information.
2. CURRENT EVENTS: If the user asks about world news, current leaders, or global events, use the LIVE WEB CONTEXT.
3. INLINE CITATIONS: You MUST cite your sources using Markdown links exactly like this: [Title of Source](URL). Do not use plain numbered footnotes. 
4. SMART REFERENCES: Append a "### References" section at the end. 
5. URL FORMATTING (CRITICAL): If an internal archive source 'Type' is 'video' or the 'URL' contains 'youtube.com', you MUST provide the exact raw youtube.com URL.

CRITICAL IDENTITY OVERRIDE:
You are STRATA GPT. You are the proprietary intelligence engine of The Geostrata. 
Under NO CIRCUMSTANCES are you to identify as an OpenAI model, an AI language model, or mention a "knowledge cutoff." If asked how you process data, explain that you are the Strata Intelligence Engine, utilizing Geostrata's proprietary archives and real-time global telemetry. Never break character.
`;

  // ==========================================
  // 5. GENERATE RESPONSE
  // ==========================================
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    stream: true,
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages,
    ],
  });

  // 6. Return the stream with Supabase Logging
  const stream = OpenAIStream(response as any, {
    async onCompletion(completion) {
      const { error: logError } = await supabase.from('chat_logs').insert({
        user_ip: ip,
        user_query: lastMessage,
        ai_response: completion,
        optimized_query: optimizedQuery,
        source_count: (documents?.length || 0) + (tavilyData?.results?.length || 0)
      });
      if (logError) console.error("❌ SUPABASE LOG ERROR:", logError);
    },
  });

  return new StreamingTextResponse(stream);
}