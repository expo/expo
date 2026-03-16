import { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import type { ImageSourcePropType } from 'react-native';
import type { ScreenStackHeaderConfigProps } from 'react-native-screens';
export interface StackScreenBackButtonProps {
    /**
     * The title to display for the back button.
     */
    children?: string | undefined;
    /**
     * Style for the back button title.
     */
    style?: NativeStackNavigationOptions['headerBackTitleStyle'] | undefined;
    /**
     * Whether to show a context menu when long pressing the back button.
     *
     * @platform ios
     */
    withMenu?: boolean | undefined;
    /**
     * The display mode for the back button.
     *
     * @platform ios
     */
    displayMode?: ScreenStackHeaderConfigProps['backButtonDisplayMode'] | undefined;
    /**
     * Whether to hide the back button.
     */
    hidden?: boolean | undefined;
    /**
     * Custom image source for the back button.
     */
    src?: ImageSourcePropType | undefined;
}
/**
 * Component to configure the back button.
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
 *       <Stack.Screen name="detail">
 *         <Stack.Screen.BackButton displayMode="minimal">Back</Stack.Screen.BackButton>
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
 *       <Stack.Screen.BackButton hidden />
 *       <ScreenContent />
 *     </>
 *   );
 * }
 * ```
 *
 * > **Note:** If multiple instances of this component are rendered for the same screen,
 * the last one rendered in the component tree takes precedence.
 */
export declare function StackScreenBackButton({ children, style, withMenu, displayMode, hidden, src, }: StackScreenBackButtonProps): null;
export declare function appendStackScreenBackButtonPropsToOptions(options: NativeStackNavigationOptions, props: StackScreenBackButtonProps): NativeStackNavigationOptions;
//# sourceMappingURL=StackScreenBackButton.d.ts.map