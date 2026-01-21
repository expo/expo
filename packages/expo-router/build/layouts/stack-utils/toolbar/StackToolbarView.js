"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.StackToolbarView = void 0;
exports.convertStackToolbarViewPropsToRNHeaderItem = convertStackToolbarViewPropsToRNHeaderItem;
const bottom_toolbar_native_elements_1 = require("./bottom-toolbar-native-elements");
const context_1 = require("./context");
/**
 * A wrapper to render custom content in the toolbar.
 *
 * Use inside `Stack.Toolbar` to render a custom React element.
 *
 * @example
 * ```tsx
 * import { Stack } from 'expo-router';
 * import { Text } from 'react-native';
 *
 * function CustomElement() {
 *   return <Text>Custom Element</Text>;
 * }
 *
 * export default function Page() {
 *   return (
 *     <>
 *       <Stack.Toolbar>
 *         <Stack.Toolbar.View>
 *           <CustomElement />
 *         </Stack.Toolbar.View>
 *       </Stack.Toolbar>
 *       <ScreenContent />
 *     </>
 *   );
 * }
 * ```
 *
 * @platform ios
 */
const StackToolbarView = (props) => {
    const placement = (0, context_1.useToolbarPlacement)();
    if (placement === 'bottom') {
        return <bottom_toolbar_native_elements_1.NativeToolbarView {...props}>{props.children}</bottom_toolbar_native_elements_1.NativeToolbarView>;
    }
    return null;
};
exports.StackToolbarView = StackToolbarView;
function convertStackToolbarViewPropsToRNHeaderItem(props) {
    if (props.hidden) {
        return undefined;
    }
    const { children, hidesSharedBackground } = props;
    if (!children) {
        console.warn('Stack.Toolbar.View requires a child element to render custom content in the toolbar.');
    }
    const element = children ? children : <></>;
    return {
        type: 'custom',
        element,
        hidesSharedBackground,
    };
}
//# sourceMappingURL=StackToolbarView.js.map