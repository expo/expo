"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.StackToolbarButton = void 0;
exports.convertStackToolbarButtonPropsToRNHeaderItem = convertStackToolbarButtonPropsToRNHeaderItem;
const react_1 = require("react");
const native_1 = require("./native");
const children_1 = require("../../../../utils/children");
const context_1 = require("../context");
const shared_1 = require("../shared");
const toolbar_primitives_1 = require("../toolbar-primitives");
/**
 * A button used inside `Stack.Toolbar`.
 *
 * @example
 * ```tsx
 * import { Stack } from 'expo-router';
 *
 * export default function Layout() {
 *   return (
 *     <Stack>
 *       <Stack.Screen name="index">
 *         <Stack.Toolbar placement="left">
 *           <Stack.Toolbar.Button icon="arrow.left.circle" onPress={() => alert('Left pressed')} />
 *         </Stack.Toolbar>
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
 *       <Stack.Toolbar placement="left">
 *         <Stack.Toolbar.Button icon="arrow.left.circle" onPress={() => alert('Left pressed')} />
 *       </Stack.Toolbar>
 *       <ScreenContent />
 *     </>
 *   );
 * }
 * ```
 *
 * @platform ios
 */
const StackToolbarButton = (props) => {
    const placement = (0, context_1.useToolbarPlacement)();
    const validChildren = (0, react_1.useMemo)(() => (0, children_1.filterAllowedChildrenElements)(props.children, ALLOWED_CHILDREN), [props.children]);
    if (process.env.NODE_ENV !== 'production') {
        // Skip validation for string children
        if (typeof props.children !== 'string') {
            const allChildren = react_1.Children.toArray(props.children);
            if (allChildren.length !== validChildren.length) {
                throw new Error(`Stack.Toolbar.Button only accepts a single string or Stack.Toolbar.Label, Stack.Toolbar.Icon, and Stack.Toolbar.Badge as its children.`);
            }
        }
    }
    if (process.env.NODE_ENV !== 'production' && placement === 'bottom') {
        const hasBadge = (0, children_1.getFirstChildOfType)(props.children, toolbar_primitives_1.StackToolbarBadge);
        if (hasBadge) {
            console.warn('Stack.Toolbar.Badge is not supported in bottom toolbar (iOS limitation). The badge will be ignored.');
        }
    }
    if (placement !== 'bottom') {
        throw new Error('Stack.Toolbar.Button must be used inside a Stack.Toolbar');
    }
    const sharedProps = (0, shared_1.convertStackHeaderSharedPropsToRNSharedHeaderItem)(props, true);
    // TODO(@ubax): Handle image loading using useImage in a follow-up PR.
    const icon = sharedProps?.icon?.type === 'sfSymbol' ? sharedProps.icon.name : undefined;
    const xcassetName = (0, shared_1.extractXcassetName)(props);
    const imageRenderingMode = (0, shared_1.extractIconRenderingMode)(props) ?? props.iconRenderingMode;
    return (<native_1.NativeToolbarButton {...sharedProps} icon={icon} xcassetName={xcassetName} image={props.image} imageRenderingMode={imageRenderingMode}/>);
};
exports.StackToolbarButton = StackToolbarButton;
function convertStackToolbarButtonPropsToRNHeaderItem(props) {
    if (props.hidden) {
        return undefined;
    }
    return {
        ...(0, shared_1.convertStackHeaderSharedPropsToRNSharedHeaderItem)(props),
        type: 'button',
        onPress: props.onPress ?? (() => { }),
        selected: !!props.selected,
    };
}
const ALLOWED_CHILDREN = [toolbar_primitives_1.StackToolbarLabel, toolbar_primitives_1.StackToolbarIcon, toolbar_primitives_1.StackToolbarBadge];
//# sourceMappingURL=index.js.map