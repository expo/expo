import type { NativeStackHeaderItemCustom } from '@react-navigation/native-stack';
export interface StackHeaderItemProps {
    /**
     * Can be any React node.
     */
    children?: NativeStackHeaderItemCustom['element'];
    hideSharedBackground?: boolean;
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
export declare const StackHeaderItem: React.FC<StackHeaderItemProps>;
export declare function convertStackHeaderItemPropsToRNHeaderItem(props: StackHeaderItemProps): NativeStackHeaderItemCustom;
//# sourceMappingURL=StackHeaderItem.d.ts.map