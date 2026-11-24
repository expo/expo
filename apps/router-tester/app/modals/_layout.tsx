import { Stack } from 'expo-router';

import { PRESENTATIONS } from '../../components/presentation-panel';

export default function Layout() {
  return (
    <Stack>
      <Stack.Screen
        name="[presentation]"
        options={({ route }) => {
          const param =
            route.params && 'presentation' in route.params ? route.params.presentation : undefined;
          // Any other value, such as `default`, leaves `presentation` unset.
          const presentation = PRESENTATIONS.find((p) => p === param);
          return {
            presentation,
            title: presentation ?? 'default',
            sheetAllowedDetents: [0.3, 0.6, 1],
            sheetGrabberVisible: true,
            // Transparent presentations need a background to keep the links readable.
            contentStyle:
              presentation === 'transparentModal' || presentation === 'containedTransparentModal'
                ? { backgroundColor: 'rgba(255, 255, 255, 0.8)' }
                : undefined,
          };
        }}
      />
      <Stack.Screen
        name="form-sheet"
        options={{
          presentation: 'formSheet',
          sheetAllowedDetents: [0.3, 0.6, 1],
          sheetGrabberVisible: true,
        }}
      />
      <Stack.Screen
        name="form-sheet-nested"
        options={{
          presentation: 'formSheet',
          headerShown: false,
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
    </Stack>
  );
}
