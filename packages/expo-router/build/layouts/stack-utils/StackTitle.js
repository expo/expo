"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StackTitle = StackTitle;
exports.appendStackTitlePropsToOptions = appendStackTitlePropsToOptions;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const react_native_1 = require("react-native");
const shared_1 = require("./toolbar/shared");
const composition_options_1 = require("../../fork/native-stack/composition-options");
const style_1 = require("../../utils/style");
/**
 * Component to set the screen title.
 *
 * Can be used inside `Stack.Screen` in a layout or directly inside a screen component.
 *
 * @example
 * String title in a layout:
 * ```tsx
 * import { Stack } from 'expo-router';
 *
 * export default function Layout() {
 *   return (
 *     <Stack>
 *       <Stack.Screen name="index">
 *         <Stack.Title large>Home</Stack.Title>
 *       </Stack.Screen>
 *     </Stack>
 *   );
 * }
 * ```
 *
 * @example
 * String title inside a screen:
 * ```tsx
 * import { Stack } from 'expo-router';
 *
 * export default function Page() {
 *   return (
 *     <>
 *       <Stack.Title>My Page</Stack.Title>
 *       <ScreenContent />
 *     </>
 *   );
 * }
 * ```
 *
 * @example
 * Custom component as the title using `asChild`:
 * ```tsx
 * import { Stack } from 'expo-router';
 *
 * export default function Layout() {
 *   return (
 *     <Stack>
 *       <Stack.Screen name="index">
 *         <Stack.Title asChild>
 *           <MyCustomTitle />
 *         </Stack.Title>
 *       </Stack.Screen>
 *     </Stack>
 *   );
 * }
 * ```
 *
 * > **Note:** If multiple instances of this component are rendered for the same screen,
 * the last one rendered in the component tree takes precedence.
 */
function StackTitle({ children, asChild, style, largeStyle, large }) {
    const options = (0, react_1.useMemo)(() => appendStackTitlePropsToOptions({}, 
    // satisfies ensures every prop is listed here
    { children, asChild, style, largeStyle, large }), [children, asChild, style, largeStyle, large]);
    (0, composition_options_1.useCompositionOption)(options);
    return null;
}
function appendStackTitlePropsToOptions(options, props) {
    const flattenedStyle = react_native_1.StyleSheet.flatten(props.style);
    const flattenedLargeStyle = react_native_1.StyleSheet.flatten(props.largeStyle);
    let titleOptions = props.asChild
        ? { headerTitle: () => (0, jsx_runtime_1.jsx)(jsx_runtime_1.Fragment, { children: props.children }) }
        : { title: (0, shared_1.convertChildrenToString)(props.children) };
    if (props.asChild && typeof props.children === 'string') {
        if (__DEV__) {
            console.warn("Stack.Title (or the deprecated Stack.Screen.Title): 'asChild' expects a custom component as children, string received.");
        }
        titleOptions = {};
    }
    if (!props.asChild && props.children != null && !(0, shared_1.areAllChildrenPrimitiveValues)(props.children)) {
        if (__DEV__) {
            console.warn('Stack.Title (or the deprecated Stack.Screen.Title): Component passed without `asChild` enabled. In order to render a custom component as the title, set `asChild` to true.');
        }
        titleOptions = {};
    }
    return {
        ...options,
        ...titleOptions,
        headerLargeTitle: props.large,
        headerTitleAlign: flattenedStyle?.textAlign,
        headerTitleStyle: {
            ...flattenedStyle,
            ...(flattenedStyle?.fontWeight
                ? {
                    fontWeight: (0, style_1.convertFontWeightToStringFontWeight)(flattenedStyle?.fontWeight),
                }
                : {}),
        },
        headerLargeTitleStyle: {
            ...flattenedLargeStyle,
            ...(flattenedLargeStyle?.fontWeight
                ? {
                    fontWeight: (0, style_1.convertFontWeightToStringFontWeight)(flattenedLargeStyle?.fontWeight),
                }
                : {}),
        },
    };
}
//# sourceMappingURL=StackTitle.js.map