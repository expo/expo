import type { NativeStackOptions, NativeStackProps } from './types';
import { type ScreenProps } from '../views/Screen';
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
export declare const NativeStack: ((props: NativeStackProps) => import("react").JSX.Element) & {
    Screen: (props: ScreenProps<NativeStackOptions>) => null;
    Protected: import("react").FunctionComponent<import("../views/Protected").ProtectedProps>;
};
//# sourceMappingURL=NativeStack.d.ts.map