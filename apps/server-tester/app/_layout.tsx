import { Stack } from 'expo-router';

import { Screen } from '@/components/Screen';
import { colors } from '@/components/theme';

export const unstable_settings = {
  anchor: 'index',
};

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerBackButtonDisplayMode: 'minimal',
        contentStyle: { backgroundColor: colors.background },
      }}
      screenLayout={({ children }) => <Screen>{children}</Screen>}
    />
  );
}
