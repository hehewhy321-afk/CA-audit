// ─── AI OCR Edge Function ───
// Path: supabase/functions/ai-ocr/index.ts

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

        const { documentUrl } = await req.json()

        console.log("Running dynamic AI OCR on", documentUrl);

        // 1. Fetch the image and convert to base64
        const imageRes = await fetch(documentUrl);
        if (!imageRes.ok) throw new Error("Failed to fetch document image");

        const contentType = imageRes.headers.get("content-type") || "image/jpeg";
        const buffer = await imageRes.arrayBuffer();
        const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));

        // 2. Call Dynamic AI Router
        const prompt = "Extract PAN (9 digits), Total Amount (Numerical), and Date (YYYY-MM-DD or DD-MM-YYYY) from this document. Return strictly JSON.";
        const extractedText = await generateAIResponse(prompt, {
            documentData: { mime_type: contentType, data: base64 },
            expectJson: true
        });

        let extracted: any = {};
        try {
            const cleanText = extractedText.replace(/```(?:json)?/g, '').trim();
            extracted = JSON.parse(cleanText);
        } catch (e) {
            console.error("Failed to parse extracted JSON:", extractedText);
            extracted = { raw: extractedText };
        }

        const details = Object.keys(extracted).length;

        await supabase.from("agent_logs").insert({
            ca_user_id: userId,
            action_type: 'extract',
            entity_type: 'document_ocr',
            description: `Extracted ${details} fields from document.`,
            confidence: 90, // Static confidence for OCR for now
            input_summary: `Scanned single document instance.`,
            output_summary: `Extracted data mapped successfully.`,
            status: 'auto_approved'
        });

        return new Response(
            JSON.stringify({ success: true, extracted }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        )
    } catch (error) {
        console.error("ai-ocr Error:", error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } })
    }
})
