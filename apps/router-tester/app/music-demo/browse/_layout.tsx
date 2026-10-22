import Stack from 'expo-router/stack';

export default function BrowseLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Browse', headerLargeTitle: true }} />
    </Stack>
  );
}
