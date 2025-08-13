import { Stack } from 'expo-router';

const isAllowed = false;

export default function Layout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Protected guard={isAllowed}>
        <Stack.Screen name="protected" />
      </Stack.Protected>
      <Stack.Screen name="modal" options={{ presentation: 'modal', headerShown: true }} />
      <Stack.Screen
        name="fullScreenModal"
        options={{ presentation: 'fullScreenModal', headerShown: true }}
      />
    </Stack>
  );
}
