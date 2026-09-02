import { Tabs } from 'expo-router';

export default function OldTabsLayout() {
  return (
    <Tabs>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="new-tabs" />
    </Tabs>
  );
}
