"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.StackToolbarSearchBarSlot = void 0;
const react_1 = require("react");
const react_native_1 = require("react-native");
const context_1 = require("./context");
const native_1 = require("../../../toolbar/native");
/**
 * A search bar slot for the bottom toolbar. This reserves space for the search bar
 * in the toolbar and allows positioning it among other toolbar items.
 *
 * This component is only available in bottom placement (`<Stack.Toolbar>` or `<Stack.Toolbar placement="bottom">`).
 *
 * @example
 * ```tsx
 * import { Stack } from 'expo-router';
 *
 * export default function Page() {
 *   return (
 *     <>
 *       <Stack.Toolbar>
 *         <Stack.Toolbar.Button icon="folder" />
 *         <Stack.Toolbar.SearchBarSlot />
 *         <Stack.Toolbar.Button icon="ellipsis.circle" />
 *       </Stack.Toolbar>
 *       <ScreenContent />
 *     </>
 *   );
 * }
 * ```
 *
 * @platform iOS 26+
 */
const StackToolbarSearchBarSlot = (props) => {
    const placement = (0, context_1.useToolbarPlacement)();
    if (placement !== 'bottom') {
        throw new Error('Stack.Toolbar.SearchBarSlot must be used inside a Stack.Toolbar');
    }
    return <NativeToolbarSearchBarSlot {...props}/>;
};
exports.StackToolbarSearchBarSlot = StackToolbarSearchBarSlot;
/**
 * Native toolbar search bar slot for bottom toolbar (iOS 26+).
 * Renders as RouterToolbarItem with type 'searchBar'.
 */
const NativeToolbarSearchBarSlot = ({ hidesSharedBackground, hidden, separateBackground, }) => {
    const id = (0, react_1.useId)();
    if (process.env.EXPO_OS !== 'ios' || parseInt(String(react_native_1.Platform.Version).split('.')[0], 10) < 26) {
        return null;
    }
    if (hidden) {
        return null;
    }
    return (<native_1.RouterToolbarItem hidesSharedBackground={hidesSharedBackground} identifier={id} sharesBackground={!separateBackground} type="searchBar"/>);
};
// #endregion
//# sourceMappingURL=StackToolbarSearchBarSlot.js.map