"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StackScreenTitle = StackScreenTitle;
exports.appendStackScreenTitlePropsToOptions = appendStackScreenTitlePropsToOptions;
const react_1 = __importDefault(require("react"));
const react_native_1 = require("react-native");
const composition_options_1 = require("../../../fork/native-stack/composition-options");
const style_1 = require("../../../utils/style");
/**
 * Component to set the screen title.
 *
 * Can be used inside Stack.Screen in a layout or directly inside a screen component.
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
 *         <Stack.Screen.Title large>Home</Stack.Screen.Title>
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
 *       <Stack.Screen.Title>My Page</Stack.Screen.Title>
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
 *         <Stack.Screen.Title asChild>
 *           <MyCustomTitle />
 *         </Stack.Screen.Title>
 *       </Stack.Screen>
 *     </Stack>
 *   );
 * }
 * ```
 *
 * > **Note:** If multiple instances of this component are rendered for the same screen,
 * the last one rendered in the component tree takes precedence.
 */
function StackScreenTitle({ children, asChild, style, largeStyle, large, }) {
    (0, composition_options_1.useCompositionOption)(() => appendStackScreenTitlePropsToOptions({}, 
    // satisfies ensures every prop is listed here; a missing prop would silently be
    // undefined and absent from the dependency array below.
    { children, asChild, style, largeStyle, large }), [children, asChild, style, largeStyle, large]);
    return null;
}
function appendStackScreenTitlePropsToOptions(options, props) {
    const flattenedStyle = react_native_1.StyleSheet.flatten(props.style);
    const flattenedLargeStyle = react_native_1.StyleSheet.flatten(props.largeStyle);
    let titleOptions = props.asChild
        ? { headerTitle: () => <>{props.children}</> }
        : { title: props.children };
    if (props.asChild && typeof props.children === 'string') {
        if (__DEV__) {
            console.warn("Stack.Screen.Title: 'asChild' expects a custom component as children, string received.");
        }
        titleOptions = {};
    }
    if (!props.asChild && props.children != null && typeof props.children !== 'string') {
        if (__DEV__) {
            console.warn('Stack.Screen.Title: Component passed to Stack.Screen.Title without `asChild` enabled. In order to render a custom component as the title, set `asChild` to true.');
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
//# sourceMappingURL=StackScreenTitle.js.map