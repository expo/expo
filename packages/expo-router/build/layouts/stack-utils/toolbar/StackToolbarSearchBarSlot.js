"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.StackToolbarSearchBarSlot = void 0;
const bottom_toolbar_native_elements_1 = require("./bottom-toolbar-native-elements");
const context_1 = require("./context");
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
        if (process.env.NODE_ENV !== 'production') {
            console.warn('Stack.Toolbar.SearchBarSlot is only available in Bottom placement. It will not render in Left or Right placement.');
        }
        return null;
    }
    return <bottom_toolbar_native_elements_1.NativeToolbarSearchBarSlot {...props}/>;
};
exports.StackToolbarSearchBarSlot = StackToolbarSearchBarSlot;
//# sourceMappingURL=StackToolbarSearchBarSlot.js.map