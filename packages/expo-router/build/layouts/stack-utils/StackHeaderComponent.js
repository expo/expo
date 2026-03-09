"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StackHeaderComponent = StackHeaderComponent;
exports.appendStackHeaderPropsToOptions = appendStackHeaderPropsToOptions;
const react_1 = require("react");
const react_native_1 = require("react-native");
const composition_options_1 = require("../../fork/native-stack/composition-options");
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
 *
 * > **Note:** If multiple instances of this component are rendered for the same screen,
 * the last one rendered in the component tree takes precedence.
 */
function StackHeaderComponent({ children, hidden, asChild, transparent, blurEffect, style, largeStyle, }) {
    const options = (0, react_1.useMemo)(() => appendStackHeaderPropsToOptions({}, 
    // satisfies ensures every prop is listed here
    { children, hidden, asChild, transparent, blurEffect, style, largeStyle }), [children, hidden, asChild, transparent, blurEffect, style, largeStyle]);
    (0, composition_options_1.useCompositionOption)(options);
    return null;
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
    // Determine if header should be transparent:
    // 1. Explicitly set via `transparent` prop
    // 2. Implicitly via backgroundColor === 'transparent'
    // 3. Implicitly when blurEffect is set (required for blurEffect to work)
    const isBackgroundTransparent = flattenedStyle?.backgroundColor === 'transparent';
    const hasBlurEffect = props.blurEffect !== undefined;
    const shouldBeTransparent = props.transparent === true ||
        (props.transparent !== false && (isBackgroundTransparent || hasBlurEffect));
    // Warn if blurEffect is set but transparent is explicitly false
    if (props.blurEffect && props.transparent === false) {
        console.warn(`Stack.Header: 'blurEffect' requires 'transparent' to be enabled.`);
    }
    return {
        ...options,
        headerShown: !props.hidden,
        headerBlurEffect: props.blurEffect,
        ...(shouldBeTransparent && { headerTransparent: true }),
        ...(props.transparent === false && { headerTransparent: false }),
        ...(flattenedStyle?.color && { headerTintColor: flattenedStyle.color }),
        headerStyle: {
            backgroundColor: flattenedStyle?.backgroundColor,
        },
        headerLargeStyle: {
            backgroundColor: flattenedLargeStyle?.backgroundColor,
        },
        ...(flattenedStyle?.shadowColor === 'transparent' && { headerShadowVisible: false }),
        ...(flattenedLargeStyle?.shadowColor === 'transparent' && {
            headerLargeTitleShadowVisible: false,
        }),
    };
}
//# sourceMappingURL=StackHeaderComponent.js.map