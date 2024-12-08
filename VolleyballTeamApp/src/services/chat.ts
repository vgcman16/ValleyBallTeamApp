import { supabase } from './supabase';
import { Message } from '../types';
import { TABLES } from '../constants/supabase';

export const subscribeToTeamChat = (
  teamId: string,
  onMessage: (message: Message) => void
) => {
  const subscription = supabase
    .from(TABLES.MESSAGES)
    .on('INSERT', (payload) => {
      onMessage(payload.new as Message);
    })
    .subscribe();

  return () => {
    supabase.removeSubscription(subscription);
  };
};

export const sendMessage = async (
  teamId: string,
  senderId: string,
  content: string,
  type: 'announcement' | 'chat',
  recipientId?: string
) => {
  try {
    const { data, error } = await supabase.from(TABLES.MESSAGES).insert([
      {
        team_id: teamId,
        sender_id: senderId,
        content,
        type,
        recipient_id: recipientId,
      },
    ]);

    if (error) throw error;
    return data?.[0];
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

export const fetchMessages = async (
  teamId: string,
  limit = 50,
  before?: string
) => {
  try {
    let query = supabase
      .from(TABLES.MESSAGES)
      .select('*, sender:users(first_name, last_name)')
      .eq('team_id', teamId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (before) {
      query = query.lt('created_at', before);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching messages:', error);
    throw error;
  }
};

export const markMessageAsRead = async (messageId: string) => {
  try {
    const { error } = await supabase
      .from(TABLES.MESSAGES)
      .update({ read: true })
      .eq('id', messageId);

    if (error) throw error;
  } catch (error) {
    console.error('Error marking message as read:', error);
    throw error;
  }
};
