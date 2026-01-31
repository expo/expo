import { Stack, unstable_navigationEvents } from 'expo-router';

const appStart = Date.now();

unstable_navigationEvents.enable();
(['pageWillRender', 'pageFocused', 'pageBlurred', 'pageRemoved'] as const).forEach((eventType) => {
  unstable_navigationEvents.addListener(eventType, (event) => {
    console.log(
      `[${Date.now() - appStart}ms] ${eventType}:`,
      event.pathname,
      event.params,
      event.screenId
    );
  });
});
unstable_navigationEvents.saveCurrentPathname();

export default function Layout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="header-items"
        options={{
          presentation: 'formSheet',
          sheetAllowedDetents: [0.3, 0.5],
        }}
      />
    </Stack>
  );
}
