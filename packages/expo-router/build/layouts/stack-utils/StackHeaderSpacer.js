"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StackHeaderSpacer = void 0;
exports.convertStackHeaderSpacerPropsToRNHeaderItem = convertStackHeaderSpacerPropsToRNHeaderItem;
/**
 * A spacing helper used inside `Stack.Header.Left` or `Stack.Header.Right` to create
 * empty space between header items.
 *
 * @example
 * ```tsx
 * import { Stack } from 'expo-router';
 *
 * export default function Screen() {
 *   return (
 *     <>
 *       <ScreenContent />
 *       <Stack.Screen>
 *         <Stack.Header>
 *           <Stack.Header.Left>
 *             <Stack.Header.Button icon="arrow.left" />
 *             <Stack.Header.Spacer width={8} />
 *             <Stack.Header.Button icon="arrow.right" />
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
const StackHeaderSpacer = () => null;
exports.StackHeaderSpacer = StackHeaderSpacer;
function convertStackHeaderSpacerPropsToRNHeaderItem({ hidden, width, }) {
    if (hidden) {
        return undefined;
    }
    return {
        type: 'spacing',
        spacing: width,
    };
}
//# sourceMappingURL=StackHeaderSpacer.js.map