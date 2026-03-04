import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1"

interface RouterOptions {
    documentData?: { mime_type: string, data: string };
    expectJson?: boolean;
}

export async function generateAIResponse(prompt: string, options?: RouterOptions) {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Use service role to bypass RLS to read ai_providers table safely
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: provider, error } = await supabase
        .from('ai_providers')
        .select('provider_name, api_key, model_name')
        .eq('is_active', true)
        .maybeSingle();

    if (error || !provider) {
        console.error("Failed to fetch active AI provider:", error);
        throw new Error("No active AI provider configured in the database.");
    }

    if (provider.api_key === "pending") {
        throw new Error(`The active provider (${provider.provider_name}) requires an API key. Please update it in the Super Admin dashboard.`);
    }

    const { provider_name, api_key, model_name } = provider;
    console.log(`Routing AI request to ${provider_name} using model ${model_name}`);

    if (provider_name === 'gemini') {
        const payload: any = {
            contents: [{
                parts: [{ text: prompt }]
            }]
        };

        if (options?.expectJson) {
            payload.generationConfig = { response_mime_type: "application/json" };
        }

        if (options?.documentData) {
            payload.contents[0].parts.push({
                inline_data: options.documentData
            });
        }

        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model_name}:generateContent?key=${api_key}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const errText = await res.text();
            throw new Error(`Gemini API Error (${res.status}): ${errText.substring(0, 150)}`);
        }
        const data = await res.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

    } else if (provider_name === 'groq') {
        const payload: any = {
            model: model_name,
            messages: [
                { role: "user", content: prompt }
            ]
        };

        if (options?.expectJson) {
            payload.response_format = { type: "json_object" };
        }

        if (options?.documentData) {
            console.warn("Groq vision not implemented in this MVP wrapper");
        }

        const res = await fetch(`https://api.groq.com/openai/v1/chat/completions`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${api_key}`
            },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const errText = await res.text();
            throw new Error(`Groq API Error (${res.status}): ${errText.substring(0, 150)}`);
        }
        const data = await res.json();
        return data.choices?.[0]?.message?.content || "{}";

    } else if (provider_name === 'openrouter') {
        const payload: any = {
            model: model_name,
            messages: [
                { role: "user", content: prompt }
            ]
        };

        const res = await fetch(`https://openrouter.ai/api/v1/chat/completions`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${api_key}`
            },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const errText = await res.text();
            throw new Error(`OpenRouter API Error (${res.status}): ${errText.substring(0, 150)}`);
        }
        const data = await res.json();
        return data.choices?.[0]?.message?.content || "{}";

    } else if (provider_name === 'cerebras') {
        const payload: any = {
            model: model_name,
            messages: [
                { role: "user", content: prompt }
            ]
        };

        if (options?.expectJson) {
            payload.response_format = { type: "json_object" };
        }

        const res = await fetch(`https://api.cerebras.ai/v1/chat/completions`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${api_key}`
            },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const errText = await res.text();
            throw new Error(`Cerebras API Error (${res.status}): ${errText.substring(0, 150)}`);
        }
        const data = await res.json();
        return data.choices?.[0]?.message?.content || "{}";

    } else if (provider_name === 'anthropic') {
        const payload: any = {
            model: model_name,
            max_tokens: 4096,
            messages: [
                { role: "user", content: prompt }
            ]
        };
        const res = await fetch(`https://api.anthropic.com/v1/messages`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": api_key,
                "anthropic-version": "2023-06-01"
            },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const errText = await res.text();
            throw new Error(`Anthropic API Error (${res.status}): ${errText.substring(0, 150)}`);
        }
        const data = await res.json();
        return data.content?.[0]?.text || "{}";
    }

    throw new Error(`Provider ${provider_name} currently not fully integrated.`);
}
