
-- ============================
-- ENUMS
-- ============================
CREATE TYPE public.app_role AS ENUM ('ca', 'client');
CREATE TYPE public.entity_type AS ENUM ('private_limited', 'public_limited', 'ngo', 'ingo', 'cooperative', 'partnership', 'proprietorship', 'trust', 'government');
CREATE TYPE public.audit_stage AS ENUM ('planning', 'fieldwork', 'review', 'reporting', 'completed');
CREATE TYPE public.risk_level AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE public.priority_level AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE public.payment_status AS ENUM ('pending', 'partial', 'paid', 'overdue');
CREATE TYPE public.document_status AS ENUM ('requested', 'received', 'reviewed', 'approved', 'rejected');

-- ============================
-- TIMESTAMP TRIGGER FUNCTION
-- ============================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- ============================
-- PROFILES
-- ============================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  phone TEXT DEFAULT '',
  firm_name TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================
-- USER ROLES
-- ============================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checks
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), COALESCE(NEW.email, ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Profiles RLS
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User roles RLS
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

-- ============================
-- CLIENTS (owned by CA)
-- ============================
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ca_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  pan_number TEXT DEFAULT '',
  entity_type entity_type NOT NULL DEFAULT 'private_limited',
  contact_person TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  address TEXT DEFAULT '',
  fiscal_year_end TEXT DEFAULT 'Ashad',
  registration_date TEXT DEFAULT '',
  industry TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'prospect')),
  risk_level risk_level NOT NULL DEFAULT 'medium',
  health_score INT NOT NULL DEFAULT 70,
  notes TEXT DEFAULT '',
  portal_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "CAs can manage own clients" ON public.clients FOR ALL USING (public.has_role(auth.uid(), 'ca') AND ca_user_id = auth.uid());
CREATE POLICY "Clients can view linked record" ON public.clients FOR SELECT USING (public.has_role(auth.uid(), 'client') AND portal_user_id = auth.uid());

-- ============================
-- AUDIT ENGAGEMENTS
-- ============================
CREATE TABLE public.audit_engagements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ca_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  fiscal_year TEXT NOT NULL DEFAULT '2081/82',
  stage audit_stage NOT NULL DEFAULT 'planning',
  assigned_to TEXT[] DEFAULT '{}',
  start_date TEXT DEFAULT '',
  expected_end_date TEXT DEFAULT '',
  actual_end_date TEXT,
  progress INT NOT NULL DEFAULT 0,
  risk_level risk_level NOT NULL DEFAULT 'medium',
  materiality NUMERIC DEFAULT 0,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.audit_engagements ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_engagements_updated_at BEFORE UPDATE ON public.audit_engagements FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE POLICY "CAs manage own engagements" ON public.audit_engagements FOR ALL USING (ca_user_id = auth.uid());

-- ============================
-- CHECKLIST ITEMS
-- ============================
CREATE TABLE public.checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ca_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  engagement_id UUID REFERENCES public.audit_engagements(id) ON DELETE CASCADE NOT NULL,
  stage audit_stage NOT NULL DEFAULT 'planning',
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  assigned_to TEXT DEFAULT '',
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  due_date TEXT DEFAULT '',
  priority priority_level NOT NULL DEFAULT 'medium'
);
ALTER TABLE public.checklist_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "CAs manage own checklists" ON public.checklist_items FOR ALL USING (ca_user_id = auth.uid());

-- ============================
-- DOCUMENTS
-- ============================
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ca_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  engagement_id UUID REFERENCES public.audit_engagements(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  category TEXT DEFAULT '',
  status document_status NOT NULL DEFAULT 'requested',
  requested_date TEXT DEFAULT '',
  received_date TEXT,
  version INT NOT NULL DEFAULT 1,
  notes TEXT DEFAULT '',
  file_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "CAs manage own documents" ON public.documents FOR ALL USING (ca_user_id = auth.uid());
CREATE POLICY "Clients can view their documents" ON public.documents FOR SELECT USING (
  public.has_role(auth.uid(), 'client') AND
  client_id IN (SELECT id FROM public.clients WHERE portal_user_id = auth.uid())
);
CREATE POLICY "Clients can update their documents" ON public.documents FOR UPDATE USING (
  public.has_role(auth.uid(), 'client') AND
  client_id IN (SELECT id FROM public.clients WHERE portal_user_id = auth.uid())
);

-- ============================
-- DEADLINES
-- ============================
CREATE TABLE public.deadlines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ca_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  authority TEXT NOT NULL DEFAULT 'Custom' CHECK (authority IN ('IRD', 'OCR', 'NRB', 'SEBON', 'Custom')),
  due_date TEXT NOT NULL,
  reminder_days INT NOT NULL DEFAULT 5,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  penalty NUMERIC,
  recurring BOOLEAN NOT NULL DEFAULT false,
  recurrence_pattern TEXT,
  priority priority_level NOT NULL DEFAULT 'medium'
);
ALTER TABLE public.deadlines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "CAs manage own deadlines" ON public.deadlines FOR ALL USING (ca_user_id = auth.uid());

-- ============================
-- TIME ENTRIES
-- ============================
CREATE TABLE public.time_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ca_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  engagement_id UUID REFERENCES public.audit_engagements(id) ON DELETE SET NULL,
  staff_id TEXT DEFAULT '',
  date TEXT NOT NULL,
  hours NUMERIC NOT NULL DEFAULT 0,
  description TEXT DEFAULT '',
  billable BOOLEAN NOT NULL DEFAULT true,
  rate NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "CAs manage own time entries" ON public.time_entries FOR ALL USING (ca_user_id = auth.uid());

-- ============================
-- INVOICES
-- ============================
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ca_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  engagement_id UUID REFERENCES public.audit_engagements(id) ON DELETE SET NULL,
  invoice_number TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  tax NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  status payment_status NOT NULL DEFAULT 'pending',
  issued_date TEXT NOT NULL,
  due_date TEXT NOT NULL,
  paid_date TEXT,
  paid_amount NUMERIC NOT NULL DEFAULT 0,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "CAs manage own invoices" ON public.invoices FOR ALL USING (ca_user_id = auth.uid());

-- ============================
-- TEAM MEMBERS
-- ============================
CREATE TABLE public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ca_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  email TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  role TEXT NOT NULL DEFAULT 'junior_auditor' CHECK (role IN ('partner', 'manager', 'senior_auditor', 'junior_auditor', 'article', 'intern')),
  specialization TEXT DEFAULT '',
  active_engagements INT NOT NULL DEFAULT 0,
  billable_hours_target INT NOT NULL DEFAULT 1400,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'on_leave', 'inactive')),
  join_date TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_team_members_updated_at BEFORE UPDATE ON public.team_members FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE POLICY "CAs manage own team" ON public.team_members FOR ALL USING (ca_user_id = auth.uid());

-- ============================
-- COMMUNICATION LOGS
-- ============================
CREATE TABLE public.communication_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ca_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL DEFAULT 'email' CHECK (type IN ('email', 'phone', 'whatsapp', 'meeting', 'letter')),
  subject TEXT DEFAULT '',
  details TEXT DEFAULT '',
  staff_id TEXT DEFAULT '',
  date TEXT NOT NULL,
  follow_up_date TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.communication_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "CAs manage own comms" ON public.communication_logs FOR ALL USING (ca_user_id = auth.uid());

-- ============================
-- AUDIT FINDINGS
-- ============================
CREATE TABLE public.audit_findings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ca_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  engagement_id UUID REFERENCES public.audit_engagements(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  area TEXT DEFAULT '',
  risk_level risk_level NOT NULL DEFAULT 'medium',
  impact TEXT DEFAULT 'financial' CHECK (impact IN ('financial', 'compliance', 'operational', 'reputational')),
  status TEXT DEFAULT 'identified' CHECK (status IN ('identified', 'discussed', 'resolved', 'reported')),
  recommendation TEXT DEFAULT '',
  management_response TEXT DEFAULT '',
  assigned_to TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.audit_findings ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_findings_updated_at BEFORE UPDATE ON public.audit_findings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE POLICY "CAs manage own findings" ON public.audit_findings FOR ALL USING (ca_user_id = auth.uid());

-- ============================
-- ADJUSTING ENTRIES
-- ============================
CREATE TABLE public.adjusting_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ca_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  engagement_id UUID REFERENCES public.audit_engagements(id) ON DELETE CASCADE NOT NULL,
  entry_number TEXT NOT NULL,
  date TEXT NOT NULL,
  description TEXT DEFAULT '',
  debit_account TEXT NOT NULL,
  credit_account TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  type TEXT NOT NULL DEFAULT 'adjusting' CHECK (type IN ('adjusting', 'reclassifying', 'correcting')),
  status TEXT NOT NULL DEFAULT 'proposed' CHECK (status IN ('proposed', 'approved', 'posted', 'rejected')),
  prepared_by TEXT DEFAULT '',
  reviewed_by TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.adjusting_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "CAs manage own entries" ON public.adjusting_entries FOR ALL USING (ca_user_id = auth.uid());

-- ============================
-- RISK ASSESSMENTS
-- ============================
CREATE TABLE public.risk_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ca_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  engagement_id UUID REFERENCES public.audit_engagements(id) ON DELETE CASCADE NOT NULL,
  area TEXT NOT NULL,
  inherent_risk INT NOT NULL DEFAULT 1 CHECK (inherent_risk BETWEEN 1 AND 5),
  control_risk INT NOT NULL DEFAULT 1 CHECK (control_risk BETWEEN 1 AND 5),
  detection_risk INT NOT NULL DEFAULT 1 CHECK (detection_risk BETWEEN 1 AND 5),
  overall_risk risk_level NOT NULL DEFAULT 'low',
  mitigating_controls TEXT DEFAULT '',
  audit_procedures TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.risk_assessments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "CAs manage own risk assessments" ON public.risk_assessments FOR ALL USING (ca_user_id = auth.uid());

-- ============================
-- WHATSAPP TEMPLATES
-- ============================
CREATE TABLE public.whatsapp_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ca_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general' CHECK (category IN ('deadline_reminder', 'document_request', 'payment_reminder', 'general', 'meeting')),
  template TEXT NOT NULL,
  variables TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.whatsapp_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "CAs manage own templates" ON public.whatsapp_templates FOR ALL USING (ca_user_id = auth.uid());

-- ============================
-- WHATSAPP ALERTS
-- ============================
CREATE TABLE public.whatsapp_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ca_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  template_id UUID REFERENCES public.whatsapp_templates(id) ON DELETE SET NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  scheduled_date TEXT NOT NULL,
  sent BOOLEAN NOT NULL DEFAULT false,
  sent_at TIMESTAMPTZ,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.whatsapp_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "CAs manage own alerts" ON public.whatsapp_alerts FOR ALL USING (ca_user_id = auth.uid());

-- ============================
-- GENERATED REPORTS
-- ============================
CREATE TABLE public.generated_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ca_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL DEFAULT 'audit_report' CHECK (type IN ('audit_report', 'management_letter', 'tax_computation')),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  engagement_id UUID REFERENCES public.audit_engagements(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  content TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'final')),
  generated_by TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.generated_reports ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON public.generated_reports FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE POLICY "CAs manage own reports" ON public.generated_reports FOR ALL USING (ca_user_id = auth.uid());

-- ============================
-- ENGAGEMENT LETTERS
-- ============================
CREATE TABLE public.engagement_letters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ca_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  engagement_id UUID REFERENCES public.audit_engagements(id) ON DELETE SET NULL,
  template_name TEXT NOT NULL,
  content TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'signed', 'expired')),
  sent_date TEXT,
  signed_date TEXT,
  signatory_name TEXT DEFAULT '',
  signatory_designation TEXT DEFAULT '',
  firm_signatory TEXT DEFAULT '',
  valid_until TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.engagement_letters ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_letters_updated_at BEFORE UPDATE ON public.engagement_letters FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE POLICY "CAs manage own letters" ON public.engagement_letters FOR ALL USING (ca_user_id = auth.uid());

-- ============================
-- KNOWLEDGE BASE ARTICLES
-- ============================
CREATE TABLE public.knowledge_base_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ca_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  content TEXT NOT NULL DEFAULT '',
  tags TEXT[] DEFAULT '{}',
  is_system BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.knowledge_base_articles ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_kb_updated_at BEFORE UPDATE ON public.knowledge_base_articles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE POLICY "CAs manage own articles" ON public.knowledge_base_articles FOR ALL USING (ca_user_id = auth.uid());

-- ============================
-- CA SETTINGS (editable tax rates, etc.)
-- ============================
CREATE TABLE public.ca_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ca_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  firm_name TEXT DEFAULT '',
  firm_address TEXT DEFAULT '',
  firm_pan TEXT DEFAULT '',
  tax_slabs JSONB DEFAULT '[]',
  corporate_rates JSONB DEFAULT '{}',
  tds_rates JSONB DEFAULT '[]',
  default_billing_rate NUMERIC DEFAULT 2000,
  fiscal_year TEXT DEFAULT '2081/82',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.ca_settings ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON public.ca_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE POLICY "CAs manage own settings" ON public.ca_settings FOR ALL USING (ca_user_id = auth.uid());

-- ============================
-- DOCUMENT STORAGE BUCKET
-- ============================
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false);
CREATE POLICY "CAs can upload documents" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'documents' AND auth.role() = 'authenticated');
CREATE POLICY "CAs can view documents" ON storage.objects FOR SELECT USING (bucket_id = 'documents' AND auth.role() = 'authenticated');
CREATE POLICY "CAs can delete documents" ON storage.objects FOR DELETE USING (bucket_id = 'documents' AND auth.role() = 'authenticated');
