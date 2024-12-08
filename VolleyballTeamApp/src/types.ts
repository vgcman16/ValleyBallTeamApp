export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'coach' | 'player' | 'parent';
  team_id?: string;
  jersey_number?: number;
  position?: string;
  created_at: string;
  updated_at: string;
  fcm_token?: string;
}

export interface Team {
  id: string;
  name: string;
  description?: string;
  team_photo_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Event {
  id: string;
  team_id: string;
  title: string;
  type: 'practice' | 'match' | 'tournament' | 'other';
  location?: string;
  start_time: string;
  end_time: string;
  notes?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  team_id: string;
  sender_id: string;
  content: string;
  type: 'announcement' | 'chat';
  recipient_id?: string;
  created_at: string;
  updated_at: string;
  read: boolean;
  sender?: User;
}

export interface Resource {
  id: string;
  team_id: string;
  title: string;
  file_url: string;
  file_type: string;
  uploaded_by: string;
  created_at: string;
  updated_at: string;
}

export interface PerformanceStat {
  id: string;
  player_id: string;
  match_id: string;
  category: string;
  value: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Play {
  id: string;
  team_id: string;
  name: string;
  description: string;
  diagram_url?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Rotation {
  id: string;
  team_id: string;
  name: string;
  positions: string[];
  notes?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}
