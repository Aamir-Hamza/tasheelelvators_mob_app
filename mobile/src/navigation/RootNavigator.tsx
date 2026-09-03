import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';
import { useTheme } from '../theme/ThemeContext';
import { LoginScreen } from '../screens/LoginScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { ElevatorsScreen } from '../screens/ElevatorsScreen';
import { EmergencyScreen } from '../screens/EmergencyScreen';
import { MaintenanceScreen } from '../screens/MaintenanceScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { ElevatorDetailScreen } from '../screens/ElevatorDetailScreen';
import { TelemetryScreen } from '../screens/TelemetryScreen';
import { ChecklistScreen } from '../screens/ChecklistScreen';
import { RootStackParamList, TabParamList } from './types';
import { NotificationsProvider, useNotifications } from '../context/NotificationsContext';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

function Tabs() {
  const { t } = useI18n();
  const { theme } = useTheme();
  const { user } = useAuth();
  const { unread } = useNotifications();
  const staff = user?.role === 'admin' || user?.role === 'technician';

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.tabBar,
          borderTopColor: theme.border,
          height: 62,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarActiveTintColor: theme.accent,
        tabBarInactiveTintColor: theme.muted,
        tabBarLabelStyle: { fontWeight: '700', fontSize: 11 },
        tabBarIcon: ({ color, size }) => {
          const map: Record<string, keyof typeof Ionicons.glyphMap> = {
            Home: 'home',
            Elevators: 'business',
            Emergency: 'warning',
            Maintenance: 'construct',
            Profile: 'person',
          };
          return <Ionicons name={map[route.name]} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: t('home'),
          tabBarBadge: staff && unread ? unread : undefined,
        }}
      />
      <Tab.Screen name="Elevators" component={ElevatorsScreen} options={{ tabBarLabel: t('elevators') }} />
      <Tab.Screen name="Emergency" component={EmergencyScreen} options={{ tabBarLabel: t('emergency') }} />
      <Tab.Screen name="Maintenance" component={MaintenanceScreen} options={{ tabBarLabel: t('maintenance') }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: t('profile') }} />
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  const { user, loading } = useAuth();
  const { theme } = useTheme();
  const { t } = useI18n();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.bg }}>
        <ActivityIndicator color={theme.accent} />
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.bg },
        headerTintColor: theme.text,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: theme.bg },
      }}
    >
      {user ? (
        <>
          <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
          <Stack.Screen name="ElevatorDetail" component={ElevatorDetailScreen} options={{ title: t('elevators') }} />
          <Stack.Screen name="Telemetry" component={TelemetryScreen} options={{ title: t('telemetry') }} />
          <Stack.Screen name="Checklist" component={ChecklistScreen} options={{ title: t('checklist') }} />
        </>
      ) : (
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      )}
    </Stack.Navigator>
  );
}

function MainTabs() {
  return (
    <NotificationsProvider>
      <Tabs />
    </NotificationsProvider>
  );
}
