export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      games: {
        Row: {
          id: string
          slug: string
          name: string
          created_at: string | null
        }
        Insert: {
          id?: string
          slug: string
          name: string
          created_at?: string | null
        }
        Update: {
          id?: string
          slug?: string
          name?: string
          created_at?: string | null
        }
        Relationships: []
      }
      patches: {
        Row: {
          id: string
          game_id: string
          version: string
          release_date: string | null
          title: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          game_id: string
          version: string
          release_date?: string | null
          title?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          game_id?: string
          version?: string
          release_date?: string | null
          title?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patches_game_id_fkey"
            columns: ["game_id"]
            referencedRelation: "games"
            referencedColumns: ["id"]
          }
        ]
      }
      patch_items: {
        Row: {
          id: string
          patch_id: string
          name: string
          category: string
          image_url: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          patch_id: string
          name: string
          category: string
          image_url?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          patch_id?: string
          name?: string
          category?: string
          image_url?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patch_items_patch_id_fkey"
            columns: ["patch_id"]
            referencedRelation: "patches"
            referencedColumns: ["id"]
          }
        ]
      }
      patch_changes: {
        Row: {
          id: string
          patch_item_id: string
          attribute: string | null
          change_type: "BUFF" | "NERF" | "ADJUST"
          before_value: string | null
          after_value: string | null
          description: string | null
          raw_description: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          patch_item_id: string
          attribute?: string | null
          change_type: "BUFF" | "NERF" | "ADJUST"
          before_value?: string | null
          after_value?: string | null
          description?: string | null
          raw_description?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          patch_item_id?: string
          attribute?: string | null
          change_type?: "BUFF" | "NERF" | "ADJUST"
          before_value?: string | null
          after_value?: string | null
          description?: string | null
          raw_description?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patch_changes_patch_item_id_fkey"
            columns: ["patch_item_id"]
            referencedRelation: "patch_items"
            referencedColumns: ["id"]
          }
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
      change_type: "BUFF" | "NERF" | "ADJUST"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
