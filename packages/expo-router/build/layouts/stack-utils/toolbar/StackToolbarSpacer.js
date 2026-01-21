"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.StackToolbarSpacer = void 0;
exports.convertStackToolbarSpacerPropsToRNHeaderItem = convertStackToolbarSpacerPropsToRNHeaderItem;
const bottom_toolbar_native_elements_1 = require("./bottom-toolbar-native-elements");
const context_1 = require("./context");
/**
 * A spacing helper used inside `Stack.Toolbar` to create empty space between toolbar items.
 *
 * In left/right placements, width is required.
 * In bottom placement, if width is not provided, creates a flexible spacer that expands to fill space.
 *
 * @example
 * ```tsx
 * import { Stack } from 'expo-router';
 *
 * export default function Page() {
 *   return (
 *     <>
 *       <Stack.Toolbar placement="left">
 *         <Stack.Toolbar.Button icon="arrow.left" />
 *         <Stack.Toolbar.Spacer width={8} />
 *         <Stack.Toolbar.Button icon="arrow.right" />
 *       </Stack.Toolbar>
 *       <ScreenContent />
 *     </>
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
 *       <Stack.Toolbar>
 *         <Stack.Toolbar.Spacer />
 *         <Stack.Toolbar.Button icon="search" />
 *         <Stack.Toolbar.Spacer />
 *       </Stack.Toolbar>
 *       <ScreenContent />
 *     </>
 *   );
 * }
 * ```
 *
 * @platform ios
 */
const StackToolbarSpacer = (props) => {
    const placement = (0, context_1.useToolbarPlacement)();
    if (placement === 'bottom') {
        return <bottom_toolbar_native_elements_1.NativeToolbarSpacer {...props} hidesSharedBackground={!props.sharesBackground}/>;
    }
    return null;
};
exports.StackToolbarSpacer = StackToolbarSpacer;
function convertStackToolbarSpacerPropsToRNHeaderItem(props) {
    const { hidden, width } = props;
    if (hidden) {
        return undefined;
    }
    // Warn if using flexible spacer in Left/Right placement
    if (width === undefined) {
        if (process.env.NODE_ENV !== 'production') {
            console.warn('Stack.Toolbar.Spacer requires `width` when used in Left or Right placement. Flexible spacers are only supported in Bottom placement.');
        }
        return undefined;
    }
    return {
        type: 'spacing',
        spacing: width ?? 0,
    };
}
//# sourceMappingURL=StackToolbarSpacer.js.map