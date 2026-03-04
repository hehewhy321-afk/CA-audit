-- ============================================================
-- MASTER BUILD: CA Practice Management & AI-Agent Platform
-- Migration: 20260225020000
-- ============================================================

-- ============================
-- FIRMS (Multi-Tenant Root)
-- ============================
CREATE TABLE IF NOT EXISTS public.firms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  pan_number TEXT DEFAULT '',
  address TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  registration_number TEXT DEFAULT '',
  ican_membership TEXT DEFAULT '',
  logo_url TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.firms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage own firm" ON public.firms FOR ALL USING (owner_id = auth.uid());
CREATE TRIGGER update_firms_updated_at BEFORE UPDATE ON public.firms
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================
-- TDS RECONCILIATIONS
-- ============================
CREATE TABLE IF NOT EXISTS public.reconciliations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ca_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  period TEXT NOT NULL DEFAULT '',
  fiscal_year TEXT NOT NULL DEFAULT '2081/82',
  ledger_source TEXT DEFAULT 'tally',
  ird_source TEXT DEFAULT 'annex10',
  ledger_data JSONB DEFAULT '[]'::jsonb,
  ird_data JSONB DEFAULT '[]'::jsonb,
  matches JSONB DEFAULT '[]'::jsonb,
  mismatches JSONB DEFAULT '[]'::jsonb,
  flagged JSONB DEFAULT '[]'::jsonb,
  total_ledger_tds NUMERIC DEFAULT 0,
  total_ird_tds NUMERIC DEFAULT 0,
  variance NUMERIC DEFAULT 0,
  match_rate NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','processing','completed','reviewed')),
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.reconciliations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "CAs manage own reconciliations" ON public.reconciliations FOR ALL USING (ca_user_id = auth.uid());
CREATE TRIGGER update_reconciliations_updated_at BEFORE UPDATE ON public.reconciliations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================
-- COMPLIANCE CALENDAR
-- ============================
CREATE TABLE IF NOT EXISTS public.compliance_calendar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ca_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  filing_type TEXT NOT NULL CHECK (filing_type IN (
    'vat_return','income_tax','tds_return','ssf_contribution',
    'ocr_annual','pan_renewal','audit_report','agm_filing',
    'bonus_tax','advance_tax','withholding_tax'
  )),
  period TEXT NOT NULL,
  due_date_bs TEXT NOT NULL DEFAULT '',
  due_date_ad DATE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','filed','overdue','error','exempt')),
  filed_date TEXT DEFAULT '',
  portal_reference TEXT DEFAULT '',
  error_code TEXT DEFAULT '',
  error_message TEXT DEFAULT '',
  penalty_amount NUMERIC DEFAULT 0,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.compliance_calendar ENABLE ROW LEVEL SECURITY;
CREATE POLICY "CAs manage own compliance" ON public.compliance_calendar FOR ALL USING (ca_user_id = auth.uid());
CREATE TRIGGER update_compliance_updated_at BEFORE UPDATE ON public.compliance_calendar
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================
-- AGENT LOGS (Immutable Audit Trail)
-- ============================
CREATE TABLE IF NOT EXISTS public.agent_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ca_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN (
    'reconcile','categorize','extract','flag','approve','reject','match','query'
  )),
  entity_type TEXT DEFAULT '',
  entity_id UUID,
  description TEXT DEFAULT '',
  confidence NUMERIC DEFAULT 0 CHECK (confidence BETWEEN 0 AND 100),
  reasoning_chain JSONB DEFAULT '{}'::jsonb,
  input_summary TEXT DEFAULT '',
  output_summary TEXT DEFAULT '',
  requires_approval BOOLEAN DEFAULT false,
  approval_threshold NUMERIC DEFAULT 50000,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','auto_approved')),
  execution_time_ms INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.agent_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "CAs view own agent logs" ON public.agent_logs FOR SELECT USING (ca_user_id = auth.uid());
CREATE POLICY "CAs insert agent logs" ON public.agent_logs FOR INSERT WITH CHECK (ca_user_id = auth.uid());
-- No UPDATE/DELETE — agent logs are immutable

-- ============================
-- NFRS KNOWLEDGE EMBEDDINGS
-- (pgvector extension must be enabled in Supabase dashboard)
-- ============================
CREATE TABLE IF NOT EXISTS public.nfrs_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  standard_code TEXT NOT NULL,
  standard_name TEXT DEFAULT '',
  paragraph TEXT NOT NULL DEFAULT '',
  section TEXT DEFAULT '',
  content TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.nfrs_embeddings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "All authenticated can read NFRS" ON public.nfrs_embeddings FOR SELECT USING (auth.uid() IS NOT NULL);

-- ============================
-- EXTEND EXISTING: documents
-- (Vision 2026 fields if not already present)
-- ============================
ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS extracted_data JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS is_ai_processed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS ocr_confidence NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS processing_status TEXT DEFAULT 'none'
    CHECK (processing_status IN ('none','queued','processing','completed','failed'));

-- ============================
-- EXTEND EXISTING: checklist_items
-- ============================
ALTER TABLE public.checklist_items
  ADD COLUMN IF NOT EXISTS is_mandatory BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS compliance_source TEXT DEFAULT 'firm';

-- ============================
-- EXTEND EXISTING: audit_engagements
-- ============================
ALTER TABLE public.audit_engagements
  ADD COLUMN IF NOT EXISTS predicted_completion_date DATE,
  ADD COLUMN IF NOT EXISTS health_score INT DEFAULT 70;

-- ============================
-- INDEXES for performance
-- ============================
CREATE INDEX IF NOT EXISTS idx_reconciliations_client ON public.reconciliations(client_id);
CREATE INDEX IF NOT EXISTS idx_reconciliations_status ON public.reconciliations(status);
CREATE INDEX IF NOT EXISTS idx_compliance_client ON public.compliance_calendar(client_id);
CREATE INDEX IF NOT EXISTS idx_compliance_type ON public.compliance_calendar(filing_type);
CREATE INDEX IF NOT EXISTS idx_compliance_status ON public.compliance_calendar(status);
CREATE INDEX IF NOT EXISTS idx_agent_logs_status ON public.agent_logs(status);
CREATE INDEX IF NOT EXISTS idx_agent_logs_type ON public.agent_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_nfrs_standard ON public.nfrs_embeddings(standard_code);
