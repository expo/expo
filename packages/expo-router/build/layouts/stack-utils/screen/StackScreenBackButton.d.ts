import { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import type { ImageSourcePropType } from 'react-native';
import type { ScreenStackHeaderConfigProps } from 'react-native-screens';
export interface StackScreenBackButtonProps {
    /**
     * The title to display for the back button.
     */
    children?: string;
    /**
     * Style for the back button title.
     */
    style?: NativeStackNavigationOptions['headerBackTitleStyle'];
    /**
     * Whether to show a context menu when long pressing the back button.
     */
    withMenu?: boolean;
    /**
     * The display mode for the back button.
     */
    displayMode?: ScreenStackHeaderConfigProps['backButtonDisplayMode'];
    /**
     * Whether to hide the back button.
     */
    hidden?: boolean;
    /**
     * Custom image source for the back button.
     */
    src?: ImageSourcePropType;
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
 * @platform ios
 */
export declare function StackScreenBackButton(props: StackScreenBackButtonProps): import("react").JSX.Element;
export declare function appendStackScreenBackButtonPropsToOptions(options: NativeStackNavigationOptions, props: StackScreenBackButtonProps): NativeStackNavigationOptions;
//# sourceMappingURL=StackScreenBackButton.d.ts.map