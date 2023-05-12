import { ComponentType, DependencyList } from 'react';
import { ViewProps } from 'react-native';

type PropsAdapterFunction = (props: Record<string, unknown>) => void;
// Simplified Reanimated type, copied and slightly modified from react-native-reanimated
type Reanimated =
  | {
      default: {
        createAnimatedComponent<P extends object>(
          component: ComponentType<P>,
          options?: unknown
        ): ComponentType<P>;
        View: ComponentType<ViewProps>;
      };
      useAnimatedProps<T extends object>(
        updater: () => Partial<T>,
        deps?: DependencyList | null,
        adapters?: PropsAdapterFunction | PropsAdapterFunction[] | null
      ): Partial<T>;
      useAnimatedStyle<T>(updater: () => T, deps?: DependencyList | null): T;
    }
  | undefined;

export default function getReanimatedIfAvailable() {
  let Reanimated: Reanimated;
  // If available import react-native-reanimated
  try {
    Reanimated = require('react-native-reanimated');
    // Make sure that imported reanimated has the required functions
    if (
      !Reanimated?.default.createAnimatedComponent ||
      !Reanimated.useAnimatedProps ||
      !Reanimated.useAnimatedStyle ||
      !Reanimated.default.View
    ) {
      Reanimated = undefined;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    // Quietly continue when 'react-native-reanimated' is not available
    Reanimated = undefined;
  }
  return Reanimated;
}
