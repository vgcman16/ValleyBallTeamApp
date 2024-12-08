import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { USER_ROLES } from '../constants/supabase';
import { RootStackParamList, CoachStackParamList, PlayerStackParamList, ParentStackParamList } from './types';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import SignupScreen from '../screens/auth/SignupScreen';

// Coach Screens
import CoachDashboardScreen from '../screens/coach/DashboardScreen';
import ManageTeamScreen from '../screens/coach/ManageTeamScreen';
import AddEventScreen from '../screens/coach/AddEventScreen';
import TeamTacticsScreen from '../screens/coach/TeamTacticsScreen';
import CreateTeamScreen from '../screens/coach/CreateTeamScreen';
import ManageRegistrationCodesScreen from '../screens/coach/ManageRegistrationCodesScreen';

// Player Screens
import PlayerDashboardScreen from '../screens/player/DashboardScreen';
import PlayerStatsScreen from '../screens/player/StatsScreen';

// Parent Screens
import ParentDashboardScreen from '../screens/parent/DashboardScreen';
import ChildStatsScreen from '../screens/parent/ChildStatsScreen';

// Common Screens
import EventDetailsScreen from '../screens/common/EventDetailsScreen';
import TeamPhotoScreen from '../screens/common/TeamPhotoScreen';
import CalendarScreen from '../screens/common/CalendarScreen';
import ChatScreen from '../screens/common/ChatScreen';
import ResourcesScreen from '../screens/common/ResourcesScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
const CoachStack = createNativeStackNavigator<CoachStackParamList>();
const PlayerStack = createNativeStackNavigator<PlayerStackParamList>();
const ParentStack = createNativeStackNavigator<ParentStackParamList>();
const Tab = createBottomTabNavigator();

const CoachTabs = () => (
  <Tab.Navigator>
    <Tab.Screen 
      name="Dashboard" 
      component={CoachDashboardScreen}
      options={{ title: 'Dashboard' }}
    />
    <Tab.Screen 
      name="Calendar" 
      component={CalendarScreen}
      options={{ title: 'Calendar' }}
    />
    <Tab.Screen 
      name="Chat" 
      component={ChatScreen}
      options={{ title: 'Team Chat' }}
    />
    <Tab.Screen 
      name="Resources" 
      component={ResourcesScreen}
      options={{ title: 'Resources' }}
    />
  </Tab.Navigator>
);

const PlayerTabs = () => (
  <Tab.Navigator>
    <Tab.Screen 
      name="Dashboard" 
      component={PlayerDashboardScreen}
      options={{ title: 'Dashboard' }}
    />
    <Tab.Screen 
      name="Stats" 
      component={PlayerStatsScreen}
      options={{ title: 'My Stats' }}
    />
    <Tab.Screen 
      name="Calendar" 
      component={CalendarScreen}
      options={{ title: 'Calendar' }}
    />
    <Tab.Screen 
      name="Chat" 
      component={ChatScreen}
      options={{ title: 'Team Chat' }}
    />
    <Tab.Screen 
      name="Resources" 
      component={ResourcesScreen}
      options={{ title: 'Resources' }}
    />
  </Tab.Navigator>
);

const ParentTabs = () => (
  <Tab.Navigator>
    <Tab.Screen 
      name="Dashboard" 
      component={ParentDashboardScreen}
      options={{ title: 'Dashboard' }}
    />
    <Tab.Screen 
      name="Calendar" 
      component={CalendarScreen}
      options={{ title: 'Calendar' }}
    />
    <Tab.Screen 
      name="Chat" 
      component={ChatScreen}
      options={{ title: 'Team Chat' }}
    />
    <Tab.Screen 
      name="Resources" 
      component={ResourcesScreen}
      options={{ title: 'Resources' }}
    />
  </Tab.Navigator>
);

const CoachStackNavigator = () => (
  <CoachStack.Navigator>
    <CoachStack.Screen
      name="CoachTabs"
      component={CoachTabs}
      options={{ headerShown: false }}
    />
    <CoachStack.Screen
      name="CreateTeam"
      component={CreateTeamScreen}
      options={{ title: 'Create Team' }}
    />
    <CoachStack.Screen
      name="ManageTeam"
      component={ManageTeamScreen}
      options={{ title: 'Manage Team' }}
    />
    <CoachStack.Screen
      name="ManageRegistrationCodes"
      component={ManageRegistrationCodesScreen}
      options={{ title: 'Registration Codes' }}
    />
    <CoachStack.Screen
      name="AddEvent"
      component={AddEventScreen}
      options={{ title: 'Add Event' }}
    />
    <CoachStack.Screen
      name="EventDetails"
      component={EventDetailsScreen}
      options={{ title: 'Event Details' }}
    />
    <CoachStack.Screen
      name="TeamPhoto"
      component={TeamPhotoScreen}
      options={{ title: 'Team Photo' }}
    />
  </CoachStack.Navigator>
);

const PlayerStackNavigator = () => (
  <PlayerStack.Navigator>
    <PlayerStack.Screen
      name="PlayerTabs"
      component={PlayerTabs}
      options={{ headerShown: false }}
    />
    <PlayerStack.Screen
      name="EventDetails"
      component={EventDetailsScreen}
      options={{ title: 'Event Details' }}
    />
  </PlayerStack.Navigator>
);

const ParentStackNavigator = () => (
  <ParentStack.Navigator>
    <ParentStack.Screen
      name="ParentTabs"
      component={ParentTabs}
      options={{ headerShown: false }}
    />
    <ParentStack.Screen
      name="EventDetails"
      component={EventDetailsScreen}
      options={{ title: 'Event Details' }}
    />
    <ParentStack.Screen
      name="ChildStats"
      component={ChildStatsScreen}
      options={{ title: 'Child Stats' }}
    />
  </ParentStack.Navigator>
);

const MainTabs = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  switch (user.role) {
    case USER_ROLES.COACH:
      return <CoachStackNavigator />;
    case USER_ROLES.PLAYER:
      return <PlayerStackNavigator />;
    case USER_ROLES.PARENT:
      return <ParentStackNavigator />;
    default:
      return null;
  }
};

export const AppNavigator = () => {
  const { user } = useAuth();

  return (
    <Stack.Navigator>
      {!user ? (
        <>
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Signup"
            component={SignupScreen}
            options={{ headerShown: false }}
          />
        </>
      ) : (
        <Stack.Screen
          name="Main"
          component={MainTabs}
          options={{ headerShown: false }}
        />
      )}
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
