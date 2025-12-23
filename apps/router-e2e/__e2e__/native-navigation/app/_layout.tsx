import { Stack, unstable_navigationEvents } from 'expo-router';

const appStart = Date.now();

(['pageWillRender', 'pageFocused', 'pageBlurred', 'pageRemoved'] as const).forEach((eventType) => {
  unstable_navigationEvents.addListener(eventType, (event) => {
    console.log(`[${Date.now() - appStart}ms] ${eventType}:`, event.pathname, event.screenId);
  });
});

export default function Layout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="[param]" predefinedValues={['a', 'x']} options={{ title: 'Param' }} />
    </Stack>
  );
}
