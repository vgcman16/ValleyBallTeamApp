import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Image,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Button } from 'react-native-elements';
import { useNavigation, useRoute } from '@react-navigation/native';
import { launchImageLibrary } from 'react-native-image-picker';
import { supabase, uploadTeamPhoto } from '../../services/supabase';
import { useAuth } from '../../hooks/useAuth';
import { USER_ROLES, TABLES } from '../../constants/supabase';
import { Text } from '../../components/Typography';

const { width } = Dimensions.get('window');

export default function TeamPhotoScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  const [teamPhoto, setTeamPhoto] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const teamId = route.params?.teamId;

  useEffect(() => {
    fetchTeamPhoto();
  }, []);

  const fetchTeamPhoto = async () => {
    try {
      const { data, error } = await supabase
        .from(TABLES.TEAMS)
        .select('team_photo_url')
        .eq('id', teamId)
        .single();

      if (error) throw error;
      setTeamPhoto(data?.team_photo_url);
    } catch (error) {
      console.error('Error fetching team photo:', error);
      Alert.alert('Error', 'Failed to load team photo');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePhoto = async () => {
    if (user?.role !== USER_ROLES.COACH) {
      Alert.alert('Error', 'Only coaches can update the team photo');
      return;
    }

    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
      });

      if (result.assets && result.assets[0].uri) {
        setIsUploading(true);
        const photoPath = await uploadTeamPhoto(teamId, result.assets[0].uri);
        
        const { error } = await supabase
          .from(TABLES.TEAMS)
          .update({ team_photo_url: photoPath })
          .eq('id', teamId);

        if (error) throw error;
        
        setTeamPhoto(photoPath);
        Alert.alert('Success', 'Team photo updated successfully');
      }
    } catch (error) {
      console.error('Error updating team photo:', error);
      Alert.alert('Error', 'Failed to update team photo');
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.photoContainer}>
        {teamPhoto ? (
          <Image
            source={{ uri: teamPhoto }}
            style={styles.photo}
            resizeMode="contain"
          />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>No team photo available</Text>
          </View>
        )}
      </View>

      {user?.role === USER_ROLES.COACH && (
        <Button
          title={teamPhoto ? 'Update Team Photo' : 'Add Team Photo'}
          onPress={handleUpdatePhoto}
          loading={isUploading}
          containerStyle={styles.buttonContainer}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photo: {
    width: width - 40,
    height: width - 40,
    borderRadius: 10,
  },
  placeholder: {
    width: width - 40,
    height: width - 40,
    backgroundColor: '#f2f2f2',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#666',
    fontSize: 16,
  },
  buttonContainer: {
    marginVertical: 20,
  },
});
