import { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { type ReactNode } from 'react';
import { type ColorValue, type StyleProp } from 'react-native';
import type { ScreenStackHeaderConfigProps } from 'react-native-screens';
export interface StackHeaderProps {
    /**
     * Child elements to compose the header. Can include Stack.Header.Title, Stack.Header.Left,
     * Stack.Header.Right, Stack.Header.BackButton, and Stack.Header.SearchBar components.
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
 * The component used to configure the whole stack header.
 *
 * When used inside a screen, it allows you to customize the header dynamically by composing
 * header subcomponents (title, left/right areas, back button, search bar, etc.).
 *
 * ```tsx
 * import { Stack } from 'expo-router';
 *
 * export default function Page() {
 *   return (
 *     <>
 *       <Stack.Header>
 *         <Stack.Header.Title>Page title</Stack.Header.Title>
 *         <Stack.Header.Left>
 *           <Stack.Header.Button onPress={() => alert('Left pressed')} />
 *         </Stack.Header.Left>
 *         <Stack.Header.Right>
 *           <Stack.Header.Button onPress={() => alert('Right pressed')} />
 *         </Stack.Header.Right>
 *       </Stack.Header>
 *       <ScreenContent />
 *     </>
 *   );
 * }
 * ```
 *
 * When used inside a layout, it needs to be wrapped in `Stack.Screen` to take effect.
 *
 * Example (inside a layout):
 * ```tsx
 * import { Stack } from 'expo-router';
 *
 * export default function Layout() {
 *   return (
 *     <Stack>
 *       <Stack.Screen name="index">
 *         <Stack.Header>
 *           <Stack.Header.Title>Layout title</Stack.Header.Title>
 *           <Stack.Header.Right>
 *             <Stack.Header.Button onPress={() => alert('Right pressed')} />
 *           </Stack.Header.Right>
 *         </Stack.Header>
 *       </Stack.Screen>
 *     </Stack>
 *   );
 * }
 * ```
 */
export declare function StackHeaderComponent(props: StackHeaderProps): import("react").JSX.Element;
export declare function appendStackHeaderPropsToOptions(options: NativeStackNavigationOptions, props: StackHeaderProps): NativeStackNavigationOptions;
//# sourceMappingURL=StackHeaderComponent.d.ts.map