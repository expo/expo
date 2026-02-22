"use strict";
'use client';
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.StackToolbar = void 0;
exports.appendStackToolbarPropsToOptions = appendStackToolbarPropsToOptions;
const react_1 = __importStar(require("react"));
const StackToolbarButton_1 = require("./StackToolbarButton");
const StackToolbarMenu_1 = require("./StackToolbarMenu");
const StackToolbarSearchBarSlot_1 = require("./StackToolbarSearchBarSlot");
const StackToolbarSpacer_1 = require("./StackToolbarSpacer");
const StackToolbarView_1 = require("./StackToolbarView");
const context_1 = require("./context");
const toolbar_primitives_1 = require("./toolbar-primitives");
const composition_options_1 = require("../../../fork/native-stack/composition-options");
const NativeMenuContext_1 = require("../../../link/NativeMenuContext");
const native_1 = require("../../../toolbar/native");
const children_1 = require("../../../utils/children");
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
const StackToolbarBottom = ({ children }) => {
    return (<context_1.ToolbarPlacementContext.Provider value="bottom">
      <NativeMenuContext_1.NativeMenuContext value>
        <native_1.RouterToolbarHost>{children}</native_1.RouterToolbarHost>
      </NativeMenuContext_1.NativeMenuContext>
    </context_1.ToolbarPlacementContext.Provider>);
};
const StackToolbarHeader = ({ children, placement, asChild }) => {
    if (placement !== 'left' && placement !== 'right') {
        throw new Error(`Invalid placement "${placement}" for Stack.Toolbar. Expected "left" or "right".`);
    }
    const options = (0, react_1.useMemo)(() => appendStackToolbarPropsToOptions({}, 
    // satisfies ensures every prop is listed here
    { children, placement, asChild }), [children, placement, asChild]);
    (0, composition_options_1.useCompositionOption)(options);
    return null;
};
function convertToolbarChildrenToUnstableItems(children, side) {
    const allChildren = react_1.default.Children.toArray(children);
    const actions = allChildren.filter((child) => (0, children_1.isChildOfType)(child, StackToolbarButton_1.StackToolbarButton) ||
        (0, children_1.isChildOfType)(child, StackToolbarMenu_1.StackToolbarMenu) ||
        (0, children_1.isChildOfType)(child, StackToolbarSpacer_1.StackToolbarSpacer) ||
        (0, children_1.isChildOfType)(child, StackToolbarView_1.StackToolbarView));
    if (actions.length !== allChildren.length && process.env.NODE_ENV !== 'production') {
        const otherElements = allChildren
            .filter((child) => !actions.some((action) => action === child))
            .map((e) => {
            if ((0, react_1.isValidElement)(e)) {
                if (e.type === react_1.Fragment) {
                    return '<Fragment>';
                }
                else {
                    return e.type?.name ?? e.type;
                }
            }
            return String(e);
        });
        console.warn(`Stack.Toolbar with placement="${side}" only accepts <Stack.Toolbar.Button>, <Stack.Toolbar.Menu>, <Stack.Toolbar.View>, and <Stack.Toolbar.Spacer> as children. Found invalid children: ${otherElements.join(', ')}`);
    }
    return () => actions
        .map((action) => {
        if ((0, children_1.isChildOfType)(action, StackToolbarButton_1.StackToolbarButton)) {
            return (0, StackToolbarButton_1.convertStackToolbarButtonPropsToRNHeaderItem)(action.props);
        }
        else if ((0, children_1.isChildOfType)(action, StackToolbarMenu_1.StackToolbarMenu)) {
            return (0, StackToolbarMenu_1.convertStackToolbarMenuPropsToRNHeaderItem)(action.props);
        }
        else if ((0, children_1.isChildOfType)(action, StackToolbarSpacer_1.StackToolbarSpacer)) {
            return (0, StackToolbarSpacer_1.convertStackToolbarSpacerPropsToRNHeaderItem)(action.props);
        }
        return (0, StackToolbarView_1.convertStackToolbarViewPropsToRNHeaderItem)(action.props);
    })
        .filter((item) => !!item);
}
function appendStackToolbarPropsToOptions(options, props) {
    const { children, placement = 'bottom', asChild } = props;
    if (placement === 'bottom') {
        // Bottom toolbar doesn't modify navigation options
        return options;
    }
    if (asChild) {
        if (placement === 'left') {
            return {
                ...options,
                headerShown: true,
                headerLeft: () => children,
            };
        }
        else {
            return {
                ...options,
                headerShown: true,
                headerRight: () => children,
            };
        }
    }
    if (placement === 'left') {
        return {
            ...options,
            headerShown: true,
            unstable_headerLeftItems: convertToolbarChildrenToUnstableItems(children, 'left'),
        };
    }
    return {
        ...options,
        headerShown: true,
        unstable_headerRightItems: convertToolbarChildrenToUnstableItems(children, 'right'),
    };
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