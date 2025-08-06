import { Stack } from 'expo-router';

const isAllowed = true;

export default function Layout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_bottom' }}>
      <Stack.Screen name="index" />
      <Stack.Protected guard={isAllowed}>
        <Stack.Screen name="one" />
      </Stack.Protected>
      <Stack.Screen name="modal" options={{ presentation: 'modal', headerShown: true }} />
      <Stack.Screen
        name="fullScreenModal"
        options={{ presentation: 'fullScreenModal', headerShown: true }}
      />
    </Stack>
  );
}
