import { type ReactNode } from 'react';
import { type ColorValue, type StyleProp, type TextStyle } from 'react-native';
import type { NativeStackNavigationOptions } from '../../react-navigation/native-stack';
export type StackTitleProps = {
    /**
     * The title content. Pass a string for a plain text title,
     * or a custom component when `asChild` is enabled.
     */
    children?: ReactNode;
    /**
     * Use this to render a custom component as the header title.
     *
     * @example
     * ```tsx
     * <Stack.Title asChild>
     *   <MyCustomTitle />
     * </Stack.Title>
     * ```
     */
    asChild?: boolean;
    style?: StyleProp<{
        fontFamily?: TextStyle['fontFamily'];
        fontSize?: TextStyle['fontSize'];
        fontWeight?: Exclude<TextStyle['fontWeight'], number>;
        color?: ColorValue;
        textAlign?: 'left' | 'center';
    }>;
    /**
     * Style properties for the large title header.
     *
     * @platform ios
     */
    largeStyle?: StyleProp<{
        fontFamily?: TextStyle['fontFamily'];
        fontSize?: TextStyle['fontSize'];
        fontWeight?: Exclude<TextStyle['fontWeight'], number>;
        color?: ColorValue;
    }>;
    /**
     * Enables large title mode.
     *
     * @platform ios
     */
    large?: boolean;
};
/**
 * Component to set the screen title.
 *
 * Can be used inside `Stack.Screen` in a layout or directly inside a screen component.
 *
 * @example
 * String title in a layout:
 * ```tsx
 * import { Stack } from 'expo-router';
 *
 * export default function Layout() {
 *   return (
 *     <Stack>
 *       <Stack.Screen name="index">
 *         <Stack.Title large>Home</Stack.Title>
 *       </Stack.Screen>
 *     </Stack>
 *   );
 * }
 * ```
 *
 * @example
 * String title inside a screen:
 * ```tsx
 * import { Stack } from 'expo-router';
 *
 * export default function Page() {
 *   return (
 *     <>
 *       <Stack.Title>My Page</Stack.Title>
 *       <ScreenContent />
 *     </>
 *   );
 * }
 * ```
 *
 * @example
 * Custom component as the title using `asChild`:
 * ```tsx
 * import { Stack } from 'expo-router';
 *
 * export default function Layout() {
 *   return (
 *     <Stack>
 *       <Stack.Screen name="index">
 *         <Stack.Title asChild>
 *           <MyCustomTitle />
 *         </Stack.Title>
 *       </Stack.Screen>
 *     </Stack>
 *   );
 * }
 * ```
 *
 * > **Note:** If multiple instances of this component are rendered for the same screen,
 * the last one rendered in the component tree takes precedence.
 */
export declare function StackTitle({ children, asChild, style, largeStyle, large }: StackTitleProps): null;
export declare function appendStackTitlePropsToOptions(options: NativeStackNavigationOptions, props: StackTitleProps): NativeStackNavigationOptions;
//# sourceMappingURL=StackTitle.d.ts.map