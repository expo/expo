import type { NativeStackHeaderItemCustom } from '@react-navigation/native-stack';
export interface StackToolbarViewProps {
    /**
     * Can be any React node.
     */
    children?: NativeStackHeaderItemCustom['element'];
    /**
     * Whether the view should be hidden.
     *
     * @default false
     */
    hidden?: boolean;
    /**
     * Whether to hide the shared background.
     *
     * @see [Official Apple documentation](https://developer.apple.com/documentation/uikit/uibarbuttonitem/hidessharedbackground) for more information.
     *
     * @platform iOS 26+
     */
    hidesSharedBackground?: boolean;
    /**
     * Whether to separate the background of this item from other items.
     *
     * Only available in bottom placement.
     *
     * @default false
     */
    separateBackground?: boolean;
}
/**
 * A wrapper to render custom content in the toolbar.
 *
 * Use inside `Stack.Toolbar` to render a custom React element.
 *
 * @example
 * ```tsx
 * import { Stack } from 'expo-router';
 * import { Text } from 'react-native';
 *
 * function CustomElement() {
 *   return <Text>Custom Element</Text>;
 * }
 *
 * export default function Page() {
 *   return (
 *     <>
 *       <Stack.Toolbar>
 *         <Stack.Toolbar.View>
 *           <CustomElement />
 *         </Stack.Toolbar.View>
 *       </Stack.Toolbar>
 *       <ScreenContent />
 *     </>
 *   );
 * }
 * ```
 *
 * @platform ios
 */
export declare const StackToolbarView: React.FC<StackToolbarViewProps>;
export declare function convertStackToolbarViewPropsToRNHeaderItem(props: StackToolbarViewProps): NativeStackHeaderItemCustom | undefined;
//# sourceMappingURL=StackToolbarView.d.ts.map