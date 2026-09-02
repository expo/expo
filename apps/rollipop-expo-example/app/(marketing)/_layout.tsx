import { Stack } from 'expo-router';

// Group layout. `(marketing)` does NOT add a path segment — its children fold
// up to `/pricing` and `/terms`. The group still gets its own layout.
export default function MarketingLayout() {
  return (
    <Stack>
      <Stack.Screen name="pricing" options={{ title: 'Pricing' }} />
      <Stack.Screen name="terms" options={{ title: 'Terms' }} />
    </Stack>
  );
}
