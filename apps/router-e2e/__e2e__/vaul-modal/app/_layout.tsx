import { Stack } from 'expo-router';

export const unstable_settings = {
  anchor: 'index',
};

export default function Layout() {
  return (
    <Stack>
      <Stack.Screen name="index" />
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
        name="modal-full"
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
        name="modal-small"
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
          sheetCornerRadius: 32,
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
