"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.StackToolbarMenuAction = exports.StackToolbarMenu = void 0;
exports.convertStackToolbarMenuPropsToRNHeaderItem = convertStackToolbarMenuPropsToRNHeaderItem;
exports.convertStackToolbarMenuActionPropsToRNHeaderItem = convertStackToolbarMenuActionPropsToRNHeaderItem;
const react_1 = require("react");
const bottom_toolbar_native_elements_1 = require("./bottom-toolbar-native-elements");
const context_1 = require("./context");
const primitives_1 = require("../../../primitives");
const children_1 = require("../../../utils/children");
const shared_1 = require("../shared");
/**
 * Use as `Stack.Toolbar.Menu` to provide menus in iOS toolbar.
 * It accepts `Stack.Toolbar.MenuAction` and nested `Stack.Toolbar.Menu`
 * elements. Menu can be configured using both component props and child
 * elements.
 *
 * @example
 * ```tsx
 * import { Stack } from 'expo-router';
 * import { Alert } from 'react-native';
 *
 * export default function Page() {
 *   return (
 *     <>
 *       <Stack.Toolbar placement="right">
 *         <Stack.Toolbar.Menu icon="ellipsis.circle">
 *           <Stack.Toolbar.MenuAction onPress={() => Alert.alert('Action pressed!')}>
 *             Action 1
 *           </Stack.Toolbar.MenuAction>
 *         </Stack.Toolbar.Menu>
 *       </Stack.Toolbar>
 *       <ScreenContent />
 *     </>
 *   );
 * }
 * ```
 *
 * @see [Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/menus) for more information about menus on iOS.
 *
 * @platform ios
 */
const StackToolbarMenu = ({ children, ...props }) => {
    const placement = (0, context_1.useToolbarPlacement)();
    const allowedChildren = (0, react_1.useMemo)(() => placement === 'bottom'
        ? [exports.StackToolbarMenu, exports.StackToolbarMenuAction, bottom_toolbar_native_elements_1.NativeToolbarMenu, bottom_toolbar_native_elements_1.NativeToolbarMenuAction]
        : [exports.StackToolbarMenu, exports.StackToolbarMenuAction], [placement]);
    const validChildren = (0, react_1.useMemo)(() => (0, children_1.filterAllowedChildrenElements)(children, allowedChildren), [children, allowedChildren]);
    if (process.env.NODE_ENV !== 'production') {
        const allChildren = react_1.Children.toArray(children);
        if (allChildren.length !== validChildren.length) {
            throw new Error(`Stack.Toolbar.Menu only accepts Stack.Toolbar.Menu and Stack.Toolbar.MenuAction as its children.`);
        }
    }
    if (placement === 'bottom') {
        // TODO(@ubax): Handle image loading using useImage in a follow-up PR.
        return <bottom_toolbar_native_elements_1.NativeToolbarMenu {...props} image={props.image} children={validChildren}/>;
    }
    return <primitives_1.Menu {...props} children={validChildren}/>;
};
exports.StackToolbarMenu = StackToolbarMenu;
function convertStackToolbarMenuPropsToRNHeaderItem(props) {
    if (props.hidden) {
        return undefined;
    }
    const { title, ...rest } = props;
    const actions = react_1.Children.toArray(props.children).filter((child) => (0, children_1.isChildOfType)(child, exports.StackToolbarMenuAction) || (0, children_1.isChildOfType)(child, exports.StackToolbarMenu));
    const item = {
        ...(0, shared_1.convertStackHeaderSharedPropsToRNSharedHeaderItem)(rest),
        type: 'menu',
        menu: {
            multiselectable: true,
            items: actions
                .map((action) => {
                if ((0, children_1.isChildOfType)(action, exports.StackToolbarMenu)) {
                    return convertStackToolbarSubmenuMenuPropsToRNHeaderItem(action.props);
                }
                return convertStackToolbarMenuActionPropsToRNHeaderItem(action.props);
            })
                .filter((i) => !!i),
        },
    };
    if (title) {
        item.menu.title = title;
    }
    return item;
}
function convertStackToolbarSubmenuMenuPropsToRNHeaderItem(props) {
    if (props.hidden) {
        return undefined;
    }
    const sharedProps = (0, shared_1.convertStackHeaderSharedPropsToRNSharedHeaderItem)(props);
    const actions = react_1.Children.toArray(props.children).filter((child) => (0, children_1.isChildOfType)(child, exports.StackToolbarMenuAction) || (0, children_1.isChildOfType)(child, exports.StackToolbarMenu));
    const item = {
        type: 'submenu',
        items: actions
            .map((action) => {
            if ((0, children_1.isChildOfType)(action, exports.StackToolbarMenu)) {
                return convertStackToolbarSubmenuMenuPropsToRNHeaderItem(action.props);
            }
            return convertStackToolbarMenuActionPropsToRNHeaderItem(action.props);
        })
            .filter((i) => !!i),
        label: sharedProps.label || props.title || '',
        multiselectable: true,
    };
    if (props.inline !== undefined) {
        item.inline = props.inline;
    }
    if (props.palette !== undefined) {
        item.layout = props.palette ? 'palette' : 'default';
    }
    if (props.destructive !== undefined) {
        item.destructive = props.destructive;
    }
    // TODO: Add elementSize to react-native-screens
    if (sharedProps.icon) {
        // Only SF Symbols are supported in submenu icons
        // TODO(@ubax): Add support for other images in react-native-screens
        if (sharedProps.icon.type === 'sfSymbol') {
            item.icon = sharedProps.icon;
        }
        else {
            console.warn('When Icon is used inside Stack.Toolbar.Menu used as a submenu, only sfSymbol icons are supported. This is a limitation of React Native Screens.');
        }
    }
    return item;
}
/**
 * An action item for a `Stack.Toolbar.Menu`.
 *
 * @example
 * ```tsx
 * import { Stack } from 'expo-router';
 *
 * export default function Page() {
 *   return (
 *     <>
 *       <Stack.Toolbar placement="right">
 *         <Stack.Toolbar.Menu icon="ellipsis.circle">
 *           <Stack.Toolbar.MenuAction onPress={() => alert('Action pressed!')}>
 *             Action 1
 *           </Stack.Toolbar.MenuAction>
 *         </Stack.Toolbar.Menu>
 *       </Stack.Toolbar>
 *       <ScreenContent />
 *     </>
 *   );
 * }
 * ```
 *
 * @platform ios
 */
const StackToolbarMenuAction = (props) => {
    const placement = (0, context_1.useToolbarPlacement)();
    if (placement === 'bottom') {
        // TODO(@ubax): Handle image loading using useImage in a follow-up PR.
        const icon = typeof props.icon === 'string' ? props.icon : undefined;
        return <bottom_toolbar_native_elements_1.NativeToolbarMenuAction {...props} icon={icon} image={props.image}/>;
    }
    return <primitives_1.MenuAction {...props}/>;
};
exports.StackToolbarMenuAction = StackToolbarMenuAction;
function convertStackToolbarMenuActionPropsToRNHeaderItem(props) {
    const { children, isOn, unstable_keepPresented, icon, ...rest } = props;
    const sharedProps = (0, shared_1.convertStackHeaderSharedPropsToRNSharedHeaderItem)(props);
    const item = {
        ...rest,
        type: 'action',
        label: sharedProps.label,
        state: isOn ? 'on' : 'off',
        onPress: props.onPress ?? (() => { }),
    };
    if (unstable_keepPresented !== undefined) {
        item.keepsMenuPresented = unstable_keepPresented;
    }
    if (sharedProps.icon) {
        // Only SF Symbols are supported in submenu icons
        // TODO(@ubax): Add support for other images in react-native-screens
        if (sharedProps.icon.type === 'sfSymbol') {
            item.icon = sharedProps.icon;
        }
        else {
            console.warn('When Icon is used inside Stack.Toolbar.MenuAction, only sfSymbol icons are supported. This is a limitation of React Native Screens.');
        }
    }
    return item;
}
//# sourceMappingURL=StackToolbarMenu.js.map