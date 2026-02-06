import type { ParamListBase, StackNavigationState } from '@react-navigation/native';
import type { NativeStackNavigationEventMap } from '@react-navigation/native-stack';
import { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { type PropsWithChildren } from 'react';
import { StackScreenTitle, StackScreenBackButton } from './screen';
import type { ScreenProps as BaseScreenProps } from '../../useScreens';
type StackBaseScreenProps = BaseScreenProps<NativeStackNavigationOptions, StackNavigationState<ParamListBase>, NativeStackNavigationEventMap>;
export interface StackScreenProps extends PropsWithChildren {
    /** Name is required when used inside a Layout component. */
    name?: StackBaseScreenProps['name'];
    /**
     * Options to configure the screen.
     *
     * Accepts an object or a function returning an object.
     * The function form `options={({ route }) => ({})}` is only supported when used inside a Layout component.
     * When used inside a page component, pass an options object directly.
     */
    options?: StackBaseScreenProps['options'];
    /**
     * Redirect to the nearest sibling route.
     * If all children are `redirect={true}`, the layout will render `null` as there are no children to render.
     *
     * Only supported when used inside a Layout component.
     */
    redirect?: StackBaseScreenProps['redirect'];
    /**
     * Initial params to pass to the route.
     *
     * Only supported when used inside a Layout component.
     */
    initialParams?: StackBaseScreenProps['initialParams'];
    /**
     * Listeners for navigation events.
     *
     * Only supported when used inside a Layout component.
     */
    listeners?: StackBaseScreenProps['listeners'];
    /**
     * Function to determine a unique ID for the screen.
     * @deprecated Use `dangerouslySingular` instead.
     *
     * Only supported when used inside a Layout component.
     */
    getId?: StackBaseScreenProps['getId'];
    /**
     * When enabled, the navigator will reuse an existing screen instead of pushing a new one.
     *
     * Only supported when used inside a Layout component.
     */
    dangerouslySingular?: StackBaseScreenProps['dangerouslySingular'];
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
export {};
//# sourceMappingURL=StackScreen.d.ts.map