import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Button, Card } from 'react-native-elements';
import { useNavigation } from '@react-navigation/native';
import { launchImageLibrary } from 'react-native-image-picker';
import { format } from 'date-fns';
import { supabase, uploadTeamPhoto } from '../../services/supabase';
import { Event, Team } from '../../types';
import { TABLES } from '../../constants/supabase';
import { Text } from '../../components/Typography';
import { useAuth } from '../../contexts/AuthContext';

export default function DashboardScreen() {
  const navigation = useNavigation();
  const { userProfile, refreshUserProfile } = useAuth();
  const [team, setTeam] = useState<Team | null>(null);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [userProfile?.teamId]);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      
      if (!userProfile?.teamId) {
        setTeam(null);
        setUpcomingEvents([]);
        setIsLoading(false);
        return;
      }

      // Fetch team data
      const { data: teamData, error: teamError } = await supabase
        .from(TABLES.TEAMS)
        .select('*')
        .eq('id', userProfile.teamId)
        .single();

      if (teamError) throw teamError;
      setTeam(teamData);

      // Fetch upcoming events
      const { data: events, error: eventsError } = await supabase
        .from(TABLES.EVENTS)
        .select('*')
        .eq('team_id', userProfile.teamId)
        .gte('start_time', new Date().toISOString())
        .order('start_time', { ascending: true })
        .limit(5);

      if (eventsError) throw eventsError;
      setUpcomingEvents(events || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateTeamPhoto = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
      });

      if (result.assets && result.assets[0].uri) {
        const photoPath = await uploadTeamPhoto(team!.id, result.assets[0].uri);
        
        // Update team record with new photo URL
        const { error } = await supabase
          .from(TABLES.TEAMS)
          .update({ teamPhotoUrl: photoPath })
          .eq('id', team!.id);

        if (error) throw error;
        
        // Refresh dashboard data
        fetchDashboardData();
        Alert.alert('Success', 'Team photo updated successfully');
      }
    } catch (error) {
      console.error('Error updating team photo:', error);
      Alert.alert('Error', 'Failed to update team photo');
    }
  };

  const handleCreateTeam = () => {
    navigation.navigate('CreateTeam' as never);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (!userProfile?.teamId) {
    return (
      <View style={styles.container}>
        <View style={styles.welcomeContainer}>
          <Text h2>Welcome Coach {userProfile?.firstName}!</Text>
          <Text style={styles.subtitle}>Let's get started by creating your team.</Text>
          <Button
            title="Create Team"
            onPress={handleCreateTeam}
            containerStyle={styles.buttonContainer}
          />
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Card>
        <Card.Title>Team Information</Card.Title>
        <Card.Image 
          source={{ uri: team?.teamPhotoUrl }}
          style={styles.teamPhoto}
        />
        <Button
          title="Update Team Photo"
          onPress={handleUpdateTeamPhoto}
          containerStyle={styles.buttonContainer}
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
                {format(new Date(event.start_time), 'MMM dd, yyyy h:mm a')}
              </Text>
              <Text style={styles.eventLocation}>{event.location}</Text>
            </View>
          </TouchableOpacity>
        ))}
        <Button
          title="Add New Event"
          onPress={() => navigation.navigate('AddEvent')}
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
          <Button
            title="Manage Registration Codes"
            onPress={() => navigation.navigate('ManageRegistrationCodes' as never)}
            containerStyle={styles.buttonContainer}
            icon={{
              name: 'key',
              type: 'font-awesome',
              color: 'white',
              size: 15,
            }}
            iconRight
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
  welcomeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  subtitle: {
    marginBottom: 20,
  },
  buttonContainer: {
    marginVertical: 10,
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
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  quickActionButton: {
    width: '30%',
  },
});
