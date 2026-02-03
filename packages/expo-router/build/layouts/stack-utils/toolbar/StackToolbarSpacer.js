"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.StackToolbarSpacer = void 0;
exports.convertStackToolbarSpacerPropsToRNHeaderItem = convertStackToolbarSpacerPropsToRNHeaderItem;
const react_1 = require("react");
const context_1 = require("./context");
const native_1 = require("../../../toolbar/native");
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
    if (placement !== 'bottom') {
        throw new Error('Stack.Toolbar.Spacer must be used inside a Stack.Toolbar');
    }
    return <NativeToolbarSpacer {...props} hidesSharedBackground={!props.sharesBackground}/>;
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
            console.warn('Stack.Toolbar.Spacer requires `width` when used in left or right placement. Flexible spacers are only supported in Bottom placement.');
        }
        return undefined;
    }
    return {
        type: 'spacing',
        spacing: width ?? 0,
    };
}
/**
 * Native toolbar spacer component for bottom toolbar.
 * Renders as RouterToolbarItem with type 'fixedSpacer' or 'fluidSpacer'.
 */
const NativeToolbarSpacer = (props) => {
    const id = (0, react_1.useId)();
    return (<native_1.RouterToolbarItem hidesSharedBackground={props.hidesSharedBackground} hidden={props.hidden} identifier={id} sharesBackground={props.sharesBackground} type={props.width ? 'fixedSpacer' : 'fluidSpacer'} width={props.width}/>);
};
// #endregion
//# sourceMappingURL=StackToolbarSpacer.js.map