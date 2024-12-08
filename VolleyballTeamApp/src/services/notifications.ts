import messaging from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, Alert, Linking } from 'react-native';
import { supabase } from './supabase';
import { TABLES } from '../constants/supabase';

export async function requestUserPermission() {
  if (Platform.OS === 'ios') {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (!enabled) {
      Alert.alert(
        'Push Notifications',
        'Please enable push notifications to receive team updates',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ]
      );
    }
  }
}

export async function getFCMToken() {
  let fcmToken = await AsyncStorage.getItem('fcmToken');

  if (!fcmToken) {
    try {
      fcmToken = await messaging().getToken();
      if (fcmToken) {
        await AsyncStorage.setItem('fcmToken', fcmToken);
      }
    } catch (error) {
      console.error('Error getting FCM token:', error);
    }
  }

  return fcmToken;
}

export async function updateUserFCMToken(userId: string) {
  const fcmToken = await getFCMToken();
  if (fcmToken) {
    try {
      await supabase
        .from(TABLES.USERS)
        .update({ fcmToken })
        .eq('id', userId);
    } catch (error) {
      console.error('Error updating FCM token:', error);
    }
  }
}

export const setupNotificationListeners = () => {
  // Handle background messages
  messaging().setBackgroundMessageHandler(async (remoteMessage) => {
    console.log('Message handled in the background:', remoteMessage);
  });

  // Handle foreground messages
  const unsubscribe = messaging().onMessage(async (remoteMessage) => {
    console.log('Received foreground message:', remoteMessage);
    // You can show a local notification here
  });

  // Handle notification open
  messaging().onNotificationOpenedApp((remoteMessage) => {
    console.log('Notification opened app:', remoteMessage);
    // Navigate to appropriate screen based on notification data
  });

  // Check if app was opened from a notification
  messaging()
    .getInitialNotification()
    .then((remoteMessage) => {
      if (remoteMessage) {
        console.log('App opened from quit state:', remoteMessage);
        // Navigate to appropriate screen based on notification data
      }
    });

  return unsubscribe;
};

export const sendPushNotification = async (
  userIds: string[],
  title: string,
  body: string,
  data?: object
) => {
  try {
    // Get FCM tokens for the specified users
    const { data: users, error } = await supabase
      .from(TABLES.USERS)
      .select('fcmToken')
      .in('id', userIds)
      .not('fcmToken', 'is', null);

    if (error) throw error;

    const tokens = users.map((user) => user.fcmToken);

    // Send to Firebase Cloud Messaging
    const message = {
      notification: {
        title,
        body,
      },
      data: data || {},
      tokens,
    };

    // You would typically send this to your backend to handle the actual sending
    // For demo purposes, we'll just log it
    console.log('Sending push notification:', message);
  } catch (error) {
    console.error('Error sending push notification:', error);
    throw error;
  }
};
