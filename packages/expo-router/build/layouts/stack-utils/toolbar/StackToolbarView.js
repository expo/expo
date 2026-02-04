"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.StackToolbarView = void 0;
exports.convertStackToolbarViewPropsToRNHeaderItem = convertStackToolbarViewPropsToRNHeaderItem;
const react_1 = require("react");
const context_1 = require("./context");
const native_1 = require("../../../toolbar/native");
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
    if (placement !== 'bottom') {
        throw new Error('Stack.Toolbar.View must be used inside a Stack.Toolbar');
    }
    return <NativeToolbarView {...props}>{props.children}</NativeToolbarView>;
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
/**
 * Native toolbar view component for bottom toolbar.
 * Renders as RouterToolbarItem with children.
 */
const NativeToolbarView = ({ children, hidden, hidesSharedBackground, separateBackground, }) => {
    const id = (0, react_1.useId)();
    return (<native_1.RouterToolbarItem hidesSharedBackground={hidesSharedBackground} hidden={hidden} identifier={id} sharesBackground={!separateBackground}>
      {children}
    </native_1.RouterToolbarItem>);
};
// #endregion
//# sourceMappingURL=StackToolbarView.js.map