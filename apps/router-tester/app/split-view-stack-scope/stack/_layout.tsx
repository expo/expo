import { Stack } from 'expo-router';

import { useScopeOptions } from '../../../components/split-stack-scope';

export const unstable_settings = { initialRouteName: 'index' };

export default function Layout() {
  const { options, setOptions } = useScopeOptions();
  return (
    <Stack
      screenOptions={{
        headerShown: !options.stackHeaderHidden,
        unstable_headerRightItems: () => [
          {
            type: 'button',
            label: `Update ${options.titleRevision}`,
            onPress: () =>
              setOptions((current) => ({ ...current, titleRevision: current.titleRevision + 1 })),
          },
        ],
      }}>
      <Stack.Screen
        name="index"
        options={{
          title: `Stack root ${options.titleRevision}`,
          gestureEnabled: options.rootGestureEnabled,
        }}
      />
      <Stack.Screen name="pushed" options={{ title: `Stack pushed ${options.titleRevision}` }} />
      <Stack.Screen
        name="modal"
        options={{
          title: `Stack modal ${options.titleRevision}`,
          presentation: options.fullScreenModal ? 'fullScreenModal' : 'modal',
        }}
      />
    </Stack>
  );
}
