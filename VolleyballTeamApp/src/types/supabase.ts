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
      users: {
        Row: {
          id: string
          email: string
          first_name: string
          last_name: string
          role: string
          team_id: string | null
          jersey_number: number | null
          position: string | null
          created_at: string
          updated_at: string
          fcm_token: string | null
        }
        Insert: {
          id?: string
          email: string
          first_name: string
          last_name: string
          role: string
          team_id?: string | null
          jersey_number?: number | null
          position?: string | null
          created_at?: string
          updated_at?: string
          fcm_token?: string | null
        }
        Update: {
          id?: string
          email?: string
          first_name?: string
          last_name?: string
          role?: string
          team_id?: string | null
          jersey_number?: number | null
          position?: string | null
          created_at?: string
          updated_at?: string
          fcm_token?: string | null
        }
      }
      teams: {
        Row: {
          id: string
          name: string
          description: string | null
          team_photo_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          team_photo_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          team_photo_url?: string | null
          created_at?: string
          updated_at?: string
        }
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
  }
}
