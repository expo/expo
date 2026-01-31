"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.StackToolbarLink = void 0;
const react_1 = require("react");
const bottom_toolbar_native_elements_1 = require("./bottom-toolbar-native-elements");
const context_1 = require("./context");
const children_1 = require("../../../utils/children");
const common_primitives_1 = require("../common-primitives");
const shared_1 = require("../shared");
/**
 * A link used inside `Stack.Toolbar` that navigates with a zoom transition from the bar button item on iOS 26+.
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
 *         <Stack.Toolbar.Link href="/new-item" icon="plus" />
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
const StackToolbarLink = (props) => {
    const placement = (0, context_1.useToolbarPlacement)();
    const validChildren = (0, react_1.useMemo)(() => (0, children_1.filterAllowedChildrenElements)(props.children, ALLOWED_CHILDREN), [props.children]);
    if (process.env.NODE_ENV !== 'production') {
        if (typeof props.children !== 'string') {
            const allChildren = react_1.Children.toArray(props.children);
            if (allChildren.length !== validChildren.length) {
                throw new Error(`Stack.Toolbar.Link only accepts a single string or Stack.Toolbar.Label, Stack.Toolbar.Icon, and Stack.Toolbar.Badge as its children.`);
            }
        }
    }
    if (placement === 'bottom') {
        const sharedProps = (0, shared_1.convertStackHeaderSharedPropsToRNSharedHeaderItem)(props);
        const icon = sharedProps?.icon?.type === 'sfSymbol' ? sharedProps.icon.name : undefined;
        return (<bottom_toolbar_native_elements_1.NativeToolbarLink {...sharedProps} href={props.href} action={props.action} icon={icon} image={props.image} imageRenderingMode={props.iconRenderingMode}/>);
    }
    // Left/right placement: not supported for zoom transitions from bar button items
    return null;
};
exports.StackToolbarLink = StackToolbarLink;
const ALLOWED_CHILDREN = [common_primitives_1.StackToolbarLabel, common_primitives_1.StackToolbarIcon, common_primitives_1.StackToolbarBadge];
//# sourceMappingURL=StackToolbarLink.js.map