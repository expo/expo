import { Tabs } from 'expo-router/js-tabs';

export default function Layout() {
  return (
    <Tabs screenOptions={{ headerShown: true }}>
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
      <Tabs.Screen name="hidden" options={{ href: null }} />
    </Tabs>
  );
}
