export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      admin_pin: {
        Row: {
          id: number
          pin_hash: string
          updated_at: string
        }
        Insert: {
          id?: number
          pin_hash: string
          updated_at?: string
        }
        Update: {
          id?: number
          pin_hash?: string
          updated_at?: string
        }
        Relationships: []
      }
      admin_users: {
        Row: {
          email: string
        }
        Insert: {
          email: string
        }
        Update: {
          email?: string
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          action: string
          actor: string
          id: number
          payload: Json
          ts: string
        }
        Insert: {
          action: string
          actor: string
          id?: number
          payload?: Json
          ts?: string
        }
        Update: {
          action?: string
          actor?: string
          id?: number
          payload?: Json
          ts?: string
        }
        Relationships: []
      }
      completions: {
        Row: {
          completed_at: string
          coupon_redeemed_at: string | null
          day_number: number
          notes: string | null
          photo_storage_path: string | null
        }
        Insert: {
          completed_at?: string
          coupon_redeemed_at?: string | null
          day_number: number
          notes?: string | null
          photo_storage_path?: string | null
        }
        Update: {
          completed_at?: string
          coupon_redeemed_at?: string | null
          day_number?: number
          notes?: string | null
          photo_storage_path?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "completions_day_number_fkey"
            columns: ["day_number"]
            isOneToOne: true
            referencedRelation: "days"
            referencedColumns: ["day_number"]
          },
        ]
      }
      days: {
        Row: {
          activity_answer: string | null
          activity_body: string
          activity_title: string
          activity_type: string
          coupon_text: string
          date: string
          day_number: number
          expected_minutes: number
          media_config: Json
          media_youtube_id: string | null
          media_type: string
          points: number
          unlock_at: string
        }
        Insert: {
          activity_answer?: string | null
          activity_body: string
          activity_title: string
          activity_type: string
          coupon_text: string
          date: string
          day_number: number
          expected_minutes?: number
          media_config?: Json
          media_youtube_id?: string | null
          media_type: string
          points?: number
          unlock_at: string
        }
        Update: {
          activity_answer?: string | null
          activity_body?: string
          activity_title?: string
          activity_type?: string
          coupon_text?: string
          date?: string
          day_number?: number
          expected_minutes?: number
          media_config?: Json
          media_youtube_id?: string | null
          media_type?: string
          points?: number
          unlock_at?: string
        }
        Relationships: []
      }
      household_pin: {
        Row: {
          id: number
          pin_hash: string
          updated_at: string
        }
        Insert: {
          id?: number
          pin_hash: string
          updated_at?: string
        }
        Update: {
          id?: number
          pin_hash?: string
          updated_at?: string
        }
        Relationships: []
      }
      kid_tile_completions: {
        Row: {
          completed_at: string
          day_number: number
        }
        Insert: {
          completed_at?: string
          day_number: number
        }
        Update: {
          completed_at?: string
          day_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "kid_tile_completions_day_number_fkey"
            columns: ["day_number"]
            isOneToOne: true
            referencedRelation: "days"
            referencedColumns: ["day_number"]
          },
        ]
      }
      login_attempts: {
        Row: {
          blocked_until: string | null
          failed_count: number
          ip: string
        }
        Insert: {
          blocked_until?: string | null
          failed_count?: number
          ip: string
        }
        Update: {
          blocked_until?: string | null
          failed_count?: number
          ip?: string
        }
        Relationships: []
      }
      sticker_completions: {
        Row: {
          collected_at: string
          day_number: number
        }
        Insert: {
          collected_at?: string
          day_number: number
        }
        Update: {
          collected_at?: string
          day_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "sticker_completions_day_number_fkey"
            columns: ["day_number"]
            isOneToOne: true
            referencedRelation: "days"
            referencedColumns: ["day_number"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

