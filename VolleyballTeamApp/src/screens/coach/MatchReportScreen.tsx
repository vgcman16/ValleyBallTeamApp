import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  Platform,
  Share,
} from 'react-native';
import {
  Button,
  Input,
  ListItem,
  Card,
  Divider,
} from 'react-native-elements';
import { Picker } from '@react-native-picker/picker';
import RNFS from 'react-native-fs';
import { supabase } from '../../services/supabase';
import { TABLES } from '../../constants/supabase';
import { useAuth } from '../../hooks/useAuth';
import { Text } from '../../components/Typography';

type Match = {
  id: string;
  date: string;
  opponent: string;
  location: string;
  score: string;
  result: 'win' | 'loss';
};

type PlayerStats = {
  playerId: string;
  playerName: string;
  serves: number;
  aces: number;
  kills: number;
  blocks: number;
  digs: number;
  assists: number;
};

export default function MatchReportScreen() {
  const { user } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<string>('');
  const [playerStats, setPlayerStats] = useState<PlayerStats[]>([]);
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadMatches();
  }, []);

  const loadMatches = async () => {
    try {
      const { data, error } = await supabase
        .from(TABLES.MATCHES)
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;
      setMatches(data || []);
    } catch (error) {
      console.error('Error loading matches:', error);
      Alert.alert('Error', 'Failed to load matches');
    }
  };

  const loadPlayerStats = async (matchId: string) => {
    try {
      const { data, error } = await supabase
        .from(TABLES.MATCH_STATS)
        .select(`
          *,
          players (
            id,
            firstName,
            lastName
          )
        `)
        .eq('matchId', matchId);

      if (error) throw error;

      const stats: PlayerStats[] = (data || []).map((stat: any) => ({
        playerId: stat.players.id,
        playerName: `${stat.players.firstName} ${stat.players.lastName}`,
        serves: stat.serves,
        aces: stat.aces,
        kills: stat.kills,
        blocks: stat.blocks,
        digs: stat.digs,
        assists: stat.assists,
      }));

      setPlayerStats(stats);
    } catch (error) {
      console.error('Error loading player stats:', error);
      Alert.alert('Error', 'Failed to load player statistics');
    }
  };

  const handleMatchSelect = (matchId: string) => {
    setSelectedMatch(matchId);
    loadPlayerStats(matchId);
  };

  const generateReport = async () => {
    if (!selectedMatch) {
      Alert.alert('Error', 'Please select a match');
      return;
    }

    setIsLoading(true);
    try {
      const match = matches.find(m => m.id === selectedMatch);
      if (!match) throw new Error('Match not found');

      const report = generateReportContent(match);
      const fileName = `match_report_${match.date}_${match.opponent}.pdf`;
      const filePath = `${RNFS.DocumentDirectoryPath}/${fileName}`;

      // Save report as PDF (using react-native-html-to-pdf in a real implementation)
      await RNFS.writeFile(filePath, report, 'utf8');

      if (Platform.OS === 'ios') {
        await Share.share({
          url: filePath,
          title: fileName,
        });
      } else {
        await Share.share({
          message: report,
          title: fileName,
        });
      }
    } catch (error) {
      console.error('Error generating report:', error);
      Alert.alert('Error', 'Failed to generate match report');
    } finally {
      setIsLoading(false);
    }
  };

  const generateReportContent = (match: Match): string => {
    const teamStats = calculateTeamStats();
    
    return `
      Match Report
      
      Date: ${match.date}
      Opponent: ${match.opponent}
      Location: ${match.location}
      Final Score: ${match.score}
      Result: ${match.result.toUpperCase()}
      
      Team Statistics
      Total Serves: ${teamStats.serves}
      Total Aces: ${teamStats.aces}
      Total Kills: ${teamStats.kills}
      Total Blocks: ${teamStats.blocks}
      Total Digs: ${teamStats.digs}
      Total Assists: ${teamStats.assists}
      
      Individual Player Statistics
      ${playerStats.map(player => `
        ${player.playerName}
        Serves: ${player.serves}
        Aces: ${player.aces}
        Kills: ${player.kills}
        Blocks: ${player.blocks}
        Digs: ${player.digs}
        Assists: ${player.assists}
      `).join('\n')}
      
      Coach's Notes
      ${notes}
    `;
  };

  const calculateTeamStats = () => {
    return playerStats.reduce(
      (acc, player) => ({
        serves: acc.serves + player.serves,
        aces: acc.aces + player.aces,
        kills: acc.kills + player.kills,
        blocks: acc.blocks + player.blocks,
        digs: acc.digs + player.digs,
        assists: acc.assists + player.assists,
      }),
      { serves: 0, aces: 0, kills: 0, blocks: 0, digs: 0, assists: 0 }
    );
  };

  return (
    <ScrollView style={styles.container}>
      <Card>
        <Card.Title>Generate Match Report</Card.Title>
        <View style={styles.pickerContainer}>
          <Text style={styles.label}>Select Match</Text>
          <Picker
            selectedValue={selectedMatch}
            onValueChange={handleMatchSelect}
            style={styles.picker}
          >
            <Picker.Item label="Select a match..." value="" />
            {matches.map(match => (
              <Picker.Item
                key={match.id}
                label={`${match.date} vs ${match.opponent}`}
                value={match.id}
              />
            ))}
          </Picker>
        </View>
      </Card>

      {selectedMatch && (
        <>
          <Card>
            <Card.Title>Player Statistics</Card.Title>
            {playerStats.map((player, index) => (
              <View key={player.playerId}>
                <ListItem>
                  <ListItem.Content>
                    <ListItem.Title>{player.playerName}</ListItem.Title>
                    <View style={styles.statsGrid}>
                      <Text>Serves: {player.serves}</Text>
                      <Text>Aces: {player.aces}</Text>
                      <Text>Kills: {player.kills}</Text>
                      <Text>Blocks: {player.blocks}</Text>
                      <Text>Digs: {player.digs}</Text>
                      <Text>Assists: {player.assists}</Text>
                    </View>
                  </ListItem.Content>
                </ListItem>
                {index < playerStats.length - 1 && <Divider />}
              </View>
            ))}
          </Card>

          <Card>
            <Card.Title>Coach's Notes</Card.Title>
            <Input
              multiline
              numberOfLines={4}
              value={notes}
              onChangeText={setNotes}
              placeholder="Add any additional notes about the match..."
            />
          </Card>

          <View style={styles.buttonContainer}>
            <Button
              title="Generate Report"
              onPress={generateReport}
              loading={isLoading}
              disabled={isLoading}
            />
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  pickerContainer: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    color: '#86939e',
  },
  picker: {
    backgroundColor: '#fff',
    borderRadius: 5,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  buttonContainer: {
    padding: 15,
    marginBottom: 20,
  },
});
