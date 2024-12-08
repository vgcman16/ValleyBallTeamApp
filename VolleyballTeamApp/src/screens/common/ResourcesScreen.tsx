import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  RefreshControl,
  Linking,
  Platform,
} from 'react-native';
import { Card, Button, Icon, ListItem } from 'react-native-elements';
import * as DocumentPicker from 'react-native-document-picker';
import * as FileSystem from 'react-native-fs';
import { format } from 'date-fns';
import { supabase } from '../../services/supabase';
import { Resource } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { USER_ROLES, TABLES, STORAGE_BUCKETS } from '../../constants/supabase';
import { Text } from '../../components/Typography';

type FileType = 'pdf' | 'image' | 'video' | 'other';

export default function ResourcesScreen() {
  const { user } = useAuth();
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchResources();
  }, []);

  const fetchResources = async () => {
    try {
      const { data, error } = await supabase
        .from(TABLES.RESOURCES)
        .select('*, uploaded_by:users(first_name, last_name)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setResources(data);
    } catch (error) {
      console.error('Error fetching resources:', error);
      Alert.alert('Error', 'Failed to load resources');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const handleUpload = async () => {
    if (user?.role !== USER_ROLES.COACH) {
      Alert.alert('Error', 'Only coaches can upload resources');
      return;
    }

    try {
      const result = await DocumentPicker.pick({
        type: [DocumentPicker.types.allFiles],
      });

      setUploading(true);
      const file = result[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;

      // Read the file
      const fileContent = await FileSystem.readFile(file.uri, 'base64');

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKETS.RESOURCES)
        .upload(fileName, fileContent, {
          contentType: file.type,
        });

      if (uploadError) throw uploadError;

      // Create resource record
      const { data: resourceData, error: resourceError } = await supabase
        .from(TABLES.RESOURCES)
        .insert([
          {
            teamId: user.teamId,
            title: file.name,
            fileUrl: uploadData.path,
            fileType: getFileType(file.type),
            uploadedBy: user.id,
          },
        ]);

      if (resourceError) throw resourceError;

      fetchResources();
      Alert.alert('Success', 'Resource uploaded successfully');
    } catch (error) {
      if (DocumentPicker.isCancel(error)) {
        // User cancelled the picker
      } else {
        console.error('Error uploading resource:', error);
        Alert.alert('Error', 'Failed to upload resource');
      }
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (resource: Resource) => {
    try {
      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKETS.RESOURCES)
        .download(resource.fileUrl);

      if (error) throw error;

      // Create a local file URL
      const localPath = `${FileSystem.DocumentDirectoryPath}/${resource.title}`;
      await FileSystem.writeFile(localPath, await data.text(), 'utf8');

      // Open the file
      await Linking.openURL(`file://${localPath}`);
    } catch (error) {
      console.error('Error downloading resource:', error);
      Alert.alert('Error', 'Failed to download resource');
    }
  };

  const handleDelete = async (resourceId: string) => {
    if (user?.role !== USER_ROLES.COACH) {
      Alert.alert('Error', 'Only coaches can delete resources');
      return;
    }

    try {
      const { error } = await supabase
        .from(TABLES.RESOURCES)
        .delete()
        .eq('id', resourceId);

      if (error) throw error;

      setResources((prev) => prev.filter((r) => r.id !== resourceId));
      Alert.alert('Success', 'Resource deleted successfully');
    } catch (error) {
      console.error('Error deleting resource:', error);
      Alert.alert('Error', 'Failed to delete resource');
    }
  };

  const getFileType = (mimeType: string): FileType => {
    if (mimeType.includes('pdf')) return 'pdf';
    if (mimeType.includes('image')) return 'image';
    if (mimeType.includes('video')) return 'video';
    return 'other';
  };

  const getFileIcon = (fileType: FileType) => {
    switch (fileType) {
      case 'pdf':
        return 'file-pdf';
      case 'image':
        return 'image';
      case 'video':
        return 'video';
      default:
        return 'file';
    }
  };

  const renderResource = (resource: Resource) => (
    <ListItem key={resource.id} bottomDivider>
      <Icon
        name={getFileIcon(resource.fileType as FileType)}
        type="font-awesome"
        color="#2089dc"
      />
      <ListItem.Content>
        <ListItem.Title>{resource.title}</ListItem.Title>
        <ListItem.Subtitle>
          Uploaded by: {(resource.uploadedBy as any).first_name}{' '}
          {(resource.uploadedBy as any).last_name}
          {'\n'}
          {format(new Date(resource.created_at), 'MMM dd, yyyy')}
        </ListItem.Subtitle>
      </ListItem.Content>
      <Button
        icon={<Icon name="download" type="font-awesome" color="white" size={15} />}
        onPress={() => handleDownload(resource)}
      />
      {user?.role === USER_ROLES.COACH && (
        <Button
          icon={<Icon name="trash" type="font-awesome" color="white" size={15} />}
          buttonStyle={{ backgroundColor: '#ff0000' }}
          onPress={() => handleDelete(resource.id)}
        />
      )}
    </ListItem>
  );

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
        <RefreshControl refreshing={refreshing} onRefresh={fetchResources} />
      }
    >
      <Card>
        <View style={styles.cardHeader}>
          <Text h2>Team Resources</Text>
          {user?.role === USER_ROLES.COACH && (
            <Button
              title="Upload"
              onPress={handleUpload}
              loading={uploading}
              disabled={uploading}
            />
          )}
        </View>

        {resources.length === 0 ? (
          <Text style={styles.noResources}>No resources available</Text>
        ) : (
          resources.map(renderResource)
        )}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noResources: {
    textAlign: 'center',
    color: '#666',
    marginVertical: 20,
  },
});
