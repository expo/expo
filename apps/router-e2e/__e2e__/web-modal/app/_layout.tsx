import { Stack } from 'expo-router';

export const unstable_settings = {
  anchor: 'index',
};

export default function Layout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen
        name="modal"
        options={{
          presentation: 'formSheet',
          sheetAllowedDetents: [0.5, 1],
          sheetGrabberVisible: true,
        }}
      />
      <Stack.Screen
        name="modal-multi"
        options={{
          presentation: 'formSheet',
          sheetAllowedDetents: [0.2, 0.5, 0.8, 0.98],
          sheetGrabberVisible: true,
        }}
      />
      <Stack.Screen
        name="modal-scroll"
        options={{
          presentation: 'modal',
          sheetCornerRadius: 0,
          sheetAllowedDetents: 'fitToContents',
        }}
      />
      <Stack.Screen
        name="modal-regular"
        options={{
          presentation: 'modal',
          sheetAllowedDetents: [0.4],
        }}
      />
      <Stack.Screen
        name="modal-regular-bg"
        options={{
          presentation: 'modal',
          sheetAllowedDetents: [0.8],
        }}
      />
      <Stack.Screen
        name="modal-fit"
        options={{
          presentation: 'formSheet',
          sheetCornerRadius: 12,
          webModalStyle: {
            minHeight: 0,
          },
          sheetAllowedDetents: 'fitToContents',
        }}
      />

      <Stack.Screen
        name="sheet-fit"
        options={{
          presentation: 'formSheet',
          sheetAllowedDetents: 'fitToContents',
          sheetGrabberVisible: true,
          sheetCornerRadius: 10,
        }}
      />
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
        name="sheet-bg"
        options={{
          presentation: 'formSheet',
          sheetAllowedDetents: [0.4],
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
