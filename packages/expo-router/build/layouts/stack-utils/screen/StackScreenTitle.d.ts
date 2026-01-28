import { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { type StyleProp, type TextStyle } from 'react-native';
export type StackScreenTitleProps = {
    children?: string;
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
 */
export declare function StackScreenTitle(props: StackScreenTitleProps): import("react").JSX.Element;
export declare function appendStackScreenTitlePropsToOptions(options: NativeStackNavigationOptions, props: StackScreenTitleProps): NativeStackNavigationOptions;
//# sourceMappingURL=StackScreenTitle.d.ts.map