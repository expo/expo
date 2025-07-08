import { Stack } from 'expo-router';

export const unstable_settings = {
  anchor: 'modal-regular',
};

export default function Layout() {
  return (
    <Stack>
      <Stack.Screen name="[test]/modal-regular" />
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
