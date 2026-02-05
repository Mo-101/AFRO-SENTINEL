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
      disease_lexicon: {
        Row: {
          case_fatality_rate: number | null
          category: Database["public"]["Enums"]["disease_category"]
          created_at: string
          disease_name: string
          endemic_regions: string[] | null
          id: string
          incubation_days_max: number | null
          incubation_days_min: number | null
          keywords_am: string[] | null
          keywords_ar: string[] | null
          keywords_en: string[] | null
          keywords_fr: string[] | null
          keywords_ha: string[] | null
          keywords_pt: string[] | null
          keywords_sw: string[] | null
          keywords_yo: string[] | null
          seasonal_peak_months: number[] | null
          symptoms_cluster: string[] | null
          transmission_routes: string[] | null
          updated_at: string
        }
        Insert: {
          case_fatality_rate?: number | null
          category?: Database["public"]["Enums"]["disease_category"]
          created_at?: string
          disease_name: string
          endemic_regions?: string[] | null
          id?: string
          incubation_days_max?: number | null
          incubation_days_min?: number | null
          keywords_am?: string[] | null
          keywords_ar?: string[] | null
          keywords_en?: string[] | null
          keywords_fr?: string[] | null
          keywords_ha?: string[] | null
          keywords_pt?: string[] | null
          keywords_sw?: string[] | null
          keywords_yo?: string[] | null
          seasonal_peak_months?: number[] | null
          symptoms_cluster?: string[] | null
          transmission_routes?: string[] | null
          updated_at?: string
        }
        Update: {
          case_fatality_rate?: number | null
          category?: Database["public"]["Enums"]["disease_category"]
          created_at?: string
          disease_name?: string
          endemic_regions?: string[] | null
          id?: string
          incubation_days_max?: number | null
          incubation_days_min?: number | null
          keywords_am?: string[] | null
          keywords_ar?: string[] | null
          keywords_en?: string[] | null
          keywords_fr?: string[] | null
          keywords_ha?: string[] | null
          keywords_pt?: string[] | null
          keywords_sw?: string[] | null
          keywords_yo?: string[] | null
          seasonal_peak_months?: number[] | null
          symptoms_cluster?: string[] | null
          transmission_routes?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          organization: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          organization?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          organization?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      signals: {
        Row: {
          affected_population: string | null
          analyst_notes: string | null
          confidence_score: number
          corroborating_signals: string[] | null
          created_at: string
          cross_border_risk: boolean | null
          disease_category:
            | Database["public"]["Enums"]["disease_category"]
            | null
          disease_name: string | null
          id: string
          ingestion_source: string | null
          lingua_fidelity_score: number | null
          location_admin1: string | null
          location_admin2: string | null
          location_country: string
          location_country_iso: string | null
          location_lat: number | null
          location_lng: number | null
          location_locality: string | null
          original_language: string | null
          original_script: string | null
          original_text: string
          priority: Database["public"]["Enums"]["signal_priority"]
          raw_payload: Json | null
          reported_cases: number | null
          reported_deaths: number | null
          seasonal_pattern_match: boolean | null
          signal_type: string
          source_id: string | null
          source_name: string
          source_tier: Database["public"]["Enums"]["source_tier"]
          source_timestamp: string | null
          source_type: string | null
          source_url: string | null
          status: Database["public"]["Enums"]["signal_status"]
          translated_text: string | null
          translation_confidence: number | null
          triaged_at: string | null
          triaged_by: string | null
          updated_at: string
          validated_at: string | null
          validated_by: string | null
        }
        Insert: {
          affected_population?: string | null
          analyst_notes?: string | null
          confidence_score?: number
          corroborating_signals?: string[] | null
          created_at?: string
          cross_border_risk?: boolean | null
          disease_category?:
            | Database["public"]["Enums"]["disease_category"]
            | null
          disease_name?: string | null
          id?: string
          ingestion_source?: string | null
          lingua_fidelity_score?: number | null
          location_admin1?: string | null
          location_admin2?: string | null
          location_country: string
          location_country_iso?: string | null
          location_lat?: number | null
          location_lng?: number | null
          location_locality?: string | null
          original_language?: string | null
          original_script?: string | null
          original_text: string
          priority?: Database["public"]["Enums"]["signal_priority"]
          raw_payload?: Json | null
          reported_cases?: number | null
          reported_deaths?: number | null
          seasonal_pattern_match?: boolean | null
          signal_type?: string
          source_id?: string | null
          source_name: string
          source_tier?: Database["public"]["Enums"]["source_tier"]
          source_timestamp?: string | null
          source_type?: string | null
          source_url?: string | null
          status?: Database["public"]["Enums"]["signal_status"]
          translated_text?: string | null
          translation_confidence?: number | null
          triaged_at?: string | null
          triaged_by?: string | null
          updated_at?: string
          validated_at?: string | null
          validated_by?: string | null
        }
        Update: {
          affected_population?: string | null
          analyst_notes?: string | null
          confidence_score?: number
          corroborating_signals?: string[] | null
          created_at?: string
          cross_border_risk?: boolean | null
          disease_category?:
            | Database["public"]["Enums"]["disease_category"]
            | null
          disease_name?: string | null
          id?: string
          ingestion_source?: string | null
          lingua_fidelity_score?: number | null
          location_admin1?: string | null
          location_admin2?: string | null
          location_country?: string
          location_country_iso?: string | null
          location_lat?: number | null
          location_lng?: number | null
          location_locality?: string | null
          original_language?: string | null
          original_script?: string | null
          original_text?: string
          priority?: Database["public"]["Enums"]["signal_priority"]
          raw_payload?: Json | null
          reported_cases?: number | null
          reported_deaths?: number | null
          seasonal_pattern_match?: boolean | null
          signal_type?: string
          source_id?: string | null
          source_name?: string
          source_tier?: Database["public"]["Enums"]["source_tier"]
          source_timestamp?: string | null
          source_type?: string | null
          source_url?: string | null
          status?: Database["public"]["Enums"]["signal_status"]
          translated_text?: string | null
          translation_confidence?: number | null
          triaged_at?: string | null
          triaged_by?: string | null
          updated_at?: string
          validated_at?: string | null
          validated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "signals_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "source_credibility"
            referencedColumns: ["id"]
          },
        ]
      }
      source_credibility: {
        Row: {
          created_at: string
          credibility_score: number
          false_positive_count: number
          id: string
          last_signal_at: string | null
          notes: string | null
          source_name: string
          source_type: string
          source_url: string | null
          tier: Database["public"]["Enums"]["source_tier"]
          total_signals: number
          updated_at: string
          validated_signals: number
        }
        Insert: {
          created_at?: string
          credibility_score?: number
          false_positive_count?: number
          id?: string
          last_signal_at?: string | null
          notes?: string | null
          source_name: string
          source_type: string
          source_url?: string | null
          tier?: Database["public"]["Enums"]["source_tier"]
          total_signals?: number
          updated_at?: string
          validated_signals?: number
        }
        Update: {
          created_at?: string
          credibility_score?: number
          false_positive_count?: number
          id?: string
          last_signal_at?: string | null
          notes?: string | null
          source_name?: string
          source_type?: string
          source_url?: string | null
          tier?: Database["public"]["Enums"]["source_tier"]
          total_signals?: number
          updated_at?: string
          validated_signals?: number
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_signal_24h_trend: {
        Args: never
        Returns: {
          current_count: number
          previous_count: number
          trend_percent: number
        }[]
      }
      get_signal_priority_counts: {
        Args: never
        Returns: {
          count: number
          priority: string
        }[]
      }
      get_signal_status_counts: {
        Args: never
        Returns: {
          count: number
          status: string
        }[]
      }
      get_signal_total_count: { Args: never; Returns: number }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "analyst" | "viewer"
      disease_category:
        | "vhf"
        | "respiratory"
        | "enteric"
        | "vector_borne"
        | "zoonotic"
        | "vaccine_preventable"
        | "environmental"
        | "unknown"
      signal_priority: "P1" | "P2" | "P3" | "P4"
      signal_status: "new" | "triaged" | "validated" | "dismissed"
      source_tier: "tier_1" | "tier_2" | "tier_3"
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
      app_role: ["admin", "analyst", "viewer"],
      disease_category: [
        "vhf",
        "respiratory",
        "enteric",
        "vector_borne",
        "zoonotic",
        "vaccine_preventable",
        "environmental",
        "unknown",
      ],
      signal_priority: ["P1", "P2", "P3", "P4"],
      signal_status: ["new", "triaged", "validated", "dismissed"],
      source_tier: ["tier_1", "tier_2", "tier_3"],
    },
  },
} as const
