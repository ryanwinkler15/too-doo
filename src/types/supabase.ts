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
      notes: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          title: string
          description: string
          user_id: string
          label_id: string | null
          due_date: string | null
          is_completed: boolean
          completed_at: string | null
          is_priority: boolean
          is_list: boolean
          position: number | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          title: string
          description: string
          user_id: string
          label_id?: string | null
          due_date?: string | null
          is_completed?: boolean
          completed_at?: string | null
          is_priority?: boolean
          is_list?: boolean
          position?: number | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          title?: string
          description?: string
          user_id?: string
          label_id?: string | null
          due_date?: string | null
          is_completed?: boolean
          completed_at?: string | null
          is_priority?: boolean
          is_list?: boolean
          position?: number | null
        }
      }
      labels: {
        Row: {
          id: string
          created_at: string
          name: string
          color: string
          user_id: string
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
          color: string
          user_id: string
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
          color?: string
          user_id?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_active_task_counts_by_label: {
        Args: {
          user_id_param: string
        }
        Returns: {
          label_id: string
          count: number
        }[]
      }
      get_all_task_counts_by_label: {
        Args: {
          user_id_param: string
        }
        Returns: {
          label_id: string
          count: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
} 