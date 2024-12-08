import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Button, ActivityIndicator } from '@rneui/themed';
import { format } from 'date-fns';
import { supabase } from '../../services/supabase';
import { Event } from '../../types';
import { TABLES } from '../../constants/supabase';
import { Text } from '../../components/Typography';

export default function EventDetailsScreen({ route, navigation }) {
  const { eventId } = route.params;
  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchEventDetails();
  }, [eventId]);

  const fetchEventDetails = async () => {
    try {
      const { data, error } = await supabase
        .from(TABLES.EVENTS)
        .select('*')
        .eq('id', eventId)
        .single();

      if (error) {
        console.error('Error fetching event details:', error);
      } else {
        setEvent(data);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!event) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>
          Unable to load event details. Please try again.
        </Text>
        <Button
          title="Go Back"
          onPress={() => navigation.goBack()}
          containerStyle={styles.buttonContainer}
        />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Card>
        <Card.Title>{event.title}</Card.Title>
        <View style={styles.detailsContainer}>
          <Text style={styles.dateTime}>
            {format(new Date(event.startTime), 'MMMM dd, yyyy')}
          </Text>
          <Text style={styles.dateTime}>
            {format(new Date(event.startTime), 'h:mm a')} - 
            {format(new Date(event.endTime), 'h:mm a')}
          </Text>
          <Text style={styles.location}>{event.location}</Text>
          {event.description && (
            <Text style={styles.description}>{event.description}</Text>
          )}
        </View>
      </Card>

      {/* Add more sections as needed, such as:
         - Attendees
         - Required Equipment
         - Notes
         - etc. 
      */}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsContainer: {
    padding: 15,
  },
  dateTime: {
    fontSize: 16,
    marginBottom: 5,
    color: '#666',
  },
  location: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 10,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginTop: 10,
  },
  buttonContainer: {
    marginTop: 15,
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 20,
    paddingHorizontal: 20,
  },
});
