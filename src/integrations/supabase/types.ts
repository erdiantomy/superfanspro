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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      credit_packages: {
        Row: {
          bonus_pct: number
          credits: number
          id: string
          is_active: boolean
          name: string
          price_idr: number
          sort_order: number
        }
        Insert: {
          bonus_pct?: number
          credits: number
          id?: string
          is_active?: boolean
          name: string
          price_idr: number
          sort_order?: number
        }
        Update: {
          bonus_pct?: number
          credits?: number
          id?: string
          is_active?: boolean
          name?: string
          price_idr?: number
          sort_order?: number
        }
        Relationships: []
      }
      matches: {
        Row: {
          created_at: string
          fans: number
          id: string
          player_a_avatar: string
          player_a_name: string
          player_a_sport: string
          player_a_tier: string
          player_a_win_rate: number
          player_b_avatar: string
          player_b_name: string
          player_b_sport: string
          player_b_tier: string
          player_b_win_rate: number
          pool: number
          score_a: number
          score_b: number
          starts_at: string | null
          status: Database["public"]["Enums"]["match_status"]
          support_a: number
          support_b: number
          title: string
          updated_at: string
          winner: string | null
        }
        Insert: {
          created_at?: string
          fans?: number
          id?: string
          player_a_avatar?: string
          player_a_name: string
          player_a_sport?: string
          player_a_tier?: string
          player_a_win_rate?: number
          player_b_avatar?: string
          player_b_name: string
          player_b_sport?: string
          player_b_tier?: string
          player_b_win_rate?: number
          pool?: number
          score_a?: number
          score_b?: number
          starts_at?: string | null
          status?: Database["public"]["Enums"]["match_status"]
          support_a?: number
          support_b?: number
          title: string
          updated_at?: string
          winner?: string | null
        }
        Update: {
          created_at?: string
          fans?: number
          id?: string
          player_a_avatar?: string
          player_a_name?: string
          player_a_sport?: string
          player_a_tier?: string
          player_a_win_rate?: number
          player_b_avatar?: string
          player_b_name?: string
          player_b_sport?: string
          player_b_tier?: string
          player_b_win_rate?: number
          pool?: number
          score_a?: number
          score_b?: number
          starts_at?: string | null
          status?: Database["public"]["Enums"]["match_status"]
          support_a?: number
          support_b?: number
          title?: string
          updated_at?: string
          winner?: string | null
        }
        Relationships: []
      }
      padel_players: {
        Row: {
          avatar: string
          created_at: string
          credits: number
          division: string
          id: string
          lifetime_xp: number
          matches_played: number
          matches_won: number
          monthly_pts: number
          name: string
          streak: number
          user_id: string
        }
        Insert: {
          avatar?: string
          created_at?: string
          credits?: number
          division?: string
          id?: string
          lifetime_xp?: number
          matches_played?: number
          matches_won?: number
          monthly_pts?: number
          name?: string
          streak?: number
          user_id: string
        }
        Update: {
          avatar?: string
          created_at?: string
          credits?: number
          division?: string
          id?: string
          lifetime_xp?: number
          matches_played?: number
          matches_won?: number
          monthly_pts?: number
          name?: string
          streak?: number
          user_id?: string
        }
        Relationships: []
      }
      payment_orders: {
        Row: {
          created_at: string
          credits_amount: number
          expired_at: string | null
          id: string
          package_id: string | null
          paid_at: string | null
          payment_channel: string | null
          player_id: string
          price_idr: number
          status: string
          xendit_invoice_id: string | null
          xendit_invoice_url: string | null
        }
        Insert: {
          created_at?: string
          credits_amount?: number
          expired_at?: string | null
          id?: string
          package_id?: string | null
          paid_at?: string | null
          payment_channel?: string | null
          player_id: string
          price_idr?: number
          status?: string
          xendit_invoice_id?: string | null
          xendit_invoice_url?: string | null
        }
        Update: {
          created_at?: string
          credits_amount?: number
          expired_at?: string | null
          id?: string
          package_id?: string | null
          paid_at?: string | null
          payment_channel?: string | null
          player_id?: string
          price_idr?: number
          status?: string
          xendit_invoice_id?: string | null
          xendit_invoice_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_orders_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "credit_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string
          id: string
          points: number
          rank: number | null
          updated_at: string
          user_id: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          id?: string
          points?: number
          rank?: number | null
          updated_at?: string
          user_id: string
          username?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          id?: string
          points?: number
          rank?: number | null
          updated_at?: string
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      supports: {
        Row: {
          amount: number
          created_at: string
          id: string
          match_id: string
          player: string
          points_earned: number
          user_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          id?: string
          match_id: string
          player: string
          points_earned?: number
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          match_id?: string
          player?: string
          points_earned?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "supports_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
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
      venue_registrations: {
        Row: {
          admin_password_hash: string | null
          city: string
          contact_email: string
          contact_name: string
          contact_phone: string
          country: string
          courts: number
          created_at: string
          id: string
          logo_url: string | null
          monthly_prize: number | null
          primary_color: string | null
          prize_split_1st: number | null
          prize_split_2nd: number | null
          prize_split_3rd: number | null
          slug: string
          status: string
          venue_name: string
        }
        Insert: {
          admin_password_hash?: string | null
          city: string
          contact_email: string
          contact_name: string
          contact_phone: string
          country?: string
          courts?: number
          created_at?: string
          id?: string
          logo_url?: string | null
          monthly_prize?: number | null
          primary_color?: string | null
          prize_split_1st?: number | null
          prize_split_2nd?: number | null
          prize_split_3rd?: number | null
          slug: string
          status?: string
          venue_name: string
        }
        Update: {
          admin_password_hash?: string | null
          city?: string
          contact_email?: string
          contact_name?: string
          contact_phone?: string
          country?: string
          courts?: number
          created_at?: string
          id?: string
          logo_url?: string | null
          monthly_prize?: number | null
          primary_color?: string | null
          prize_split_1st?: number | null
          prize_split_2nd?: number | null
          prize_split_3rd?: number | null
          slug?: string
          status?: string
          venue_name?: string
        }
        Relationships: []
      }
      venues: {
        Row: {
          admin_password_hash: string | null
          city: string | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          country: string | null
          courts_default: number | null
          created_at: string
          id: string
          logo_url: string | null
          monthly_prize: number | null
          name: string
          primary_color: string | null
          prize_split_1st: number | null
          prize_split_2nd: number | null
          prize_split_3rd: number | null
          slug: string
          status: string
        }
        Insert: {
          admin_password_hash?: string | null
          city?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          country?: string | null
          courts_default?: number | null
          created_at?: string
          id?: string
          logo_url?: string | null
          monthly_prize?: number | null
          name: string
          primary_color?: string | null
          prize_split_1st?: number | null
          prize_split_2nd?: number | null
          prize_split_3rd?: number | null
          slug: string
          status?: string
        }
        Update: {
          admin_password_hash?: string | null
          city?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          country?: string | null
          courts_default?: number | null
          created_at?: string
          id?: string
          logo_url?: string | null
          monthly_prize?: number | null
          name?: string
          primary_color?: string | null
          prize_split_1st?: number | null
          prize_split_2nd?: number | null
          prize_split_3rd?: number | null
          slug?: string
          status?: string
        }
        Relationships: []
      }
      wallet_transactions: {
        Row: {
          created_at: string
          description: string
          id: string
          idr_amount: number
          payment_order_id: string | null
          sp_amount: number
          type: Database["public"]["Enums"]["tx_type"]
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string
          id?: string
          idr_amount?: number
          payment_order_id?: string | null
          sp_amount?: number
          type: Database["public"]["Enums"]["tx_type"]
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          idr_amount?: number
          payment_order_id?: string | null
          sp_amount?: number
          type?: Database["public"]["Enums"]["tx_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_transactions_payment_order_id_fkey"
            columns: ["payment_order_id"]
            isOneToOne: false
            referencedRelation: "payment_orders"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      leaderboard: {
        Row: {
          avatar_url: string | null
          points: number | null
          rank: number | null
          total_supports: number | null
          user_id: string | null
          username: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      verify_venue_password: {
        Args: { plain_password: string; venue_slug: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      match_status: "live" | "upcoming" | "finished"
      tx_type: "support" | "reward" | "topup" | "redeem" | "bonus"
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
      app_role: ["admin", "moderator", "user"],
      match_status: ["live", "upcoming", "finished"],
      tx_type: ["support", "reward", "topup", "redeem", "bonus"],
    },
  },
} as const
