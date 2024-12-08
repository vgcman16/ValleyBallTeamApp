import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { TABLES } from '../../constants/supabase';
import { Text } from '../../components/Typography';

interface StatRecord {
  id: string;
  category: string;
  value: number;
  created_at: string;
  match_id: string;
}

interface AggregatedStats {
  date: string;
  serves: number;
  spikes: number;
  blocks: number;
  matchId: string;
}

const ChildStatsScreen = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AggregatedStats[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    fetchChildStats();
  }, []);

  const aggregateStatsByDate = (records: StatRecord[]): AggregatedStats[] => {
    const statsByDate = records.reduce((acc: { [key: string]: AggregatedStats }, curr) => {
      const date = new Date(curr.created_at).toISOString().split('T')[0];
      
      if (!acc[date]) {
        acc[date] = {
          date,
          serves: 0,
          spikes: 0,
          blocks: 0,
          matchId: curr.match_id,
        };
      }
      
      switch (curr.category.toLowerCase()) {
        case 'serve':
          acc[date].serves += curr.value;
          break;
        case 'spike':
          acc[date].spikes += curr.value;
          break;
        case 'block':
          acc[date].blocks += curr.value;
          break;
      }
      
      return acc;
    }, {});

    return Object.values(statsByDate).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  };

  const fetchChildStats = async () => {
    try {
      if (!user) {
        console.log('Auth state:', { user, loading });
        setLoading(false);
        return;
      }

      console.log('Fetching stats for user:', user.id);
      const { data, error } = await supabase
        .from(TABLES.PERFORMANCE_STATS)
        .select(`
          id,
          category,
          value,
          created_at,
          match_id
        `)
        .eq('player_id', user.id)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching stats:', error);
        return;
      }

      if (data) {
        const aggregatedStats = aggregateStatsByDate(data);
        setStats(aggregatedStats);
      }
    } catch (error) {
      console.error('Error in fetchChildStats:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteStats = async (matchId: string) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from(TABLES.PERFORMANCE_STATS)
        .delete()
        .eq('match_id', matchId)
        .eq('player_id', user?.id);

      if (error) {
        console.error('Error deleting stats:', error);
        Alert.alert('Error', 'Failed to delete stats. Please try again.');
        return;
      }

      // Refresh stats after deletion
      fetchChildStats();
    } catch (error) {
      console.error('Error in deleteStats:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const confirmDeleteStats = (matchId: string, date: string) => {
    Alert.alert(
      'Delete Stats',
      `Are you sure you want to delete all stats for ${date}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteStats(matchId),
        },
      ],
    );
  };

  const clearTestData = async () => {
    try {
      setLoading(true);
      const { error } = await supabase
        .rpc('delete_future_stats', { player_uuid: user?.id });

      if (error) {
        console.error('Error clearing test data:', error);
        Alert.alert('Error', 'Failed to clear test data. Please try again.');
        return;
      }

      // Refresh stats after clearing test data
      fetchChildStats();
      Alert.alert('Success', 'Test data has been cleared.');
    } catch (error) {
      console.error('Error in clearTestData:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const confirmClearTestData = () => {
    Alert.alert(
      'Clear Test Data',
      'This will remove all performance stats with future dates. Are you sure?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: clearTestData,
        },
      ],
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (stats.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No performance data available yet.</Text>
          <Text style={styles.emptyStateSubtext}>Stats will appear here after matches.</Text>
        </View>
      </View>
    );
  }

  const chartData = {
    labels: stats.map(stat => 
      new Date(stat.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    ),
    datasets: [
      {
        data: stats.map(stat => stat.serves),
        color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
        strokeWidth: 2,
      },
      {
        data: stats.map(stat => stat.spikes),
        color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
        strokeWidth: 2,
      },
      {
        data: stats.map(stat => stat.blocks),
        color: (opacity = 1) => `rgba(255, 152, 0, ${opacity})`,
        strokeWidth: 2,
      },
    ],
    legend: ['Serves', 'Spikes', 'Blocks'],
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Performance Statistics</Text>
        <TouchableOpacity
          onPress={confirmClearTestData}
          style={styles.clearButton}
        >
          <Text style={styles.clearButtonText}>Clear Test Data</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Performance Trends</Text>
        <LineChart
          data={chartData}
          width={Dimensions.get('window').width - 32}
          height={220}
          yAxisSuffix=""
          yAxisInterval={1}
          chartConfig={{
            backgroundColor: '#ffffff',
            backgroundGradientFrom: '#ffffff',
            backgroundGradientTo: '#ffffff',
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(51, 51, 51, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(51, 51, 51, ${opacity})`,
            strokeWidth: 2,
            propsForLabels: {
              fontSize: 12,
            },
            propsForDots: {
              r: '4',
              strokeWidth: '2',
            },
            propsForVerticalLabels: {
              fontSize: 10,
              rotation: 0,
            },
            propsForHorizontalLabels: {
              fontSize: 10,
            },
          }}
          bezier
          style={{
            marginVertical: 8,
            borderRadius: 16,
          }}
          fromZero
          segments={4}
        />
      </View>

      <View style={styles.statsContainer}>
        {stats.map((stat, index) => (
          <View key={index} style={styles.statItem}>
            <View style={styles.statHeader}>
              <Text style={styles.statDate}>
                {new Date(stat.date).toLocaleDateString('en-US', { 
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </Text>
              <TouchableOpacity
                onPress={() => confirmDeleteStats(stat.matchId, stat.date)}
                style={styles.deleteButton}
              >
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.statGrid}>
              <View style={styles.statGridItem}>
                <View style={[styles.statIndicator, { backgroundColor: 'rgba(76, 175, 80, 0.2)' }]} />
                <Text style={styles.statLabel}>Serves</Text>
                <Text style={styles.statNumber}>{stat.serves}</Text>
              </View>
              <View style={styles.statGridItem}>
                <View style={[styles.statIndicator, { backgroundColor: 'rgba(33, 150, 243, 0.2)' }]} />
                <Text style={styles.statLabel}>Spikes</Text>
                <Text style={styles.statNumber}>{stat.spikes}</Text>
              </View>
              <View style={styles.statGridItem}>
                <View style={[styles.statIndicator, { backgroundColor: 'rgba(255, 152, 0, 0.2)' }]} />
                <Text style={styles.statLabel}>Blocks</Text>
                <Text style={styles.statNumber}>{stat.blocks}</Text>
              </View>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

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
  header: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
  },
  clearButton: {
    backgroundColor: '#ff4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  clearButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  chartContainer: {
    backgroundColor: '#ffffff',
    padding: 16,
    margin: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    color: '#000000',
  },
  statsContainer: {
    padding: 16,
  },
  statItem: {
    backgroundColor: '#ffffff',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  deleteButton: {
    backgroundColor: '#ff4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  deleteButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  statGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statGridItem: {
    flex: 1,
    alignItems: 'center',
    padding: 8,
  },
  statIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 2,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
  },
});

export default ChildStatsScreen;
