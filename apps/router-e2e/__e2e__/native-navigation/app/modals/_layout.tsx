import { Stack } from 'expo-router';

export default function Layout() {
  return (
    <Stack>
      <Stack.Screen
        name="form-sheet"
        options={{
          presentation: 'formSheet',
          sheetAllowedDetents: [0.3, 0.6, 1],
          sheetGrabberVisible: true,
        }}
      />
      <Stack.Screen
        name="form-sheet-content"
        options={{
          presentation: 'formSheet',
          sheetAllowedDetents: 'fitToContents',
          sheetGrabberVisible: true,
        }}
      />
      <Stack.Screen
        name="page-sheet"
        options={{
          presentation: 'pageSheet',
        }}
      />
    </Stack>
  );
}
