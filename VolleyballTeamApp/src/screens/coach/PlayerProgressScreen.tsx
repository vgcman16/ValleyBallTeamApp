import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Dimensions,
  Alert,
  TouchableOpacity,
} from 'react-native';
import {
  Card,
  Button,
  SearchBar,
  ListItem,
  Avatar,
  Overlay,
} from 'react-native-elements';
import { LineChart, RadarChart } from 'react-native-chart-kit';
import { Picker } from '@react-native-picker/picker';
import { supabase } from '../../services/supabase';
import { TABLES } from '../../constants/supabase';
import { Text } from '../../components/Typography';

type Player = {
  id: string;
  firstName: string;
  lastName: string;
  position: string;
  jerseyNumber: string;
  imageUrl?: string;
};

type PlayerStats = {
  matchId: string;
  date: string;
  serves: number;
  aces: number;
  kills: number;
  blocks: number;
  digs: number;
  assists: number;
  errors: number;
};

type ProgressMetric = {
  category: string;
  current: number;
  previous: number;
  trend: 'up' | 'down' | 'stable';
};

export default function PlayerProgressScreen() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [playerStats, setPlayerStats] = useState<PlayerStats[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStat, setSelectedStat] = useState('kills');
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPlayers();
  }, []);

  useEffect(() => {
    if (selectedPlayer) {
      loadPlayerStats(selectedPlayer.id);
    }
  }, [selectedPlayer]);

  const loadPlayers = async () => {
    try {
      const { data, error } = await supabase
        .from(TABLES.PLAYERS)
        .select('*')
        .order('lastName');

      if (error) throw error;
      setPlayers(data || []);
    } catch (error) {
      console.error('Error loading players:', error);
      Alert.alert('Error', 'Failed to load players');
    } finally {
      setLoading(false);
    }
  };

  const loadPlayerStats = async (playerId: string) => {
    try {
      const { data, error } = await supabase
        .from(TABLES.MATCH_STATS)
        .select(`
          *,
          matches (
            date
          )
        `)
        .eq('playerId', playerId)
        .order('matches.date', { ascending: false })
        .limit(10);

      if (error) throw error;

      const formattedStats: PlayerStats[] = (data || []).map((stat: any) => ({
        matchId: stat.matchId,
        date: new Date(stat.matches.date).toLocaleDateString(),
        serves: stat.serves,
        aces: stat.aces,
        kills: stat.kills,
        blocks: stat.blocks,
        digs: stat.digs,
        assists: stat.assists,
        errors: stat.errors,
      }));

      setPlayerStats(formattedStats);
    } catch (error) {
      console.error('Error loading player stats:', error);
      Alert.alert('Error', 'Failed to load player statistics');
    }
  };

  const calculateProgressMetrics = (): ProgressMetric[] => {
    if (playerStats.length < 2) return [];

    const current = playerStats[0];
    const previous = playerStats[1];

    return [
      {
        category: 'Kills',
        current: current.kills,
        previous: previous.kills,
        trend: current.kills > previous.kills ? 'up' : current.kills < previous.kills ? 'down' : 'stable',
      },
      {
        category: 'Blocks',
        current: current.blocks,
        previous: previous.blocks,
        trend: current.blocks > previous.blocks ? 'up' : current.blocks < previous.blocks ? 'down' : 'stable',
      },
      {
        category: 'Digs',
        current: current.digs,
        previous: previous.digs,
        trend: current.digs > previous.digs ? 'up' : current.digs < previous.digs ? 'down' : 'stable',
      },
      {
        category: 'Aces',
        current: current.aces,
        previous: previous.aces,
        trend: current.aces > previous.aces ? 'up' : current.aces < previous.aces ? 'down' : 'stable',
      },
    ];
  };

  const renderProgressChart = () => {
    if (!playerStats.length) return null;

    const data = {
      labels: playerStats.map(stat => stat.date).reverse(),
      datasets: [{
        data: playerStats.map(stat => stat[selectedStat as keyof PlayerStats] as number).reverse(),
      }],
    };

    return (
      <Card>
        <Card.Title>{selectedStat.toUpperCase()} Progress</Card.Title>
        <Picker
          selectedValue={selectedStat}
          onValueChange={(value) => setSelectedStat(value)}
          style={styles.picker}
        >
          <Picker.Item label="Kills" value="kills" />
          <Picker.Item label="Blocks" value="blocks" />
          <Picker.Item label="Digs" value="digs" />
          <Picker.Item label="Aces" value="aces" />
          <Picker.Item label="Assists" value="assists" />
        </Picker>
        <LineChart
          data={data}
          width={Dimensions.get('window').width - 40}
          height={220}
          chartConfig={{
            backgroundColor: '#ffffff',
            backgroundGradientFrom: '#ffffff',
            backgroundGradientTo: '#ffffff',
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
            style: {
              borderRadius: 16,
            },
          }}
          bezier
          style={styles.chart}
        />
      </Card>
    );
  };

  const renderSkillRadar = () => {
    if (!playerStats.length) return null;

    const latestStats = playerStats[0];
    const data = {
      labels: ['Kills', 'Blocks', 'Digs', 'Aces', 'Assists'],
      datasets: [{
        data: [
          latestStats.kills,
          latestStats.blocks,
          latestStats.digs,
          latestStats.aces,
          latestStats.assists,
        ],
      }],
    };

    return (
      <Card>
        <Card.Title>Skill Distribution</Card.Title>
        <RadarChart
          data={data}
          width={Dimensions.get('window').width - 40}
          height={300}
          chartConfig={{
            backgroundColor: '#ffffff',
            backgroundGradientFrom: '#ffffff',
            backgroundGradientTo: '#ffffff',
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
          }}
          style={styles.chart}
        />
      </Card>
    );
  };

  const renderPlayerModal = () => (
    <Overlay
      isVisible={showPlayerModal}
      onBackdropPress={() => setShowPlayerModal(false)}
      overlayStyle={styles.overlay}
    >
      <ScrollView>
        <SearchBar
          placeholder="Search players..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          platform="ios"
          containerStyle={styles.searchBar}
        />
        {players
          .filter(player =>
            `${player.firstName} ${player.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
          )
          .map(player => (
            <ListItem
              key={player.id}
              onPress={() => {
                setSelectedPlayer(player);
                setShowPlayerModal(false);
              }}
              bottomDivider
            >
              <Avatar
                rounded
                source={player.imageUrl ? { uri: player.imageUrl } : undefined}
                title={`${player.firstName[0]}${player.lastName[0]}`}
              />
              <ListItem.Content>
                <ListItem.Title>
                  {player.firstName} {player.lastName}
                </ListItem.Title>
                <ListItem.Subtitle>
                  #{player.jerseyNumber} - {player.position}
                </ListItem.Subtitle>
              </ListItem.Content>
              <ListItem.Chevron />
            </ListItem>
          ))}
      </ScrollView>
    </Overlay>
  );

  return (
    <ScrollView style={styles.container}>
      <Card>
        <Button
          title={selectedPlayer ? `${selectedPlayer.firstName} ${selectedPlayer.lastName}` : "Select Player"}
          onPress={() => setShowPlayerModal(true)}
          type="outline"
        />
      </Card>

      {selectedPlayer && (
        <>
          {renderProgressChart()}
          {renderSkillRadar()}

          <Card>
            <Card.Title>Progress Metrics</Card.Title>
            <View style={styles.metricsGrid}>
              {calculateProgressMetrics().map((metric, index) => (
                <View key={index} style={styles.metricItem}>
                  <Text style={styles.metricLabel}>{metric.category}</Text>
                  <Text style={styles.metricValue}>{metric.current}</Text>
                  <Text style={[
                    styles.metricTrend,
                    {
                      color: metric.trend === 'up'
                        ? '#4CAF50'
                        : metric.trend === 'down'
                          ? '#F44336'
                          : '#757575'
                    }
                  ]}>
                    {metric.trend === 'up' ? '↑' : metric.trend === 'down' ? '↓' : '→'}
                  </Text>
                </View>
              ))}
            </View>
          </Card>
        </>
      )}

      {renderPlayerModal()}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  picker: {
    marginBottom: 10,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  overlay: {
    width: '90%',
    maxHeight: '80%',
  },
  searchBar: {
    backgroundColor: 'transparent',
    borderTopWidth: 0,
    borderBottomWidth: 0,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  metricItem: {
    alignItems: 'center',
    width: '45%',
    marginVertical: 10,
    padding: 10,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  metricLabel: {
    fontSize: 14,
    color: '#86939e',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 5,
  },
  metricTrend: {
    fontSize: 20,
    fontWeight: 'bold',
  },
});
