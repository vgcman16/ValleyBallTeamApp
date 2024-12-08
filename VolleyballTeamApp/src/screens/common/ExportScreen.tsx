import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import {
  Button,
  Card,
  CheckBox,
  Input,
  ButtonGroup,
  ListItem,
} from 'react-native-elements';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { ExportService } from '../../services/exportService';
import { supabase } from '../../services/supabase';
import { TABLES } from '../../constants/supabase';
import { Text } from '../../components/Typography';

type Player = {
  id: string;
  firstName: string;
  lastName: string;
};

type Match = {
  id: string;
  date: string;
  opponent: string;
};

export default function ExportScreen() {
  const [exportType, setExportType] = useState<'team' | 'player' | 'match'>('team');
  const [exportFormat, setExportFormat] = useState<'csv' | 'pdf'>('csv');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showStartDate, setShowStartDate] = useState(false);
  const [showEndDate, setShowEndDate] = useState(false);
  const [includeCharts, setIncludeCharts] = useState(true);
  const [selectedPlayer, setSelectedPlayer] = useState<string>('');
  const [selectedMatch, setSelectedMatch] = useState<string>('');
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(false);

  const exportService = ExportService.getInstance();

  useEffect(() => {
    loadPlayers();
    loadMatches();
  }, []);

  const loadPlayers = async () => {
    try {
      const { data, error } = await supabase
        .from(TABLES.PLAYERS)
        .select('id, firstName, lastName')
        .order('lastName');

      if (error) throw error;
      setPlayers(data || []);
    } catch (error) {
      console.error('Error loading players:', error);
      Alert.alert('Error', 'Failed to load players');
    }
  };

  const loadMatches = async () => {
    try {
      const { data, error } = await supabase
        .from(TABLES.MATCHES)
        .select('id, date, opponent')
        .order('date', { ascending: false });

      if (error) throw error;
      setMatches(data || []);
    } catch (error) {
      console.error('Error loading matches:', error);
      Alert.alert('Error', 'Failed to load matches');
    }
  };

  const handleExport = async () => {
    try {
      setLoading(true);

      const options = {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        playerId: selectedPlayer,
        matchId: selectedMatch,
        includeCharts: includeCharts && exportFormat === 'pdf',
      };

      const filePath = await exportService.exportData(
        exportFormat,
        exportType,
        options
      );

      await exportService.shareExport(filePath);
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Error', 'Failed to export data');
    } finally {
      setLoading(false);
    }
  };

  const renderDatePicker = (
    show: boolean,
    value: Date,
    onChange: (event: any, date?: Date) => void,
    onPress: () => void,
    label: string
  ) => (
    <View>
      <Text style={styles.label}>{label}</Text>
      {Platform.OS === 'ios' ? (
        <DateTimePicker
          value={value}
          mode="date"
          display="default"
          onChange={onChange}
          style={styles.datePicker}
        />
      ) : (
        <>
          <Button
            title={value.toLocaleDateString()}
            onPress={onPress}
            type="outline"
          />
          {show && (
            <DateTimePicker
              value={value}
              mode="date"
              display="default"
              onChange={onChange}
            />
          )}
        </>
      )}
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <Card>
        <Card.Title>Export Settings</Card.Title>

        <Text style={styles.label}>Export Type</Text>
        <ButtonGroup
          onPress={(index) => {
            const types: Array<'team' | 'player' | 'match'> = ['team', 'player', 'match'];
            setExportType(types[index]);
          }}
          selectedIndex={['team', 'player', 'match'].indexOf(exportType)}
          buttons={['Team', 'Player', 'Match']}
          containerStyle={styles.buttonGroup}
        />

        <Text style={styles.label}>Export Format</Text>
        <ButtonGroup
          onPress={(index) => {
            const formats: Array<'csv' | 'pdf'> = ['csv', 'pdf'];
            setExportFormat(formats[index]);
          }}
          selectedIndex={['csv', 'pdf'].indexOf(exportFormat)}
          buttons={['CSV', 'PDF']}
          containerStyle={styles.buttonGroup}
        />

        {exportType === 'player' && (
          <View style={styles.pickerContainer}>
            <Text style={styles.label}>Select Player</Text>
            <Picker
              selectedValue={selectedPlayer}
              onValueChange={setSelectedPlayer}
              style={styles.picker}
            >
              <Picker.Item label="Select a player..." value="" />
              {players.map(player => (
                <Picker.Item
                  key={player.id}
                  label={`${player.firstName} ${player.lastName}`}
                  value={player.id}
                />
              ))}
            </Picker>
          </View>
        )}

        {exportType === 'match' && (
          <View style={styles.pickerContainer}>
            <Text style={styles.label}>Select Match</Text>
            <Picker
              selectedValue={selectedMatch}
              onValueChange={setSelectedMatch}
              style={styles.picker}
            >
              <Picker.Item label="Select a match..." value="" />
              {matches.map(match => (
                <Picker.Item
                  key={match.id}
                  label={`${new Date(match.date).toLocaleDateString()} vs ${match.opponent}`}
                  value={match.id}
                />
              ))}
            </Picker>
          </View>
        )}

        {exportType !== 'match' && (
          <View style={styles.dateContainer}>
            {renderDatePicker(
              showStartDate,
              startDate,
              (event, date) => {
                setShowStartDate(false);
                if (date) setStartDate(date);
              },
              () => setShowStartDate(true),
              'Start Date'
            )}

            {renderDatePicker(
              showEndDate,
              endDate,
              (event, date) => {
                setShowEndDate(false);
                if (date) setEndDate(date);
              },
              () => setShowEndDate(true),
              'End Date'
            )}
          </View>
        )}

        {exportFormat === 'pdf' && (
          <CheckBox
            title="Include Charts"
            checked={includeCharts}
            onPress={() => setIncludeCharts(!includeCharts)}
            containerStyle={styles.checkbox}
          />
        )}

        <Button
          title={loading ? 'Exporting...' : 'Export'}
          onPress={handleExport}
          disabled={loading || (exportType === 'player' && !selectedPlayer) || (exportType === 'match' && !selectedMatch)}
          loading={loading}
          containerStyle={styles.exportButton}
        />
      </Card>

      <Card>
        <Card.Title>Recent Exports</Card.Title>
        <ListItem bottomDivider>
          <ListItem.Content>
            <ListItem.Title>Team Stats (CSV)</ListItem.Title>
            <ListItem.Subtitle>Exported on {new Date().toLocaleDateString()}</ListItem.Subtitle>
          </ListItem.Content>
          <Button
            title="Share"
            type="clear"
            onPress={() => {}}
          />
        </ListItem>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  label: {
    fontSize: 16,
    color: '#86939e',
    marginBottom: 5,
    marginTop: 10,
  },
  buttonGroup: {
    marginBottom: 20,
  },
  pickerContainer: {
    marginBottom: 20,
  },
  picker: {
    backgroundColor: '#fff',
    borderRadius: 5,
  },
  dateContainer: {
    marginBottom: 20,
  },
  datePicker: {
    backgroundColor: '#fff',
    borderRadius: 5,
    marginBottom: 10,
  },
  checkbox: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    marginLeft: 0,
    marginRight: 0,
  },
  exportButton: {
    marginTop: 20,
  },
});
