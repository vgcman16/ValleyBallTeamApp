import { supabase } from './supabase';
import { TABLES } from '../constants/supabase';
import * as Calendar from 'expo-calendar';
import { Platform } from 'react-native';

export type EventType = 'practice' | 'game' | 'tournament' | 'other';

export interface ScheduleEvent {
  id: string;
  title: string;
  type: EventType;
  startDate: Date;
  endDate: Date;
  location: string;
  description?: string;
  opponent?: string;
  requiredPlayers?: string[];
  isRecurring?: boolean;
  recurrenceRule?: string;
  calendarEventId?: string;
}

export interface PlayerAvailability {
  playerId: string;
  eventId: string;
  status: 'available' | 'unavailable' | 'tentative';
  note?: string;
}

export class ScheduleService {
  private static instance: ScheduleService;
  private calendarId: string | null = null;

  private constructor() {}

  static getInstance(): ScheduleService {
    if (!ScheduleService.instance) {
      ScheduleService.instance = new ScheduleService();
    }
    return ScheduleService.instance;
  }

  async initialize() {
    await this.requestCalendarPermissions();
    await this.setupTeamCalendar();
  }

  private async requestCalendarPermissions() {
    const { status } = await Calendar.requestCalendarPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Calendar permissions not granted');
    }
  }

  private async setupTeamCalendar() {
    try {
      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      const teamCalendar = calendars.find(cal => cal.title === 'Volleyball Team');

      if (teamCalendar) {
        this.calendarId = teamCalendar.id;
      } else {
        // Create a new calendar for the team
        const newCalendarId = await Calendar.createCalendarAsync({
          title: 'Volleyball Team',
          color: '#007AFF',
          entityType: Calendar.EntityTypes.EVENT,
          sourceId: calendars[0].source.id,
          source: calendars[0].source,
          name: 'Volleyball Team Calendar',
          ownerAccount: 'default',
          accessLevel: Calendar.CalendarAccessLevel.OWNER,
        });
        this.calendarId = newCalendarId;
      }
    } catch (error) {
      console.error('Error setting up calendar:', error);
      throw error;
    }
  }

  async createEvent(event: Omit<ScheduleEvent, 'id' | 'calendarEventId'>): Promise<string> {
    try {
      // Create event in Supabase
      const { data, error } = await supabase
        .from(TABLES.EVENTS)
        .insert([{
          title: event.title,
          type: event.type,
          start_date: event.startDate.toISOString(),
          end_date: event.endDate.toISOString(),
          location: event.location,
          description: event.description,
          opponent: event.opponent,
          required_players: event.requiredPlayers,
          is_recurring: event.isRecurring,
          recurrence_rule: event.recurrenceRule,
        }])
        .select()
        .single();

      if (error) throw error;

      // Create event in device calendar
      if (this.calendarId) {
        const calendarEventId = await Calendar.createEventAsync(this.calendarId, {
          title: event.title,
          startDate: event.startDate,
          endDate: event.endDate,
          location: event.location,
          notes: event.description,
          recurrenceRule: event.recurrenceRule ? JSON.parse(event.recurrenceRule) : undefined,
          alarms: [{ relativeOffset: -60 }], // 1 hour reminder
        });

        // Update event with calendar ID
        await supabase
          .from(TABLES.EVENTS)
          .update({ calendar_event_id: calendarEventId })
          .eq('id', data.id);
      }

      return data.id;
    } catch (error) {
      console.error('Error creating event:', error);
      throw error;
    }
  }

  async updateEvent(eventId: string, updates: Partial<ScheduleEvent>): Promise<void> {
    try {
      const { data, error } = await supabase
        .from(TABLES.EVENTS)
        .update({
          title: updates.title,
          type: updates.type,
          start_date: updates.startDate?.toISOString(),
          end_date: updates.endDate?.toISOString(),
          location: updates.location,
          description: updates.description,
          opponent: updates.opponent,
          required_players: updates.requiredPlayers,
          is_recurring: updates.isRecurring,
          recurrence_rule: updates.recurrenceRule,
        })
        .eq('id', eventId)
        .select()
        .single();

      if (error) throw error;

      // Update device calendar event
      if (this.calendarId && data.calendar_event_id) {
        await Calendar.updateEventAsync(data.calendar_event_id, {
          title: updates.title,
          startDate: updates.startDate,
          endDate: updates.endDate,
          location: updates.location,
          notes: updates.description,
          recurrenceRule: updates.recurrenceRule ? JSON.parse(updates.recurrenceRule) : undefined,
        });
      }
    } catch (error) {
      console.error('Error updating event:', error);
      throw error;
    }
  }

  async deleteEvent(eventId: string): Promise<void> {
    try {
      const { data, error } = await supabase
        .from(TABLES.EVENTS)
        .delete()
        .eq('id', eventId)
        .select()
        .single();

      if (error) throw error;

      // Delete from device calendar
      if (this.calendarId && data.calendar_event_id) {
        await Calendar.deleteEventAsync(data.calendar_event_id);
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      throw error;
    }
  }

  async getEvents(startDate: Date, endDate: Date): Promise<ScheduleEvent[]> {
    try {
      const { data, error } = await supabase
        .from(TABLES.EVENTS)
        .select('*')
        .gte('start_date', startDate.toISOString())
        .lte('end_date', endDate.toISOString());

      if (error) throw error;

      return data.map(event => ({
        id: event.id,
        title: event.title,
        type: event.type,
        startDate: new Date(event.start_date),
        endDate: new Date(event.end_date),
        location: event.location,
        description: event.description,
        opponent: event.opponent,
        requiredPlayers: event.required_players,
        isRecurring: event.is_recurring,
        recurrenceRule: event.recurrence_rule,
        calendarEventId: event.calendar_event_id,
      }));
    } catch (error) {
      console.error('Error fetching events:', error);
      throw error;
    }
  }

  async updateAvailability(
    playerId: string,
    eventId: string,
    status: PlayerAvailability['status'],
    note?: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from(TABLES.PLAYER_AVAILABILITY)
        .upsert({
          player_id: playerId,
          event_id: eventId,
          status,
          note,
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error updating availability:', error);
      throw error;
    }
  }

  async getEventAvailability(eventId: string): Promise<PlayerAvailability[]> {
    try {
      const { data, error } = await supabase
        .from(TABLES.PLAYER_AVAILABILITY)
        .select(\`
          player_id,
          event_id,
          status,
          note,
          players (
            firstName,
            lastName
          )
        \`)
        .eq('event_id', eventId);

      if (error) throw error;

      return data.map(item => ({
        playerId: item.player_id,
        eventId: item.event_id,
        status: item.status,
        note: item.note,
      }));
    } catch (error) {
      console.error('Error fetching event availability:', error);
      throw error;
    }
  }

  async getPlayerSchedule(playerId: string, startDate: Date, endDate: Date): Promise<ScheduleEvent[]> {
    try {
      const { data, error } = await supabase
        .from(TABLES.EVENTS)
        .select(\`
          *,
          player_availability!inner (
            player_id,
            status
          )
        \`)
        .eq('player_availability.player_id', playerId)
        .gte('start_date', startDate.toISOString())
        .lte('end_date', endDate.toISOString());

      if (error) throw error;

      return data.map(event => ({
        id: event.id,
        title: event.title,
        type: event.type,
        startDate: new Date(event.start_date),
        endDate: new Date(event.end_date),
        location: event.location,
        description: event.description,
        opponent: event.opponent,
        requiredPlayers: event.required_players,
        isRecurring: event.is_recurring,
        recurrenceRule: event.recurrence_rule,
        calendarEventId: event.calendar_event_id,
      }));
    } catch (error) {
      console.error('Error fetching player schedule:', error);
      throw error;
    }
  }
}
