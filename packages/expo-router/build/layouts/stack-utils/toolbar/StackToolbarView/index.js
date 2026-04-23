"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.StackToolbarView = void 0;
exports.convertStackToolbarViewPropsToRNHeaderItem = convertStackToolbarViewPropsToRNHeaderItem;
const jsx_runtime_1 = require("react/jsx-runtime");
const native_1 = require("./native");
const context_1 = require("../context");
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
 * @platform android
 * @platform ios
 */
const StackToolbarView = (props) => {
    const placement = (0, context_1.useToolbarPlacement)();
    if ((process.env.EXPO_OS === 'ios' && placement !== 'bottom') || placement == null) {
        throw new Error('Stack.Toolbar.View must be used inside a Stack.Toolbar');
    }
    return (0, jsx_runtime_1.jsx)(native_1.NativeToolbarView, { ...props, children: props.children });
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
    const element = children ? children : (0, jsx_runtime_1.jsx)(jsx_runtime_1.Fragment, {});
    return {
        type: 'custom',
        element,
        hidesSharedBackground,
    };
}
//# sourceMappingURL=index.js.map