import { Tabs } from 'expo-router';

export default function Layout() {
  return (
    <Tabs>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="second" />
      <Tabs.Screen name="[id]" />
    </Tabs>
  );
}
