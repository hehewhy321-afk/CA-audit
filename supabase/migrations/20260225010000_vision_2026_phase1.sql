-- Migration: Vision 2026 Phase 1 - AI Foundation & Compliance
-- Adds fields for AI data extraction and mandatory compliance tracking

-- 1. AI Document Intelligence
ALTER TABLE public.documents 
ADD COLUMN IF NOT EXISTS extracted_data JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS is_ai_processed BOOLEAN DEFAULT false;

-- 2. Predictive Audit Analytics
ALTER TABLE public.audit_engagements
ADD COLUMN IF NOT EXISTS predicted_completion_date DATE;

-- 3. Autonomous Compliance (Read-only/Mandatory items)
ALTER TABLE public.checklist_items
ADD COLUMN IF NOT EXISTS is_mandatory BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS compliance_source TEXT DEFAULT 'custom';

-- Index for performance on AI processed docs
CREATE INDEX IF NOT EXISTS idx_documents_is_ai_processed ON public.documents(is_ai_processed) WHERE is_ai_processed = true;
