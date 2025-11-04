"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StackHeaderItem = void 0;
exports.convertStackHeaderItemPropsToRNHeaderItem = convertStackHeaderItemPropsToRNHeaderItem;
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
const StackHeaderItem = () => null;
exports.StackHeaderItem = StackHeaderItem;
function convertStackHeaderItemPropsToRNHeaderItem(props) {
    const { children, ...rest } = props;
    if (!children) {
        console.warn('Stack.Header.Item requires a child element to render custom content in the header.');
    }
    return {
        ...rest,
        type: 'custom',
        element: children ?? <></>,
    };
}
//# sourceMappingURL=StackHeaderItem.js.map