-- Add audit_type column to audit_engagements
ALTER TABLE public.audit_engagements ADD COLUMN IF NOT EXISTS audit_type TEXT NOT NULL DEFAULT 'statutory';
