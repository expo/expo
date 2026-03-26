"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.StackToolbar = void 0;
exports.appendStackToolbarPropsToOptions = appendStackToolbarPropsToOptions;
const react_1 = require("react");
const StackToolbarButton_1 = require("./StackToolbarButton");
const StackToolbarMenu_1 = require("./StackToolbarMenu");
const StackToolbarSearchBarSlot_1 = require("./StackToolbarSearchBarSlot");
const StackToolbarSpacer_1 = require("./StackToolbarSpacer");
const StackToolbarView_1 = require("./StackToolbarView");
const context_1 = require("./context");
const processHeaderItemsForPlatform_1 = require("./processHeaderItemsForPlatform");
const toolbar_primitives_1 = require("./toolbar-primitives");
const composition_options_1 = require("../../../fork/native-stack/composition-options");
const NativeMenuContext_1 = require("../../../link/NativeMenuContext");
const native_1 = require("../../../toolbar/native");
/**
 * The component used to configure the stack toolbar.
 *
 * - Use `placement="left"` to customize the left side of the header.
 * - Use `placement="right"` to customize the right side of the header.
 * - Use `placement="bottom"` (default) to show a bottom toolbar (iOS only).
 *
 * If multiple instances of this component are rendered for the same screen,
 * the last one rendered in the component tree takes precedence.
 *
 * > **Note:** Using `Stack.Toolbar` with `placement="left"` or `placement="right"` will
 * automatically make the header visible (`headerShown: true`), as the toolbar is rendered
 * as part of the native header.
 *
 * > **Note:** `Stack.Toolbar` with `placement="bottom"` can only be used inside **page**
 * components, not in layout components.
 *
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
 *           <Stack.Toolbar.Button icon="sidebar.left" onPress={() => alert('Left button pressed!')} />
 *         </Stack.Toolbar>
 *         <Stack.Toolbar placement="right">
 *           <Stack.Toolbar.Button icon="ellipsis.circle" onPress={() => alert('Right button pressed!')} />
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
 *         <Stack.Toolbar.Button icon="sidebar.left" onPress={() => alert('Left button pressed!')} />
 *       </Stack.Toolbar>
 *       <Stack.Toolbar>
 *         <Stack.Toolbar.Spacer />
 *         <Stack.Toolbar.Button icon="magnifyingglass" onPress={() => {}} />
 *         <Stack.Toolbar.Spacer />
 *       </Stack.Toolbar>
 *       <ScreenContent />
 *     </>
 *   );
 * }
 * ```
 *
 * @experimental
 * @platform ios
 */
const StackToolbar = (props) => {
    const parentPlacement = (0, context_1.useToolbarPlacement)();
    if (parentPlacement) {
        throw new Error(`Stack.Toolbar cannot be nested inside another Stack.Toolbar.`);
    }
    if (props.placement === 'bottom' || !props.placement) {
        return <StackToolbarBottom {...props}/>;
    }
    return <StackToolbarHeader {...props} key={props.placement}/>;
};
exports.StackToolbar = StackToolbar;
const StackToolbarBottom = ({ children, disableImePadding, tintColor, backgroundColor, }) => {
    const colors = (0, react_1.useMemo)(() => ({ tintColor, backgroundColor }), [tintColor, backgroundColor]);
    return (<context_1.ToolbarPlacementContext.Provider value="bottom">
      <context_1.ToolbarColorContext.Provider value={colors}>
        <NativeMenuContext_1.NativeMenuContext value>
          <native_1.RouterToolbarHost withImePadding={!disableImePadding} backgroundColor={backgroundColor}>
            {children}
          </native_1.RouterToolbarHost>
        </NativeMenuContext_1.NativeMenuContext>
      </context_1.ToolbarColorContext.Provider>
    </context_1.ToolbarPlacementContext.Provider>);
};
const StackToolbarHeader = ({ children, placement, asChild, disableImePadding, tintColor, backgroundColor, }) => {
    if (placement !== 'left' && placement !== 'right') {
        throw new Error(`Invalid placement "${placement}" for Stack.Toolbar. Expected "left" or "right".`);
    }
    const options = (0, react_1.useMemo)(() => appendStackToolbarPropsToOptions({}, 
    // satisfies ensures every prop is listed here
    {
        children,
        placement,
        asChild,
        disableImePadding,
        tintColor,
        backgroundColor,
    }), [children, placement, asChild, disableImePadding, tintColor, backgroundColor]);
    (0, composition_options_1.useCompositionOption)(options);
    return null;
};
function appendStackToolbarPropsToOptions(options, props) {
    const { children, placement = 'bottom', asChild } = props;
    if (placement === 'bottom') {
        // Bottom toolbar doesn't modify navigation options
        return options;
    }
    const colors = {
        tintColor: props.tintColor,
        backgroundColor: props.backgroundColor,
    };
    if (asChild) {
        const wrappedChildren = (<context_1.ToolbarColorContext.Provider value={colors}>{children}</context_1.ToolbarColorContext.Provider>);
        if (placement === 'left') {
            return {
                ...options,
                headerShown: true,
                headerLeft: () => wrappedChildren,
            };
        }
        else {
            return {
                ...options,
                headerShown: true,
                headerRight: () => wrappedChildren,
            };
        }
    }
    return { ...options, ...((0, processHeaderItemsForPlatform_1.processHeaderItemsForPlatform)(children, placement, colors) ?? {}) };
}
exports.StackToolbar.Button = StackToolbarButton_1.StackToolbarButton;
exports.StackToolbar.Menu = StackToolbarMenu_1.StackToolbarMenu;
exports.StackToolbar.MenuAction = StackToolbarMenu_1.StackToolbarMenuAction;
exports.StackToolbar.SearchBarSlot = StackToolbarSearchBarSlot_1.StackToolbarSearchBarSlot;
exports.StackToolbar.Spacer = StackToolbarSpacer_1.StackToolbarSpacer;
exports.StackToolbar.View = StackToolbarView_1.StackToolbarView;
exports.StackToolbar.Label = toolbar_primitives_1.StackToolbarLabel;
exports.StackToolbar.Icon = toolbar_primitives_1.StackToolbarIcon;
exports.StackToolbar.Badge = toolbar_primitives_1.StackToolbarBadge;
exports.default = exports.StackToolbar;
//# sourceMappingURL=StackToolbarClient.js.map