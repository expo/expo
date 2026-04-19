import { Stack } from 'expo-router';

export default function MetricsLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Debug' }} />
    </Stack>
  );
}
