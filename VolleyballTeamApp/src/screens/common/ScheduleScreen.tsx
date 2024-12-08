import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Platform,
} from 'react-native';
import {
  Button,
  Card,
  Icon,
  Overlay,
  Input,
  ListItem,
} from 'react-native-elements';
import { Calendar, CalendarList, Agenda } from 'react-native-calendars';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import RNPickerSelect from 'react-native-picker-select';
import { useAuth } from '../../hooks/useAuth';
import {
  ScheduleService,
  ScheduleEvent,
  EventType,
  PlayerAvailability,
} from '../../services/scheduleService';
import { Text } from '../../components/Typography';

const eventTypes: EventType[] = ['practice', 'game', 'tournament', 'other'];

export default function ScheduleScreen() {
  const { user } = useAuth();
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showEventModal, setShowEventModal] = useState(false);
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<ScheduleEvent | null>(null);
  const [availability, setAvailability] = useState<PlayerAvailability[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCoach] = useState(user?.role === 'coach');

  // New Event Form State
  const [newEvent, setNewEvent] = useState({
    title: '',
    type: 'practice' as EventType,
    startDate: new Date(),
    endDate: new Date(),
    location: '',
    description: '',
    opponent: '',
    isRecurring: false,
  });

  const scheduleService = ScheduleService.getInstance();

  useEffect(() => {
    loadEvents();
  }, [selectedDate]);

  const loadEvents = async () => {
    try {
      setIsLoading(true);
      const startOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
      const endOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
      
      const fetchedEvents = await scheduleService.getEvents(startOfMonth, endOfMonth);
      setEvents(fetchedEvents);
    } catch (error) {
      console.error('Error loading events:', error);
      Alert.alert('Error', 'Failed to load schedule');
    } finally {
      setIsLoading(false);
    }
  };

  const loadEventAvailability = async (eventId: string) => {
    try {
      const availability = await scheduleService.getEventAvailability(eventId);
      setAvailability(availability);
    } catch (error) {
      console.error('Error loading availability:', error);
      Alert.alert('Error', 'Failed to load availability');
    }
  };

  const handleCreateEvent = async () => {
    try {
      await scheduleService.createEvent(newEvent);
      setShowEventModal(false);
      loadEvents();
      Alert.alert('Success', 'Event created successfully');
    } catch (error) {
      console.error('Error creating event:', error);
      Alert.alert('Error', 'Failed to create event');
    }
  };

  const handleUpdateAvailability = async (status: PlayerAvailability['status']) => {
    if (!selectedEvent) return;

    try {
      await scheduleService.updateAvailability(
        user.id,
        selectedEvent.id,
        status
      );
      loadEventAvailability(selectedEvent.id);
      Alert.alert('Success', 'Availability updated');
    } catch (error) {
      console.error('Error updating availability:', error);
      Alert.alert('Error', 'Failed to update availability');
    }
  };

  const renderEventModal = () => (
    <Overlay
      isVisible={showEventModal}
      onBackdropPress={() => setShowEventModal(false)}
      overlayStyle={styles.modal}
    >
      <ScrollView>
        <Text h4 style={styles.modalTitle}>Create New Event</Text>
        
        <Input
          label="Title"
          value={newEvent.title}
          onChangeText={(text) => setNewEvent({ ...newEvent, title: text })}
        />

        <Text style={styles.label}>Event Type</Text>
        <Picker
          selectedValue={newEvent.type}
          onValueChange={(value) => setNewEvent({ ...newEvent, type: value })}
          style={styles.picker}
        >
          {eventTypes.map((type) => (
            <Picker.Item
              key={type}
              label={type.charAt(0).toUpperCase() + type.slice(1)}
              value={type}
            />
          ))}
        </Picker>

        <Input
          label="Location"
          value={newEvent.location}
          onChangeText={(text) => setNewEvent({ ...newEvent, location: text })}
        />

        {newEvent.type === 'game' && (
          <Input
            label="Opponent"
            value={newEvent.opponent}
            onChangeText={(text) => setNewEvent({ ...newEvent, opponent: text })}
          />
        )}

        <Input
          label="Description"
          value={newEvent.description}
          onChangeText={(text) => setNewEvent({ ...newEvent, description: text })}
          multiline
          numberOfLines={3}
        />

        <View style={styles.dateContainer}>
          <Text style={styles.label}>Start Time</Text>
          <DateTimePicker
            value={newEvent.startDate}
            mode="datetime"
            display="default"
            onChange={(event, date) => date && setNewEvent({ ...newEvent, startDate: date })}
          />
        </View>

        <View style={styles.dateContainer}>
          <Text style={styles.label}>End Time</Text>
          <DateTimePicker
            value={newEvent.endDate}
            mode="datetime"
            display="default"
            onChange={(event, date) => date && setNewEvent({ ...newEvent, endDate: date })}
          />
        </View>

        <Button
          title="Create Event"
          onPress={handleCreateEvent}
          containerStyle={styles.button}
        />
      </ScrollView>
    </Overlay>
  );

  const renderAvailabilityModal = () => (
    <Overlay
      isVisible={showAvailabilityModal}
      onBackdropPress={() => setShowAvailabilityModal(false)}
      overlayStyle={styles.modal}
    >
      <ScrollView>
        <Text h4 style={styles.modalTitle}>Event Availability</Text>
        
        {selectedEvent && (
          <View style={styles.eventDetails}>
            <Text style={styles.eventTitle}>{selectedEvent.title}</Text>
            <Text style={styles.eventInfo}>
              {new Date(selectedEvent.startDate).toLocaleString()}
            </Text>
            <Text style={styles.eventInfo}>{selectedEvent.location}</Text>
          </View>
        )}

        {!isCoach && (
          <View style={styles.availabilityButtons}>
            <Button
              title="Available"
              onPress={() => handleUpdateAvailability('available')}
              buttonStyle={[styles.availabilityButton, { backgroundColor: '#4CAF50' }]}
            />
            <Button
              title="Tentative"
              onPress={() => handleUpdateAvailability('tentative')}
              buttonStyle={[styles.availabilityButton, { backgroundColor: '#FFC107' }]}
            />
            <Button
              title="Unavailable"
              onPress={() => handleUpdateAvailability('unavailable')}
              buttonStyle={[styles.availabilityButton, { backgroundColor: '#F44336' }]}
            />
          </View>
        )}

        <View style={styles.availabilityList}>
          <Text style={styles.sectionTitle}>Team Availability</Text>
          {availability.map((item) => (
            <ListItem key={item.playerId} bottomDivider>
              <Icon
                name="circle"
                type="font-awesome"
                color={
                  item.status === 'available'
                    ? '#4CAF50'
                    : item.status === 'tentative'
                    ? '#FFC107'
                    : '#F44336'
                }
              />
              <ListItem.Content>
                <ListItem.Title>{item.playerId}</ListItem.Title>
                {item.note && <ListItem.Subtitle>{item.note}</ListItem.Subtitle>}
              </ListItem.Content>
            </ListItem>
          ))}
        </View>
      </ScrollView>
    </Overlay>
  );

  const markedDates = events.reduce((acc, event) => {
    const dateStr = new Date(event.startDate).toISOString().split('T')[0];
    acc[dateStr] = {
      marked: true,
      dotColor: event.type === 'practice' ? '#4CAF50' : event.type === 'game' ? '#2196F3' : '#FFC107',
    };
    return acc;
  }, {} as { [key: string]: any });

  return (
    <View style={styles.container}>
      <Calendar
        current={selectedDate.toISOString()}
        onDayPress={(day) => setSelectedDate(new Date(day.timestamp))}
        markedDates={markedDates}
        theme={{
          todayTextColor: '#2196F3',
          selectedDayBackgroundColor: '#2196F3',
          selectedDayTextColor: '#ffffff',
        }}
      />

      <View style={styles.eventsList}>
        <Text style={styles.sectionTitle}>
          Events for {selectedDate.toLocaleDateString()}
        </Text>
        <ScrollView>
          {events
            .filter(
              (event) =>
                new Date(event.startDate).toDateString() === selectedDate.toDateString()
            )
            .map((event) => (
              <TouchableOpacity
                key={event.id}
                onPress={() => {
                  setSelectedEvent(event);
                  loadEventAvailability(event.id);
                  setShowAvailabilityModal(true);
                }}
              >
                <Card>
                  <View style={styles.eventCard}>
                    <View style={styles.eventHeader}>
                      <Text style={styles.eventTitle}>{event.title}</Text>
                      <Text style={styles.eventType}>
                        {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                      </Text>
                    </View>
                    <Text style={styles.eventTime}>
                      {new Date(event.startDate).toLocaleTimeString()} -{' '}
                      {new Date(event.endDate).toLocaleTimeString()}
                    </Text>
                    <Text style={styles.eventLocation}>{event.location}</Text>
                    {event.opponent && (
                      <Text style={styles.eventOpponent}>vs {event.opponent}</Text>
                    )}
                  </View>
                </Card>
              </TouchableOpacity>
            ))}
        </ScrollView>
      </View>

      {isCoach && (
        <Button
          title="Create Event"
          onPress={() => setShowEventModal(true)}
          containerStyle={styles.createButton}
          icon={
            <Icon
              name="plus"
              type="font-awesome"
              color="#ffffff"
              size={15}
              style={{ marginRight: 10 }}
            />
          }
        />
      )}

      {renderEventModal()}
      {renderAvailabilityModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  eventsList: {
    flex: 1,
    padding: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 10,
  },
  eventCard: {
    padding: 10,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  eventType: {
    fontSize: 14,
    color: '#666',
  },
  eventTime: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  eventLocation: {
    fontSize: 14,
    color: '#666',
  },
  eventOpponent: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  createButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    borderRadius: 30,
    width: 60,
    height: 60,
  },
  modal: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: 10,
    padding: 20,
  },
  modalTitle: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: '#86939e',
    marginBottom: 5,
  },
  picker: {
    backgroundColor: '#f9f9f9',
    marginBottom: 15,
  },
  dateContainer: {
    marginBottom: 15,
  },
  button: {
    marginTop: 20,
  },
  eventDetails: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
  },
  eventInfo: {
    color: '#666',
    marginTop: 5,
  },
  availabilityButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  availabilityButton: {
    width: 100,
  },
  availabilityList: {
    marginTop: 20,
  },
});
