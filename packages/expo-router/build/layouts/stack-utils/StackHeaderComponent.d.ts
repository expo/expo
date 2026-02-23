import { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { type ReactNode } from 'react';
import { type ColorValue, type StyleProp } from 'react-native';
import type { ScreenStackHeaderConfigProps } from 'react-native-screens';
export interface StackHeaderProps {
    /**
     * Child elements for custom header when `asChild` is true.
     */
    children?: ReactNode;
    /**
     * Whether to hide the header completely. When set to `true`, the header will not be rendered.
     *
     * @default false
     */
    hidden?: boolean;
    /**
     * When `true`, renders children as a custom header component, replacing the default header entirely.
     * Use this to implement fully custom header layouts.
     *
     * @default false
     */
    asChild?: boolean;
    /**
     * Whether the header should be transparent.
     * When `true`, the header is absolutely positioned and content scrolls underneath.
     *
     * Auto-enabled when:
     * - `style.backgroundColor` is 'transparent'
     * - `blurEffect` is set (required for blur to work)
     *
     * @default false
     */
    transparent?: boolean;
    /**
     * The blur effect to apply to the header background on iOS.
     * Common values include 'regular', 'prominent', 'systemMaterial', etc.
     *
     * @platform ios
     */
    blurEffect?: ScreenStackHeaderConfigProps['blurEffect'];
    /**
     * Style properties for the standard-sized header.
     * - `color`: Tint color for header elements (similar to tintColor in React Navigation)
     * - `backgroundColor`: Background color of the header
     * - `shadowColor`: Set to 'transparent' to hide the header shadow/border
     */
    style?: StyleProp<{
        color?: ColorValue;
        backgroundColor?: ScreenStackHeaderConfigProps['backgroundColor'];
        shadowColor?: undefined | 'transparent';
    }>;
    /**
     * Style properties for the large title header (iOS).
     * - `backgroundColor`: Background color of the large title header
     * - `shadowColor`: Set to 'transparent' to hide the large title shadow/border
     *
     * @platform ios
     */
    largeStyle?: StyleProp<{
        backgroundColor?: ScreenStackHeaderConfigProps['largeTitleBackgroundColor'];
        shadowColor?: undefined | 'transparent';
    }>;
}
/**
 * The component used to configure header styling for a stack screen.
 *
 * Use this component to set header appearance properties like blur effect, background color,
 * and shadow visibility.
 *
 * @example
 * ```tsx
 * import { Stack } from 'expo-router';
 *
 * export default function Page() {
 *   return (
 *     <>
 *       <Stack.Header
 *         blurEffect="systemMaterial"
 *         style={{ backgroundColor: '#fff' }}
 *       />
 *       <ScreenContent />
 *     </>
 *   );
 * }
 * ```
 *
 * @example
 * When used inside a layout with Stack.Screen:
 * ```tsx
 * import { Stack } from 'expo-router';
 *
 * export default function Layout() {
 *   return (
 *     <Stack>
 *       <Stack.Screen name="index">
 *         <Stack.Header blurEffect="systemMaterial" />
 *       </Stack.Screen>
 *     </Stack>
 *   );
 * }
 * ```
 *
 * > **Note:** If multiple instances of this component are rendered for the same screen,
 * the last one rendered in the component tree takes precedence.
 */
export declare function StackHeaderComponent({ children, hidden, asChild, transparent, blurEffect, style, largeStyle, }: StackHeaderProps): null;
export declare function appendStackHeaderPropsToOptions(options: NativeStackNavigationOptions, props: StackHeaderProps): NativeStackNavigationOptions;
//# sourceMappingURL=StackHeaderComponent.d.ts.map