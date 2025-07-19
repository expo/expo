import { Stack } from 'expo-router';

export const unstable_settings = {
  initialRouteName: 'orange',
};

export default function Layout() {
  return (
    <Stack
      screenOptions={{
        headerLargeTitle: true,
        headerLargeStyle: { backgroundColor: 'transparent' },
        headerStyle: { backgroundColor: 'transparent' },
        headerTransparent: true,
        headerBlurEffect: 'systemChromeMaterial',
      }}>
      <Stack.Screen
        name="index"
        options={{
          title: 'Face Gallery',
        }}
      />
      <Stack.Screen name="[face]" />
    </Stack>
  );
}
