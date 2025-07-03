import { Stack } from 'expo-router';

export default function Layout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_bottom' }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="modal" options={{ presentation: 'modal', headerShown: true }} />
    </Stack>
  );
}
