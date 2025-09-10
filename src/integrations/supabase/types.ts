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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          subscription_plan: string | null
          subscription_status: string | null
          token_balance: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          subscription_plan?: string | null
          subscription_status?: string | null
          token_balance?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          subscription_plan?: string | null
          subscription_status?: string | null
          token_balance?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      style_analysis_logs: {
        Row: {
          confidence: number
          created_at: string
          custom_prompt: string | null
          detected_style: Json
          id: string
          image_format: string
          raw_response: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          confidence?: number
          created_at?: string
          custom_prompt?: string | null
          detected_style: Json
          id?: string
          image_format: string
          raw_response?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          confidence?: number
          created_at?: string
          custom_prompt?: string | null
          detected_style?: Json
          id?: string
          image_format?: string
          raw_response?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          polar_customer_id: string | null
          subscribed: boolean
          subscription_end: string | null
          subscription_tier: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          polar_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          polar_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          billing_cycle: string | null
          created_at: string
          id: string
          plan_id: string
          plan_name: string
          price_monthly: number | null
          price_yearly: number | null
          status: string | null
          tokens_included: number
          updated_at: string
          user_id: string
        }
        Insert: {
          billing_cycle?: string | null
          created_at?: string
          id?: string
          plan_id: string
          plan_name: string
          price_monthly?: number | null
          price_yearly?: number | null
          status?: string | null
          tokens_included: number
          updated_at?: string
          user_id: string
        }
        Update: {
          billing_cycle?: string | null
          created_at?: string
          id?: string
          plan_id?: string
          plan_name?: string
          price_monthly?: number | null
          price_yearly?: number | null
          status?: string | null
          tokens_included?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      subtitle_presets: {
        Row: {
          active_word_highlight: boolean
          animation_delay: number | null
          animation_duration: number | null
          animation_type: Database["public"]["Enums"]["animation_type"]
          background_color: string | null
          background_opacity: number | null
          border_radius: number | null
          created_at: string | null
          custom_x: number | null
          custom_y: number | null
          deleted_at: string | null
          description: string | null
          font_family: string
          font_size: number
          font_weight: string
          has_background: boolean
          highlight_color: string | null
          horizontal_ratio_offset: number | null
          id: string
          is_default: boolean
          is_public: boolean
          line_spacing: number | null
          max_width: number | null
          name: string
          position: Database["public"]["Enums"]["subtitle_position"]
          primary_color: string
          ratio_adaptive: boolean
          secondary_color: string | null
          style_type: Database["public"]["Enums"]["subtitle_style_type"]
          text_shadow: boolean
          updated_at: string | null
          usage_count: number
          user_id: string
          vertical_ratio_offset: number | null
          word_emphasis: boolean
        }
        Insert: {
          active_word_highlight?: boolean
          animation_delay?: number | null
          animation_duration?: number | null
          animation_type?: Database["public"]["Enums"]["animation_type"]
          background_color?: string | null
          background_opacity?: number | null
          border_radius?: number | null
          created_at?: string | null
          custom_x?: number | null
          custom_y?: number | null
          deleted_at?: string | null
          description?: string | null
          font_family?: string
          font_size?: number
          font_weight?: string
          has_background?: boolean
          highlight_color?: string | null
          horizontal_ratio_offset?: number | null
          id?: string
          is_default?: boolean
          is_public?: boolean
          line_spacing?: number | null
          max_width?: number | null
          name: string
          position?: Database["public"]["Enums"]["subtitle_position"]
          primary_color?: string
          ratio_adaptive?: boolean
          secondary_color?: string | null
          style_type?: Database["public"]["Enums"]["subtitle_style_type"]
          text_shadow?: boolean
          updated_at?: string | null
          usage_count?: number
          user_id: string
          vertical_ratio_offset?: number | null
          word_emphasis?: boolean
        }
        Update: {
          active_word_highlight?: boolean
          animation_delay?: number | null
          animation_duration?: number | null
          animation_type?: Database["public"]["Enums"]["animation_type"]
          background_color?: string | null
          background_opacity?: number | null
          border_radius?: number | null
          created_at?: string | null
          custom_x?: number | null
          custom_y?: number | null
          deleted_at?: string | null
          description?: string | null
          font_family?: string
          font_size?: number
          font_weight?: string
          has_background?: boolean
          highlight_color?: string | null
          horizontal_ratio_offset?: number | null
          id?: string
          is_default?: boolean
          is_public?: boolean
          line_spacing?: number | null
          max_width?: number | null
          name?: string
          position?: Database["public"]["Enums"]["subtitle_position"]
          primary_color?: string
          ratio_adaptive?: boolean
          secondary_color?: string | null
          style_type?: Database["public"]["Enums"]["subtitle_style_type"]
          text_shadow?: boolean
          updated_at?: string | null
          usage_count?: number
          user_id?: string
          vertical_ratio_offset?: number | null
          word_emphasis?: boolean
        }
        Relationships: []
      }
      subtitle_styles: {
        Row: {
          active_word_highlight: boolean
          animation_delay: number | null
          animation_duration: number | null
          animation_type: Database["public"]["Enums"]["animation_type"]
          background_color: string | null
          background_opacity: number | null
          border_radius: number | null
          created_at: string | null
          custom_x: number | null
          custom_y: number | null
          font_family: string
          font_size: number
          font_weight: string
          has_background: boolean
          highlight_color: string | null
          horizontal_ratio_offset: number | null
          id: string
          line_spacing: number | null
          max_width: number | null
          position: Database["public"]["Enums"]["subtitle_position"]
          preset_id: string | null
          preset_name: string | null
          primary_color: string
          ratio_adaptive: boolean
          secondary_color: string | null
          style_type: Database["public"]["Enums"]["subtitle_style_type"]
          text_shadow: boolean
          updated_at: string | null
          user_id: string
          vertical_ratio_offset: number | null
          video_aspect_ratio:
            | Database["public"]["Enums"]["video_aspect_ratio"]
            | null
          video_job_id: string
          word_emphasis: boolean
        }
        Insert: {
          active_word_highlight?: boolean
          animation_delay?: number | null
          animation_duration?: number | null
          animation_type?: Database["public"]["Enums"]["animation_type"]
          background_color?: string | null
          background_opacity?: number | null
          border_radius?: number | null
          created_at?: string | null
          custom_x?: number | null
          custom_y?: number | null
          font_family?: string
          font_size?: number
          font_weight?: string
          has_background?: boolean
          highlight_color?: string | null
          horizontal_ratio_offset?: number | null
          id?: string
          line_spacing?: number | null
          max_width?: number | null
          position?: Database["public"]["Enums"]["subtitle_position"]
          preset_id?: string | null
          preset_name?: string | null
          primary_color?: string
          ratio_adaptive?: boolean
          secondary_color?: string | null
          style_type?: Database["public"]["Enums"]["subtitle_style_type"]
          text_shadow?: boolean
          updated_at?: string | null
          user_id: string
          vertical_ratio_offset?: number | null
          video_aspect_ratio?:
            | Database["public"]["Enums"]["video_aspect_ratio"]
            | null
          video_job_id: string
          word_emphasis?: boolean
        }
        Update: {
          active_word_highlight?: boolean
          animation_delay?: number | null
          animation_duration?: number | null
          animation_type?: Database["public"]["Enums"]["animation_type"]
          background_color?: string | null
          background_opacity?: number | null
          border_radius?: number | null
          created_at?: string | null
          custom_x?: number | null
          custom_y?: number | null
          font_family?: string
          font_size?: number
          font_weight?: string
          has_background?: boolean
          highlight_color?: string | null
          horizontal_ratio_offset?: number | null
          id?: string
          line_spacing?: number | null
          max_width?: number | null
          position?: Database["public"]["Enums"]["subtitle_position"]
          preset_id?: string | null
          preset_name?: string | null
          primary_color?: string
          ratio_adaptive?: boolean
          secondary_color?: string | null
          style_type?: Database["public"]["Enums"]["subtitle_style_type"]
          text_shadow?: boolean
          updated_at?: string | null
          user_id?: string
          vertical_ratio_offset?: number | null
          video_aspect_ratio?:
            | Database["public"]["Enums"]["video_aspect_ratio"]
            | null
          video_job_id?: string
          word_emphasis?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "subtitle_styles_preset_id_fkey"
            columns: ["preset_id"]
            isOneToOne: false
            referencedRelation: "subtitle_presets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subtitle_styles_video_job_id_fkey"
            columns: ["video_job_id"]
            isOneToOne: true
            referencedRelation: "video_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      token_transactions: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          transaction_type: string
          user_id: string
          video_job_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          transaction_type: string
          user_id: string
          video_job_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          transaction_type?: string
          user_id?: string
          video_job_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "token_transactions_video_job_id_fkey"
            columns: ["video_job_id"]
            isOneToOne: false
            referencedRelation: "video_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      video_jobs: {
        Row: {
          created_at: string
          error_message: string | null
          file_size_mb: number | null
          id: string
          input_file_path: string | null
          original_filename: string
          output_file_path: string | null
          processing_type: string
          progress_percentage: number | null
          status: string | null
          subtitle_file_path: string | null
          target_language: string | null
          tokens_used: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          file_size_mb?: number | null
          id?: string
          input_file_path?: string | null
          original_filename: string
          output_file_path?: string | null
          processing_type: string
          progress_percentage?: number | null
          status?: string | null
          subtitle_file_path?: string | null
          target_language?: string | null
          tokens_used?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          file_size_mb?: number | null
          id?: string
          input_file_path?: string | null
          original_filename?: string
          output_file_path?: string | null
          processing_type?: string
          progress_percentage?: number | null
          status?: string | null
          subtitle_file_path?: string | null
          target_language?: string | null
          tokens_used?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      video_subtitles: {
        Row: {
          confidence: number | null
          created_at: string | null
          duration: number | null
          end_time: number
          id: string
          manual_edit: boolean
          speaker_id: string | null
          start_time: number
          style_override: Json | null
          text: string
          updated_at: string | null
          verified: boolean
          video_job_id: string
          words: Json | null
        }
        Insert: {
          confidence?: number | null
          created_at?: string | null
          duration?: number | null
          end_time: number
          id?: string
          manual_edit?: boolean
          speaker_id?: string | null
          start_time: number
          style_override?: Json | null
          text: string
          updated_at?: string | null
          verified?: boolean
          video_job_id: string
          words?: Json | null
        }
        Update: {
          confidence?: number | null
          created_at?: string | null
          duration?: number | null
          end_time?: number
          id?: string
          manual_edit?: boolean
          speaker_id?: string | null
          start_time?: number
          style_override?: Json | null
          text?: string
          updated_at?: string | null
          verified?: boolean
          video_job_id?: string
          words?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "video_subtitles_video_job_id_fkey"
            columns: ["video_job_id"]
            isOneToOne: false
            referencedRelation: "video_jobs"
            referencedColumns: ["id"]
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
      animation_type:
        | "none"
        | "fade"
        | "slide"
        | "pop"
        | "typewriter"
        | "bounce"
      job_status:
        | "pending"
        | "processing"
        | "completed"
        | "failed"
        | "cancelled"
      subtitle_position: "top" | "middle" | "bottom" | "custom"
      subtitle_style_type: "classy" | "normal"
      video_aspect_ratio: "16:9" | "9:16" | "4:3" | "1:1" | "custom"
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
      animation_type: ["none", "fade", "slide", "pop", "typewriter", "bounce"],
      job_status: ["pending", "processing", "completed", "failed", "cancelled"],
      subtitle_position: ["top", "middle", "bottom", "custom"],
      subtitle_style_type: ["classy", "normal"],
      video_aspect_ratio: ["16:9", "9:16", "4:3", "1:1", "custom"],
    },
  },
} as const
