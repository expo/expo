import { Tabs } from 'expo-router';

export default function Layout() {
  return (
    <Tabs screenOptions={{ headerShown: true }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="page1" />
      <Tabs.Screen name="page2" />
    </Tabs>
  );
}
