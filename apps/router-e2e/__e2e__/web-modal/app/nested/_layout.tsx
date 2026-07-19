import { Stack } from 'expo-router';

export const unstable_settings = {
  anchor: 'page',
};

export default function Layout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="page" />
      <Stack.Screen
        name="sheet-radius"
        options={{
          presentation: 'formSheet',
          sheetAllowedDetents: [0.4],
          sheetCornerRadius: 40,
          sheetGrabberVisible: true,
        }}
      />
      <Stack.Screen
        name="modal-transparent"
        options={{
          presentation: 'transparentModal',
        }}
      />
    </Stack>
  );
}
