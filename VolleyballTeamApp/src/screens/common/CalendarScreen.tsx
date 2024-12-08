import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Button, Input } from 'react-native-elements';
import { Calendar } from 'react-native-calendars';
import { format } from 'date-fns';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../../services/supabase';
import { Event } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { USER_ROLES, TABLES } from '../../constants/supabase';
import { Modal } from '../../components/Modal';
import { Text } from '../../components/Typography';

type MarkedDates = {
  [date: string]: {
    marked: boolean;
    dotColor: string;
  };
};

export default function CalendarScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [markedDates, setMarkedDates] = useState<MarkedDates>({});
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    location: '',
    startTime: '',
    endTime: '',
    type: 'practice',
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from(TABLES.EVENTS)
        .select('*')
        .order('start_time', { ascending: true });

      if (error) throw error;

      setEvents(data);
      
      // Mark dates with events
      const marked: MarkedDates = {};
      data.forEach((event) => {
        const date = format(new Date(event.startTime), 'yyyy-MM-dd');
        marked[date] = {
          marked: true,
          dotColor: event.type === 'match' ? '#ff0000' : '#2089dc',
        };
      });
      setMarkedDates(marked);
    } catch (error) {
      console.error('Error fetching events:', error);
      Alert.alert('Error', 'Failed to load events');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchEvents();
  };

  const handleDayPress = (day: { dateString: string }) => {
    setSelectedDate(day.dateString);
  };

  const getDayEvents = () => {
    if (!selectedDate) return [];
    return events.filter((event) => 
      format(new Date(event.startTime), 'yyyy-MM-dd') === selectedDate
    );
  };

  const handleAddEvent = async () => {
    if (!user || user.role !== USER_ROLES.COACH) {
      Alert.alert('Error', 'Only coaches can add events');
      return;
    }

    if (!newEvent.title || !newEvent.startTime || !newEvent.endTime) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      const { error } = await supabase
        .from(TABLES.EVENTS)
        .insert([{
          ...newEvent,
          teamId: user.teamId,
        }]);

      if (error) throw error;

      setShowAddEvent(false);
      setNewEvent({
        title: '',
        description: '',
        location: '',
        startTime: '',
        endTime: '',
        type: 'practice',
      });
      fetchEvents();
      Alert.alert('Success', 'Event added successfully');
    } catch (error) {
      console.error('Error adding event:', error);
      Alert.alert('Error', 'Failed to add event');
    }
  };

  return (
    <View style={styles.container}>
      <Calendar
        markedDates={markedDates}
        onDayPress={handleDayPress}
        theme={{
          selectedDayBackgroundColor: '#2089dc',
          todayTextColor: '#2089dc',
          arrowColor: '#2089dc',
        }}
      />

      <ScrollView
        style={styles.eventsContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {selectedDate && (
          <View>
            <Text h4 style={styles.dateHeader}>
              Events for {format(new Date(selectedDate), 'MMMM dd, yyyy')}
            </Text>
            {getDayEvents().map((event) => (
              <TouchableOpacity
                key={event.id}
                onPress={() => navigation.navigate('EventDetails', { eventId: event.id })}
                style={styles.eventItem}
              >
                <Text style={styles.eventTitle}>{event.title}</Text>
                <Text style={styles.eventTime}>
                  {format(new Date(event.startTime), 'h:mm a')} - 
                  {format(new Date(event.endTime), 'h:mm a')}
                </Text>
                <Text style={styles.eventLocation}>{event.location}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {user?.role === USER_ROLES.COACH && (
        <Button
          title="Add Event"
          onPress={() => setShowAddEvent(true)}
          containerStyle={styles.addButton}
        />
      )}

      <Modal
        visible={showAddEvent}
        onBackdropPress={() => setShowAddEvent(false)}
        style={styles.modal}
      >
        <ScrollView>
          <Text h4 style={styles.modalTitle}>Add New Event</Text>
          
          <Input
            placeholder="Event Title"
            value={newEvent.title}
            onChangeText={(value) => setNewEvent({ ...newEvent, title: value })}
            containerStyle={styles.inputContainer}
          />

          <Input
            placeholder="Description"
            value={newEvent.description}
            onChangeText={(value) => setNewEvent({ ...newEvent, description: value })}
            multiline
            numberOfLines={3}
            containerStyle={styles.inputContainer}
          />

          <Input
            placeholder="Location"
            value={newEvent.location}
            onChangeText={(value) => setNewEvent({ ...newEvent, location: value })}
            containerStyle={styles.inputContainer}
          />

          <Input
            placeholder="Start Time (YYYY-MM-DD HH:mm)"
            value={newEvent.startTime}
            onChangeText={(value) => setNewEvent({ ...newEvent, startTime: value })}
            containerStyle={styles.inputContainer}
          />

          <Input
            placeholder="End Time (YYYY-MM-DD HH:mm)"
            value={newEvent.endTime}
            onChangeText={(value) => setNewEvent({ ...newEvent, endTime: value })}
            containerStyle={styles.inputContainer}
          />

          <View style={styles.buttonContainer}>
            <Button
              title="Cancel"
              onPress={() => setShowAddEvent(false)}
              buttonStyle={styles.cancelButton}
              containerStyle={styles.actionButton}
            />
            <Button
              title="Add Event"
              onPress={handleAddEvent}
              containerStyle={styles.actionButton}
            />
          </View>
        </ScrollView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  eventsContainer: {
    flex: 1,
    padding: 15,
  },
  dateHeader: {
    marginBottom: 15,
  },
  eventItem: {
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 5,
    marginBottom: 10,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  eventTime: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  eventLocation: {
    fontSize: 14,
    color: '#666',
  },
  addButton: {
    margin: 15,
  },
  modal: {
    padding: 0,
  },
  modalTitle: {
    textAlign: 'center',
    marginBottom: 20,
  },
  inputContainer: {
    paddingHorizontal: 0,
    marginBottom: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#999',
  },
});
