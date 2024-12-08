import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { Card, Button, Input, ListItem, Overlay } from 'react-native-elements';
import { Picker } from '@react-native-picker/picker';
import { format } from 'date-fns';
import { supabase } from '../../services/supabase';
import { User, Event, PerformanceStat } from '../../types';
import { TABLES } from '../../constants/supabase';
import { sendPushNotification } from '../../services/notifications';
import { Text } from '../../components/Typography';

type PlayerStats = {
  [playerId: string]: {
    player: User;
    stats: PerformanceStat[];
  };
};

export default function PerformanceManagementScreen() {
  const [players, setPlayers] = useState<User[]>([]);
  const [matches, setMatches] = useState<Event[]>([]);
  const [playerStats, setPlayerStats] = useState<PlayerStats>({});
  const [selectedMatch, setSelectedMatch] = useState<string>('');
  const [showAddStats, setShowAddStats] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<string>('');
  const [newStat, setNewStat] = useState({
    category: 'Serves',
    value: '',
    notes: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch team players
      const { data: playersData, error: playersError } = await supabase
        .from(TABLES.USERS)
        .select('*')
        .eq('role', 'player');

      if (playersError) throw playersError;
      setPlayers(playersData);

      // Fetch matches
      const { data: matchesData, error: matchesError } = await supabase
        .from(TABLES.EVENTS)
        .select('*')
        .eq('type', 'match')
        .order('start_time', { ascending: false });

      if (matchesError) throw matchesError;
      setMatches(matchesData);

      // Fetch all stats
      const { data: statsData, error: statsError } = await supabase
        .from(TABLES.PERFORMANCE_STATS)
        .select('*')
        .order('created_at', { ascending: false });

      if (statsError) throw statsError;

      // Group stats by player
      const groupedStats: PlayerStats = {};
      playersData.forEach((player) => {
        groupedStats[player.id] = {
          player,
          stats: statsData.filter((stat) => stat.playerId === player.id),
        };
      });
      setPlayerStats(groupedStats);
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', 'Failed to load performance data');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const handleAddStats = async () => {
    if (!selectedMatch || !selectedPlayer || !newStat.value) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      const { data, error } = await supabase.from(TABLES.PERFORMANCE_STATS).insert([
        {
          playerId: selectedPlayer,
          matchId: selectedMatch,
          category: newStat.category,
          value: parseInt(newStat.value),
          notes: newStat.notes,
        },
      ]);

      if (error) throw error;

      // Send push notification to the player
      await sendPushNotification(
        [selectedPlayer],
        'New Performance Stats Added',
        `Your ${newStat.category} stats have been updated for the latest match.`
      );

      setShowAddStats(false);
      setNewStat({ category: 'Serves', value: '', notes: '' });
      fetchData();
      Alert.alert('Success', 'Stats added successfully');
    } catch (error) {
      console.error('Error adding stats:', error);
      Alert.alert('Error', 'Failed to add stats');
    }
  };

  const renderPlayerStats = (playerId: string) => {
    const { player, stats } = playerStats[playerId];
    const recentStats = stats.slice(0, 3);

    return (
      <Card key={playerId}>
        <Card.Title>{`${player.firstName} ${player.lastName}`}</Card.Title>
        <Button
          title="Add Stats"
          onPress={() => {
            setSelectedPlayer(playerId);
            setShowAddStats(true);
          }}
          containerStyle={styles.addButton}
        />

        {recentStats.length > 0 ? (
          recentStats.map((stat) => (
            <ListItem key={stat.id} bottomDivider>
              <ListItem.Content>
                <ListItem.Title>{stat.category}</ListItem.Title>
                <ListItem.Subtitle>
                  Value: {stat.value}
                  {'\n'}
                  {format(new Date(stat.createdAt), 'MMM dd, yyyy')}
                  {stat.notes && `\nNotes: ${stat.notes}`}
                </ListItem.Subtitle>
              </ListItem.Content>
            </ListItem>
          ))
        ) : (
          <Text style={styles.noStats}>No recent stats available</Text>
        )}

        <Button
          title="View Full History"
          type="outline"
          onPress={() => {
            // Navigate to detailed player stats screen
          }}
          containerStyle={styles.viewButton}
        />
      </Card>
    );
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
        <RefreshControl refreshing={refreshing} onRefresh={fetchData} />
      }
    >
      {players.map((player) => renderPlayerStats(player.id))}

      <Overlay
        isVisible={showAddStats}
        onBackdropPress={() => setShowAddStats(false)}
        overlayStyle={styles.overlay}
      >
        <ScrollView>
          <Text h4 style={styles.overlayTitle}>Add Performance Stats</Text>

          <Text style={styles.label}>Select Match:</Text>
          <Picker
            selectedValue={selectedMatch}
            onValueChange={setSelectedMatch}
            style={styles.picker}
          >
            <Picker.Item label="Select a match..." value="" />
            {matches.map((match) => (
              <Picker.Item
                key={match.id}
                label={`${match.title} (${format(
                  new Date(match.startTime),
                  'MMM dd, yyyy'
                )})`}
                value={match.id}
              />
            ))}
          </Picker>

          <Text style={styles.label}>Category:</Text>
          <Picker
            selectedValue={newStat.category}
            onValueChange={(value) => setNewStat({ ...newStat, category: value })}
            style={styles.picker}
          >
            <Picker.Item label="Serves" value="Serves" />
            <Picker.Item label="Spikes" value="Spikes" />
            <Picker.Item label="Blocks" value="Blocks" />
            <Picker.Item label="Digs" value="Digs" />
            <Picker.Item label="Assists" value="Assists" />
            <Picker.Item label="Points" value="Points" />
          </Picker>

          <Input
            label="Value"
            placeholder="Enter value"
            keyboardType="numeric"
            value={newStat.value}
            onChangeText={(value) => setNewStat({ ...newStat, value })}
          />

          <Input
            label="Notes (Optional)"
            placeholder="Add notes"
            multiline
            value={newStat.notes}
            onChangeText={(value) => setNewStat({ ...newStat, notes: value })}
          />

          <Button
            title="Add Stats"
            onPress={handleAddStats}
            containerStyle={styles.buttonContainer}
          />

          <Button
            title="Cancel"
            type="outline"
            onPress={() => setShowAddStats(false)}
            containerStyle={styles.buttonContainer}
          />
        </ScrollView>
      </Overlay>
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
  addButton: {
    marginBottom: 15,
  },
  viewButton: {
    marginTop: 10,
  },
  noStats: {
    textAlign: 'center',
    color: '#666',
    marginVertical: 10,
  },
  overlay: {
    width: '90%',
    maxHeight: '80%',
  },
  overlayTitle: {
    textAlign: 'center',
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: '#86939e',
    marginBottom: 5,
    marginLeft: 10,
  },
  picker: {
    backgroundColor: '#f2f2f2',
    marginBottom: 15,
  },
  buttonContainer: {
    marginVertical: 5,
  },
});
