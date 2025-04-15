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
      user_profiles: {
        Row: {
          id: string
          username: string
          display_name: string
          profile_image: string | null
          status: string
          last_seen: string
          is_online: boolean
          created_at: string
        }
        Insert: {
          id: string
          username: string
          display_name: string
          profile_image?: string | null
          status?: string
          last_seen?: string
          is_online?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          username?: string
          display_name?: string
          profile_image?: string | null
          status?: string
          last_seen?: string
          is_online?: boolean
          created_at?: string
        }
      }
      chats: {
        Row: {
          id: number
          name: string | null
          is_group: boolean
          created_at: string
          created_by: string
          image: string | null
        }
        Insert: {
          id?: number
          name?: string | null
          is_group?: boolean
          created_at?: string
          created_by: string
          image?: string | null
        }
        Update: {
          id?: number
          name?: string | null
          is_group?: boolean
          created_at?: string
          created_by?: string
          image?: string | null
        }
      }
      chat_members: {
        Row: {
          id: number
          chat_id: number
          user_id: string
          joined_at: string
          is_admin: boolean
        }
        Insert: {
          id?: number
          chat_id: number
          user_id: string
          joined_at?: string
          is_admin?: boolean
        }
        Update: {
          id?: number
          chat_id?: number
          user_id?: string
          joined_at?: string
          is_admin?: boolean
        }
      }
      messages: {
        Row: {
          id: number
          chat_id: number
          sender_id: string
          content: string | null
          media_url: string | null
          sent_at: string
          reply_to_id: number | null
          reactions: Json
          is_read: boolean
          is_delivered: boolean
        }
        Insert: {
          id?: number
          chat_id: number
          sender_id: string
          content?: string | null
          media_url?: string | null
          sent_at?: string
          reply_to_id?: number | null
          reactions?: Json
          is_read?: boolean
          is_delivered?: boolean
        }
        Update: {
          id?: number
          chat_id?: number
          sender_id?: string
          content?: string | null
          media_url?: string | null
          sent_at?: string
          reply_to_id?: number | null
          reactions?: Json
          is_read?: boolean
          is_delivered?: boolean
        }
      }
      message_reactions: {
        Row: {
          id: number
          message_id: number
          user_id: string
          reaction: string
          created_at: string
        }
        Insert: {
          id?: number
          message_id: number
          user_id: string
          reaction: string
          created_at?: string
        }
        Update: {
          id?: number
          message_id?: number
          user_id?: string
          reaction?: string
          created_at?: string
        }
      }
      file_uploads: {
        Row: {
          id: number
          user_id: string
          filename: string
          file_path: string
          file_type: string
          file_size: number
          content_type: string
          is_public: boolean
          created_at: string
        }
        Insert: {
          id?: number
          user_id: string
          filename: string
          file_path: string
          file_type: string
          file_size: number
          content_type: string
          is_public?: boolean
          created_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          filename?: string
          file_path?: string
          file_type?: string
          file_size?: number
          content_type?: string
          is_public?: boolean
          created_at?: string
        }
      }
      message_read_status: {
        Row: {
          id: number
          message_id: number
          user_id: string
          read_at: string
        }
        Insert: {
          id?: number
          message_id: number
          user_id: string
          read_at?: string
        }
        Update: {
          id?: number
          message_id?: number
          user_id?: string
          read_at?: string
        }
      }
      typing_indicators: {
        Row: {
          id: number
          chat_id: number
          user_id: string
          started_at: string
        }
        Insert: {
          id?: number
          chat_id: number
          user_id: string
          started_at?: string
        }
        Update: {
          id?: number
          chat_id?: number
          user_id?: string
          started_at?: string
        }
      }
      message_delivery_status: {
        Row: {
          id: number
          message_id: number
          user_id: string
          delivered_at: string
        }
        Insert: {
          id?: number
          message_id: number
          user_id: string
          delivered_at?: string
        }
        Update: {
          id?: number
          message_id?: number
          user_id?: string
          delivered_at?: string
        }
      }
      user_status_history: {
        Row: {
          id: number
          user_id: string
          status: string
          started_at: string
          ended_at: string | null
        }
        Insert: {
          id?: number
          user_id: string
          status: string
          started_at?: string
          ended_at?: string | null
        }
        Update: {
          id?: number
          user_id?: string
          status?: string
          started_at?: string
          ended_at?: string | null
        }
      }
      user_chat_favorites: {
        Row: {
          id: number
          user_id: string
          chat_id: number
          is_pinned: boolean
          is_muted: boolean
          is_archived: boolean
          notification_sound: string | null
          custom_background: string | null
          last_interacted_at: string
        }
        Insert: {
          id?: number
          user_id: string
          chat_id: number
          is_pinned?: boolean
          is_muted?: boolean
          is_archived?: boolean
          notification_sound?: string | null
          custom_background?: string | null
          last_interacted_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          chat_id?: number
          is_pinned?: boolean
          is_muted?: boolean
          is_archived?: boolean
          notification_sound?: string | null
          custom_background?: string | null
          last_interacted_at?: string
        }
      }
    }
    Views: {
      user_chats_with_latest_message: {
        Row: {
          id: number
          name: string | null
          is_group: boolean
          created_at: string
          created_by: string
          image: string | null
          last_message_id: number | null
          last_message_content: string | null
          last_message_media_url: string | null
          last_message_sent_at: string | null
          last_message_sender_id: string | null
          last_message_sender_name: string | null
          last_message_sender_profile_image: string | null
          unread_count: number | null
          is_pinned: boolean | null
          is_muted: boolean | null
          is_archived: boolean | null
        }
      }
      chat_details_with_members: {
        Row: {
          id: number
          name: string | null
          is_group: boolean
          created_at: string
          created_by: string
          image: string | null
          members: Json | null
          message_count: number | null
        }
      }
      messages_with_details: {
        Row: {
          id: number
          chat_id: number
          sender_id: string
          content: string | null
          media_url: string | null
          sent_at: string
          reply_to_id: number | null
          reactions: Json
          is_read: boolean
          is_delivered: boolean
          reaction_details: Json | null
          read_status_details: Json | null
          read_count: number | null
          sender_name: string | null
          sender_profile_image: string | null
        }
      }
      user_contacts: {
        Row: {
          id: string
          username: string
          display_name: string
          profile_image: string | null
          status: string
          is_online: boolean
          last_seen: string
          direct_chat_id: number | null
        }
      }
      searchable_messages: {
        Row: {
          id: number
          chat_id: number
          sender_id: string
          content: string | null
          media_url: string | null
          sent_at: string
          chat_name: string | null
          sender_name: string | null
          document: unknown
        }
      }
    }
    Functions: {
      search_messages: {
        Args: {
          search_term: string
        }
        Returns: {
          id: number
          chat_id: number
          sender_id: string
          content: string
          sent_at: string
          chat_name: string
          sender_name: string
          rank: number
        }[]
      }
      create_direct_chat: {
        Args: {
          other_user_id: string
        }
        Returns: number
      }
      create_group_chat: {
        Args: {
          chat_name: string
          member_ids: string[]
        }
        Returns: number
      }
      mark_chat_read: {
        Args: {
          chat_id_param: number
        }
        Returns: undefined
      }
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']
export type Views<T extends keyof Database['public']['Views']> = Database['public']['Views'][T]['Row']
export type Functions<T extends keyof Database['public']['Functions']> = Database['public']['Functions'][T]