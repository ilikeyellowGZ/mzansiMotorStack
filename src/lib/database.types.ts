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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      appointment_requests: {
        Row: {
          address: string | null
          contact_name: string
          contact_phone: string
          created_at: string
          id: string
          meeting_format: string
          notes: string | null
          organization_id: string
          preferred_date: string
          preferred_time: string
          source_onboarding_request_id: string
          status: string
          time_zone: string
          travel_quote_status: string
        }
        Insert: {
          address?: string | null
          contact_name: string
          contact_phone: string
          created_at?: string
          id?: string
          meeting_format: string
          notes?: string | null
          organization_id: string
          preferred_date: string
          preferred_time: string
          source_onboarding_request_id: string
          status?: string
          time_zone?: string
          travel_quote_status?: string
        }
        Update: {
          address?: string | null
          contact_name?: string
          contact_phone?: string
          created_at?: string
          id?: string
          meeting_format?: string
          notes?: string | null
          organization_id?: string
          preferred_date?: string
          preferred_time?: string
          source_onboarding_request_id?: string
          status?: string
          time_zone?: string
          travel_quote_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointment_requests_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_requests_source_onboarding_request_id_fkey"
            columns: ["source_onboarding_request_id"]
            isOneToOne: true
            referencedRelation: "onboarding_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_events: {
        Row: {
          actor_user_id: string | null
          created_at: string
          details: Json
          event_type: string
          id: number
          organization_id: string | null
          record_id: string | null
          record_type: string
        }
        Insert: {
          actor_user_id?: string | null
          created_at?: string
          details?: Json
          event_type: string
          id?: never
          organization_id?: string | null
          record_id?: string | null
          record_type: string
        }
        Update: {
          actor_user_id?: string | null
          created_at?: string
          details?: Json
          event_type?: string
          id?: never
          organization_id?: string | null
          record_id?: string | null
          record_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_charges: {
        Row: {
          amount_minor: number
          charge_type: string
          created_at: string
          currency: string
          due_at: string | null
          failed_at: string | null
          failure_code: string | null
          failure_message: string | null
          id: string
          idempotency_key: string
          installment_number: number | null
          onboarding_request_id: string | null
          organization_id: string
          paid_at: string | null
          provider: string
          provider_charge_reference: string | null
          refunded_minor: number
          service_quote_id: string | null
          status: string
          subscription_id: string | null
          tax_minor: number | null
          updated_at: string
        }
        Insert: {
          amount_minor: number
          charge_type: string
          created_at?: string
          currency?: string
          due_at?: string | null
          failed_at?: string | null
          failure_code?: string | null
          failure_message?: string | null
          id?: string
          idempotency_key: string
          installment_number?: number | null
          onboarding_request_id?: string | null
          organization_id: string
          paid_at?: string | null
          provider?: string
          provider_charge_reference?: string | null
          refunded_minor?: number
          service_quote_id?: string | null
          status?: string
          subscription_id?: string | null
          tax_minor?: number | null
          updated_at?: string
        }
        Update: {
          amount_minor?: number
          charge_type?: string
          created_at?: string
          currency?: string
          due_at?: string | null
          failed_at?: string | null
          failure_code?: string | null
          failure_message?: string | null
          id?: string
          idempotency_key?: string
          installment_number?: number | null
          onboarding_request_id?: string | null
          organization_id?: string
          paid_at?: string | null
          provider?: string
          provider_charge_reference?: string | null
          refunded_minor?: number
          service_quote_id?: string | null
          status?: string
          subscription_id?: string | null
          tax_minor?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_charges_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_charges_organization_id_onboarding_request_id_fkey"
            columns: ["organization_id", "onboarding_request_id"]
            isOneToOne: false
            referencedRelation: "onboarding_requests"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "billing_charges_organization_id_service_quote_id_fkey"
            columns: ["organization_id", "service_quote_id"]
            isOneToOne: false
            referencedRelation: "service_quotes"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "billing_charges_organization_id_subscription_id_fkey"
            columns: ["organization_id", "subscription_id"]
            isOneToOne: false
            referencedRelation: "organization_subscriptions"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      billing_provider_events: {
        Row: {
          attempt_count: number
          event_type: string
          id: string
          last_error: string | null
          payload_digest: string
          processed_at: string | null
          processing_status: string
          provider: string
          provider_event_reference: string
          received_at: string
        }
        Insert: {
          attempt_count?: number
          event_type: string
          id?: string
          last_error?: string | null
          payload_digest: string
          processed_at?: string | null
          processing_status?: string
          provider: string
          provider_event_reference: string
          received_at?: string
        }
        Update: {
          attempt_count?: number
          event_type?: string
          id?: string
          last_error?: string | null
          payload_digest?: string
          processed_at?: string | null
          processing_status?: string
          provider?: string
          provider_event_reference?: string
          received_at?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          address_line_1: string | null
          address_line_2: string | null
          alternate_phone: string | null
          archived_at: string | null
          assigned_to_user_id: string | null
          business_name: string | null
          city: string | null
          consent_source: string | null
          country_code: string
          created_at: string
          created_by_user_id: string
          customer_type: string
          email: string | null
          email_marketing_consented_at: string | null
          email_marketing_opt_in: boolean
          first_name: string
          id: string
          last_name: string
          notes: string
          organization_id: string
          phone: string | null
          postal_code: string | null
          preferred_contact_channel: string
          privacy_notice_version: string | null
          province: string | null
          sms_marketing_consented_at: string | null
          sms_marketing_opt_in: boolean
          suburb: string | null
          tags: string[]
          updated_at: string
          whatsapp_marketing_consented_at: string | null
          whatsapp_marketing_opt_in: boolean
        }
        Insert: {
          address_line_1?: string | null
          address_line_2?: string | null
          alternate_phone?: string | null
          archived_at?: string | null
          assigned_to_user_id?: string | null
          business_name?: string | null
          city?: string | null
          consent_source?: string | null
          country_code?: string
          created_at?: string
          created_by_user_id: string
          customer_type?: string
          email?: string | null
          email_marketing_consented_at?: string | null
          email_marketing_opt_in?: boolean
          first_name?: string
          id?: string
          last_name?: string
          notes?: string
          organization_id: string
          phone?: string | null
          postal_code?: string | null
          preferred_contact_channel?: string
          privacy_notice_version?: string | null
          province?: string | null
          sms_marketing_consented_at?: string | null
          sms_marketing_opt_in?: boolean
          suburb?: string | null
          tags?: string[]
          updated_at?: string
          whatsapp_marketing_consented_at?: string | null
          whatsapp_marketing_opt_in?: boolean
        }
        Update: {
          address_line_1?: string | null
          address_line_2?: string | null
          alternate_phone?: string | null
          archived_at?: string | null
          assigned_to_user_id?: string | null
          business_name?: string | null
          city?: string | null
          consent_source?: string | null
          country_code?: string
          created_at?: string
          created_by_user_id?: string
          customer_type?: string
          email?: string | null
          email_marketing_consented_at?: string | null
          email_marketing_opt_in?: boolean
          first_name?: string
          id?: string
          last_name?: string
          notes?: string
          organization_id?: string
          phone?: string | null
          postal_code?: string | null
          preferred_contact_channel?: string
          privacy_notice_version?: string | null
          province?: string | null
          sms_marketing_consented_at?: string | null
          sms_marketing_opt_in?: boolean
          suburb?: string | null
          tags?: string[]
          updated_at?: string
          whatsapp_marketing_consented_at?: string | null
          whatsapp_marketing_opt_in?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "customers_organization_id_assigned_to_user_id_fkey"
            columns: ["organization_id", "assigned_to_user_id"]
            isOneToOne: false
            referencedRelation: "organization_memberships"
            referencedColumns: ["organization_id", "user_id"]
          },
          {
            foreignKeyName: "customers_organization_id_created_by_user_id_fkey"
            columns: ["organization_id", "created_by_user_id"]
            isOneToOne: false
            referencedRelation: "organization_memberships"
            referencedColumns: ["organization_id", "user_id"]
          },
          {
            foreignKeyName: "customers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_payments: {
        Row: {
          amount_minor: number
          created_at: string
          currency: string
          deal_id: string
          id: string
          invoice_id: string | null
          notes: string
          organization_id: string
          payment_method: string
          payment_reference: string | null
          received_at: string | null
          recorded_by_user_id: string
          status: string
        }
        Insert: {
          amount_minor: number
          created_at?: string
          currency?: string
          deal_id: string
          id?: string
          invoice_id?: string | null
          notes?: string
          organization_id: string
          payment_method: string
          payment_reference?: string | null
          received_at?: string | null
          recorded_by_user_id: string
          status?: string
        }
        Update: {
          amount_minor?: number
          created_at?: string
          currency?: string
          deal_id?: string
          id?: string
          invoice_id?: string | null
          notes?: string
          organization_id?: string
          payment_method?: string
          payment_reference?: string | null
          received_at?: string | null
          recorded_by_user_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_payments_organization_id_deal_id_fkey"
            columns: ["organization_id", "deal_id"]
            isOneToOne: false
            referencedRelation: "sales_deals"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "deal_payments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_payments_organization_id_invoice_id_fkey"
            columns: ["organization_id", "invoice_id"]
            isOneToOne: false
            referencedRelation: "sales_invoices"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "deal_payments_organization_id_recorded_by_user_id_fkey"
            columns: ["organization_id", "recorded_by_user_id"]
            isOneToOne: false
            referencedRelation: "organization_memberships"
            referencedColumns: ["organization_id", "user_id"]
          },
        ]
      }
      dealership_appointments: {
        Row: {
          appointment_type: string
          assigned_to_user_id: string | null
          confirmation_sent_at: string | null
          contact_email: string | null
          contact_name: string
          contact_phone: string | null
          created_at: string
          created_by_user_id: string
          customer_id: string | null
          customer_notes: string
          ends_at: string
          id: string
          internal_notes: string
          lead_id: string | null
          location_id: string | null
          location_notes: string | null
          organization_id: string
          reminder_sent_at: string | null
          starts_at: string
          status: string
          time_zone: string
          updated_at: string
          vehicle_id: string | null
        }
        Insert: {
          appointment_type: string
          assigned_to_user_id?: string | null
          confirmation_sent_at?: string | null
          contact_email?: string | null
          contact_name: string
          contact_phone?: string | null
          created_at?: string
          created_by_user_id: string
          customer_id?: string | null
          customer_notes?: string
          ends_at: string
          id?: string
          internal_notes?: string
          lead_id?: string | null
          location_id?: string | null
          location_notes?: string | null
          organization_id: string
          reminder_sent_at?: string | null
          starts_at: string
          status?: string
          time_zone?: string
          updated_at?: string
          vehicle_id?: string | null
        }
        Update: {
          appointment_type?: string
          assigned_to_user_id?: string | null
          confirmation_sent_at?: string | null
          contact_email?: string | null
          contact_name?: string
          contact_phone?: string | null
          created_at?: string
          created_by_user_id?: string
          customer_id?: string | null
          customer_notes?: string
          ends_at?: string
          id?: string
          internal_notes?: string
          lead_id?: string | null
          location_id?: string | null
          location_notes?: string | null
          organization_id?: string
          reminder_sent_at?: string | null
          starts_at?: string
          status?: string
          time_zone?: string
          updated_at?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dealership_appointments_organization_id_assigned_to_user_i_fkey"
            columns: ["organization_id", "assigned_to_user_id"]
            isOneToOne: false
            referencedRelation: "organization_memberships"
            referencedColumns: ["organization_id", "user_id"]
          },
          {
            foreignKeyName: "dealership_appointments_organization_id_created_by_user_id_fkey"
            columns: ["organization_id", "created_by_user_id"]
            isOneToOne: false
            referencedRelation: "organization_memberships"
            referencedColumns: ["organization_id", "user_id"]
          },
          {
            foreignKeyName: "dealership_appointments_organization_id_customer_id_fkey"
            columns: ["organization_id", "customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "dealership_appointments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dealership_appointments_organization_id_lead_id_fkey"
            columns: ["organization_id", "lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "dealership_appointments_organization_id_location_id_fkey"
            columns: ["organization_id", "location_id"]
            isOneToOne: false
            referencedRelation: "dealership_locations"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "dealership_appointments_organization_id_vehicle_id_fkey"
            columns: ["organization_id", "vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      dealership_locations: {
        Row: {
          address: string | null
          business_hours: Json
          city: string
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          id: string
          is_default: boolean
          latitude: number | null
          longitude: number | null
          name: string
          organization_id: string
          postal_code: string | null
          province: string
        }
        Insert: {
          address?: string | null
          business_hours?: Json
          city: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          is_default?: boolean
          latitude?: number | null
          longitude?: number | null
          name: string
          organization_id: string
          postal_code?: string | null
          province: string
        }
        Update: {
          address?: string | null
          business_hours?: Json
          city?: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          is_default?: boolean
          latitude?: number | null
          longitude?: number | null
          name?: string
          organization_id?: string
          postal_code?: string | null
          province?: string
        }
        Relationships: [
          {
            foreignKeyName: "dealership_locations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      dealership_tasks: {
        Row: {
          assigned_to_user_id: string | null
          completed_at: string | null
          completion_note: string | null
          created_at: string
          created_by_user_id: string
          customer_id: string | null
          description: string
          due_at: string | null
          id: string
          lead_id: string | null
          organization_id: string
          priority: string
          reminder_at: string | null
          status: string
          task_type: string
          title: string
          updated_at: string
          vehicle_id: string | null
        }
        Insert: {
          assigned_to_user_id?: string | null
          completed_at?: string | null
          completion_note?: string | null
          created_at?: string
          created_by_user_id: string
          customer_id?: string | null
          description?: string
          due_at?: string | null
          id?: string
          lead_id?: string | null
          organization_id: string
          priority?: string
          reminder_at?: string | null
          status?: string
          task_type?: string
          title: string
          updated_at?: string
          vehicle_id?: string | null
        }
        Update: {
          assigned_to_user_id?: string | null
          completed_at?: string | null
          completion_note?: string | null
          created_at?: string
          created_by_user_id?: string
          customer_id?: string | null
          description?: string
          due_at?: string | null
          id?: string
          lead_id?: string | null
          organization_id?: string
          priority?: string
          reminder_at?: string | null
          status?: string
          task_type?: string
          title?: string
          updated_at?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dealership_tasks_organization_id_assigned_to_user_id_fkey"
            columns: ["organization_id", "assigned_to_user_id"]
            isOneToOne: false
            referencedRelation: "organization_memberships"
            referencedColumns: ["organization_id", "user_id"]
          },
          {
            foreignKeyName: "dealership_tasks_organization_id_created_by_user_id_fkey"
            columns: ["organization_id", "created_by_user_id"]
            isOneToOne: false
            referencedRelation: "organization_memberships"
            referencedColumns: ["organization_id", "user_id"]
          },
          {
            foreignKeyName: "dealership_tasks_organization_id_customer_id_fkey"
            columns: ["organization_id", "customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "dealership_tasks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dealership_tasks_organization_id_lead_id_fkey"
            columns: ["organization_id", "lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "dealership_tasks_organization_id_vehicle_id_fkey"
            columns: ["organization_id", "vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      import_job_rows: {
        Row: {
          created_at: string
          duplicate_action: string
          duplicate_of_record_id: string | null
          id: string
          import_job_id: string
          normalized_data: Json | null
          organization_id: string
          raw_data: Json
          row_number: number
          status: string
          validation_errors: Json
        }
        Insert: {
          created_at?: string
          duplicate_action?: string
          duplicate_of_record_id?: string | null
          id?: string
          import_job_id: string
          normalized_data?: Json | null
          organization_id: string
          raw_data: Json
          row_number: number
          status?: string
          validation_errors?: Json
        }
        Update: {
          created_at?: string
          duplicate_action?: string
          duplicate_of_record_id?: string | null
          id?: string
          import_job_id?: string
          normalized_data?: Json | null
          organization_id?: string
          raw_data?: Json
          row_number?: number
          status?: string
          validation_errors?: Json
        }
        Relationships: [
          {
            foreignKeyName: "import_job_rows_organization_id_import_job_id_fkey"
            columns: ["organization_id", "import_job_id"]
            isOneToOne: false
            referencedRelation: "import_jobs"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      import_jobs: {
        Row: {
          bucket_id: string
          completed_at: string | null
          created_at: string
          duplicate_rows: number
          error_summary: Json
          field_mapping: Json
          file_name: string
          file_size_bytes: number | null
          id: string
          import_type: string
          invalid_rows: number
          object_path: string
          organization_id: string
          started_at: string | null
          status: string
          total_rows: number
          updated_at: string
          uploaded_by_user_id: string
          valid_rows: number
        }
        Insert: {
          bucket_id?: string
          completed_at?: string | null
          created_at?: string
          duplicate_rows?: number
          error_summary?: Json
          field_mapping?: Json
          file_name: string
          file_size_bytes?: number | null
          id?: string
          import_type: string
          invalid_rows?: number
          object_path: string
          organization_id: string
          started_at?: string | null
          status?: string
          total_rows?: number
          updated_at?: string
          uploaded_by_user_id: string
          valid_rows?: number
        }
        Update: {
          bucket_id?: string
          completed_at?: string | null
          created_at?: string
          duplicate_rows?: number
          error_summary?: Json
          field_mapping?: Json
          file_name?: string
          file_size_bytes?: number | null
          id?: string
          import_type?: string
          invalid_rows?: number
          object_path?: string
          organization_id?: string
          started_at?: string | null
          status?: string
          total_rows?: number
          updated_at?: string
          uploaded_by_user_id?: string
          valid_rows?: number
        }
        Relationships: [
          {
            foreignKeyName: "import_jobs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "import_jobs_organization_id_uploaded_by_user_id_fkey"
            columns: ["organization_id", "uploaded_by_user_id"]
            isOneToOne: false
            referencedRelation: "organization_memberships"
            referencedColumns: ["organization_id", "user_id"]
          },
        ]
      }
      lead_activities: {
        Row: {
          activity_type: string
          actor_user_id: string | null
          body: string
          created_at: string
          customer_id: string | null
          direction: string | null
          happened_at: string
          id: string
          lead_id: string
          metadata: Json
          next_action_at: string | null
          organization_id: string
          outcome: string | null
          subject: string | null
          vehicle_id: string | null
        }
        Insert: {
          activity_type: string
          actor_user_id?: string | null
          body?: string
          created_at?: string
          customer_id?: string | null
          direction?: string | null
          happened_at?: string
          id?: string
          lead_id: string
          metadata?: Json
          next_action_at?: string | null
          organization_id: string
          outcome?: string | null
          subject?: string | null
          vehicle_id?: string | null
        }
        Update: {
          activity_type?: string
          actor_user_id?: string | null
          body?: string
          created_at?: string
          customer_id?: string | null
          direction?: string | null
          happened_at?: string
          id?: string
          lead_id?: string
          metadata?: Json
          next_action_at?: string | null
          organization_id?: string
          outcome?: string | null
          subject?: string | null
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_activities_organization_id_actor_user_id_fkey"
            columns: ["organization_id", "actor_user_id"]
            isOneToOne: false
            referencedRelation: "organization_memberships"
            referencedColumns: ["organization_id", "user_id"]
          },
          {
            foreignKeyName: "lead_activities_organization_id_customer_id_fkey"
            columns: ["organization_id", "customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "lead_activities_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_activities_organization_id_lead_id_fkey"
            columns: ["organization_id", "lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "lead_activities_organization_id_vehicle_id_fkey"
            columns: ["organization_id", "vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      leads: {
        Row: {
          archived_at: string | null
          assigned_to_user_id: string | null
          budget_max_minor: number | null
          budget_min_minor: number | null
          consent_captured_at: string | null
          consent_to_contact: boolean
          created_at: string
          created_by_user_id: string
          custom_fields: Json
          customer_id: string | null
          enquiry_message: string
          expected_purchase_on: string | null
          finance_required: boolean | null
          first_contact_at: string | null
          follow_up_at: string | null
          id: string
          last_contact_at: string | null
          lost_reason: string | null
          organization_id: string
          preferred_contact_channel: string | null
          priority: string
          requested_make: string | null
          requested_model: string | null
          requested_year_from: number | null
          requested_year_to: number | null
          source: string
          source_detail: string | null
          status: string
          subject: string | null
          trade_in_expected: boolean
          updated_at: string
          vehicle_id: string | null
        }
        Insert: {
          archived_at?: string | null
          assigned_to_user_id?: string | null
          budget_max_minor?: number | null
          budget_min_minor?: number | null
          consent_captured_at?: string | null
          consent_to_contact?: boolean
          created_at?: string
          created_by_user_id: string
          custom_fields?: Json
          customer_id?: string | null
          enquiry_message?: string
          expected_purchase_on?: string | null
          finance_required?: boolean | null
          first_contact_at?: string | null
          follow_up_at?: string | null
          id?: string
          last_contact_at?: string | null
          lost_reason?: string | null
          organization_id: string
          preferred_contact_channel?: string | null
          priority?: string
          requested_make?: string | null
          requested_model?: string | null
          requested_year_from?: number | null
          requested_year_to?: number | null
          source?: string
          source_detail?: string | null
          status?: string
          subject?: string | null
          trade_in_expected?: boolean
          updated_at?: string
          vehicle_id?: string | null
        }
        Update: {
          archived_at?: string | null
          assigned_to_user_id?: string | null
          budget_max_minor?: number | null
          budget_min_minor?: number | null
          consent_captured_at?: string | null
          consent_to_contact?: boolean
          created_at?: string
          created_by_user_id?: string
          custom_fields?: Json
          customer_id?: string | null
          enquiry_message?: string
          expected_purchase_on?: string | null
          finance_required?: boolean | null
          first_contact_at?: string | null
          follow_up_at?: string | null
          id?: string
          last_contact_at?: string | null
          lost_reason?: string | null
          organization_id?: string
          preferred_contact_channel?: string | null
          priority?: string
          requested_make?: string | null
          requested_model?: string | null
          requested_year_from?: number | null
          requested_year_to?: number | null
          source?: string
          source_detail?: string | null
          status?: string
          subject?: string | null
          trade_in_expected?: boolean
          updated_at?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_organization_id_assigned_to_user_id_fkey"
            columns: ["organization_id", "assigned_to_user_id"]
            isOneToOne: false
            referencedRelation: "organization_memberships"
            referencedColumns: ["organization_id", "user_id"]
          },
          {
            foreignKeyName: "leads_organization_id_created_by_user_id_fkey"
            columns: ["organization_id", "created_by_user_id"]
            isOneToOne: false
            referencedRelation: "organization_memberships"
            referencedColumns: ["organization_id", "user_id"]
          },
          {
            foreignKeyName: "leads_organization_id_customer_id_fkey"
            columns: ["organization_id", "customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "leads_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_organization_id_vehicle_id_fkey"
            columns: ["organization_id", "vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      onboarding_drafts: {
        Row: {
          answers: Json
          created_at: string
          current_step: number
          submitted_request_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          answers?: Json
          created_at?: string
          current_step?: number
          submitted_request_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          answers?: Json
          created_at?: string
          current_step?: number
          submitted_request_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_draft_submitted_request_fk"
            columns: ["submitted_request_id"]
            isOneToOne: false
            referencedRelation: "onboarding_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_requests: {
        Row: {
          annual_saving_minor: number
          annual_total_minor: number
          billing_interval: string
          created_at: string
          currency: string
          due_today_minor: number
          id: string
          onboarding_user_id: string
          organization_id: string
          payment_status: string
          plan_code: string
          service_scope_snapshot: Json
          setup_fee_minor: number
          setup_installments: number
          setup_method: string
          setup_schedule_minor: number[]
          status: string
          submitted_at: string
          submitted_by_user_id: string
          subscription_amount_minor: number
          tax_status: string
        }
        Insert: {
          annual_saving_minor: number
          annual_total_minor: number
          billing_interval: string
          created_at?: string
          currency?: string
          due_today_minor: number
          id?: string
          onboarding_user_id: string
          organization_id: string
          payment_status?: string
          plan_code: string
          service_scope_snapshot: Json
          setup_fee_minor: number
          setup_installments: number
          setup_method: string
          setup_schedule_minor: number[]
          status?: string
          submitted_at?: string
          submitted_by_user_id: string
          subscription_amount_minor: number
          tax_status?: string
        }
        Update: {
          annual_saving_minor?: number
          annual_total_minor?: number
          billing_interval?: string
          created_at?: string
          currency?: string
          due_today_minor?: number
          id?: string
          onboarding_user_id?: string
          organization_id?: string
          payment_status?: string
          plan_code?: string
          service_scope_snapshot?: Json
          setup_fee_minor?: number
          setup_installments?: number
          setup_method?: string
          setup_schedule_minor?: number[]
          status?: string
          submitted_at?: string
          submitted_by_user_id?: string
          subscription_amount_minor?: number
          tax_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_requests_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_invitations: {
        Row: {
          accepted_at: string | null
          accepted_by_user_id: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by_user_id: string
          organization_id: string
          role: string
          status: string
          token_hash: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_by_user_id?: string | null
          created_at?: string
          email: string
          expires_at: string
          id?: string
          invited_by_user_id: string
          organization_id: string
          role: string
          status?: string
          token_hash: string
        }
        Update: {
          accepted_at?: string | null
          accepted_by_user_id?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by_user_id?: string
          organization_id?: string
          role?: string
          status?: string
          token_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_invitations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_memberships: {
        Row: {
          created_at: string
          organization_id: string
          role: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          organization_id: string
          role: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          organization_id?: string
          role?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_memberships_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_social_profiles: {
        Row: {
          authorization_method: string | null
          authorization_status: string
          authorized_at: string | null
          authorized_by_user_id: string | null
          created_at: string
          display_name: string | null
          external_account_reference: string | null
          handle: string | null
          id: string
          last_error: string | null
          organization_id: string
          platform: string
          profile_url: string | null
          revoked_at: string | null
          updated_at: string
        }
        Insert: {
          authorization_method?: string | null
          authorization_status?: string
          authorized_at?: string | null
          authorized_by_user_id?: string | null
          created_at?: string
          display_name?: string | null
          external_account_reference?: string | null
          handle?: string | null
          id?: string
          last_error?: string | null
          organization_id: string
          platform: string
          profile_url?: string | null
          revoked_at?: string | null
          updated_at?: string
        }
        Update: {
          authorization_method?: string | null
          authorization_status?: string
          authorized_at?: string | null
          authorized_by_user_id?: string | null
          created_at?: string
          display_name?: string | null
          external_account_reference?: string | null
          handle?: string | null
          id?: string
          last_error?: string | null
          organization_id?: string
          platform?: string
          profile_url?: string | null
          revoked_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_social_profiles_organization_id_authorized_by_fkey"
            columns: ["organization_id", "authorized_by_user_id"]
            isOneToOne: false
            referencedRelation: "organization_memberships"
            referencedColumns: ["organization_id", "user_id"]
          },
          {
            foreignKeyName: "organization_social_profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_subscriptions: {
        Row: {
          activated_at: string | null
          amount_minor: number
          billing_interval: string
          cancel_at_period_end: boolean
          cancelled_at: string | null
          created_at: string
          currency: string
          current_period_end: string | null
          current_period_start: string | null
          entitlement_verified_at: string | null
          id: string
          organization_id: string
          plan_code: string
          provider: string
          provider_customer_reference: string | null
          provider_subscription_reference: string | null
          source_onboarding_request_id: string | null
          status: string
          tax_treatment: string
          trial_ends_at: string | null
          updated_at: string
        }
        Insert: {
          activated_at?: string | null
          amount_minor: number
          billing_interval: string
          cancel_at_period_end?: boolean
          cancelled_at?: string | null
          created_at?: string
          currency?: string
          current_period_end?: string | null
          current_period_start?: string | null
          entitlement_verified_at?: string | null
          id?: string
          organization_id: string
          plan_code: string
          provider?: string
          provider_customer_reference?: string | null
          provider_subscription_reference?: string | null
          source_onboarding_request_id?: string | null
          status?: string
          tax_treatment?: string
          trial_ends_at?: string | null
          updated_at?: string
        }
        Update: {
          activated_at?: string | null
          amount_minor?: number
          billing_interval?: string
          cancel_at_period_end?: boolean
          cancelled_at?: string | null
          created_at?: string
          currency?: string
          current_period_end?: string | null
          current_period_start?: string | null
          entitlement_verified_at?: string | null
          id?: string
          organization_id?: string
          plan_code?: string
          provider?: string
          provider_customer_reference?: string | null
          provider_subscription_reference?: string | null
          source_onboarding_request_id?: string | null
          status?: string
          tax_treatment?: string
          trial_ends_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_subscriptions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_subscriptions_organization_id_source_onboardi_fkey"
            columns: ["organization_id", "source_onboarding_request_id"]
            isOneToOne: false
            referencedRelation: "onboarding_requests"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      organizations: {
        Row: {
          address: string | null
          business_hours: Json
          business_registration_number: string | null
          city: string
          contact_email: string | null
          created_at: string
          created_by_user_id: string
          currency: string
          default_follow_up_days: number
          default_lead_assignment_user_id: string | null
          help_areas: string[]
          id: string
          legal_name: string | null
          logo_path: string | null
          name: string
          onboarding_status: string
          phone: string
          province: string
          role: string
          social_help: string | null
          social_platforms: string[]
          social_profiles: Json
          staff_size: string
          stock_band: string
          time_zone: string
          updated_at: string
          vat_number: string | null
          vat_registered: boolean
          website_review_requested: boolean
          website_status: string
          website_url: string | null
        }
        Insert: {
          address?: string | null
          business_hours?: Json
          business_registration_number?: string | null
          city: string
          contact_email?: string | null
          created_at?: string
          created_by_user_id: string
          currency?: string
          default_follow_up_days?: number
          default_lead_assignment_user_id?: string | null
          help_areas?: string[]
          id?: string
          legal_name?: string | null
          logo_path?: string | null
          name: string
          onboarding_status?: string
          phone: string
          province: string
          role: string
          social_help?: string | null
          social_platforms?: string[]
          social_profiles?: Json
          staff_size: string
          stock_band: string
          time_zone?: string
          updated_at?: string
          vat_number?: string | null
          vat_registered?: boolean
          website_review_requested?: boolean
          website_status?: string
          website_url?: string | null
        }
        Update: {
          address?: string | null
          business_hours?: Json
          business_registration_number?: string | null
          city?: string
          contact_email?: string | null
          created_at?: string
          created_by_user_id?: string
          currency?: string
          default_follow_up_days?: number
          default_lead_assignment_user_id?: string | null
          help_areas?: string[]
          id?: string
          legal_name?: string | null
          logo_path?: string | null
          name?: string
          onboarding_status?: string
          phone?: string
          province?: string
          role?: string
          social_help?: string | null
          social_platforms?: string[]
          social_profiles?: Json
          staff_size?: string
          stock_band?: string
          time_zone?: string
          updated_at?: string
          vat_number?: string | null
          vat_registered?: boolean
          website_review_requested?: boolean
          website_status?: string
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organizations_default_assignment_membership_fk"
            columns: ["id", "default_lead_assignment_user_id"]
            isOneToOne: false
            referencedRelation: "organization_memberships"
            referencedColumns: ["organization_id", "user_id"]
          },
        ]
      }
      pricing_configuration: {
        Row: {
          ai_allowances: Json | null
          effective_at: string
          messaging_allowances: Json | null
          payment_provider: string
          privacy_notice_version: string | null
          service_terms_version: string | null
          singleton: boolean
          tax_rate_basis_points: number | null
          tax_treatment: string
          updated_at: string
        }
        Insert: {
          ai_allowances?: Json | null
          effective_at?: string
          messaging_allowances?: Json | null
          payment_provider?: string
          privacy_notice_version?: string | null
          service_terms_version?: string | null
          singleton?: boolean
          tax_rate_basis_points?: number | null
          tax_treatment?: string
          updated_at?: string
        }
        Update: {
          ai_allowances?: Json | null
          effective_at?: string
          messaging_allowances?: Json | null
          payment_provider?: string
          privacy_notice_version?: string | null
          service_terms_version?: string | null
          singleton?: boolean
          tax_rate_basis_points?: number | null
          tax_treatment?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string
          id: string
          marketing_opt_in: boolean
          privacy_acknowledged_at: string | null
          privacy_version: string | null
          terms_accepted_at: string | null
          terms_version: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name?: string
          id: string
          marketing_opt_in?: boolean
          privacy_acknowledged_at?: string | null
          privacy_version?: string | null
          terms_accepted_at?: string | null
          terms_version?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          marketing_opt_in?: boolean
          privacy_acknowledged_at?: string | null
          privacy_version?: string | null
          terms_accepted_at?: string | null
          terms_version?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      sales_deals: {
        Row: {
          agreed_price_minor: number
          cancellation_reason: string | null
          completed_at: string | null
          created_at: string
          created_by_user_id: string
          currency: string
          custom_fields: Json
          customer_id: string
          deal_number: string
          delivery_due_at: string | null
          deposit_received_minor: number
          deposit_required_minor: number
          discount_minor: number
          finance_provider: string | null
          finance_reference: string | null
          finance_required: boolean
          finance_status: string | null
          id: string
          internal_notes: string
          lead_id: string | null
          location_id: string | null
          organization_id: string
          sale_agreed_at: string | null
          salesperson_user_id: string
          status: string
          trade_in_value_minor: number
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          agreed_price_minor: number
          cancellation_reason?: string | null
          completed_at?: string | null
          created_at?: string
          created_by_user_id: string
          currency?: string
          custom_fields?: Json
          customer_id: string
          deal_number: string
          delivery_due_at?: string | null
          deposit_received_minor?: number
          deposit_required_minor?: number
          discount_minor?: number
          finance_provider?: string | null
          finance_reference?: string | null
          finance_required?: boolean
          finance_status?: string | null
          id?: string
          internal_notes?: string
          lead_id?: string | null
          location_id?: string | null
          organization_id: string
          sale_agreed_at?: string | null
          salesperson_user_id: string
          status?: string
          trade_in_value_minor?: number
          updated_at?: string
          vehicle_id: string
        }
        Update: {
          agreed_price_minor?: number
          cancellation_reason?: string | null
          completed_at?: string | null
          created_at?: string
          created_by_user_id?: string
          currency?: string
          custom_fields?: Json
          customer_id?: string
          deal_number?: string
          delivery_due_at?: string | null
          deposit_received_minor?: number
          deposit_required_minor?: number
          discount_minor?: number
          finance_provider?: string | null
          finance_reference?: string | null
          finance_required?: boolean
          finance_status?: string | null
          id?: string
          internal_notes?: string
          lead_id?: string | null
          location_id?: string | null
          organization_id?: string
          sale_agreed_at?: string | null
          salesperson_user_id?: string
          status?: string
          trade_in_value_minor?: number
          updated_at?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_deals_organization_id_created_by_user_id_fkey"
            columns: ["organization_id", "created_by_user_id"]
            isOneToOne: false
            referencedRelation: "organization_memberships"
            referencedColumns: ["organization_id", "user_id"]
          },
          {
            foreignKeyName: "sales_deals_organization_id_customer_id_fkey"
            columns: ["organization_id", "customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "sales_deals_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_deals_organization_id_lead_id_fkey"
            columns: ["organization_id", "lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "sales_deals_organization_id_location_id_fkey"
            columns: ["organization_id", "location_id"]
            isOneToOne: false
            referencedRelation: "dealership_locations"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "sales_deals_organization_id_salesperson_user_id_fkey"
            columns: ["organization_id", "salesperson_user_id"]
            isOneToOne: false
            referencedRelation: "organization_memberships"
            referencedColumns: ["organization_id", "user_id"]
          },
          {
            foreignKeyName: "sales_deals_organization_id_vehicle_id_fkey"
            columns: ["organization_id", "vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      sales_documents: {
        Row: {
          bucket_id: string
          content_type: string | null
          deal_id: string
          display_name: string
          document_type: string
          file_size_bytes: number | null
          id: string
          object_path: string
          organization_id: string
          uploaded_at: string
          uploaded_by_user_id: string
        }
        Insert: {
          bucket_id?: string
          content_type?: string | null
          deal_id: string
          display_name: string
          document_type: string
          file_size_bytes?: number | null
          id?: string
          object_path: string
          organization_id: string
          uploaded_at?: string
          uploaded_by_user_id: string
        }
        Update: {
          bucket_id?: string
          content_type?: string | null
          deal_id?: string
          display_name?: string
          document_type?: string
          file_size_bytes?: number | null
          id?: string
          object_path?: string
          organization_id?: string
          uploaded_at?: string
          uploaded_by_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_documents_organization_id_deal_id_fkey"
            columns: ["organization_id", "deal_id"]
            isOneToOne: false
            referencedRelation: "sales_deals"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "sales_documents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_documents_organization_id_uploaded_by_user_id_fkey"
            columns: ["organization_id", "uploaded_by_user_id"]
            isOneToOne: false
            referencedRelation: "organization_memberships"
            referencedColumns: ["organization_id", "user_id"]
          },
        ]
      }
      sales_invoice_lines: {
        Row: {
          created_at: string
          description: string
          id: string
          invoice_id: string
          line_number: number
          organization_id: string
          quantity: number
          tax_rate_basis_points: number | null
          total_amount_minor: number
          unit_amount_minor: number
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          invoice_id: string
          line_number: number
          organization_id: string
          quantity?: number
          tax_rate_basis_points?: number | null
          total_amount_minor: number
          unit_amount_minor: number
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          invoice_id?: string
          line_number?: number
          organization_id?: string
          quantity?: number
          tax_rate_basis_points?: number | null
          total_amount_minor?: number
          unit_amount_minor?: number
        }
        Relationships: [
          {
            foreignKeyName: "sales_invoice_lines_organization_id_invoice_id_fkey"
            columns: ["organization_id", "invoice_id"]
            isOneToOne: false
            referencedRelation: "sales_invoices"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      sales_invoices: {
        Row: {
          amount_paid_minor: number
          created_at: string
          created_by_user_id: string
          currency: string
          customer_address_snapshot: string | null
          customer_email_snapshot: string | null
          customer_name_snapshot: string
          deal_id: string
          due_at: string | null
          id: string
          invoice_number: string
          issued_at: string | null
          organization_id: string
          paid_at: string | null
          status: string
          subtotal_minor: number
          tax_minor: number | null
          tax_treatment: string
          total_minor: number
          updated_at: string
          voided_at: string | null
        }
        Insert: {
          amount_paid_minor?: number
          created_at?: string
          created_by_user_id: string
          currency?: string
          customer_address_snapshot?: string | null
          customer_email_snapshot?: string | null
          customer_name_snapshot: string
          deal_id: string
          due_at?: string | null
          id?: string
          invoice_number: string
          issued_at?: string | null
          organization_id: string
          paid_at?: string | null
          status?: string
          subtotal_minor?: number
          tax_minor?: number | null
          tax_treatment?: string
          total_minor: number
          updated_at?: string
          voided_at?: string | null
        }
        Update: {
          amount_paid_minor?: number
          created_at?: string
          created_by_user_id?: string
          currency?: string
          customer_address_snapshot?: string | null
          customer_email_snapshot?: string | null
          customer_name_snapshot?: string
          deal_id?: string
          due_at?: string | null
          id?: string
          invoice_number?: string
          issued_at?: string | null
          organization_id?: string
          paid_at?: string | null
          status?: string
          subtotal_minor?: number
          tax_minor?: number | null
          tax_treatment?: string
          total_minor?: number
          updated_at?: string
          voided_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_invoices_organization_id_created_by_user_id_fkey"
            columns: ["organization_id", "created_by_user_id"]
            isOneToOne: false
            referencedRelation: "organization_memberships"
            referencedColumns: ["organization_id", "user_id"]
          },
          {
            foreignKeyName: "sales_invoices_organization_id_deal_id_fkey"
            columns: ["organization_id", "deal_id"]
            isOneToOne: false
            referencedRelation: "sales_deals"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "sales_invoices_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      service_deliverables: {
        Row: {
          approved_at: string | null
          approved_by_user_id: string | null
          bucket_id: string
          created_at: string
          customer_feedback: string | null
          deliverable_type: string
          id: string
          object_path: string
          organization_id: string
          published_at: string | null
          scheduled_for: string | null
          service_request_id: string
          status: string
          title: string
          updated_at: string
          uploaded_by_user_id: string
          version_number: number
        }
        Insert: {
          approved_at?: string | null
          approved_by_user_id?: string | null
          bucket_id?: string
          created_at?: string
          customer_feedback?: string | null
          deliverable_type: string
          id?: string
          object_path: string
          organization_id: string
          published_at?: string | null
          scheduled_for?: string | null
          service_request_id: string
          status?: string
          title: string
          updated_at?: string
          uploaded_by_user_id: string
          version_number?: number
        }
        Update: {
          approved_at?: string | null
          approved_by_user_id?: string | null
          bucket_id?: string
          created_at?: string
          customer_feedback?: string | null
          deliverable_type?: string
          id?: string
          object_path?: string
          organization_id?: string
          published_at?: string | null
          scheduled_for?: string | null
          service_request_id?: string
          status?: string
          title?: string
          updated_at?: string
          uploaded_by_user_id?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "service_deliverables_organization_id_approved_by_user_id_fkey"
            columns: ["organization_id", "approved_by_user_id"]
            isOneToOne: false
            referencedRelation: "organization_memberships"
            referencedColumns: ["organization_id", "user_id"]
          },
          {
            foreignKeyName: "service_deliverables_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_deliverables_organization_id_service_request_id_fkey"
            columns: ["organization_id", "service_request_id"]
            isOneToOne: false
            referencedRelation: "service_requests"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "service_deliverables_organization_id_uploaded_by_user_id_fkey"
            columns: ["organization_id", "uploaded_by_user_id"]
            isOneToOne: false
            referencedRelation: "organization_memberships"
            referencedColumns: ["organization_id", "user_id"]
          },
        ]
      }
      service_delivery_tasks: {
        Row: {
          assigned_to_user_id: string | null
          completed_at: string | null
          created_at: string
          created_by_user_id: string | null
          customer_approval_required: boolean
          customer_approved_at: string | null
          description: string
          due_at: string | null
          id: string
          organization_id: string
          service_request_id: string
          status: string
          task_order: number
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to_user_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by_user_id?: string | null
          customer_approval_required?: boolean
          customer_approved_at?: string | null
          description?: string
          due_at?: string | null
          id?: string
          organization_id: string
          service_request_id: string
          status?: string
          task_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to_user_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by_user_id?: string | null
          customer_approval_required?: boolean
          customer_approved_at?: string | null
          description?: string
          due_at?: string | null
          id?: string
          organization_id?: string
          service_request_id?: string
          status?: string
          task_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_delivery_tasks_organization_id_assigned_to_user_id_fkey"
            columns: ["organization_id", "assigned_to_user_id"]
            isOneToOne: false
            referencedRelation: "organization_memberships"
            referencedColumns: ["organization_id", "user_id"]
          },
          {
            foreignKeyName: "service_delivery_tasks_organization_id_created_by_user_id_fkey"
            columns: ["organization_id", "created_by_user_id"]
            isOneToOne: false
            referencedRelation: "organization_memberships"
            referencedColumns: ["organization_id", "user_id"]
          },
          {
            foreignKeyName: "service_delivery_tasks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_delivery_tasks_organization_id_service_request_id_fkey"
            columns: ["organization_id", "service_request_id"]
            isOneToOne: false
            referencedRelation: "service_requests"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      service_quote_lines: {
        Row: {
          created_at: string
          description: string
          id: string
          is_recurring: boolean
          line_number: number
          organization_id: string
          quantity: number
          service_code: string
          service_quote_id: string
          total_amount_minor: number
          unit_amount_minor: number
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          is_recurring?: boolean
          line_number: number
          organization_id: string
          quantity?: number
          service_code: string
          service_quote_id: string
          total_amount_minor: number
          unit_amount_minor: number
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          is_recurring?: boolean
          line_number?: number
          organization_id?: string
          quantity?: number
          service_code?: string
          service_quote_id?: string
          total_amount_minor?: number
          unit_amount_minor?: number
        }
        Relationships: [
          {
            foreignKeyName: "service_quote_lines_organization_id_service_quote_id_fkey"
            columns: ["organization_id", "service_quote_id"]
            isOneToOne: false
            referencedRelation: "service_quotes"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      service_quotes: {
        Row: {
          accepted_at: string | null
          created_at: string
          created_by_user_id: string
          currency: string
          customer_response_note: string | null
          declined_at: string | null
          expires_at: string | null
          id: string
          organization_id: string
          quote_number: string
          scope_snapshot: Json
          sent_at: string | null
          service_request_id: string
          status: string
          subtotal_minor: number
          tax_minor: number | null
          tax_treatment: string
          terms_version: string | null
          total_minor: number
          travel_minor: number
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          created_by_user_id: string
          currency?: string
          customer_response_note?: string | null
          declined_at?: string | null
          expires_at?: string | null
          id?: string
          organization_id: string
          quote_number: string
          scope_snapshot: Json
          sent_at?: string | null
          service_request_id: string
          status?: string
          subtotal_minor?: number
          tax_minor?: number | null
          tax_treatment?: string
          terms_version?: string | null
          total_minor: number
          travel_minor?: number
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          created_by_user_id?: string
          currency?: string
          customer_response_note?: string | null
          declined_at?: string | null
          expires_at?: string | null
          id?: string
          organization_id?: string
          quote_number?: string
          scope_snapshot?: Json
          sent_at?: string | null
          service_request_id?: string
          status?: string
          subtotal_minor?: number
          tax_minor?: number | null
          tax_treatment?: string
          terms_version?: string | null
          total_minor?: number
          travel_minor?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_quotes_organization_id_created_by_user_id_fkey"
            columns: ["organization_id", "created_by_user_id"]
            isOneToOne: false
            referencedRelation: "organization_memberships"
            referencedColumns: ["organization_id", "user_id"]
          },
          {
            foreignKeyName: "service_quotes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_quotes_organization_id_service_request_id_fkey"
            columns: ["organization_id", "service_request_id"]
            isOneToOne: false
            referencedRelation: "service_requests"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      service_requests: {
        Row: {
          created_at: string
          details: Json
          id: string
          organization_id: string
          service_code: string
          source_onboarding_request_id: string
          status: string
        }
        Insert: {
          created_at?: string
          details?: Json
          id?: string
          organization_id: string
          service_code: string
          source_onboarding_request_id: string
          status?: string
        }
        Update: {
          created_at?: string
          details?: Json
          id?: string
          organization_id?: string
          service_code?: string
          source_onboarding_request_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_requests_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_requests_source_onboarding_request_id_fkey"
            columns: ["source_onboarding_request_id"]
            isOneToOne: false
            referencedRelation: "onboarding_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      trade_in_vehicles: {
        Row: {
          appraisal_value_minor: number
          condition_notes: string
          created_at: string
          deal_id: string
          id: string
          make: string
          model: string
          model_year: number | null
          odometer_km: number | null
          organization_id: string
          outstanding_settlement_minor: number
          registration_number: string | null
          updated_at: string
          variant: string | null
          vin: string | null
        }
        Insert: {
          appraisal_value_minor: number
          condition_notes?: string
          created_at?: string
          deal_id: string
          id?: string
          make: string
          model: string
          model_year?: number | null
          odometer_km?: number | null
          organization_id: string
          outstanding_settlement_minor?: number
          registration_number?: string | null
          updated_at?: string
          variant?: string | null
          vin?: string | null
        }
        Update: {
          appraisal_value_minor?: number
          condition_notes?: string
          created_at?: string
          deal_id?: string
          id?: string
          make?: string
          model?: string
          model_year?: number | null
          odometer_km?: number | null
          organization_id?: string
          outstanding_settlement_minor?: number
          registration_number?: string | null
          updated_at?: string
          variant?: string | null
          vin?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trade_in_vehicles_organization_id_deal_id_fkey"
            columns: ["organization_id", "deal_id"]
            isOneToOne: true
            referencedRelation: "sales_deals"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "trade_in_vehicles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_notification_preferences: {
        Row: {
          appointment_reminders_enabled: boolean
          email_enabled: boolean
          in_app_enabled: boolean
          marketing_enabled: boolean
          organization_id: string
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          reminder_minutes_before: number[]
          service_updates_enabled: boolean
          task_reminders_enabled: boolean
          time_zone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          appointment_reminders_enabled?: boolean
          email_enabled?: boolean
          in_app_enabled?: boolean
          marketing_enabled?: boolean
          organization_id: string
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          reminder_minutes_before?: number[]
          service_updates_enabled?: boolean
          task_reminders_enabled?: boolean
          time_zone?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          appointment_reminders_enabled?: boolean
          email_enabled?: boolean
          in_app_enabled?: boolean
          marketing_enabled?: boolean
          organization_id?: string
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          reminder_minutes_before?: number[]
          service_updates_enabled?: boolean
          task_reminders_enabled?: boolean
          time_zone?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_notification_preferences_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_notification_preferences_organization_id_user_id_fkey"
            columns: ["organization_id", "user_id"]
            isOneToOne: false
            referencedRelation: "organization_memberships"
            referencedColumns: ["organization_id", "user_id"]
          },
        ]
      }
      vehicle_media: {
        Row: {
          alt_text: string | null
          bucket_id: string
          created_at: string
          id: string
          is_primary: boolean
          media_type: string
          object_path: string
          organization_id: string
          sort_order: number
          title: string | null
          uploaded_by_user_id: string
          vehicle_id: string
        }
        Insert: {
          alt_text?: string | null
          bucket_id?: string
          created_at?: string
          id?: string
          is_primary?: boolean
          media_type: string
          object_path: string
          organization_id: string
          sort_order?: number
          title?: string | null
          uploaded_by_user_id: string
          vehicle_id: string
        }
        Update: {
          alt_text?: string | null
          bucket_id?: string
          created_at?: string
          id?: string
          is_primary?: boolean
          media_type?: string
          object_path?: string
          organization_id?: string
          sort_order?: number
          title?: string | null
          uploaded_by_user_id?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_media_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_media_organization_id_uploaded_by_user_id_fkey"
            columns: ["organization_id", "uploaded_by_user_id"]
            isOneToOne: false
            referencedRelation: "organization_memberships"
            referencedColumns: ["organization_id", "user_id"]
          },
          {
            foreignKeyName: "vehicle_media_organization_id_vehicle_id_fkey"
            columns: ["organization_id", "vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      vehicle_service_records: {
        Row: {
          cost_minor: number | null
          created_at: string
          currency: string
          description: string
          id: string
          next_service_due_odometer_km: number | null
          next_service_due_on: string | null
          odometer_km: number | null
          organization_id: string
          provider_name: string | null
          recorded_by_user_id: string
          service_date: string
          service_type: string
          vehicle_id: string
          work_order_reference: string | null
        }
        Insert: {
          cost_minor?: number | null
          created_at?: string
          currency?: string
          description: string
          id?: string
          next_service_due_odometer_km?: number | null
          next_service_due_on?: string | null
          odometer_km?: number | null
          organization_id: string
          provider_name?: string | null
          recorded_by_user_id: string
          service_date: string
          service_type: string
          vehicle_id: string
          work_order_reference?: string | null
        }
        Update: {
          cost_minor?: number | null
          created_at?: string
          currency?: string
          description?: string
          id?: string
          next_service_due_odometer_km?: number | null
          next_service_due_on?: string | null
          odometer_km?: number | null
          organization_id?: string
          provider_name?: string | null
          recorded_by_user_id?: string
          service_date?: string
          service_type?: string
          vehicle_id?: string
          work_order_reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_service_records_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_service_records_organization_id_recorded_by_user_i_fkey"
            columns: ["organization_id", "recorded_by_user_id"]
            isOneToOne: false
            referencedRelation: "organization_memberships"
            referencedColumns: ["organization_id", "user_id"]
          },
          {
            foreignKeyName: "vehicle_service_records_organization_id_vehicle_id_fkey"
            columns: ["organization_id", "vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      vehicles: {
        Row: {
          acquired_on: string | null
          acquisition_price_minor: number | null
          acquisition_source: string | null
          body_type: string | null
          condition: string
          created_at: string
          created_by_user_id: string
          currency: string
          custom_fields: Json
          description: string
          drivetrain: string | null
          engine_capacity_cc: number | null
          engine_number: string | null
          exterior_colour: string | null
          features: string[]
          fuel_type: string | null
          id: string
          interior_colour: string | null
          listed_at: string | null
          listing_price_minor: number
          location_id: string
          make: string
          minimum_sale_price_minor: number | null
          model: string
          model_year: number
          odometer_km: number
          organization_id: string
          previous_owners: number | null
          public_listing: boolean
          reconditioning_cost_minor: number
          registration_number: string | null
          reserved_until: string | null
          roadworthy_expires_on: string | null
          roadworthy_status: string
          service_history_available: boolean
          sold_at: string | null
          status: string
          stock_number: string
          transmission: string | null
          updated_at: string
          variant: string | null
          vin: string | null
        }
        Insert: {
          acquired_on?: string | null
          acquisition_price_minor?: number | null
          acquisition_source?: string | null
          body_type?: string | null
          condition?: string
          created_at?: string
          created_by_user_id: string
          currency?: string
          custom_fields?: Json
          description?: string
          drivetrain?: string | null
          engine_capacity_cc?: number | null
          engine_number?: string | null
          exterior_colour?: string | null
          features?: string[]
          fuel_type?: string | null
          id?: string
          interior_colour?: string | null
          listed_at?: string | null
          listing_price_minor: number
          location_id: string
          make: string
          minimum_sale_price_minor?: number | null
          model: string
          model_year: number
          odometer_km?: number
          organization_id: string
          previous_owners?: number | null
          public_listing?: boolean
          reconditioning_cost_minor?: number
          registration_number?: string | null
          reserved_until?: string | null
          roadworthy_expires_on?: string | null
          roadworthy_status?: string
          service_history_available?: boolean
          sold_at?: string | null
          status?: string
          stock_number: string
          transmission?: string | null
          updated_at?: string
          variant?: string | null
          vin?: string | null
        }
        Update: {
          acquired_on?: string | null
          acquisition_price_minor?: number | null
          acquisition_source?: string | null
          body_type?: string | null
          condition?: string
          created_at?: string
          created_by_user_id?: string
          currency?: string
          custom_fields?: Json
          description?: string
          drivetrain?: string | null
          engine_capacity_cc?: number | null
          engine_number?: string | null
          exterior_colour?: string | null
          features?: string[]
          fuel_type?: string | null
          id?: string
          interior_colour?: string | null
          listed_at?: string | null
          listing_price_minor?: number
          location_id?: string
          make?: string
          minimum_sale_price_minor?: number | null
          model?: string
          model_year?: number
          odometer_km?: number
          organization_id?: string
          previous_owners?: number | null
          public_listing?: boolean
          reconditioning_cost_minor?: number
          registration_number?: string | null
          reserved_until?: string | null
          roadworthy_expires_on?: string | null
          roadworthy_status?: string
          service_history_available?: boolean
          sold_at?: string | null
          status?: string
          stock_number?: string
          transmission?: string | null
          updated_at?: string
          variant?: string | null
          vin?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_organization_id_created_by_user_id_fkey"
            columns: ["organization_id", "created_by_user_id"]
            isOneToOne: false
            referencedRelation: "organization_memberships"
            referencedColumns: ["organization_id", "user_id"]
          },
          {
            foreignKeyName: "vehicles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicles_organization_id_location_id_fkey"
            columns: ["organization_id", "location_id"]
            isOneToOne: false
            referencedRelation: "dealership_locations"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_organization_invitation: {
        Args: { p_token: string }
        Returns: string
      }
      is_organization_manager: {
        Args: { p_organization_id: string }
        Returns: boolean
      }
      is_organization_member: {
        Args: { p_organization_id: string }
        Returns: boolean
      }
      save_onboarding_terms: {
        Args: { p_privacy_version: string; p_terms_version: string }
        Returns: undefined
      }
      submit_onboarding_request: { Args: { p_answers: Json }; Returns: Json }
    }
    Enums: {
      [_ in never]: never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
