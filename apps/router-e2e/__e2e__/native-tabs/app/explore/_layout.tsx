import { Stack } from 'expo-router';

export default function Layout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ title: 'News' }} />
      <Stack.Screen
        name="news/[title]"
        options={{
          headerShown: true,
          headerLargeTitle: true,
          headerLargeStyle: { backgroundColor: 'transparent' },
          headerStyle: { backgroundColor: 'transparent' },
          headerTransparent: true,
          headerBlurEffect: 'systemChromeMaterial',
        }}
      />
    </Stack>
  );
}
