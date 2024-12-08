import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Input, Button } from '@rneui/themed';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Text } from '../../components/Typography';
import { TABLES } from '../../constants/supabase';
import { useNavigation } from '@react-navigation/native';

export default function CreateTeamScreen() {
  const navigation = useNavigation();
  const { userProfile, refreshUserProfile } = useAuth();
  const [teamName, setTeamName] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateTeam = async () => {
    if (!teamName.trim()) {
      Alert.alert('Error', 'Please enter a team name');
      return;
    }

    if (!userProfile?.id) {
      Alert.alert('Error', 'You must be logged in to create a team');
      return;
    }

    setIsLoading(true);
    try {
      // Create the team
      const { data: teamData, error: teamError } = await supabase
        .from(TABLES.TEAMS)
        .insert([
          {
            name: teamName.trim(),
            description: description.trim(),
          },
        ])
        .select()
        .single();

      if (teamError) throw teamError;

      // Update the user's team_id
      const { error: userError } = await supabase
        .from(TABLES.USERS)
        .update({ team_id: teamData.id })
        .eq('id', userProfile.id);

      if (userError) throw userError;

      // Refresh the user profile to get the updated team_id
      await refreshUserProfile();

      Alert.alert(
        'Success',
        'Team created successfully!',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('Error creating team:', error);
      Alert.alert('Error', 'Failed to create team. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text h2 style={styles.title}>Create Your Team</Text>
        <Input
          placeholder="Team Name"
          value={teamName}
          onChangeText={setTeamName}
          autoCapitalize="words"
          disabled={isLoading}
        />
        <Input
          placeholder="Description (optional)"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          disabled={isLoading}
        />
        <Button
          title={isLoading ? 'Creating Team...' : 'Create Team'}
          onPress={handleCreateTeam}
          loading={isLoading}
          disabled={isLoading}
          containerStyle={styles.buttonContainer}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    padding: 20,
  },
  title: {
    textAlign: 'center',
    marginBottom: 30,
  },
  buttonContainer: {
    marginTop: 20,
  },
});
