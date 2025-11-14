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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      common_items: {
        Row: {
          category: string
          created_at: string | null
          display_order: number
          food_name: string
          id: string
          image_url: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          display_order?: number
          food_name: string
          id?: string
          image_url?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          display_order?: number
          food_name?: string
          id?: string
          image_url?: string | null
        }
        Relationships: []
      }
      food_database: {
        Row: {
          calories: number
          carbs_g: number | null
          category: string
          created_at: string | null
          default_serving_size: number | null
          default_unit: string | null
          fat_g: number | null
          fiber_g: number | null
          id: string
          name: string
          protein_g: number | null
        }
        Insert: {
          calories: number
          carbs_g?: number | null
          category: string
          created_at?: string | null
          default_serving_size?: number | null
          default_unit?: string | null
          fat_g?: number | null
          fiber_g?: number | null
          id?: string
          name: string
          protein_g?: number | null
        }
        Update: {
          calories?: number
          carbs_g?: number | null
          category?: string
          created_at?: string | null
          default_serving_size?: number | null
          default_unit?: string | null
          fat_g?: number | null
          fiber_g?: number | null
          id?: string
          name?: string
          protein_g?: number | null
        }
        Relationships: []
      }
      grocery_list: {
        Row: {
          checked: boolean | null
          created_at: string | null
          id: string
          item_name: string
          quantity: number | null
          recipe_id: string | null
          source: string | null
          unit: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          checked?: boolean | null
          created_at?: string | null
          id?: string
          item_name: string
          quantity?: number | null
          recipe_id?: string | null
          source?: string | null
          unit?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          checked?: boolean | null
          created_at?: string | null
          id?: string
          item_name?: string
          quantity?: number | null
          recipe_id?: string | null
          source?: string | null
          unit?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      recipe_ingredients: {
        Row: {
          created_at: string | null
          food_id: string | null
          id: string
          quantity: number | null
          raw_text: string
          recipe_id: string
          unit: string | null
        }
        Insert: {
          created_at?: string | null
          food_id?: string | null
          id?: string
          quantity?: number | null
          raw_text: string
          recipe_id: string
          unit?: string | null
        }
        Update: {
          created_at?: string | null
          food_id?: string | null
          id?: string
          quantity?: number | null
          raw_text?: string
          recipe_id?: string
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recipe_ingredients_food_id_fkey"
            columns: ["food_id"]
            isOneToOne: false
            referencedRelation: "food_database"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_ingredients_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_ratings: {
        Row: {
          created_at: string | null
          id: string
          rating: number
          recipe_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          rating: number
          recipe_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          rating?: number
          recipe_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      recipe_tags: {
        Row: {
          created_at: string | null
          id: string
          recipe_id: string
          tag: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          recipe_id: string
          tag: string
        }
        Update: {
          created_at?: string | null
          id?: string
          recipe_id?: string
          tag?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipe_tags_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      recipes: {
        Row: {
          calories_per_serving: number | null
          cook_time_minutes: number | null
          created_at: string | null
          description: string | null
          difficulty: string | null
          id: string
          image_url: string | null
          prep_time_minutes: number | null
          servings: number | null
          source: string | null
          source_recipe_slug: string | null
          source_url: string | null
          steps: Json | null
          title: string
          total_time_minutes: number | null
          updated_at: string | null
        }
        Insert: {
          calories_per_serving?: number | null
          cook_time_minutes?: number | null
          created_at?: string | null
          description?: string | null
          difficulty?: string | null
          id?: string
          image_url?: string | null
          prep_time_minutes?: number | null
          servings?: number | null
          source?: string | null
          source_recipe_slug?: string | null
          source_url?: string | null
          steps?: Json | null
          title: string
          total_time_minutes?: number | null
          updated_at?: string | null
        }
        Update: {
          calories_per_serving?: number | null
          cook_time_minutes?: number | null
          created_at?: string | null
          description?: string | null
          difficulty?: string | null
          id?: string
          image_url?: string | null
          prep_time_minutes?: number | null
          servings?: number | null
          source?: string | null
          source_recipe_slug?: string | null
          source_url?: string | null
          steps?: Json | null
          title?: string
          total_time_minutes?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      saved_recipes: {
        Row: {
          created_at: string | null
          id: string
          recipe_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          recipe_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          recipe_id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_inventory: {
        Row: {
          calories: number | null
          carbs_g: number | null
          created_at: string | null
          custom_name: string | null
          expires_at: string | null
          fat_g: number | null
          fiber_g: number | null
          food_id: string | null
          id: string
          location: string
          protein_g: number | null
          quantity: number
          status: string | null
          unit: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          calories?: number | null
          carbs_g?: number | null
          created_at?: string | null
          custom_name?: string | null
          expires_at?: string | null
          fat_g?: number | null
          fiber_g?: number | null
          food_id?: string | null
          id?: string
          location: string
          protein_g?: number | null
          quantity: number
          status?: string | null
          unit: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          calories?: number | null
          carbs_g?: number | null
          created_at?: string | null
          custom_name?: string | null
          expires_at?: string | null
          fat_g?: number | null
          fiber_g?: number | null
          food_id?: string | null
          id?: string
          location?: string
          protein_g?: number | null
          quantity?: number
          status?: string | null
          unit?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_inventory_food_id_fkey"
            columns: ["food_id"]
            isOneToOne: false
            referencedRelation: "food_database"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          allergies: string[] | null
          carbs_goal_g: number | null
          cooking_time_preference: string | null
          created_at: string | null
          daily_calorie_goal: number | null
          dietary_restrictions: string[] | null
          fat_goal_g: number | null
          fiber_goal_g: number | null
          id: string
          onboarding_completed: boolean | null
          protein_goal_g: number | null
          updated_at: string | null
        }
        Insert: {
          allergies?: string[] | null
          carbs_goal_g?: number | null
          cooking_time_preference?: string | null
          created_at?: string | null
          daily_calorie_goal?: number | null
          dietary_restrictions?: string[] | null
          fat_goal_g?: number | null
          fiber_goal_g?: number | null
          id: string
          onboarding_completed?: boolean | null
          protein_goal_g?: number | null
          updated_at?: string | null
        }
        Update: {
          allergies?: string[] | null
          carbs_goal_g?: number | null
          cooking_time_preference?: string | null
          created_at?: string | null
          daily_calorie_goal?: number | null
          dietary_restrictions?: string[] | null
          fat_goal_g?: number | null
          fiber_goal_g?: number | null
          id?: string
          onboarding_completed?: boolean | null
          protein_goal_g?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
    },
  },
} as const
