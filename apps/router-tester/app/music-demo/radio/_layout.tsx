import Stack from 'expo-router/stack';

export default function RadioLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Radio', headerLargeTitle: true }} />
    </Stack>
  );
}
