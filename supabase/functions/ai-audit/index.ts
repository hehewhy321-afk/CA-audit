import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { generateAIResponse } from "../_shared/ai_router.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("authorization");
    if (!authHeader) throw new Error("Missing authorization header");

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Validate user via anon-key client + getClaims
    const token = authHeader.replace("Bearer ", "");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    if (!SUPABASE_ANON_KEY) throw new Error("SUPABASE_ANON_KEY is not configured");

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims?.sub) throw new Error("Unauthorized");
    const userId = claimsData.claims.sub as string;

    const { sessionId, mode, rules, parameters, fileContents } = await req.json();

    // Update session status to processing
    await supabase
      .from("smart_audit_sessions")
      .update({ status: "processing" })
      .eq("id", sessionId)
      .eq("ca_user_id", userId);

    // Build the audit prompt
    const rulesText = (rules as string[]).map((r: string, i: number) => `${i + 1}. ${r}`).join("\n");

    const systemPrompt = `You are AuditPro Nepal's Smart Audit AI engine — an expert Nepalese Chartered Accountant auditor.
    Analyze financial data and documents against specified audit rules.
    Materiality NPR: ${(parameters as any)?.materiality || 100000}
    Fiscal year: ${(parameters as any)?.fiscal_year || '2081/82'}`;

    const userPrompt = `AUDIT RULES TO CHECK:
    ${rulesText}
    
    FILE DATA:
    ${(fileContents as { name: string; content: string }[])
        .map((f) => `--- FILE: ${f.name} ---\n${f.content.substring(0, 50000)}`)
        .join("\n\n")}
    
    Return strictly JSON with "findings" (array), "summary" (key_observations), and "compliance_score" (0-100).`;

    const rawContent = await generateAIResponse(`${systemPrompt}\n\n${userPrompt}`, { expectJson: true });

    // Parse the JSON from AI response
    let parsed;
    try {
      const cleanText = rawContent.replace(/```(?:json)?/g, '').trim();
      parsed = JSON.parse(cleanText);
    } catch {
      console.error("Failed to parse ai-audit output:", rawContent);
      parsed = { findings: [], summary: { key_observations: rawContent }, compliance_score: 0 };
    }

    // Update session with results
    await supabase
      .from("smart_audit_sessions")
      .update({
        status: "completed",
        results: parsed,
        summary: parsed.summary?.key_observations || "Audit completed",
      })
      .eq("id", sessionId);

    // Record the autonomous action in the Agent Log
    await supabase.from("agent_logs").insert({
      ca_user_id: userId,
      action_type: 'categorize',
      entity_type: 'smart_audit_sessions',
      entity_id: sessionId,
      description: `Smart Audit completed for ${fileContents.length} document(s)`,
      confidence: parsed.compliance_score || 0,
      input_summary: `Rules checks: ${rules.length}`,
      output_summary: parsed.summary?.key_observations?.substring(0, 200) || "Audit completed",
      status: 'auto_approved'
    });

    return new Response(JSON.stringify({ success: true, results: parsed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("ai-audit error:", e);
    return new Response(
      JSON.stringify({ error: e.message || "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
