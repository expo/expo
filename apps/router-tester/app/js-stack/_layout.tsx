import { Stack } from 'expo-router/js-stack';

import { JSHeaderBackButton, JSHeaderTitle } from '../../components/demo-screen';

export default function Layout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerTitle: JSHeaderTitle,
        headerLeft: JSHeaderBackButton,
      }}>
      <Stack.Screen name="index" options={{ title: 'Home' }} />
      <Stack.Screen name="details" options={{ title: 'Details' }} />
      <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
    </Stack>
  );
}
