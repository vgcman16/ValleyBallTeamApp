import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { REACT_APP_SUPABASE_URL, REACT_APP_SUPABASE_ANON_KEY } from '@env';
import { Database } from '../types/supabase';
import { Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';

if (!REACT_APP_SUPABASE_URL) throw new Error('Missing SUPABASE_URL');
if (!REACT_APP_SUPABASE_ANON_KEY) throw new Error('Missing SUPABASE_ANON_KEY');

const supabaseUrl = REACT_APP_SUPABASE_URL;
const supabaseAnonKey = REACT_APP_SUPABASE_ANON_KEY;

// Define the redirect URL based on platform
const getRedirectUrl = () => {
  if (Platform.OS === 'ios') {
    return 'volleyballteamapp://login';
  } else if (Platform.OS === 'android') {
    return 'volleyballteamapp://login';
  }
  return 'volleyballteamapp://login';
};

export const supabase = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
      flowType: 'pkce',
      redirectTo: getRedirectUrl(),
    },
    global: {
      headers: { 'x-app-platform': Platform.OS },
    },
    realtime: {
      params: {
        eventsPerSecond: 2,
      },
    },
    db: {
      schema: 'public'
    }
  }
);

// Add connection state monitoring with reconnection logic
NetInfo.addEventListener(state => {
  if (state.isConnected) {
    console.log('Reconnected to network, refreshing Supabase connection');
    // Refresh the client's connection
    supabase.auth.refreshSession();
    // Resubscribe to any active realtime subscriptions
    supabase.realtime.connect();
  }
});

// Add a global error handler for Supabase
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'TOKEN_REFRESHED') {
    console.log('Supabase token refreshed successfully');
  }
  if (event === 'SIGNED_OUT') {
    console.log('User signed out');
  }
});

// Helper function to handle Supabase operations with retries
export const withRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> => {
  let lastError: any;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      const result = await operation();
      return result;
    } catch (error: any) {
      lastError = error;
      console.warn(`Operation failed (attempt ${i + 1}/${maxRetries}):`, error.message);
      
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
      }
    }
  }
  
  throw lastError;
};

export const uploadTeamPhoto = async (teamId: string, photoUri: string) => {
  return withRetry(async () => {
    const fileName = `team-${teamId}-${Date.now()}.jpg`;
    const response = await fetch(photoUri);
    const blob = await response.blob();
    
    const { data, error } = await supabase.storage
      .from('team-photos')
      .upload(fileName, blob);

    if (error) throw error;
    return data;
  });
};

export const getTeamPhoto = async (photoPath: string) => {
  return withRetry(async () => {
    if (!photoPath) return null;

    const { data, error } = await supabase.storage
      .from('team-photos')
      .getPublicUrl(photoPath);

    if (error) throw error;
    return data.publicUrl;
  });
};
