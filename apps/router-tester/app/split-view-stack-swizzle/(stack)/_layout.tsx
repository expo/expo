import { Stack } from 'expo-router';

import { ROOT_TITLE, useDemoState } from '@/components/split-view-stack-swizzle';

export default function Layout() {
  const { collapsed, gestureEnabled, largeTitle, rootHidden } = useDemoState();
  return (
    <Stack screenOptions={{ gestureEnabled }}>
      <Stack.Screen
        name="index"
        options={{
          title: ROOT_TITLE,
          headerLargeTitleEnabled: largeTitle,
          headerShown: !rootHidden,
          unstable_headerLeftItems: () =>
            collapsed
              ? [
                  {
                    type: 'button',
                    label: 'Back',
                    icon: { type: 'sfSymbol', name: 'chevron.backward' },
                    variant: 'plain',
                    onPress: () => {},
                  },
                ]
              : [],
        }}
      />
      <Stack.Screen name="detail" options={{ title: 'Stack detail' }} />
      <Stack.Screen name="deep" options={{ title: 'Stack deep detail' }} />
      <Stack.Screen name="modal" options={{ title: 'Stack modal', presentation: 'modal' }} />
    </Stack>
  );
}
