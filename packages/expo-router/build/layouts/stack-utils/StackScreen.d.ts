import { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { type PropsWithChildren } from 'react';
import { StackScreenTitle, StackScreenBackButton } from './screen';
export interface StackScreenProps extends PropsWithChildren {
    name?: string;
    options?: NativeStackNavigationOptions;
}
/**
 * Component used to define a screen in a native stack navigator.
 *
 * Can be used in the `_layout.tsx` files, or directly in page components.
 *
 * When configuring header inside page components, prefer using `Stack.Toolbar`, `Stack.Header` and `Stack.Screen.*` components.
 *
 * @example
 * ```tsx app/_layout.tsx
 * import { Stack } from 'expo-router';
 *
 * export default function Layout() {
 *   return (
 *     <Stack>
 *       <Stack.Screen
 *         name="home"
 *         options={{ title: 'Home' }}
 *       />
 *    </Stack>
 *  );
 * }
 * ```
 *
 * @example
 * ```tsx app/home.tsx
 * import { Stack } from 'expo-router';
 *
 * export default function HomePage() {
 *   return (
 *     <>
 *       <Stack.Screen
 *         options={{ headerTransparent: true }}
 *       />
 *       <Stack.Screen.Title>Welcome Home</Stack.Screen.Title>
 *       // Page content
 *     </>
 *   );
 * }
 * ```
 */
export declare const StackScreen: (({ children, options, ...rest }: StackScreenProps) => import("react").JSX.Element) & {
    Title: typeof StackScreenTitle;
    BackButton: typeof StackScreenBackButton;
};
export declare function validateStackPresentation(options: NativeStackNavigationOptions): NativeStackNavigationOptions;
export declare function validateStackPresentation<F extends (...args: never[]) => NativeStackNavigationOptions>(options: F): F;
export declare function appendScreenStackPropsToOptions(options: NativeStackNavigationOptions, props: StackScreenProps): NativeStackNavigationOptions;
//# sourceMappingURL=StackScreen.d.ts.map