import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1"

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
        const { email, name, firm_name, phone } = await req.json()

        if (!email || !name) {
            throw new Error("Email and Name are required");
        }

        const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
        const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

        // Use service role to interact with Admin API and bypass RLS
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

        // 1. Verify caller is a super_admin
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            throw new Error("Missing Authorization header");
        }
        const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
        if (authError || !user) {
            throw new Error("Unauthorized");
        }

        const { data: roleData, error: roleError } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id)
            .single();

        if (roleError || roleData?.role !== 'super_admin') {
            throw new Error("Forbidden: Only Super Admins can invite CAs");
        }

        // 2. Invite User
        const { data: inviteData, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(email, {
            data: { full_name: name, firm_name: firm_name, phone: phone }
        });

        if (inviteError) {
            throw inviteError;
        }

        if (inviteData?.user) {
            // 3. Add 'ca' role
            const { error: insertRoleError } = await supabase
                .from('user_roles')
                .insert([{ user_id: inviteData.user.id, role: 'ca' }]);

            if (insertRoleError) {
                console.error("Failed to insert CA role:", insertRoleError);
            }

            // Note: The profile row might be auto-created by a database trigger on auth.users insert.
            // If it's not, we might manually insert or update the profile here.
            // We'll update the profile just in case it's created but missing details, or insert if it doesn't exist.
            const { error: profileError } = await supabase
                .from('profiles')
                .upsert({
                    user_id: inviteData.user.id,
                    email: email,
                    full_name: name,
                    firm_name: firm_name || null,
                    phone: phone || null
                }, { onConflict: 'user_id' });

            if (profileError) {
                console.error("Failed to upsert profile for CA:", profileError);
            }
        }

        return new Response(JSON.stringify({ success: true, user: inviteData?.user }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        })
    } catch (error: any) {
        console.error("Error inviting CA:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
        })
    }
})
