"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.processHeaderItemsForPlatform = processHeaderItemsForPlatform;
const jsx_runtime_1 = require("react/jsx-runtime");
const jetpack_compose_1 = require("@expo/ui/jetpack-compose");
const react_1 = require("react");
const context_1 = require("./context");
const NativeMenuContext_1 = require("../../../link/NativeMenuContext");
/**
 * On Android, renders toolbar children as native Compose components inside `headerLeft`/`headerRight`.
 * This bridges the gap since Android's react-native-screens doesn't support
 * `unstable_headerLeftItems`/`unstable_headerRightItems`.
 */
function processHeaderItemsForPlatform(children, placement, colors) {
    if (placement !== 'left' && placement !== 'right') {
        return null;
    }
    const headerContent = (props) => ((0, jsx_runtime_1.jsx)(HeaderToolbarHostBase, { placement: placement, colors: colors, headerProps: props, children: children }));
    if (placement === 'left') {
        return {
            headerShown: true,
            headerLeft: headerContent,
        };
    }
    return {
        headerShown: true,
        headerRight: headerContent,
    };
}
function HeaderToolbarHostBase({ children, placement, colors, headerProps, }) {
    const stableColors = (0, react_1.useMemo)(() => ({
        tintColor: colors?.tintColor ?? headerProps?.tintColor,
        backgroundColor: colors?.backgroundColor ?? headerProps?.backgroundColor,
    }), [
        colors?.backgroundColor,
        colors?.tintColor,
        headerProps?.tintColor,
        headerProps?.backgroundColor,
    ]);
    return ((0, jsx_runtime_1.jsx)(context_1.ToolbarPlacementContext.Provider, { value: placement, children: (0, jsx_runtime_1.jsx)(context_1.ToolbarColorContext.Provider, { value: stableColors, children: (0, jsx_runtime_1.jsx)(NativeMenuContext_1.NativeMenuContext, { value: true, children: (0, jsx_runtime_1.jsx)(jetpack_compose_1.Host, { matchContents: true, children: (0, jsx_runtime_1.jsx)(jetpack_compose_1.Row, { verticalAlignment: "center", children: children }) }) }) }) }));
}
//# sourceMappingURL=processHeaderItemsForPlatform.android.js.map