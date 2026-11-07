export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type Table<Row, Insert = Partial<Row>, Update = Partial<Insert>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export interface Database {
  public: {
    Tables: {
      profiles: Table<{
        id: string;
        full_name: string;
        marketing_opt_in: boolean;
        terms_version: string | null;
        terms_accepted_at: string | null;
        privacy_version: string | null;
        privacy_acknowledged_at: string | null;
        created_at: string;
        updated_at: string;
      }>;
      onboarding_drafts: Table<{
        user_id: string;
        current_step: number;
        answers: Json;
        submitted_request_id: string | null;
        created_at: string;
        updated_at: string;
      }>;
      organizations: Table<{
        id: string;
        name: string;
        created_by_user_id: string;
        phone: string;
        city: string;
        province: string;
        address: string | null;
        role: string;
        staff_size: string;
        stock_band: string;
        help_areas: string[];
        website_status: string;
        website_url: string | null;
        social_platforms: string[];
        social_profiles: Json;
        created_at: string;
        updated_at: string;
      }>;
      dealership_locations: Table<{
        id: string;
        organization_id: string;
        name: string;
        city: string;
        province: string;
        address: string | null;
        is_default: boolean;
        created_at: string;
      }>;
      organization_memberships: Table<{
        organization_id: string;
        user_id: string;
        role: string;
        status: string;
        created_at: string;
      }>;
      onboarding_requests: Table<{
        id: string;
        organization_id: string;
        submitted_by_user_id: string;
        plan_code: string;
        billing_interval: string;
        setup_method: string;
        currency: string;
        subscription_amount_minor: number;
        annual_total_minor: number;
        annual_saving_minor: number;
        setup_fee_minor: number;
        setup_installments: number;
        setup_schedule_minor: number[];
        due_today_minor: number;
        tax_status: string;
        status: string;
        service_scope_snapshot: Json;
        created_at: string;
      }>;
      service_requests: Table<{
        id: string;
        organization_id: string;
        source_onboarding_request_id: string;
        service_code: string;
        status: string;
        details: Json;
        created_at: string;
      }>;
      appointment_requests: Table<{
        id: string;
        organization_id: string;
        source_onboarding_request_id: string;
        preferred_date: string;
        preferred_time: string;
        time_zone: string;
        meeting_format: string;
        contact_name: string;
        contact_phone: string;
        address: string | null;
        notes: string | null;
        status: string;
        created_at: string;
      }>;
      organization_invitations: Table<{
        id: string;
        organization_id: string;
        email: string;
        role: string;
        invited_by_user_id: string;
        status: string;
        expires_at: string;
        created_at: string;
      }>;
    };
    Views: Record<string, never>;
    Functions: {
      save_onboarding_terms: {
        Args: { p_terms_version: string; p_privacy_version: string };
        Returns: undefined;
      };
      submit_onboarding_request: {
        Args: { p_answers: Json };
        Returns: Json;
      };
      accept_organization_invitation: {
        Args: { p_token: string };
        Returns: string;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
