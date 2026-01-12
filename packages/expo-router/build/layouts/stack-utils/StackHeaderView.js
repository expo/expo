"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StackHeaderView = void 0;
exports.convertStackHeaderViewPropsToRNHeaderItem = convertStackHeaderViewPropsToRNHeaderItem;
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
const StackHeaderView = () => null;
exports.StackHeaderView = StackHeaderView;
function convertStackHeaderViewPropsToRNHeaderItem(props) {
    if (props.hidden) {
        return undefined;
    }
    const { children, hidesSharedBackground } = props;
    if (!children) {
        console.warn('Stack.Header.View requires a child element to render custom content in the header.');
    }
    const element = children ? children : <></>;
    return {
        type: 'custom',
        element,
        hidesSharedBackground,
    };
}
//# sourceMappingURL=StackHeaderView.js.map