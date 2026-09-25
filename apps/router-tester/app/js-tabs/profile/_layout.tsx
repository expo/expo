import { Stack } from 'expo-router/js-stack';

export default function Layout() {
  return (
    <Stack screenOptions={{ headerShown: true }}>
      <Stack.Screen name="index" options={{ title: 'Profile' }} />
      <Stack.Screen name="details" options={{ title: 'Profile Details' }} />
    </Stack>
  );
}
