import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Card, Text, Button, Avatar } from '@rneui/base';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { format } from 'date-fns';
import { supabase } from '../../services/supabase';
import { Event, PerformanceStat, Team, User } from '../../types';
import { TABLES } from '../../constants/supabase';
import { useAuth } from '../../contexts/AuthContext';

type ParentStackParamList = {
  ParentTabs: undefined;
  EventDetails: { eventId: string };
  ChildStats: undefined;
};

type ParentScreenNavigationProp = NavigationProp<ParentStackParamList>;

export default function ParentDashboardScreen() {
  const navigation = useNavigation<ParentScreenNavigationProp>();
  const { user } = useAuth();
  const [team, setTeam] = useState<Team | null>(null);
  const [childInfo, setChildInfo] = useState<User | null>(null);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [recentStats, setRecentStats] = useState<PerformanceStat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      if (!user?.id) {
        console.error('No authenticated user found');
        setIsLoading(false);
        return;
      }

      // Get user profile
      const { data: userData, error: userError } = await supabase
        .from(TABLES.USERS)
        .select('*')
        .eq('id', user.id)
        .single();

      if (userError) {
        // If profile doesn't exist, create it from auth metadata
        if (userError.code === 'PGRST116') {
          const metadata = user.user_metadata;
          if (metadata?.firstName && metadata?.lastName && metadata?.role) {
            const { data: newUserData, error: createError } = await supabase
              .from(TABLES.USERS)
              .insert([
                {
                  id: user.id,
                  email: user.email,
                  first_name: metadata.firstName,
                  last_name: metadata.lastName,
                  role: metadata.role,
                }
              ])
              .select()
              .single();

            if (createError) {
              console.error('Error creating user profile:', createError);
              setIsLoading(false);
              return;
            }

            setChildInfo(newUserData);
          } else {
            console.error('Missing user metadata');
            setIsLoading(false);
            return;
          }
        } else {
          console.error('Error fetching user data:', userError);
          setIsLoading(false);
          return;
        }
      } else {
        setChildInfo(userData);
      }

      // Get team data if user has a team
      if (childInfo?.teamId) {
        const { data: teamData, error: teamError } = await supabase
          .from(TABLES.TEAMS)
          .select('*')
          .eq('id', childInfo.teamId)
          .single();

        if (teamError) {
          console.error('Error fetching team data:', teamError);
        } else {
          setTeam(teamData);
        }

        // Get upcoming events for the team
        const { data: events, error: eventsError } = await supabase
          .from(TABLES.EVENTS)
          .select('*')
          .eq('team_id', childInfo.teamId)
          .gte('start_time', new Date().toISOString())
          .order('start_time', { ascending: true })
          .limit(5);

        if (eventsError) {
          console.error('Error fetching events:', eventsError);
        } else {
          setUpcomingEvents(events || []);
        }

        // Get performance stats
        const { data: stats, error: statsError } = await supabase
          .from(TABLES.PERFORMANCE_STATS)
          .select('*')
          .eq('player_id', childInfo.id)
          .order('created_at', { ascending: false })
          .limit(5);

        if (statsError) {
          console.error('Error fetching stats:', statsError);
        } else {
          setRecentStats(stats || []);
        }
      }

      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setIsLoading(false);
    }
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchDashboardData().finally(() => setRefreshing(false));
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>
          Please sign in to view your dashboard
        </Text>
        <Button
          title="Refresh"
          onPress={onRefresh}
          containerStyle={styles.buttonContainer}
        />
      </View>
    );
  }

  if (!childInfo) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>
          Unable to load profile information. Please try signing out and signing in again.
        </Text>
        <Button
          title="Refresh"
          onPress={onRefresh}
          containerStyle={styles.buttonContainer}
        />
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
      <Card containerStyle={styles.cardContainer}>
        <Text h4 style={styles.cardTitle}>Child Information</Text>
        <View style={styles.childInfoContainer}>
          <Avatar
            rounded
            size="large"
            title={`${childInfo.firstName?.[0]}${childInfo.lastName?.[0]}`}
            containerStyle={styles.avatar}
          />
          <View style={styles.childDetails}>
            <Text style={styles.childName}>
              {childInfo.firstName} {childInfo.lastName}
            </Text>
            <Text style={styles.teamName}>{team?.name || 'No team assigned'}</Text>
          </View>
        </View>
      </Card>

      {team?.teamPhotoUrl && (
        <Card containerStyle={styles.cardContainer}>
          <Text h4 style={styles.cardTitle}>Team Photo</Text>
          <Image 
            source={{ uri: team.teamPhotoUrl }}
            style={styles.teamPhoto}
          />
        </Card>
      )}

      <Card containerStyle={styles.cardContainer}>
        <Text h4 style={styles.cardTitle}>Upcoming Events</Text>
        {upcomingEvents.length > 0 ? (
          upcomingEvents.map((event) => (
            <TouchableOpacity
              key={event.id}
              onPress={() => {
                navigation.navigate('EventDetails', { eventId: event.id });
              }}
            >
              <View style={styles.eventItem}>
                <Text style={styles.eventTitle}>{event.title}</Text>
                <Text style={styles.eventDate}>
                  {format(new Date(event.startTime), 'MMM dd, yyyy h:mm a')}
                </Text>
                <Text style={styles.eventLocation}>{event.location}</Text>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.noDataText}>No upcoming events</Text>
        )}
      </Card>

      <Card containerStyle={styles.cardContainer}>
        <Text h4 style={styles.cardTitle}>Recent Performance</Text>
        {recentStats.length > 0 ? (
          recentStats.map((stat) => (
            <View key={stat.id} style={styles.statItem}>
              <Text style={styles.statCategory}>{stat.category}</Text>
              <Text style={styles.statValue}>{stat.value}</Text>
              {stat.notes && (
                <Text style={styles.statNotes}>{stat.notes}</Text>
              )}
            </View>
          ))
        ) : (
          <Text style={styles.noDataText}>No recent performance stats</Text>
        )}
        <Button
          title="View All Stats"
          onPress={() => navigation.navigate('ChildStats')}
          containerStyle={styles.buttonContainer}
        />
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
  cardContainer: {
    borderRadius: 10,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  cardTitle: {
    marginBottom: 15,
    textAlign: 'center',
  },
  childInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  avatar: {
    backgroundColor: '#2089dc',
    marginRight: 15,
  },
  childDetails: {
    flex: 1,
  },
  childName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  teamName: {
    fontSize: 16,
    color: '#666',
  },
  teamPhoto: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
    borderRadius: 5,
  },
  eventItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  eventDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  eventLocation: {
    fontSize: 14,
    color: '#666',
  },
  statItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  statCategory: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  statValue: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  statNotes: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  buttonContainer: {
    marginTop: 15,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  noDataText: {
    textAlign: 'center',
    color: '#666',
    paddingVertical: 10,
  },
});
