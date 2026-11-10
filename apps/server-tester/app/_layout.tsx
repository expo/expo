import { Slot, Stack, usePathname } from 'expo-router';

import { Screen } from '@/components/Screen';
import { colors } from '@/components/theme';

export default function RootLayout() {
  const pathname = usePathname();

  // The safe-area streaming test needs one route that renders without any navigator.
  if (pathname === '/rendering/safe-area') {
    return <Slot />;
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerBackButtonDisplayMode: 'minimal',
        contentStyle: { backgroundColor: colors.background },
        // Set at first render: an options update after hydration would remount the streamed content.
        headerShown: pathname !== '/rendering/safe-area-stack',
      }}
      screenLayout={({ children }) => <Screen>{children}</Screen>}
    />
  );
}
