import { UserRole } from '../constants/supabase';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  teamId?: string;
  playerId?: string; // For parent accounts
}

export interface Team {
  id: string;
  name: string;
  coachId: string;
  teamPhotoUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Event {
  id: string;
  teamId: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  location: string;
  type: 'practice' | 'match' | 'other';
  createdAt: string;
  updatedAt: string;
}

export interface Attendance {
  id: string;
  eventId: string;
  userId: string;
  status: 'attending' | 'not_attending' | 'pending';
  createdAt: string;
  updatedAt: string;
}

export interface PerformanceStat {
  id: string;
  playerId: string;
  matchId: string;
  category: string;
  value: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  teamId: string;
  senderId: string;
  content: string;
  type: 'announcement' | 'chat';
  recipientId?: string; // For direct messages
  createdAt: string;
  updatedAt: string;
}

export interface Resource {
  id: string;
  teamId: string;
  title: string;
  description?: string;
  fileUrl: string;
  fileType: string;
  uploadedBy: string;
  createdAt: string;
  updatedAt: string;
}
