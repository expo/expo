import Stack from '@/components/layout/stack';

export const unstable_settings = {
  anchor: 'explore',
};

export default function ExploreLayout() {
  return (
    <Stack>
      <Stack.Screen name="explore" options={{ headerShown: false }} />
    </Stack>
  );
}
