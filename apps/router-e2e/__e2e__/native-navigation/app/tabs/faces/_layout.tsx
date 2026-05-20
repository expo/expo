import { Stack } from 'expo-router';
import { Platform } from 'react-native';

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
      <Stack.Screen
        name="[face]"
        options={
          Platform.OS === 'ios'
            ? {}
            : { headerTransparent: false, headerStyle: { backgroundColor: undefined } }
        }
      />
    </Stack>
  );
}
