import Stack from 'expo-router/stack';

export default function ListenNowLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Home', headerLargeTitle: true }} />
    </Stack>
  );
}
