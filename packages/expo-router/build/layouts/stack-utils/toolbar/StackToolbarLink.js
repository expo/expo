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
 * Supports two modes:
 * - **Icon/label mode**: Use `icon` prop or `Stack.Toolbar.Icon`/`Stack.Toolbar.Label` children for standard bar button items.
 * - **Custom view mode**: Pass arbitrary React elements as children to render a custom view that navigates on press.
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
 * @example
 * ```tsx
 * <Stack.Toolbar>
 *   <Stack.Toolbar.Link href="/layers">
 *     <View style={{ flexDirection: 'row', gap: 8 }}>
 *       <Image source={'sf:square.3.layers.3d.down.right'} />
 *       <Text>Layers</Text>
 *     </View>
 *   </Stack.Toolbar.Link>
 * </Stack.Toolbar>
 * ```
 *
 * @platform ios
 */
const StackToolbarLink = (props) => {
    const placement = (0, context_1.useToolbarPlacement)();
    const primitiveChildren = (0, react_1.useMemo)(() => (0, children_1.filterAllowedChildrenElements)(props.children, PRIMITIVE_CHILDREN), [props.children]);
    if (placement === 'bottom') {
        const allChildren = react_1.Children.toArray(props.children);
        const hasCustomViewChildren = allChildren.length > 0 &&
            typeof props.children !== 'string' &&
            primitiveChildren.length !== allChildren.length;
        if (hasCustomViewChildren) {
            // Custom view mode: pass children through to render as a custom view bar button item
            return (<bottom_toolbar_native_elements_1.NativeToolbarLink accessibilityHint={props.accessibilityHint} accessibilityLabel={props.accessibilityLabel} href={props.href} action={props.action} disabled={props.disabled} hidden={props.hidden} hidesSharedBackground={props.hidesSharedBackground} separateBackground={props.separateBackground} tintColor={props.tintColor} variant={props.variant}>
          {props.children}
        </bottom_toolbar_native_elements_1.NativeToolbarLink>);
        }
        // Icon/label mode: convert primitive children to bar button item props
        const sharedProps = (0, shared_1.convertStackHeaderSharedPropsToRNSharedHeaderItem)(props);
        const icon = sharedProps?.icon?.type === 'sfSymbol' ? sharedProps.icon.name : undefined;
        return (<bottom_toolbar_native_elements_1.NativeToolbarLink {...sharedProps} href={props.href} action={props.action} icon={icon} image={props.image} imageRenderingMode={props.iconRenderingMode}/>);
    }
    // Left/right placement: not supported for zoom transitions from bar button items
    return null;
};
exports.StackToolbarLink = StackToolbarLink;
const PRIMITIVE_CHILDREN = [common_primitives_1.StackToolbarLabel, common_primitives_1.StackToolbarIcon, common_primitives_1.StackToolbarBadge];
//# sourceMappingURL=StackToolbarLink.js.map