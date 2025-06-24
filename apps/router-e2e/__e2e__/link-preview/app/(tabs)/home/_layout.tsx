import { Stack } from 'expo-router';
import { PlatformColor } from 'react-native';

export default function Layout() {
  return (
    <Stack
      screenOptions={{
        headerTransparent: true,
        headerBlurEffect: 'systemChromeMaterial',
        headerShadowVisible: true,
        headerLargeTitleShadowVisible: false,
        headerLargeStyle: {
          backgroundColor: 'transparent',
        },
        headerLargeTitle: true,
        animation: 'default',
        headerTintColor: PlatformColor('label'),
      }}>
      <Stack.Screen
        name="video"
        options={{
          headerShown: false,
          headerTransparent: true,
          animationMatchesGesture: true,
          animation: 'none',
        }}
      />
      <Stack.Screen
        name="one"
        options={{
          title: 'Update',
        }}
      />
    </Stack>
  );
}
