import type { NativeStackHeaderItemCustom } from '@react-navigation/native-stack';
export interface StackHeaderViewProps {
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
}
/**
 * A wrapper to render custom content in the header.
 *
 * Use as `Stack.Header.Item` to render a custom React element into the header
 *
 * @example
 * ```tsx
 * import { Stack } from 'expo-router';
 * import { Text } from 'react-native';
 *
 * function CustomHeaderElement() {
 *   return <Text>Custom Element</Text>;
 * }
 *
 * function Screen() {
 *   return (
 *     <>
 *       <ScreenContent />
 *       <Stack.Screen>
 *         <Stack.Header>
 *           <Stack.Header.Left>
 *             <Stack.Header.Item>
 *               <CustomHeaderElement />
 *             </Stack.Header.Item>
 *           </Stack.Header.Left>
 *         </Stack.Header>
 *       </Stack.Screen>
 *     </>
 *   );
 * }
 * ```
 *
 * @platform ios
 */
export declare const StackHeaderView: React.FC<StackHeaderViewProps>;
export declare function convertStackHeaderViewPropsToRNHeaderItem(props: StackHeaderViewProps): NativeStackHeaderItemCustom | undefined;
//# sourceMappingURL=StackHeaderView.d.ts.map