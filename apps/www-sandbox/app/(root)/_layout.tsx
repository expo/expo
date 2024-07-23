import { Slot, Stack, Tabs } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { View } from 'react-native';
import SideBarNav from '@/components/www/side-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function Layout() {
  return <Slot />;
  if (process.env.EXPO_OS === 'web') {
  }
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
      }}
    />
  );
}
