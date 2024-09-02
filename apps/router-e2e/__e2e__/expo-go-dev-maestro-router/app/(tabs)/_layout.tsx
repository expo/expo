import { Tabs, router } from 'expo-router';

export default function () {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="two" />
      <Tabs.Screen name="hidden" options={{ href: null }} />
      <Tabs.Screen name="three" options={{ href: '/(tabs)/three/apple' }} />
    </Tabs>
  );
}
