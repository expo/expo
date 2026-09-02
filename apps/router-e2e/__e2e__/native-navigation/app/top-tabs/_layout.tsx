import { TopTabs } from 'expo-router/js-top-tabs';
import { SafeAreaView } from 'react-native-screens/experimental';

export default function Layout() {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={{ top: true }}>
      <TopTabs screenOptions={{ headerShown: true }}>
        <TopTabs.Screen name="index" options={{ title: 'Home' }} />
        <TopTabs.Screen name="profile" options={{ title: 'Profile' }} />
        <TopTabs.Screen name="settings" options={{ title: 'Settings' }} />
        <TopTabs.Screen name="hidden" options={{ href: null }} />
      </TopTabs>
    </SafeAreaView>
  );
}
