import { type PropsWithChildren } from 'react';
import { StackScreenTitle, StackScreenBackButton } from './screen';
import type { ParamListBase, StackNavigationState } from '../../react-navigation/native';
import { NativeStackNavigationOptions } from '../../react-navigation/native-stack';
import type { NativeStackNavigationEventMap } from '../../react-navigation/native-stack';
import type { ScreenProps as BaseScreenProps } from '../../useScreens';
/**
 * Extends `NativeStackNavigationOptions` with Expo Router web-specific options.
 * Placing this type here (rather than in `StackClient`) makes it available to
 * `Stack.Screen` so users don't get a TypeScript error when passing `webModalStyle`.
 */
export type ExtendedStackNavigationOptions = NativeStackNavigationOptions & {
    /**
     * Style overrides for the modal when rendered on web. Has no effect on native platforms.
     * @platform web
     */
    webModalStyle?: {
        /**
         * Override the width of the modal (px or percentage).
         * @platform web
         */
        width?: number | string;
        /**
         * Override the height of the modal (px or percentage). Applies on web desktop.
         * @platform web
         */
        height?: number | string;
        /**
         * Minimum height of the desktop modal. Overrides the default 640px clamp.
         * @platform web
         */
        minHeight?: number | string;
        /**
         * Minimum width of the desktop modal. Overrides the default 580px.
         * @platform web
         */
        minWidth?: number | string;
        /**
         * Border of the desktop modal (any valid CSS border value, e.g. `'1px solid #ccc'`).
         * @platform web
         */
        border?: string;
        /**
         * Overlay background color (any valid CSS color, rgba, or hsla value).
         * @platform web
         */
        overlayBackground?: string;
        /**
         * Modal shadow filter (any valid CSS `filter` value).
         * @platform web
         */
        shadow?: string;
    };
};
type StackBaseScreenProps = BaseScreenProps<ExtendedStackNavigationOptions, StackNavigationState<ParamListBase>, NativeStackNavigationEventMap>;
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
export declare function validateStackPresentation(options: ExtendedStackNavigationOptions): ExtendedStackNavigationOptions;
export declare function validateStackPresentation<F extends (...args: never[]) => ExtendedStackNavigationOptions>(options: F): F;
export declare function appendScreenStackPropsToOptions(options: ExtendedStackNavigationOptions, props: StackScreenProps): ExtendedStackNavigationOptions;
export {};
//# sourceMappingURL=StackScreen.d.ts.map