import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { supabase } from '../../constants/supabase';
import { useAuth } from '../../hooks/useAuth';
import { Text } from '../../components/Typography';

interface Player {
  id: string;
  first_name: string;
  last_name: string;
  position: string;
  jersey_number: number;
}

const ManageTeamScreen = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    fetchPlayers();
  }, []);

  const fetchPlayers = async () => {
    try {
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .order('jersey_number');

      if (error) {
        throw error;
      }

      if (data) {
        setPlayers(data);
      }
    } catch (error) {
      console.error('Error fetching players:', error);
      Alert.alert('Error', 'Failed to load players');
    }
  };

  const handleAddPlayer = () => {
    // Navigate to add player form
    // This will be implemented in a future update
    Alert.alert('Coming Soon', 'Add player functionality will be available soon');
  };

  const handleEditPlayer = (player: Player) => {
    // Navigate to edit player form
    // This will be implemented in a future update
    Alert.alert('Coming Soon', 'Edit player functionality will be available soon');
  };

  const handleRemovePlayer = async (playerId: string) => {
    Alert.alert(
      'Confirm Removal',
      'Are you sure you want to remove this player?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('players')
                .delete()
                .eq('id', playerId);

              if (error) {
                throw error;
              }

              // Refresh the players list
              fetchPlayers();
            } catch (error) {
              console.error('Error removing player:', error);
              Alert.alert('Error', 'Failed to remove player');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Team Roster</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddPlayer}
        >
          <Text style={styles.addButtonText}>Add Player</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.playerList}>
        {players.map((player) => (
          <View key={player.id} style={styles.playerCard}>
            <View style={styles.playerInfo}>
              <Text style={styles.playerNumber}>#{player.jersey_number}</Text>
              <View style={styles.playerDetails}>
                <Text style={styles.playerName}>
                  {player.first_name} {player.last_name}
                </Text>
                <Text style={styles.playerPosition}>{player.position}</Text>
              </View>
            </View>
            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.actionButton, styles.editButton]}
                onPress={() => handleEditPlayer(player)}
              >
                <Text style={styles.actionButtonText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.removeButton]}
                onPress={() => handleRemovePlayer(player.id)}
              >
                <Text style={[styles.actionButtonText, styles.removeButtonText]}>
                  Remove
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  playerList: {
    flex: 1,
  },
  playerCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  playerNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#666',
    marginRight: 12,
  },
  playerDetails: {
    flex: 1,
  },
  playerName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  playerPosition: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    marginLeft: 8,
  },
  actionButtonText: {
    fontWeight: '600',
  },
  editButton: {
    backgroundColor: '#E3F2FD',
  },
  removeButton: {
    backgroundColor: '#FFEBEE',
  },
  removeButtonText: {
    color: '#D32F2F',
  },
});

export default ManageTeamScreen;
