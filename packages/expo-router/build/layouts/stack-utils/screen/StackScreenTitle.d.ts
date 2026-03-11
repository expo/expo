import { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import React from 'react';
import { type StyleProp, type TextStyle } from 'react-native';
export type StackScreenTitleProps = {
    /**
     * The title content. Pass a string for a plain text title,
     * or a custom component when `asChild` is enabled.
     */
    children?: React.ReactNode;
    /**
     * Use this to render a custom component as the header title.
     *
     * @example
     * ```tsx
     * <Stack.Screen.Title asChild>
     *   <MyCustomTitle />
     * </Stack.Screen.Title>
     * ```
     */
    asChild?: boolean;
    style?: StyleProp<{
        fontFamily?: TextStyle['fontFamily'];
        fontSize?: TextStyle['fontSize'];
        fontWeight?: Exclude<TextStyle['fontWeight'], number>;
        color?: string;
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
        color?: string;
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
 * Can be used inside Stack.Screen in a layout or directly inside a screen component.
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
 *         <Stack.Screen.Title large>Home</Stack.Screen.Title>
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
 *       <Stack.Screen.Title>My Page</Stack.Screen.Title>
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
 *         <Stack.Screen.Title asChild>
 *           <MyCustomTitle />
 *         </Stack.Screen.Title>
 *       </Stack.Screen>
 *     </Stack>
 *   );
 * }
 * ```
 *
 * > **Note:** If multiple instances of this component are rendered for the same screen,
 * the last one rendered in the component tree takes precedence.
 */
export declare function StackScreenTitle({ children, asChild, style, largeStyle, large, }: StackScreenTitleProps): null;
export declare function appendStackScreenTitlePropsToOptions(options: NativeStackNavigationOptions, props: StackScreenTitleProps): NativeStackNavigationOptions;
//# sourceMappingURL=StackScreenTitle.d.ts.map