// ─── AI TDS Reconciliation Edge Function ───
// Path: supabase/functions/reconcile-tds/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { generateAIResponse } from "../_shared/ai_router.ts"

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
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

        const { ledgerData, irdData } = await req.json()

        console.log("Processing TDS Reconciliation for", ledgerData.length, "entries");

        const prompt = `Match the following Ledger entries to IRD records. Return JSON matching pairs.
        
        Ledger: ${JSON.stringify(ledgerData.slice(0, 10))}
        IRD: ${JSON.stringify(irdData.slice(0, 10))}`;

        const resultsText = await generateAIResponse(prompt, { expectJson: true });

        // Strip markdown backticks if returned
        let parsedJSON: any = {};
        try {
            const cleanText = resultsText.replace(/```(?:json)?/g, '').trim();
            parsedJSON = JSON.parse(cleanText);
        } catch (e) {
            console.error("Failed to parse AI response as JSON:", resultsText);
            parsedJSON = { raw: resultsText };
        }

        // Calculate a rough confidence based on how many matches it found
        const matchedCount = parsedJSON.matches ? parsedJSON.matches.length : 0;
        const confidence = ledgerData.length > 0 ? Math.min(100, (matchedCount / ledgerData.length) * 100) : 0;

        await supabase.from("agent_logs").insert({
            ca_user_id: userId,
            action_type: 'reconcile',
            entity_type: 'tds_reconciliation',
            description: `TDS Reconciliation: Analysed ${ledgerData.length} ledger entries vs ${irdData.length} IRD records.`,
            confidence: confidence,
            input_summary: `${ledgerData.length} ledger items`,
            output_summary: `Found ${matchedCount} potential matches.`,
            status: 'auto_approved'
        });

        return new Response(
            JSON.stringify({
                success: true,
                message: "Dynamic AI-enhanced Reconciliation Analysis complete",
                results: parsedJSON
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        )
    } catch (error) {
        console.error("reconcile-tds Error:", error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } })
    }
})
