import { Slot, Stack } from 'expo-router';

export default function Layout() {
  return (
    <Stack>
      <Stack.Screen name="modal" options={{ presentation: 'pageSheet', headerShown: false }} />
    </Stack>
  );
}
