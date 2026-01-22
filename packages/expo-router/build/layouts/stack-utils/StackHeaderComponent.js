"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StackHeaderComponent = StackHeaderComponent;
exports.appendStackHeaderPropsToOptions = appendStackHeaderPropsToOptions;
const react_1 = require("react");
const react_native_1 = require("react-native");
const Screen_1 = require("../../views/Screen");
/**
 * The component used to configure header styling for a stack screen.
 *
 * Use this component to set header appearance properties like blur effect, background color,
 * and shadow visibility.
 *
 * @example
 * ```tsx
 * import { Stack } from 'expo-router';
 *
 * export default function Page() {
 *   return (
 *     <>
 *       <Stack.Header
 *         blurEffect="systemMaterial"
 *         style={{ backgroundColor: '#fff' }}
 *       />
 *       <ScreenContent />
 *     </>
 *   );
 * }
 * ```
 *
 * @example
 * When used inside a layout with Stack.Screen:
 * ```tsx
 * import { Stack } from 'expo-router';
 *
 * export default function Layout() {
 *   return (
 *     <Stack>
 *       <Stack.Screen name="index">
 *         <Stack.Header blurEffect="systemMaterial" />
 *       </Stack.Screen>
 *     </Stack>
 *   );
 * }
 * ```
 */
function StackHeaderComponent(props) {
    // This component will only render when used inside a page
    // but only if it is not wrapped in Stack.Screen
    const updatedOptions = (0, react_1.useMemo)(() => appendStackHeaderPropsToOptions({}, props), [props]);
    return <Screen_1.Screen options={updatedOptions}/>;
}
function appendStackHeaderPropsToOptions(options, props) {
    const flattenedStyle = react_native_1.StyleSheet.flatten(props.style);
    const flattenedLargeStyle = react_native_1.StyleSheet.flatten(props.largeStyle);
    if (props.hidden) {
        return { ...options, headerShown: false };
    }
    if (props.asChild) {
        return { ...options, header: () => props.children };
    }
    if (props.children && !props.asChild) {
        console.warn(`To render a custom header, set the 'asChild' prop to true on Stack.Header.`);
    }
    return {
        ...options,
        headerShown: !props.hidden,
        headerBlurEffect: props.blurEffect,
        headerStyle: {
            backgroundColor: flattenedStyle?.backgroundColor,
        },
        headerLargeStyle: {
            backgroundColor: flattenedLargeStyle?.backgroundColor,
        },
        headerShadowVisible: flattenedStyle?.shadowColor !== 'transparent',
        headerLargeTitleShadowVisible: flattenedLargeStyle?.shadowColor !== 'transparent',
    };
}
//# sourceMappingURL=StackHeaderComponent.js.map