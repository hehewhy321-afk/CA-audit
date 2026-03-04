import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1"
import { generateAIResponse } from "../_shared/ai_router.ts"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

serve(async (req) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        let { query } = await req.json()

        if (!query) {
            return new Response(JSON.stringify({ error: "Missing query" }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        // Normalize query for caching
        const normalizedQuery = query.trim().toLowerCase();

        console.log(`[RAG Request] Processing query: "${query}"`);

        const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
        const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

        const authHeader = req.headers.get("authorization");
        if (!authHeader) throw new Error("Missing authorization header");

        const token = authHeader.replace("Bearer ", "");
        const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            global: { headers: { Authorization: `Bearer ${token}` } },
        });

        const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
        if (claimsError || !claimsData?.claims?.sub) throw new Error("Unauthorized");
        const userId = claimsData.claims.sub as string;

        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

        // Check cache first
        const { data: cachedResult } = await supabase
            .from('ai_query_cache')
            .select('response_text, citations')
            .eq('query_text', normalizedQuery)
            .maybeSingle();

        if (cachedResult) {
            console.log(`[RAG Request] CACHE HIT for: "${normalizedQuery}"`);

            // Log the query from cache
            await supabase.from("agent_logs").insert({
                ca_user_id: userId,
                action_type: 'query',
                entity_type: 'knowledge_base_cache',
                description: `Answered query from cache: "${query}"`,
                confidence: 99,
                input_summary: `User Query String`,
                output_summary: `Returned instant cached response.`,
                status: 'auto_approved'
            });

            return new Response(
                JSON.stringify({
                    answer: cachedResult.response_text,
                    citations: cachedResult.citations,
                    cached: true
                }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
            )
        }

        console.log(`[RAG Request] CACHE MISS.Executing full pipeline for: "${normalizedQuery}"`);

        // 1. Fetch relevant articles (Simple keyword filter for MVP)
        const safeQuery = query.replace(/[^a-zA-Z0-9\s]/g, '');
        const { data: articles } = await supabase
            .from('knowledge_base_articles')
            .select('title, content')
            .or(`title.ilike.% ${safeQuery}%, content.ilike.% ${safeQuery}% `)
            .limit(3);

        const context = articles && articles.length > 0
            ? articles.map(a => `[ARTICLE: ${a.title}]\n${a.content} `).join('\n\n')
            : "No specific local articles found matching the query.";

        console.log("RAG Query:", query);
        console.log("Context Length:", context.length);

        const prompt = `You are an expert NFRS(Nepal Financial Reporting Standards) and Nepal Tax Law assistant. 
        Use the provided context to answer the user's question accurately. 
        If the context doesn't contain the answer, use your general knowledge of Nepal's auditing and tax standards.
        
        CONTEXT FROM KNOWLEDGE BASE:
        ${context}
        
        USER QUESTION: ${query} `;

        const answer = await generateAIResponse(prompt, { expectJson: false });
        console.log(`[RAG Request] AI Response received successfully.Length: ${answer.length} `);

        // Save to Cache (fire and forget)
        const citations = articles?.map(a => a.title) || ["General NFRS Knowledge"];
        supabase
            .from('ai_query_cache')
            .insert({
                query_text: normalizedQuery,
                response_text: answer,
                citations: citations
            })
            .then(async ({ error }) => {
                if (error && error.code !== '23505') { // Ignore unique constraint errors (race conditions)
                    console.error('[RAG Request] Error saving to cache:', error);
                } else if (!error) {
                    console.log(`[RAG Request] Saved result to cache for: "${normalizedQuery}"`);

                    // Log the autonomous RAG query
                    await supabase.from("agent_logs").insert({
                        ca_user_id: userId,
                        action_type: 'query',
                        entity_type: 'knowledge_base_rag',
                        description: `Processed NFRS/Tax RAG query: "${query}"`,
                        confidence: 85,
                        input_summary: `Context size: ${articles?.length || 0} local matched documents.`,
                        output_summary: `Generated original answer.`,
                        status: 'auto_approved'
                    });
                }
            });

        return new Response(
            JSON.stringify({
                answer,
                citations,
                cached: false
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        )
    } catch (error) {
        console.error("nfrs-rag Error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        })
    }
})
