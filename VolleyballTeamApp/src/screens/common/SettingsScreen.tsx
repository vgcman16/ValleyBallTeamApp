import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
  Linking,
} from 'react-native';
import { ListItem, Switch, Button, Text, Icon } from 'react-native-elements';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../services/supabase';
import { TABLES } from '../../constants/supabase';
import { requestUserPermission } from '../../services/notifications';

type NotificationSettings = {
  events: boolean;
  chat: boolean;
  stats: boolean;
  resources: boolean;
};

type ThemePreference = 'light' | 'dark' | 'system';

export default function SettingsScreen() {
  const { user, signOut } = useAuth();
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    events: true,
    chat: true,
    stats: true,
    resources: true,
  });
  const [theme, setTheme] = useState<ThemePreference>('system');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      // Load notification settings
      const storedSettings = await AsyncStorage.getItem('notificationSettings');
      if (storedSettings) {
        setNotificationSettings(JSON.parse(storedSettings));
      }

      // Load theme preference
      const storedTheme = await AsyncStorage.getItem('themePreference');
      if (storedTheme) {
        setTheme(storedTheme as ThemePreference);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNotificationToggle = async (setting: keyof NotificationSettings) => {
    try {
      const newSettings = {
        ...notificationSettings,
        [setting]: !notificationSettings[setting],
      };
      setNotificationSettings(newSettings);
      await AsyncStorage.setItem('notificationSettings', JSON.stringify(newSettings));

      if (newSettings[setting]) {
        // If enabling notifications, request permission
        await requestUserPermission();
      }
    } catch (error) {
      console.error('Error updating notification settings:', error);
      Alert.alert('Error', 'Failed to update notification settings');
    }
  };

  const handleThemeChange = async (newTheme: ThemePreference) => {
    try {
      setTheme(newTheme);
      await AsyncStorage.setItem('themePreference', newTheme);
      // You would typically update your app's theme here
    } catch (error) {
      console.error('Error updating theme:', error);
      Alert.alert('Error', 'Failed to update theme preference');
    }
  };

  const handleDeleteAccount = async () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from(TABLES.USERS)
                .delete()
                .eq('id', user?.id);

              if (error) throw error;

              await signOut();
              Alert.alert('Success', 'Your account has been deleted');
            } catch (error) {
              console.error('Error deleting account:', error);
              Alert.alert('Error', 'Failed to delete account');
            }
          },
        },
      ]
    );
  };

  const handleContactSupport = () => {
    Linking.openURL('mailto:support@volleyballapp.com');
  };

  const handlePrivacyPolicy = () => {
    Linking.openURL('https://volleyballapp.com/privacy');
  };

  const handleTermsOfService = () => {
    Linking.openURL('https://volleyballapp.com/terms');
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text h4 style={styles.sectionTitle}>Account</Text>
      <ListItem bottomDivider>
        <Icon name="person" type="material" />
        <ListItem.Content>
          <ListItem.Title>Name</ListItem.Title>
          <ListItem.Subtitle>{user?.firstName} {user?.lastName}</ListItem.Subtitle>
        </ListItem.Content>
      </ListItem>
      <ListItem bottomDivider>
        <Icon name="email" type="material" />
        <ListItem.Content>
          <ListItem.Title>Email</ListItem.Title>
          <ListItem.Subtitle>{user?.email}</ListItem.Subtitle>
        </ListItem.Content>
      </ListItem>

      <Text h4 style={styles.sectionTitle}>Notifications</Text>
      <ListItem bottomDivider>
        <ListItem.Content>
          <ListItem.Title>Event Updates</ListItem.Title>
          <ListItem.Subtitle>Receive notifications about team events</ListItem.Subtitle>
        </ListItem.Content>
        <Switch
          value={notificationSettings.events}
          onValueChange={() => handleNotificationToggle('events')}
        />
      </ListItem>
      <ListItem bottomDivider>
        <ListItem.Content>
          <ListItem.Title>Chat Messages</ListItem.Title>
          <ListItem.Subtitle>Receive notifications for new messages</ListItem.Subtitle>
        </ListItem.Content>
        <Switch
          value={notificationSettings.chat}
          onValueChange={() => handleNotificationToggle('chat')}
        />
      </ListItem>
      <ListItem bottomDivider>
        <ListItem.Content>
          <ListItem.Title>Performance Stats</ListItem.Title>
          <ListItem.Subtitle>Receive notifications about stat updates</ListItem.Subtitle>
        </ListItem.Content>
        <Switch
          value={notificationSettings.stats}
          onValueChange={() => handleNotificationToggle('stats')}
        />
      </ListItem>
      <ListItem bottomDivider>
        <ListItem.Content>
          <ListItem.Title>New Resources</ListItem.Title>
          <ListItem.Subtitle>Receive notifications about new team resources</ListItem.Subtitle>
        </ListItem.Content>
        <Switch
          value={notificationSettings.resources}
          onValueChange={() => handleNotificationToggle('resources')}
        />
      </ListItem>

      <Text h4 style={styles.sectionTitle}>Appearance</Text>
      <ListItem>
        <Icon name="palette" type="material" />
        <ListItem.Content>
          <ListItem.Title>Theme</ListItem.Title>
          <View style={styles.themeButtons}>
            <Button
              title="Light"
              type={theme === 'light' ? 'solid' : 'outline'}
              onPress={() => handleThemeChange('light')}
              containerStyle={styles.themeButton}
            />
            <Button
              title="Dark"
              type={theme === 'dark' ? 'solid' : 'outline'}
              onPress={() => handleThemeChange('dark')}
              containerStyle={styles.themeButton}
            />
            <Button
              title="System"
              type={theme === 'system' ? 'solid' : 'outline'}
              onPress={() => handleThemeChange('system')}
              containerStyle={styles.themeButton}
            />
          </View>
        </ListItem.Content>
      </ListItem>

      <Text h4 style={styles.sectionTitle}>Support</Text>
      <ListItem bottomDivider onPress={handleContactSupport}>
        <Icon name="help" type="material" />
        <ListItem.Content>
          <ListItem.Title>Contact Support</ListItem.Title>
        </ListItem.Content>
        <ListItem.Chevron />
      </ListItem>
      <ListItem bottomDivider onPress={handlePrivacyPolicy}>
        <Icon name="security" type="material" />
        <ListItem.Content>
          <ListItem.Title>Privacy Policy</ListItem.Title>
        </ListItem.Content>
        <ListItem.Chevron />
      </ListItem>
      <ListItem bottomDivider onPress={handleTermsOfService}>
        <Icon name="description" type="material" />
        <ListItem.Content>
          <ListItem.Title>Terms of Service</ListItem.Title>
        </ListItem.Content>
        <ListItem.Chevron />
      </ListItem>

      <View style={styles.buttonContainer}>
        <Button
          title="Sign Out"
          onPress={signOut}
          type="outline"
          containerStyle={styles.button}
        />
        <Button
          title="Delete Account"
          onPress={handleDeleteAccount}
          buttonStyle={{ backgroundColor: '#ff0000' }}
          containerStyle={styles.button}
        />
      </View>
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
  sectionTitle: {
    padding: 15,
    backgroundColor: '#f5f5f5',
  },
  themeButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  themeButton: {
    flex: 1,
    marginHorizontal: 5,
  },
  buttonContainer: {
    padding: 15,
  },
  button: {
    marginVertical: 5,
  },
});
