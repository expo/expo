import Stack from '@/components/layout/stack';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Home' }} />
      <Stack.Screen name="info" options={{ headerShown: false, presentation: 'modal' }} />
    </Stack>
  );
}
