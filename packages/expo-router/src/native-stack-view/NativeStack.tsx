import { NativeStackWithContext } from './NativeStackNavigator';
import type { NativeStackOptions, NativeStackProps } from './types';
import { Protected } from '../views/Protected';
import { Screen, type ScreenProps } from '../views/Screen';

/**
 * Native stack navigator that renders `ScreenStack` and `ScreenStackItem` from `react-native-screens` directly.
 *
 * Uses `useNavigationBuilder` with `StackRouter` for state management while giving full control
 * over the rendering layer.
 *
 * @example
 * ```tsx app/_layout.tsx
 * import { NativeStack } from 'expo-router/unstable-native-stack-view';
 *
 * export default function Layout() {
 *   return <NativeStack />;
 * }
 * ```
 */
export const NativeStack = Object.assign(
  (props: NativeStackProps) => {
    return <NativeStackWithContext {...props} />;
  },
  {
    Screen: Screen as (props: ScreenProps<NativeStackOptions>) => null,
    Protected,
  }
);
