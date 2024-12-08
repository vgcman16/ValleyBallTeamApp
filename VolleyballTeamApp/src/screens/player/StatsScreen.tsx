import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  Dimensions,
} from 'react-native';
import { Card, Button } from 'react-native-elements';
import { LineChart } from 'react-native-chart-kit';
import { format } from 'date-fns';
import { supabase } from '../../services/supabase';
import { PerformanceStat } from '../../types';
import { TABLES } from '../../constants/supabase';
import { Text } from '../../components/Typography';

const STAT_CATEGORIES = [
  'Serves',
  'Spikes',
  'Blocks',
  'Digs',
  'Assists',
  'Points',
];

type StatsByCategory = {
  [key: string]: PerformanceStat[];
};

export default function StatsScreen() {
  const [stats, setStats] = useState<StatsByCategory>({});
  const [selectedCategory, setSelectedCategory] = useState(STAT_CATEGORIES[0]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { data, error } = await supabase
        .from(TABLES.PERFORMANCE_STATS)
        .select('*, match:events(title, start_time)')
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Group stats by category
      const groupedStats = data.reduce((acc: StatsByCategory, stat) => {
        if (!acc[stat.category]) {
          acc[stat.category] = [];
        }
        acc[stat.category].push(stat);
        return acc;
      }, {});

      setStats(groupedStats);
    } catch (error) {
      console.error('Error fetching stats:', error);
      Alert.alert('Error', 'Failed to load performance stats');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  const getChartData = () => {
    const categoryStats = stats[selectedCategory] || [];
    const last10Stats = categoryStats.slice(-10);

    return {
      labels: last10Stats.map((stat) => 
        format(new Date((stat.match as any).startTime), 'MM/dd')
      ),
      datasets: [
        {
          data: last10Stats.map((stat) => stat.value),
        },
      ],
    };
  };

  const calculateAverages = () => {
    const categoryStats = stats[selectedCategory] || [];
    if (categoryStats.length === 0) return { recent: 0, overall: 0 };

    const overall = categoryStats.reduce((sum, stat) => sum + stat.value, 0) / categoryStats.length;
    const recent = categoryStats
      .slice(-5)
      .reduce((sum, stat) => sum + stat.value, 0) / Math.min(categoryStats.length, 5);

    return {
      recent: Math.round(recent * 10) / 10,
      overall: Math.round(overall * 10) / 10,
    };
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  const averages = calculateAverages();

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <Card>
        <Card.Title>Performance Statistics</Card.Title>
        
        <View style={styles.categoryButtons}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {STAT_CATEGORIES.map((category) => (
              <Button
                key={category}
                title={category}
                type={selectedCategory === category ? 'solid' : 'outline'}
                onPress={() => setSelectedCategory(category)}
                containerStyle={styles.categoryButton}
              />
            ))}
          </ScrollView>
        </View>

        <View style={styles.averagesContainer}>
          <View style={styles.averageBox}>
            <Text style={styles.averageLabel}>Recent Average</Text>
            <Text style={styles.averageValue}>{averages.recent}</Text>
            <Text style={styles.averageSubtext}>(Last 5 matches)</Text>
          </View>
          <View style={styles.averageBox}>
            <Text style={styles.averageLabel}>Overall Average</Text>
            <Text style={styles.averageValue}>{averages.overall}</Text>
            <Text style={styles.averageSubtext}>(All matches)</Text>
          </View>
        </View>

        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>{selectedCategory} Trend</Text>
          <LineChart
            data={getChartData()}
            width={Dimensions.get('window').width - 60}
            height={220}
            chartConfig={{
              backgroundColor: '#ffffff',
              backgroundGradientFrom: '#ffffff',
              backgroundGradientTo: '#ffffff',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(32, 137, 220, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              style: {
                borderRadius: 16,
              },
              propsForDots: {
                r: '6',
                strokeWidth: '2',
                stroke: '#2089dc',
              },
            }}
            bezier
            style={styles.chart}
          />
        </View>

        <Card.Divider />

        <Text style={styles.recentMatchesTitle}>Recent Matches</Text>
        {(stats[selectedCategory] || []).slice(-5).reverse().map((stat) => (
          <View key={stat.id} style={styles.matchItem}>
            <Text style={styles.matchTitle}>
              {(stat.match as any).title}
            </Text>
            <Text style={styles.matchDate}>
              {format(new Date((stat.match as any).startTime), 'MMM dd, yyyy')}
            </Text>
            <Text style={styles.statValue}>
              {selectedCategory}: {stat.value}
            </Text>
            {stat.notes && (
              <Text style={styles.notes}>{stat.notes}</Text>
            )}
          </View>
        ))}
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
  categoryButtons: {
    marginBottom: 20,
  },
  categoryButton: {
    marginHorizontal: 5,
    minWidth: 80,
  },
  averagesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  averageBox: {
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    minWidth: 120,
  },
  averageLabel: {
    fontSize: 14,
    color: '#666',
  },
  averageValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2089dc',
  },
  averageSubtext: {
    fontSize: 12,
    color: '#999',
  },
  chartContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  recentMatchesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  matchItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  matchTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  matchDate: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  statValue: {
    fontSize: 14,
    color: '#2089dc',
    marginTop: 5,
  },
  notes: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 5,
  },
});
