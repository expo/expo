import { Stack } from 'expo-router';

export default function StackShowcaseLayout() {
  return (
    <Stack
      screenOptions={{
        headerLargeTitleEnabled: true,
        headerLargeStyle: { backgroundColor: 'transparent' },
        headerStyle: { backgroundColor: 'transparent' },
        headerTransparent: true,
        headerBlurEffect: 'none',
      }}>
      <Stack.Screen
        name="index"
        options={{ title: process.env.EXPO_OS === 'ios' ? 'Movies' : '' }}
      />
    </Stack>
  );
}
