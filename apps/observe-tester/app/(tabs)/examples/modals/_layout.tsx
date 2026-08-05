import { Stack } from 'expo-router';

import { useTheme } from '@/utils/theme';

export default function ModalsLayout() {
  const theme = useTheme();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.background.screen },
        headerTintColor: theme.text.default,
      }}>
      <Stack.Screen name="index" options={{ title: 'Modals' }} />
      <Stack.Screen
        name="modal"
        options={{ title: 'Modal', presentation: 'modal' }}
      />
      <Stack.Screen
        name="formsheet"
        options={{
          title: 'Form sheet',
          presentation: 'formSheet',
          sheetAllowedDetents: [0.5, 1],
          sheetGrabberVisible: true,
        }}
      />
      <Stack.Screen
        name="pagesheet"
        options={{ title: 'Page sheet', presentation: 'pageSheet' }}
      />
    </Stack>
  );
}
