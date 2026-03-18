export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type UserRole = 'free' | 'pro' | 'admin';
export type SubscriptionStatus = 'none' | 'trial' | 'active' | 'past_due' | 'canceled' | 'expired';
export type SubscriptionPlan = 'monthly' | 'yearly';
export type ThemePreference = 'light' | 'dark' | 'system';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          display_name: string | null;
          avatar_url: string | null;
          role: UserRole;
          subscription_status: SubscriptionStatus;
          subscription_plan: SubscriptionPlan | null;
          trial_started_at: string | null;
          trial_ends_at: string | null;
          payment_provider: string | null;
          payment_customer_id: string | null;
          notes_count: number;
          tags_count: number;
          storage_used_bytes: number;
          theme_preference: ThemePreference;
          font_pair: string;
          accent_color: string;
          onboarding_completed: boolean;
          last_active_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          display_name?: string | null;
          avatar_url?: string | null;
          role?: UserRole;
          subscription_status?: SubscriptionStatus;
          subscription_plan?: SubscriptionPlan | null;
          trial_started_at?: string | null;
          trial_ends_at?: string | null;
          payment_provider?: string | null;
          payment_customer_id?: string | null;
          notes_count?: number;
          tags_count?: number;
          storage_used_bytes?: number;
          theme_preference?: ThemePreference;
          font_pair?: string;
          accent_color?: string;
          onboarding_completed?: boolean;
          last_active_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
      notes: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          content: Json;
          content_text: string;
          word_count: number;
          reading_time_minutes: number;
          is_pinned: boolean;
          is_archived: boolean;
          is_deleted: boolean;
          deleted_at: string | null;
          last_edited_at: string;
          last_synced_at: string | null;
          local_version: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title?: string;
          content?: Json;
          content_text?: string;
          word_count?: number;
          reading_time_minutes?: number;
          is_pinned?: boolean;
          is_archived?: boolean;
          is_deleted?: boolean;
          deleted_at?: string | null;
          last_edited_at?: string;
          last_synced_at?: string | null;
          local_version?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['notes']['Insert']>;
      };
      tags: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          color: string;
          notes_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          color?: string;
          notes_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['tags']['Insert']>;
      };
      note_tags: {
        Row: {
          note_id: string;
          tag_id: string;
          created_at: string;
        };
        Insert: {
          note_id: string;
          tag_id: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['note_tags']['Insert']>;
      };
      images: {
        Row: {
          id: string;
          user_id: string;
          note_id: string | null;
          storage_path: string;
          public_url: string;
          filename: string;
          mime_type: string;
          size_bytes: number;
          width: number | null;
          height: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          note_id?: string | null;
          storage_path: string;
          public_url: string;
          filename: string;
          mime_type: string;
          size_bytes?: number;
          width?: number | null;
          height?: number | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['images']['Insert']>;
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          plan: SubscriptionPlan;
          status: Exclude<SubscriptionStatus, 'none'>;
          amount: number;
          currency: string;
          payment_provider: string;
          payment_external_id: string | null;
          payment_method: string | null;
          started_at: string;
          expires_at: string | null;
          canceled_at: string | null;
          cancel_reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          plan: SubscriptionPlan;
          status: Exclude<SubscriptionStatus, 'none'>;
          amount: number;
          currency?: string;
          payment_provider: string;
          payment_external_id?: string | null;
          payment_method?: string | null;
          started_at?: string;
          expires_at?: string | null;
          canceled_at?: string | null;
          cancel_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['subscriptions']['Insert']>;
      };
      payment_events: {
        Row: {
          id: string;
          subscription_id: string | null;
          user_id: string;
          provider: string;
          event_type: string;
          external_id: string | null;
          payload: Json;
          processed: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          subscription_id?: string | null;
          user_id: string;
          provider: string;
          event_type: string;
          external_id?: string | null;
          payload?: Json;
          processed?: boolean;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['payment_events']['Insert']>;
      };
      platform_config: {
        Row: {
          key: string;
          value: Json;
          description: string | null;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          key: string;
          value: Json;
          description?: string | null;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: Partial<Database['public']['Tables']['platform_config']['Insert']>;
      };
      admin_audit_log: {
        Row: {
          id: string;
          admin_id: string;
          action: string;
          target_user_id: string | null;
          details: Json;
          ip_address: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          admin_id: string;
          action: string;
          target_user_id?: string | null;
          details?: Json;
          ip_address?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['admin_audit_log']['Insert']>;
      };
      waitlist: {
        Row: {
          id: string;
          email: string;
          referral_source: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          referral_source?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['waitlist']['Insert']>;
      };
    };
    Functions: {
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
    };
  };
}
