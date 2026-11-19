import { Tabs } from 'expo-router/js-tabs';

export default function Layout() {
  return (
    <Tabs backBehavior="initialRoute">
      <Tabs.Screen name="index" options={{ title: 'First' }} />
      <Tabs.Screen name="second" options={{ title: 'Second' }} />
    </Tabs>
  );
}
