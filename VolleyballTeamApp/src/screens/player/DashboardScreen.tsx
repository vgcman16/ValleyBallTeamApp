import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { Card, Button } from 'react-native-elements';
import { useNavigation } from '@react-navigation/native';
import { format } from 'date-fns';
import { supabase } from '../../services/supabase';
import { Event, PerformanceStat, Team } from '../../types';
import { TABLES } from '../../constants/supabase';
import { Text } from '../../components/Typography';

export default function PlayerDashboardScreen() {
  const navigation = useNavigation();
  const [team, setTeam] = useState<Team | null>(null);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [recentStats, setRecentStats] = useState<PerformanceStat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch team data
      const { data: teamData, error: teamError } = await supabase
        .from(TABLES.TEAMS)
        .select('*')
        .single();

      if (teamError) throw teamError;
      setTeam(teamData);

      // Fetch upcoming events
      const { data: events, error: eventsError } = await supabase
        .from(TABLES.EVENTS)
        .select('*')
        .gte('start_time', new Date().toISOString())
        .order('start_time', { ascending: true })
        .limit(5);

      if (eventsError) throw eventsError;
      setUpcomingEvents(events);

      // Fetch recent performance stats
      const { data: stats, error: statsError } = await supabase
        .from(TABLES.PERFORMANCE_STATS)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (statsError) throw statsError;
      setRecentStats(stats);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <Card>
        <Card.Title>Team Information</Card.Title>
        <Card.Image 
          source={{ uri: team?.teamPhotoUrl }}
          style={styles.teamPhoto}
        />
        <Text style={styles.teamName}>{team?.name}</Text>
      </Card>

      <Card>
        <Card.Title>Upcoming Events</Card.Title>
        {upcomingEvents.map((event) => (
          <TouchableOpacity
            key={event.id}
            onPress={() => navigation.navigate('EventDetails', { eventId: event.id })}
          >
            <View style={styles.eventItem}>
              <Text style={styles.eventTitle}>{event.title}</Text>
              <Text style={styles.eventDate}>
                {format(new Date(event.startTime), 'MMM dd, yyyy h:mm a')}
              </Text>
              <Text style={styles.eventLocation}>{event.location}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </Card>

      <Card>
        <Card.Title>Recent Performance</Card.Title>
        {recentStats.map((stat) => (
          <View key={stat.id} style={styles.statItem}>
            <Text style={styles.statCategory}>{stat.category}</Text>
            <Text style={styles.statValue}>{stat.value}</Text>
            {stat.notes && (
              <Text style={styles.statNotes}>{stat.notes}</Text>
            )}
          </View>
        ))}
        <Button
          title="View All Stats"
          onPress={() => navigation.navigate('Stats')}
          containerStyle={styles.buttonContainer}
        />
      </Card>

      <Card>
        <Card.Title>Quick Actions</Card.Title>
        <View style={styles.quickActions}>
          <Button
            title="Team Chat"
            onPress={() => navigation.navigate('Chat')}
            containerStyle={[styles.buttonContainer, styles.quickActionButton]}
          />
          <Button
            title="Resources"
            onPress={() => navigation.navigate('Resources')}
            containerStyle={[styles.buttonContainer, styles.quickActionButton]}
          />
          <Button
            title="Calendar"
            onPress={() => navigation.navigate('Calendar')}
            containerStyle={[styles.buttonContainer, styles.quickActionButton]}
          />
        </View>
      </Card>
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
  teamPhoto: {
    width: '100%',
    height: 200,
    borderRadius: 10,
  },
  teamName: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 10,
  },
  eventItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  eventDate: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  eventLocation: {
    fontSize: 14,
    color: '#666',
  },
  statItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  statCategory: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  statValue: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  statNotes: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 5,
  },
  buttonContainer: {
    marginVertical: 10,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  quickActionButton: {
    width: '30%',
  },
});
