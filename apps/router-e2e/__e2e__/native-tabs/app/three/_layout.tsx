import { Stack } from 'expo-router';

export const unstable_settings = {
  initialRouteName: 'orange',
};

export default function Layout() {
  return (
    <Stack>
      <Stack.Screen
        name="orange"
        options={{
          headerLargeTitle: true,
          headerLargeStyle: {
            backgroundColor: 'transparent',
          },
          headerBlurEffect: 'extraLight',
          headerTransparent: true,
        }}
      />
    </Stack>
  );
}
