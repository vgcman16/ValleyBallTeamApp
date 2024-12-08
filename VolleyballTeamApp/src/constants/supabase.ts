import { REACT_APP_SUPABASE_URL, REACT_APP_SUPABASE_ANON_KEY } from '@env';

export const SUPABASE_URL = REACT_APP_SUPABASE_URL;
export const SUPABASE_ANON_KEY = REACT_APP_SUPABASE_ANON_KEY;

export const USER_ROLES = {
  COACH: 'coach',
  PLAYER: 'player',
  PARENT: 'parent',
} as const;

export const STORAGE_BUCKETS = {
  TEAM_PHOTOS: 'team-photos',
  RESOURCES: 'resources',
} as const;

export const TABLES = {
  USERS: 'users',
  TEAMS: 'teams',
  EVENTS: 'events',
  ATTENDANCE: 'attendance',
  PERFORMANCE_STATS: 'performance_stats',
  MESSAGES: 'messages',
  RESOURCES: 'resources',
  FORMATIONS: 'formations',
  PLAYS: 'plays',
  ROTATIONS: 'rotations',
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];
