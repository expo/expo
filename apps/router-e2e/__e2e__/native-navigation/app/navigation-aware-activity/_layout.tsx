import { Stack } from 'expo-router';

export default function Layout() {
  return (
    <Stack screenOptions={{ headerShown: true }}>
      <Stack.Screen name="index" options={{ title: 'Activity Home' }} />
      <Stack.Screen name="a" options={{ title: 'Screen A' }} />
      <Stack.Screen name="b" options={{ title: 'Screen B' }} />
    </Stack>
  );
}
