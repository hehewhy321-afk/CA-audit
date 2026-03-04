
-- Smart Audit Sessions table
CREATE TABLE public.smart_audit_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ca_user_id uuid NOT NULL,
  client_id uuid REFERENCES public.clients(id),
  engagement_id uuid REFERENCES public.audit_engagements(id),
  mode text NOT NULL DEFAULT 'auto' CHECK (mode IN ('auto', 'ai')),
  name text NOT NULL DEFAULT 'Smart Audit',
  rules jsonb NOT NULL DEFAULT '[]'::jsonb,
  parameters jsonb NOT NULL DEFAULT '{}'::jsonb,
  file_names jsonb NOT NULL DEFAULT '[]'::jsonb,
  results jsonb,
  summary text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.smart_audit_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "CAs manage own smart audits" ON public.smart_audit_sessions
  FOR ALL USING (ca_user_id = auth.uid());

CREATE TRIGGER update_smart_audit_sessions_updated_at
  BEFORE UPDATE ON public.smart_audit_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for smart audit files
INSERT INTO storage.buckets (id, name, public) VALUES ('smart-audit-files', 'smart-audit-files', false);

CREATE POLICY "CAs can upload smart audit files" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'smart-audit-files' AND auth.uid() IS NOT NULL);

CREATE POLICY "CAs can read own smart audit files" ON storage.objects
  FOR SELECT USING (bucket_id = 'smart-audit-files' AND auth.uid() IS NOT NULL);

CREATE POLICY "CAs can delete own smart audit files" ON storage.objects
  FOR DELETE USING (bucket_id = 'smart-audit-files' AND auth.uid() IS NOT NULL);
