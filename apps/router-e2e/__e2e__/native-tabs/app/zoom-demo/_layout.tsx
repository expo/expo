import { Stack } from 'expo-router';

export default function ZoomDemoLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="player" options={{ presentation: 'transparentModal' }} />
    </Stack>
  );
}
