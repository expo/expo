"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.NativeToolbarMenuAction = exports.NativeToolbarMenu = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const expo_ui_1 = require("../../../../optional-dependencies/expo-ui");
const primitives_1 = require("../../../../primitives");
const AnimatedItemContainer_1 = require("../../../../toolbar/AnimatedItemContainer");
const children_1 = require("../../../../utils/children");
const context_1 = require("../context");
const defaults_1 = require("../defaults");
const arrowRightIcon = require('../../../../../assets/arrow_right.xml');
const checkmarkIcon = require('../../../../../assets/checkmark.xml');
/**
 * Context for propagating menu close callbacks from root to nested menus.
 * - `null` means root level (no parent menu)
 * - A function means nested level (call to close entire menu chain)
 */
const ToolbarMenuCloseContext = (0, react_1.createContext)(null);
/**
 * Native toolbar menu component for Android bottom toolbar.
 * Renders as a DropdownMenu with IconButton trigger (root) or DropdownMenuItem trigger (nested).
 */
const NativeToolbarMenu = (props) => {
    const { DropdownMenu, DropdownMenuItem, HorizontalDivider, Icon, IconButton, Text: ComposeText, } = (0, expo_ui_1.getExpoUiJetpackCompose)('`Stack.Toolbar.Menu` on Android');
    const { background } = (0, expo_ui_1.getExpoUiJetpackComposeModifiers)('`Stack.Toolbar.Menu` on Android');
    const [expanded, setExpanded] = (0, react_1.useState)(false);
    const parentClose = (0, react_1.use)(ToolbarMenuCloseContext);
    const isNested = parentClose !== null;
    const toolbarColors = (0, context_1.useToolbarColors)();
    const tintColor = props.imageRenderingMode === 'original'
        ? undefined
        : (props.tintColor ?? toolbarColors.tintColor ?? (0, defaults_1.DEFAULT_TOOLBAR_TINT_COLOR)());
    const backgroundColor = (toolbarColors.backgroundColor ??
        (0, defaults_1.DEFAULT_TOOLBAR_BACKGROUND_COLOR)());
    const closeMenu = (0, react_1.useCallback)(() => {
        setExpanded(false);
        parentClose?.();
    }, [parentClose]);
    // Inline nested: render children directly with a divider separator
    if (isNested && props.inline) {
        return ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(HorizontalDivider, {}), props.children] }));
    }
    // Non-inline nested: DropdownMenu with DropdownMenuItem trigger
    if (isNested) {
        const trailingIcon = ((0, jsx_runtime_1.jsx)(DropdownMenuItem.TrailingIcon, { children: (0, jsx_runtime_1.jsx)(Icon, { source: arrowRightIcon, tint: tintColor, size: 24 }) }));
        const leadingIcon = props.source ? ((0, jsx_runtime_1.jsx)(DropdownMenuItem.LeadingIcon, { children: (0, jsx_runtime_1.jsx)(Icon, { source: props.source, tint: tintColor, size: 24 }) })) : null;
        return ((0, jsx_runtime_1.jsxs)(DropdownMenu, { expanded: expanded, onDismissRequest: () => setExpanded(false), color: backgroundColor, children: [(0, jsx_runtime_1.jsx)(DropdownMenu.Trigger, { children: (0, jsx_runtime_1.jsxs)(DropdownMenuItem, { onClick: () => {
                            if (!props.disabled)
                                setExpanded(true);
                        }, modifiers: [background(backgroundColor)], enabled: !props.disabled, children: [leadingIcon, (0, jsx_runtime_1.jsx)(DropdownMenuItem.Text, { children: (0, jsx_runtime_1.jsx)(ComposeText, { color: typeof props.tintColor === 'string'
                                        ? props.tintColor
                                        : (toolbarColors.tintColor ?? (0, defaults_1.DEFAULT_TOOLBAR_TINT_COLOR)()), children: props.label }) }), trailingIcon] }) }), (0, jsx_runtime_1.jsx)(DropdownMenu.Items, { children: (0, jsx_runtime_1.jsx)(ToolbarMenuCloseContext, { value: closeMenu, children: props.children }) })] }));
    }
    // Root: AnimatedItemContainer + IconButton trigger + DropdownMenu
    if (!props.source) {
        if (process.env.NODE_ENV !== 'production') {
            console.warn('Stack.Toolbar.Menu on Android requires an ImageSourcePropType icon. SF Symbols and xcasset icons are not supported. Use the `icon` prop with a require() or { uri } source, or use <Stack.Toolbar.Icon src={...} />.');
        }
        return null;
    }
    return ((0, jsx_runtime_1.jsx)(AnimatedItemContainer_1.AnimatedItemContainer, { visible: !props.hidden, children: (0, jsx_runtime_1.jsxs)(DropdownMenu, { expanded: expanded, onDismissRequest: () => setExpanded(false), color: backgroundColor, children: [(0, jsx_runtime_1.jsx)(DropdownMenu.Trigger, { children: (0, jsx_runtime_1.jsx)(IconButton, { onClick: () => setExpanded(true), enabled: !props.disabled, modifiers: [background(backgroundColor)], children: (0, jsx_runtime_1.jsx)(Icon, { source: props.source, tint: tintColor, size: 24, contentDescription: props.accessibilityLabel }) }) }), (0, jsx_runtime_1.jsx)(DropdownMenu.Items, { children: (0, jsx_runtime_1.jsx)(ToolbarMenuCloseContext, { value: closeMenu, children: props.children }) })] }) }));
};
exports.NativeToolbarMenu = NativeToolbarMenu;
/**
 * Native toolbar menu action component for Android.
 * Renders as a DropdownMenuItem.
 */
const NativeToolbarMenuAction = (props) => {
    const { DropdownMenuItem, Icon, Text: ComposeText, } = (0, expo_ui_1.getExpoUiJetpackCompose)('`Stack.Toolbar.MenuAction` on Android');
    const { background } = (0, expo_ui_1.getExpoUiJetpackComposeModifiers)('`Stack.Toolbar.MenuAction` on Android');
    const closeMenu = (0, react_1.use)(ToolbarMenuCloseContext);
    const toolbarColors = (0, context_1.useToolbarColors)();
    const tintColor = props.destructive
        ? (0, defaults_1.DEFAULT_DESTRUCTIVE_COLOR)()
        : (toolbarColors.tintColor ?? (0, defaults_1.DEFAULT_TOOLBAR_TINT_COLOR)());
    const backgroundColor = (toolbarColors.backgroundColor ??
        (0, defaults_1.DEFAULT_TOOLBAR_BACKGROUND_COLOR)());
    const handleClick = (0, react_1.useCallback)(() => {
        props.onPress?.();
        if (!props.unstable_keepPresented) {
            closeMenu?.();
        }
    }, [props.onPress, props.unstable_keepPresented, closeMenu]);
    const areChildrenString = typeof props.children === 'string';
    const label = areChildrenString
        ? props.children
        : ((0, children_1.getFirstChildOfType)(props.children, primitives_1.Label)?.props.children ?? '');
    if (props.hidden)
        return null;
    return ((0, jsx_runtime_1.jsxs)(DropdownMenuItem, { onClick: handleClick, modifiers: [background(backgroundColor)], enabled: !props.disabled, children: [(0, jsx_runtime_1.jsx)(DropdownMenuItem.Text, { children: (0, jsx_runtime_1.jsx)(ComposeText, { color: tintColor, children: label }) }), props.source && ((0, jsx_runtime_1.jsx)(DropdownMenuItem.LeadingIcon, { children: (0, jsx_runtime_1.jsx)(Icon, { source: props.source, tint: tintColor, size: 24 }) })), props.isOn && ((0, jsx_runtime_1.jsx)(DropdownMenuItem.TrailingIcon, { children: (0, jsx_runtime_1.jsx)(Icon, { source: checkmarkIcon, tint: tintColor, size: 24 }) }))] }));
};
exports.NativeToolbarMenuAction = NativeToolbarMenuAction;
//# sourceMappingURL=native.android.js.map