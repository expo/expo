import { Stack } from 'expo-router/js-stack';

import { JSHeaderTitle } from '../../components/demo-screen';

export default function Layout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerTitle: JSHeaderTitle,
      }}>
      <Stack.Screen name="index" options={{ title: 'Home' }} />
      <Stack.Screen name="details" options={{ title: 'Details' }} />
      <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
    </Stack>
  );
}
