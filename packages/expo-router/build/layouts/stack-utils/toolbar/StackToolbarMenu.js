"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.StackToolbarMenuAction = exports.StackToolbarMenu = void 0;
exports.convertStackToolbarMenuPropsToRNHeaderItem = convertStackToolbarMenuPropsToRNHeaderItem;
exports.convertStackToolbarMenuActionPropsToRNHeaderItem = convertStackToolbarMenuActionPropsToRNHeaderItem;
const react_1 = require("react");
const react_native_1 = require("react-native");
const context_1 = require("./context");
const shared_1 = require("./shared");
const toolbar_primitives_1 = require("./toolbar-primitives");
const elements_1 = require("../../../link/elements");
const native_1 = require("../../../link/preview/native");
const children_1 = require("../../../utils/children");
/**
 * Computes the label and menu title from children and title prop.
 *
 * - If only `title` prop is provided, it is used for both the label (button text) and menu title
 * - If only `.Label` child is provided, it is used for the label and the menu title is an empty string
 * - If both `.Label` child and `title` prop are provided. `.Label` is used for the label, and `title` is used for the menu title
 */
function computeMenuLabelAndTitle(children, title) {
    const labelChild = (0, children_1.getFirstChildOfType)(children, toolbar_primitives_1.StackToolbarLabel);
    const labelFromChild = labelChild?.props.children;
    return {
        label: labelFromChild ?? title ?? '',
        menuTitle: title ?? '',
    };
}
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
const StackToolbarMenu = (props) => {
    const placement = (0, context_1.useToolbarPlacement)();
    if (placement !== 'bottom') {
        // For placement other than bottom, this component will not render, and should be
        // converted to RN header item using convertStackToolbarMenuPropsToRNHeaderItem.
        // So if we reach here, it means we're not inside a toolbar or something else is wrong.
        throw new Error('Stack.Toolbar.Menu must be used inside a Stack.Toolbar');
    }
    const validChildren = (0, react_1.useMemo)(() => (0, children_1.filterAllowedChildrenElements)(props.children, ALLOWED_CHILDREN), [props.children]);
    const sharedProps = convertStackToolbarMenuPropsToRNHeaderItem(props, true);
    const computedLabel = sharedProps?.label;
    const computedMenuTitle = sharedProps?.menu?.title;
    const icon = sharedProps?.icon?.type === 'sfSymbol' ? sharedProps.icon.name : undefined;
    const xcassetName = (0, shared_1.extractXcassetName)(props);
    const imageRenderingMode = (0, shared_1.extractIconRenderingMode)(props) ?? props.iconRenderingMode;
    if (process.env.NODE_ENV !== 'production') {
        const allChildren = react_1.Children.toArray(props.children);
        if (allChildren.length !== validChildren.length) {
            throw new Error(`Stack.Toolbar.Menu only accepts Stack.Toolbar.Menu, Stack.Toolbar.MenuAction, Stack.Toolbar.Label, Stack.Toolbar.Icon, and Stack.Toolbar.Badge as its children.`);
        }
    }
    if (process.env.NODE_ENV !== 'production') {
        const hasBadge = (0, children_1.getFirstChildOfType)(props.children, toolbar_primitives_1.StackToolbarBadge);
        if (hasBadge) {
            console.warn('Stack.Toolbar.Badge is not supported in bottom toolbar (iOS limitation). The badge will be ignored.');
        }
    }
    // TODO(@ubax): Handle image loading using useImage in a follow-up PR.
    return (<NativeToolbarMenu {...props} icon={icon} xcassetName={xcassetName} image={props.image} imageRenderingMode={imageRenderingMode} label={computedLabel} title={computedMenuTitle} children={validChildren}/>);
};
exports.StackToolbarMenu = StackToolbarMenu;
function convertStackToolbarMenuPropsToRNHeaderItem(props, isBottomPlacement = false) {
    if (props.hidden) {
        return undefined;
    }
    const { title, ...rest } = props;
    const actions = react_1.Children.toArray(props.children).filter((child) => (0, children_1.isChildOfType)(child, exports.StackToolbarMenuAction) || (0, children_1.isChildOfType)(child, exports.StackToolbarMenu));
    const { label: computedLabel, menuTitle: computedMenuTitle } = computeMenuLabelAndTitle(props.children, title);
    const sharedProps = (0, shared_1.convertStackHeaderSharedPropsToRNSharedHeaderItem)(rest, isBottomPlacement);
    const item = {
        ...sharedProps,
        label: computedLabel,
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
    if (computedMenuTitle) {
        item.menu.title = computedMenuTitle;
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
    if (placement !== 'bottom') {
        throw new Error('Stack.Toolbar.MenuAction must be used inside a Stack.Toolbar.Menu');
    }
    // TODO(@ubax): Handle image loading using useImage in a follow-up PR.
    const icon = typeof props.icon === 'string' ? props.icon : undefined;
    return (<NativeToolbarMenuAction {...props} icon={icon} image={props.image} imageRenderingMode={props.iconRenderingMode}/>);
};
exports.StackToolbarMenuAction = StackToolbarMenuAction;
function convertStackToolbarMenuActionPropsToRNHeaderItem(props) {
    const { children, isOn, unstable_keepPresented, icon, ...rest } = props;
    const sharedProps = (0, shared_1.convertStackHeaderSharedPropsToRNSharedHeaderItem)(props);
    const item = {
        ...rest,
        description: props.subtitle,
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
/**
 * Native toolbar menu component for bottom toolbar.
 * Renders as NativeLinkPreviewAction.
 */
const NativeToolbarMenu = ({ accessibilityHint, accessibilityLabel, separateBackground, hidesSharedBackground, palette, inline, hidden, subtitle, title, label, destructive, children, icon, xcassetName, image, imageRenderingMode, tintColor, variant, style, elementSize, }) => {
    const identifier = (0, react_1.useId)();
    const titleStyle = react_native_1.StyleSheet.flatten(style);
    const renderingMode = imageRenderingMode ?? (tintColor !== undefined ? 'template' : 'original');
    return (<native_1.NativeLinkPreviewAction sharesBackground={!separateBackground} hidesSharedBackground={hidesSharedBackground} hidden={hidden} icon={icon} xcassetName={xcassetName} 
    // TODO(@ubax): Handle image loading using useImage in a follow-up PR.
    image={image} imageRenderingMode={renderingMode} destructive={destructive} subtitle={subtitle} accessibilityLabel={accessibilityLabel} accessibilityHint={accessibilityHint} displayAsPalette={palette} displayInline={inline} preferredElementSize={elementSize} tintColor={tintColor} titleStyle={titleStyle} barButtonItemStyle={variant === 'done' ? 'prominent' : variant} title={title ?? ''} label={label} onSelected={() => { }} children={children} identifier={identifier}/>);
};
// #endregion
// #region NativeToolbarMenuAction
/**
 * Native toolbar menu action - reuses LinkMenuAction.
 */
const NativeToolbarMenuAction = elements_1.LinkMenuAction;
// #endregion
const ALLOWED_CHILDREN = [
    exports.StackToolbarMenu,
    exports.StackToolbarMenuAction,
    NativeToolbarMenu,
    NativeToolbarMenuAction,
    toolbar_primitives_1.StackToolbarLabel,
    toolbar_primitives_1.StackToolbarIcon,
    toolbar_primitives_1.StackToolbarBadge,
];
//# sourceMappingURL=StackToolbarMenu.js.map