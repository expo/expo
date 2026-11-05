import { Stack } from 'expo-router';

import { useDemoState } from '@/components/split-view-stack-swizzle';

export default function Layout() {
  const { gestureEnabled } = useDemoState();
  return (
    <Stack screenOptions={{ gestureEnabled }}>
      <Stack.Screen name="index" options={{ title: 'Stack root' }} />
      <Stack.Screen name="detail" options={{ title: 'Stack detail' }} />
      <Stack.Screen name="deep" options={{ title: 'Stack deep detail' }} />
      <Stack.Screen name="modal" options={{ title: 'Stack modal', presentation: 'modal' }} />
    </Stack>
  );
}
