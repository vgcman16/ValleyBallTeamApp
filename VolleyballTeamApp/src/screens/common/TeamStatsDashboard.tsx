import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Alert,
  Text,
} from 'react-native';
import { Card, Button, ButtonGroup } from 'react-native-elements';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { supabase } from '../../services/supabase';
import { TABLES } from '../../constants/supabase';

type TeamStats = {
  serves: number;
  aces: number;
  kills: number;
  blocks: number;
  digs: number;
  assists: number;
  errors: number;
  points: number;
};

type MatchStats = TeamStats & {
  matchId: string;
  date: string;
  opponent: string;
  result: 'win' | 'loss';
};

const timeRanges = ['Last 5', 'Last 10', 'Season'];
const statCategories = ['Offense', 'Defense', 'Overall'];

export default function TeamStatsDashboard() {
  const [selectedTimeRange, setSelectedTimeRange] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState(0);
  const [matchStats, setMatchStats] = useState<MatchStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [winRate, setWinRate] = useState(0);

  useEffect(() => {
    loadTeamStats();
  }, [selectedTimeRange]);

  const loadTeamStats = async () => {
    try {
      setLoading(true);
      const matchLimit = selectedTimeRange === 0 ? 5 : selectedTimeRange === 1 ? 10 : 100;

      const { data, error } = await supabase
        .from(TABLES.MATCH_STATS)
        .select(`
          matches (
            id,
            date,
            opponent,
            result
          ),
          serves,
          aces,
          kills,
          blocks,
          digs,
          assists,
          errors,
          points
        `)
        .order('matches.date', { ascending: false })
        .limit(matchLimit);

      if (error) throw error;

      const formattedStats: MatchStats[] = (data || []).map((stat: any) => ({
        matchId: stat.matches.id,
        date: new Date(stat.matches.date).toLocaleDateString(),
        opponent: stat.matches.opponent,
        result: stat.matches.result,
        serves: stat.serves,
        aces: stat.aces,
        kills: stat.kills,
        blocks: stat.blocks,
        digs: stat.digs,
        assists: stat.assists,
        errors: stat.errors,
        points: stat.points,
      }));

      setMatchStats(formattedStats);
      calculateWinRate(formattedStats);
    } catch (error) {
      console.error('Error loading team stats:', error);
      Alert.alert('Error', 'Failed to load team statistics');
    } finally {
      setLoading(false);
    }
  };

  const calculateWinRate = (stats: MatchStats[]) => {
    const wins = stats.filter(stat => stat.result === 'win').length;
    setWinRate((wins / stats.length) * 100);
  };

  const getChartData = (category: string) => {
    const labels = matchStats.map(stat => stat.date);
    let datasets: number[] = [];

    switch (category) {
      case 'Offense':
        datasets = matchStats.map(stat => stat.kills + stat.aces);
        break;
      case 'Defense':
        datasets = matchStats.map(stat => stat.blocks + stat.digs);
        break;
      case 'Overall':
        datasets = matchStats.map(stat => stat.points);
        break;
    }

    return {
      labels,
      datasets: [{ data: datasets }],
    };
  };

  const renderPerformanceChart = () => {
    const chartData = getChartData(statCategories[selectedCategory]);
    
    return (
      <LineChart
        data={chartData}
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
    );
  };

  const renderTeamSummary = () => {
    if (matchStats.length === 0) return null;

    const averageStats = matchStats.reduce(
      (acc, stat) => ({
        serves: acc.serves + stat.serves / matchStats.length,
        aces: acc.aces + stat.aces / matchStats.length,
        kills: acc.kills + stat.kills / matchStats.length,
        blocks: acc.blocks + stat.blocks / matchStats.length,
        digs: acc.digs + stat.digs / matchStats.length,
        assists: acc.assists + stat.assists / matchStats.length,
        errors: acc.errors + stat.errors / matchStats.length,
        points: acc.points + stat.points / matchStats.length,
      }),
      { serves: 0, aces: 0, kills: 0, blocks: 0, digs: 0, assists: 0, errors: 0, points: 0 }
    );

    return (
      <Card>
        <Card.Title>Team Average Performance</Card.Title>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{averageStats.kills.toFixed(1)}</Text>
            <Text style={styles.statLabel}>Kills</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{averageStats.blocks.toFixed(1)}</Text>
            <Text style={styles.statLabel}>Blocks</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{averageStats.digs.toFixed(1)}</Text>
            <Text style={styles.statLabel}>Digs</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{averageStats.aces.toFixed(1)}</Text>
            <Text style={styles.statLabel}>Aces</Text>
          </View>
        </View>
      </Card>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Card>
        <Card.Title>Team Performance Dashboard</Card.Title>
        <ButtonGroup
          onPress={setSelectedTimeRange}
          selectedIndex={selectedTimeRange}
          buttons={timeRanges}
          containerStyle={styles.buttonGroup}
        />
        <ButtonGroup
          onPress={setSelectedCategory}
          selectedIndex={selectedCategory}
          buttons={statCategories}
          containerStyle={styles.buttonGroup}
        />
        {renderPerformanceChart()}
      </Card>

      <Card>
        <Card.Title>Win Rate</Card.Title>
        <View style={styles.winRateContainer}>
          <Text style={styles.winRateText}>{winRate.toFixed(1)}%</Text>
          <Text>Last {matchStats.length} matches</Text>
        </View>
      </Card>

      {renderTeamSummary()}

      <Card>
        <Card.Title>Recent Matches</Card.Title>
        {matchStats.slice(0, 5).map((match, index) => (
          <View key={match.matchId} style={styles.matchItem}>
            <Text style={styles.matchDate}>{match.date}</Text>
            <Text>vs {match.opponent}</Text>
            <Text style={[
              styles.matchResult,
              { color: match.result === 'win' ? '#4CAF50' : '#F44336' }
            ]}>
              {match.result.toUpperCase()}
            </Text>
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
  buttonGroup: {
    marginBottom: 10,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  statItem: {
    alignItems: 'center',
    marginVertical: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  statLabel: {
    fontSize: 12,
    color: '#86939e',
  },
  winRateContainer: {
    alignItems: 'center',
    padding: 20,
  },
  winRateText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  matchItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e8ee',
  },
  matchDate: {
    color: '#86939e',
  },
  matchResult: {
    fontWeight: 'bold',
  },
});
