export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      adjusting_entries: {
        Row: {
          amount: number
          ca_user_id: string
          created_at: string
          credit_account: string
          date: string
          debit_account: string
          description: string | null
          engagement_id: string
          entry_number: string
          id: string
          prepared_by: string | null
          reviewed_by: string | null
          status: string
          type: string
        }
        Insert: {
          amount?: number
          ca_user_id: string
          created_at?: string
          credit_account: string
          date: string
          debit_account: string
          description?: string | null
          engagement_id: string
          entry_number: string
          id?: string
          prepared_by?: string | null
          reviewed_by?: string | null
          status?: string
          type?: string
        }
        Update: {
          amount?: number
          ca_user_id?: string
          created_at?: string
          credit_account?: string
          date?: string
          debit_account?: string
          description?: string | null
          engagement_id?: string
          entry_number?: string
          id?: string
          prepared_by?: string | null
          reviewed_by?: string | null
          status?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "adjusting_entries_engagement_id_fkey"
            columns: ["engagement_id"]
            isOneToOne: false
            referencedRelation: "audit_engagements"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_logs: {
        Row: {
          action_type: string
          approval_threshold: number | null
          approved_at: string | null
          approved_by: string | null
          ca_user_id: string
          confidence: number | null
          created_at: string
          description: string | null
          entity_id: string | null
          entity_type: string | null
          execution_time_ms: number | null
          id: string
          input_summary: string | null
          output_summary: string | null
          reasoning_chain: Json | null
          requires_approval: boolean | null
          status: string | null
        }
        Insert: {
          action_type: string
          approval_threshold?: number | null
          approved_at?: string | null
          approved_by?: string | null
          ca_user_id: string
          confidence?: number | null
          created_at?: string
          description?: string | null
          entity_id?: string | null
          entity_type?: string | null
          execution_time_ms?: number | null
          id?: string
          input_summary?: string | null
          output_summary?: string | null
          reasoning_chain?: Json | null
          requires_approval?: boolean | null
          status?: string | null
        }
        Update: {
          action_type?: string
          approval_threshold?: number | null
          approved_at?: string | null
          approved_by?: string | null
          ca_user_id?: string
          confidence?: number | null
          created_at?: string
          description?: string | null
          entity_id?: string | null
          entity_type?: string | null
          execution_time_ms?: number | null
          id?: string
          input_summary?: string | null
          output_summary?: string | null
          reasoning_chain?: Json | null
          requires_approval?: boolean | null
          status?: string | null
        }
        Relationships: []
      }
      ai_providers: {
        Row: {
          api_key: string
          created_at: string
          id: string
          is_active: boolean
          model_name: string
          provider_name: string
          updated_at: string
        }
        Insert: {
          api_key: string
          created_at?: string
          id?: string
          is_active?: boolean
          model_name: string
          provider_name: string
          updated_at?: string
        }
        Update: {
          api_key?: string
          created_at?: string
          id?: string
          is_active?: boolean
          model_name?: string
          provider_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      audit_engagements: {
        Row: {
          actual_end_date: string | null
          assigned_to: string[] | null
          audit_type: string
          ca_user_id: string
          client_id: string
          created_at: string
          expected_end_date: string | null
          fiscal_year: string
          health_score: number | null
          id: string
          materiality: number | null
          notes: string | null
          predicted_completion_date: string | null
          progress: number
          risk_level: Database["public"]["Enums"]["risk_level"]
          stage: Database["public"]["Enums"]["audit_stage"]
          start_date: string | null
          updated_at: string
        }
        Insert: {
          actual_end_date?: string | null
          assigned_to?: string[] | null
          audit_type?: string
          ca_user_id: string
          client_id: string
          created_at?: string
          expected_end_date?: string | null
          fiscal_year?: string
          health_score?: number | null
          id?: string
          materiality?: number | null
          notes?: string | null
          predicted_completion_date?: string | null
          progress?: number
          risk_level?: Database["public"]["Enums"]["risk_level"]
          stage?: Database["public"]["Enums"]["audit_stage"]
          start_date?: string | null
          updated_at?: string
        }
        Update: {
          actual_end_date?: string | null
          assigned_to?: string[] | null
          audit_type?: string
          ca_user_id?: string
          client_id?: string
          created_at?: string
          expected_end_date?: string | null
          fiscal_year?: string
          health_score?: number | null
          id?: string
          materiality?: number | null
          notes?: string | null
          predicted_completion_date?: string | null
          progress?: number
          risk_level?: Database["public"]["Enums"]["risk_level"]
          stage?: Database["public"]["Enums"]["audit_stage"]
          start_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_engagements_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_findings: {
        Row: {
          area: string | null
          assigned_to: string | null
          ca_user_id: string
          created_at: string
          description: string | null
          engagement_id: string
          id: string
          impact: string | null
          management_response: string | null
          recommendation: string | null
          risk_level: Database["public"]["Enums"]["risk_level"]
          status: string | null
          title: string
          updated_at: string
        }
        Insert: {
          area?: string | null
          assigned_to?: string | null
          ca_user_id: string
          created_at?: string
          description?: string | null
          engagement_id: string
          id?: string
          impact?: string | null
          management_response?: string | null
          recommendation?: string | null
          risk_level?: Database["public"]["Enums"]["risk_level"]
          status?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          area?: string | null
          assigned_to?: string | null
          ca_user_id?: string
          created_at?: string
          description?: string | null
          engagement_id?: string
          id?: string
          impact?: string | null
          management_response?: string | null
          recommendation?: string | null
          risk_level?: Database["public"]["Enums"]["risk_level"]
          status?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_findings_engagement_id_fkey"
            columns: ["engagement_id"]
            isOneToOne: false
            referencedRelation: "audit_engagements"
            referencedColumns: ["id"]
          },
        ]
      }
      ca_settings: {
        Row: {
          ca_user_id: string
          corporate_rates: Json | null
          created_at: string
          default_billing_rate: number | null
          firm_address: string | null
          firm_name: string | null
          firm_pan: string | null
          fiscal_year: string | null
          id: string
          tax_slabs: Json | null
          tds_rates: Json | null
          updated_at: string
        }
        Insert: {
          ca_user_id: string
          corporate_rates?: Json | null
          created_at?: string
          default_billing_rate?: number | null
          firm_address?: string | null
          firm_name?: string | null
          firm_pan?: string | null
          fiscal_year?: string | null
          id?: string
          tax_slabs?: Json | null
          tds_rates?: Json | null
          updated_at?: string
        }
        Update: {
          ca_user_id?: string
          corporate_rates?: Json | null
          created_at?: string
          default_billing_rate?: number | null
          firm_address?: string | null
          firm_name?: string | null
          firm_pan?: string | null
          fiscal_year?: string | null
          id?: string
          tax_slabs?: Json | null
          tds_rates?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      checklist_items: {
        Row: {
          assigned_to: string | null
          ca_user_id: string
          completed: boolean
          completed_at: string | null
          compliance_source: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          engagement_id: string
          id: string
          is_mandatory: boolean | null
          priority: Database["public"]["Enums"]["priority_level"]
          stage: Database["public"]["Enums"]["audit_stage"]
          title: string
        }
        Insert: {
          assigned_to?: string | null
          ca_user_id: string
          completed?: boolean
          completed_at?: string | null
          compliance_source?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          engagement_id: string
          id?: string
          is_mandatory?: boolean | null
          priority?: Database["public"]["Enums"]["priority_level"]
          stage?: Database["public"]["Enums"]["audit_stage"]
          title: string
        }
        Update: {
          assigned_to?: string | null
          ca_user_id?: string
          completed?: boolean
          completed_at?: string | null
          compliance_source?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          engagement_id?: string
          id?: string
          is_mandatory?: boolean | null
          priority?: Database["public"]["Enums"]["priority_level"]
          stage?: Database["public"]["Enums"]["audit_stage"]
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_items_engagement_id_fkey"
            columns: ["engagement_id"]
            isOneToOne: false
            referencedRelation: "audit_engagements"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          address: string | null
          ca_user_id: string
          contact_person: string | null
          created_at: string
          email: string | null
          entity_type: Database["public"]["Enums"]["entity_type"]
          fiscal_year_end: string | null
          health_score: number
          id: string
          industry: string | null
          name: string
          notes: string | null
          pan_number: string | null
          phone: string | null
          portal_user_id: string | null
          registration_date: string | null
          risk_level: Database["public"]["Enums"]["risk_level"]
          status: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          ca_user_id: string
          contact_person?: string | null
          created_at?: string
          email?: string | null
          entity_type?: Database["public"]["Enums"]["entity_type"]
          fiscal_year_end?: string | null
          health_score?: number
          id?: string
          industry?: string | null
          name: string
          notes?: string | null
          pan_number?: string | null
          phone?: string | null
          portal_user_id?: string | null
          registration_date?: string | null
          risk_level?: Database["public"]["Enums"]["risk_level"]
          status?: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          ca_user_id?: string
          contact_person?: string | null
          created_at?: string
          email?: string | null
          entity_type?: Database["public"]["Enums"]["entity_type"]
          fiscal_year_end?: string | null
          health_score?: number
          id?: string
          industry?: string | null
          name?: string
          notes?: string | null
          pan_number?: string | null
          phone?: string | null
          portal_user_id?: string | null
          registration_date?: string | null
          risk_level?: Database["public"]["Enums"]["risk_level"]
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      communication_logs: {
        Row: {
          ca_user_id: string
          client_id: string
          created_at: string
          date: string
          details: string | null
          follow_up_date: string | null
          id: string
          staff_id: string | null
          subject: string | null
          type: string
        }
        Insert: {
          ca_user_id: string
          client_id: string
          created_at?: string
          date: string
          details?: string | null
          follow_up_date?: string | null
          id?: string
          staff_id?: string | null
          subject?: string | null
          type?: string
        }
        Update: {
          ca_user_id?: string
          client_id?: string
          created_at?: string
          date?: string
          details?: string | null
          follow_up_date?: string | null
          id?: string
          staff_id?: string | null
          subject?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "communication_logs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_calendar: {
        Row: {
          ca_user_id: string
          client_id: string
          created_at: string
          due_date_ad: string | null
          due_date_bs: string
          error_code: string | null
          error_message: string | null
          filed_date: string | null
          filing_type: string
          id: string
          notes: string | null
          penalty_amount: number | null
          period: string
          portal_reference: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          ca_user_id: string
          client_id: string
          created_at?: string
          due_date_ad?: string | null
          due_date_bs?: string
          error_code?: string | null
          error_message?: string | null
          filed_date?: string | null
          filing_type: string
          id?: string
          notes?: string | null
          penalty_amount?: number | null
          period: string
          portal_reference?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          ca_user_id?: string
          client_id?: string
          created_at?: string
          due_date_ad?: string | null
          due_date_bs?: string
          error_code?: string | null
          error_message?: string | null
          filed_date?: string | null
          filing_type?: string
          id?: string
          notes?: string | null
          penalty_amount?: number | null
          period?: string
          portal_reference?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "compliance_calendar_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      deadlines: {
        Row: {
          authority: string
          ca_user_id: string
          client_id: string | null
          completed: boolean
          completed_at: string | null
          created_at: string | null
          description: string | null
          due_date: string
          id: string
          penalty: number | null
          priority: Database["public"]["Enums"]["priority_level"]
          recurrence_pattern: string | null
          recurring: boolean
          reminder_days: number
          title: string
        }
        Insert: {
          authority?: string
          ca_user_id: string
          client_id?: string | null
          completed?: boolean
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_date: string
          id?: string
          penalty?: number | null
          priority?: Database["public"]["Enums"]["priority_level"]
          recurrence_pattern?: string | null
          recurring?: boolean
          reminder_days?: number
          title: string
        }
        Update: {
          authority?: string
          ca_user_id?: string
          client_id?: string | null
          completed?: boolean
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string
          id?: string
          penalty?: number | null
          priority?: Database["public"]["Enums"]["priority_level"]
          recurrence_pattern?: string | null
          recurring?: boolean
          reminder_days?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "deadlines_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          ca_user_id: string
          category: string | null
          client_id: string
          created_at: string
          engagement_id: string | null
          extracted_data: Json | null
          file_url: string | null
          id: string
          is_ai_processed: boolean | null
          name: string
          notes: string | null
          ocr_confidence: number | null
          processing_status: string | null
          received_date: string | null
          requested_date: string | null
          status: Database["public"]["Enums"]["document_status"]
          version: number
        }
        Insert: {
          ca_user_id: string
          category?: string | null
          client_id: string
          created_at?: string
          engagement_id?: string | null
          extracted_data?: Json | null
          file_url?: string | null
          id?: string
          is_ai_processed?: boolean | null
          name: string
          notes?: string | null
          ocr_confidence?: number | null
          processing_status?: string | null
          received_date?: string | null
          requested_date?: string | null
          status?: Database["public"]["Enums"]["document_status"]
          version?: number
        }
        Update: {
          ca_user_id?: string
          category?: string | null
          client_id?: string
          created_at?: string
          engagement_id?: string | null
          extracted_data?: Json | null
          file_url?: string | null
          id?: string
          is_ai_processed?: boolean | null
          name?: string
          notes?: string | null
          ocr_confidence?: number | null
          processing_status?: string | null
          received_date?: string | null
          requested_date?: string | null
          status?: Database["public"]["Enums"]["document_status"]
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "documents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_engagement_id_fkey"
            columns: ["engagement_id"]
            isOneToOne: false
            referencedRelation: "audit_engagements"
            referencedColumns: ["id"]
          },
        ]
      }
      engagement_letters: {
        Row: {
          ca_user_id: string
          client_id: string
          content: string | null
          created_at: string
          engagement_id: string | null
          firm_signatory: string | null
          id: string
          sent_date: string | null
          signatory_designation: string | null
          signatory_name: string | null
          signed_date: string | null
          status: string
          template_name: string
          updated_at: string
          valid_until: string | null
        }
        Insert: {
          ca_user_id: string
          client_id: string
          content?: string | null
          created_at?: string
          engagement_id?: string | null
          firm_signatory?: string | null
          id?: string
          sent_date?: string | null
          signatory_designation?: string | null
          signatory_name?: string | null
          signed_date?: string | null
          status?: string
          template_name: string
          updated_at?: string
          valid_until?: string | null
        }
        Update: {
          ca_user_id?: string
          client_id?: string
          content?: string | null
          created_at?: string
          engagement_id?: string | null
          firm_signatory?: string | null
          id?: string
          sent_date?: string | null
          signatory_designation?: string | null
          signatory_name?: string | null
          signed_date?: string | null
          status?: string
          template_name?: string
          updated_at?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "engagement_letters_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "engagement_letters_engagement_id_fkey"
            columns: ["engagement_id"]
            isOneToOne: false
            referencedRelation: "audit_engagements"
            referencedColumns: ["id"]
          },
        ]
      }
      firms: {
        Row: {
          address: string | null
          created_at: string
          email: string | null
          ican_membership: string | null
          id: string
          logo_url: string | null
          name: string
          owner_id: string
          pan_number: string | null
          phone: string | null
          registration_number: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string | null
          ican_membership?: string | null
          id?: string
          logo_url?: string | null
          name: string
          owner_id: string
          pan_number?: string | null
          phone?: string | null
          registration_number?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string | null
          ican_membership?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          owner_id?: string
          pan_number?: string | null
          phone?: string | null
          registration_number?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      generated_reports: {
        Row: {
          ca_user_id: string
          client_id: string
          content: string | null
          created_at: string
          engagement_id: string | null
          generated_by: string | null
          id: string
          status: string
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          ca_user_id: string
          client_id: string
          content?: string | null
          created_at?: string
          engagement_id?: string | null
          generated_by?: string | null
          id?: string
          status?: string
          title: string
          type?: string
          updated_at?: string
        }
        Update: {
          ca_user_id?: string
          client_id?: string
          content?: string | null
          created_at?: string
          engagement_id?: string | null
          generated_by?: string | null
          id?: string
          status?: string
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "generated_reports_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generated_reports_engagement_id_fkey"
            columns: ["engagement_id"]
            isOneToOne: false
            referencedRelation: "audit_engagements"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount: number
          ca_user_id: string
          client_id: string
          created_at: string
          due_date: string
          engagement_id: string | null
          id: string
          invoice_number: string
          issued_date: string
          notes: string | null
          paid_amount: number
          paid_date: string | null
          status: Database["public"]["Enums"]["payment_status"]
          tax: number
          total: number
        }
        Insert: {
          amount?: number
          ca_user_id: string
          client_id: string
          created_at?: string
          due_date: string
          engagement_id?: string | null
          id?: string
          invoice_number: string
          issued_date: string
          notes?: string | null
          paid_amount?: number
          paid_date?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          tax?: number
          total?: number
        }
        Update: {
          amount?: number
          ca_user_id?: string
          client_id?: string
          created_at?: string
          due_date?: string
          engagement_id?: string | null
          id?: string
          invoice_number?: string
          issued_date?: string
          notes?: string | null
          paid_amount?: number
          paid_date?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          tax?: number
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_engagement_id_fkey"
            columns: ["engagement_id"]
            isOneToOne: false
            referencedRelation: "audit_engagements"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_base_articles: {
        Row: {
          ca_user_id: string
          category: string
          content: string
          created_at: string
          id: string
          is_system: boolean
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          ca_user_id: string
          category?: string
          content?: string
          created_at?: string
          id?: string
          is_system?: boolean
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          ca_user_id?: string
          category?: string
          content?: string
          created_at?: string
          id?: string
          is_system?: boolean
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      nfrs_embeddings: {
        Row: {
          content: string
          created_at: string
          id: string
          metadata: Json | null
          paragraph: string
          section: string | null
          standard_code: string
          standard_name: string | null
          tags: string[] | null
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          metadata?: Json | null
          paragraph?: string
          section?: string | null
          standard_code: string
          standard_name?: string | null
          tags?: string[] | null
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          paragraph?: string
          section?: string | null
          standard_code?: string
          standard_name?: string | null
          tags?: string[] | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          firm_name: string | null
          full_name: string
          id: string
          phone: string | null
          status: string
          suspension_reason: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string
          firm_name?: string | null
          full_name?: string
          id?: string
          phone?: string | null
          status?: string
          suspension_reason?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          firm_name?: string | null
          full_name?: string
          id?: string
          phone?: string | null
          status?: string
          suspension_reason?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reconciliations: {
        Row: {
          ca_user_id: string
          client_id: string | null
          created_at: string
          fiscal_year: string
          flagged: Json | null
          id: string
          ird_data: Json | null
          ird_source: string | null
          ledger_data: Json | null
          ledger_source: string | null
          match_rate: number | null
          matches: Json | null
          mismatches: Json | null
          notes: string | null
          period: string
          status: string | null
          total_ird_tds: number | null
          total_ledger_tds: number | null
          updated_at: string
          variance: number | null
        }
        Insert: {
          ca_user_id: string
          client_id?: string | null
          created_at?: string
          fiscal_year?: string
          flagged?: Json | null
          id?: string
          ird_data?: Json | null
          ird_source?: string | null
          ledger_data?: Json | null
          ledger_source?: string | null
          match_rate?: number | null
          matches?: Json | null
          mismatches?: Json | null
          notes?: string | null
          period?: string
          status?: string | null
          total_ird_tds?: number | null
          total_ledger_tds?: number | null
          updated_at?: string
          variance?: number | null
        }
        Update: {
          ca_user_id?: string
          client_id?: string | null
          created_at?: string
          fiscal_year?: string
          flagged?: Json | null
          id?: string
          ird_data?: Json | null
          ird_source?: string | null
          ledger_data?: Json | null
          ledger_source?: string | null
          match_rate?: number | null
          matches?: Json | null
          mismatches?: Json | null
          notes?: string | null
          period?: string
          status?: string | null
          total_ird_tds?: number | null
          total_ledger_tds?: number | null
          updated_at?: string
          variance?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "reconciliations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      risk_assessments: {
        Row: {
          area: string
          audit_procedures: string | null
          ca_user_id: string
          control_risk: number
          created_at: string
          detection_risk: number
          engagement_id: string
          id: string
          inherent_risk: number
          mitigating_controls: string | null
          notes: string | null
          overall_risk: Database["public"]["Enums"]["risk_level"]
        }
        Insert: {
          area: string
          audit_procedures?: string | null
          ca_user_id: string
          control_risk?: number
          created_at?: string
          detection_risk?: number
          engagement_id: string
          id?: string
          inherent_risk?: number
          mitigating_controls?: string | null
          notes?: string | null
          overall_risk?: Database["public"]["Enums"]["risk_level"]
        }
        Update: {
          area?: string
          audit_procedures?: string | null
          ca_user_id?: string
          control_risk?: number
          created_at?: string
          detection_risk?: number
          engagement_id?: string
          id?: string
          inherent_risk?: number
          mitigating_controls?: string | null
          notes?: string | null
          overall_risk?: Database["public"]["Enums"]["risk_level"]
        }
        Relationships: [
          {
            foreignKeyName: "risk_assessments_engagement_id_fkey"
            columns: ["engagement_id"]
            isOneToOne: false
            referencedRelation: "audit_engagements"
            referencedColumns: ["id"]
          },
        ]
      }
      smart_audit_sessions: {
        Row: {
          ca_user_id: string
          client_id: string | null
          created_at: string
          engagement_id: string | null
          error_message: string | null
          file_names: Json
          id: string
          mode: string
          name: string
          parameters: Json
          results: Json | null
          rules: Json
          status: string
          summary: string | null
          updated_at: string
        }
        Insert: {
          ca_user_id: string
          client_id?: string | null
          created_at?: string
          engagement_id?: string | null
          error_message?: string | null
          file_names?: Json
          id?: string
          mode?: string
          name?: string
          parameters?: Json
          results?: Json | null
          rules?: Json
          status?: string
          summary?: string | null
          updated_at?: string
        }
        Update: {
          ca_user_id?: string
          client_id?: string | null
          created_at?: string
          engagement_id?: string | null
          error_message?: string | null
          file_names?: Json
          id?: string
          mode?: string
          name?: string
          parameters?: Json
          results?: Json | null
          rules?: Json
          status?: string
          summary?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "smart_audit_sessions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "smart_audit_sessions_engagement_id_fkey"
            columns: ["engagement_id"]
            isOneToOne: false
            referencedRelation: "audit_engagements"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          active_engagements: number
          billable_hours_target: number
          ca_user_id: string
          created_at: string
          email: string | null
          id: string
          join_date: string | null
          name: string
          phone: string | null
          role: string
          specialization: string | null
          status: string
          updated_at: string
        }
        Insert: {
          active_engagements?: number
          billable_hours_target?: number
          ca_user_id: string
          created_at?: string
          email?: string | null
          id?: string
          join_date?: string | null
          name: string
          phone?: string | null
          role?: string
          specialization?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          active_engagements?: number
          billable_hours_target?: number
          ca_user_id?: string
          created_at?: string
          email?: string | null
          id?: string
          join_date?: string | null
          name?: string
          phone?: string | null
          role?: string
          specialization?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      time_entries: {
        Row: {
          billable: boolean
          ca_user_id: string
          client_id: string
          created_at: string
          date: string
          description: string | null
          engagement_id: string | null
          hours: number
          id: string
          rate: number
          staff_id: string | null
        }
        Insert: {
          billable?: boolean
          ca_user_id: string
          client_id: string
          created_at?: string
          date: string
          description?: string | null
          engagement_id?: string | null
          hours?: number
          id?: string
          rate?: number
          staff_id?: string | null
        }
        Update: {
          billable?: boolean
          ca_user_id?: string
          client_id?: string
          created_at?: string
          date?: string
          description?: string | null
          engagement_id?: string | null
          hours?: number
          id?: string
          rate?: number
          staff_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "time_entries_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_entries_engagement_id_fkey"
            columns: ["engagement_id"]
            isOneToOne: false
            referencedRelation: "audit_engagements"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      whatsapp_alerts: {
        Row: {
          ca_user_id: string
          client_id: string
          created_at: string
          id: string
          message: string
          scheduled_date: string
          sent: boolean
          sent_at: string | null
          template_id: string | null
        }
        Insert: {
          ca_user_id: string
          client_id: string
          created_at?: string
          id?: string
          message: string
          scheduled_date: string
          sent?: boolean
          sent_at?: string | null
          template_id?: string | null
        }
        Update: {
          ca_user_id?: string
          client_id?: string
          created_at?: string
          id?: string
          message?: string
          scheduled_date?: string
          sent?: boolean
          sent_at?: string | null
          template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_alerts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_alerts_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_templates: {
        Row: {
          ca_user_id: string
          category: string
          created_at: string
          id: string
          name: string
          template: string
          variables: string[] | null
        }
        Insert: {
          ca_user_id: string
          category?: string
          created_at?: string
          id?: string
          name: string
          template: string
          variables?: string[] | null
        }
        Update: {
          ca_user_id?: string
          category?: string
          created_at?: string
          id?: string
          name?: string
          template?: string
          variables?: string[] | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "ca" | "client" | "super_admin"
      audit_stage:
      | "planning"
      | "fieldwork"
      | "review"
      | "reporting"
      | "completed"
      document_status:
      | "requested"
      | "received"
      | "reviewed"
      | "approved"
      | "rejected"
      entity_type:
      | "private_limited"
      | "public_limited"
      | "ngo"
      | "ingo"
      | "cooperative"
      | "partnership"
      | "proprietorship"
      | "trust"
      | "government"
      payment_status: "pending" | "partial" | "paid" | "overdue"
      priority_level: "low" | "medium" | "high" | "urgent"
      risk_level: "low" | "medium" | "high" | "critical"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
  | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
  ? R
  : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
    DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] &
    DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
  ? R
  : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema["Tables"]
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Insert: infer I
  }
  ? I
  : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
    Insert: infer I
  }
  ? I
  : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema["Tables"]
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Update: infer U
  }
  ? U
  : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
    Update: infer U
  }
  ? U
  : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
  | keyof DefaultSchema["Enums"]
  | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
  : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
  | keyof DefaultSchema["CompositeTypes"]
  | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
  : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["ca", "client", "super_admin"],
      audit_stage: [
        "planning",
        "fieldwork",
        "review",
        "reporting",
        "completed",
      ],
      document_status: [
        "requested",
        "received",
        "reviewed",
        "approved",
        "rejected",
      ],
      entity_type: [
        "private_limited",
        "public_limited",
        "ngo",
        "ingo",
        "cooperative",
        "partnership",
        "proprietorship",
        "trust",
        "government",
      ],
      payment_status: ["pending", "partial", "paid", "overdue"],
      priority_level: ["low", "medium", "high", "urgent"],
      risk_level: ["low", "medium", "high", "critical"],
    },
  },
} as const
