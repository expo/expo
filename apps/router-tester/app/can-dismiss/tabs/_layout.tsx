import { Tabs } from 'expo-router/js-tabs';

export const unstable_settings = { anchor: 'index' };

export default function Layout() {
  return (
    <Tabs>
      <Tabs.Screen name="index" options={{ title: 'First' }} />
      <Tabs.Screen name="second" options={{ title: 'Second' }} />
    </Tabs>
  );
}
