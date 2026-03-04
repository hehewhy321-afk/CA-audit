-- Add super_admin role
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'super_admin';

-- Create ai_providers table
CREATE TABLE IF NOT EXISTS public.ai_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_name TEXT NOT NULL UNIQUE,
  api_key TEXT NOT NULL,
  model_name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_providers ENABLE ROW LEVEL SECURITY;

-- Auto update updated_at
DROP TRIGGER IF EXISTS update_ai_providers_updated_at ON public.ai_providers;
CREATE TRIGGER update_ai_providers_updated_at 
BEFORE UPDATE ON public.ai_providers 
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Only super_admin can manage AI providers
DROP POLICY IF EXISTS "Super admins can manage AI providers" ON public.ai_providers;
CREATE POLICY "Super admins can manage AI providers" 
ON public.ai_providers 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'super_admin'::app_role
  )
);

-- Seed initial providers
INSERT INTO public.ai_providers (provider_name, api_key, model_name, is_active)
VALUES 
  ('gemini', 'pending', 'gemini-2.0-flash', true),
  ('groq', 'pending', 'llama3-70b-8192', false),
  ('anthropic', 'pending', 'claude-3-5-sonnet-20240620', false),
  ('openrouter', 'pending', 'auto', false)
ON CONFLICT (provider_name) DO NOTHING;
