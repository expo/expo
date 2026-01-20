"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StackScreenTitle = StackScreenTitle;
exports.appendStackScreenTitlePropsToOptions = appendStackScreenTitlePropsToOptions;
const react_1 = require("react");
const react_native_1 = require("react-native");
const style_1 = require("../../../utils/style");
const Screen_1 = require("../../../views/Screen");
/**
 * Component to set the screen title.
 *
 * Can be used inside Stack.Screen in a layout or directly inside a screen component.
 *
 * @example
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
 * @platform ios
 */
function StackScreenTitle(props) {
    const updatedOptions = (0, react_1.useMemo)(() => appendStackScreenTitlePropsToOptions({}, props), [props]);
    return <Screen_1.Screen options={updatedOptions}/>;
}
function appendStackScreenTitlePropsToOptions(options, props) {
    const flattenedStyle = react_native_1.StyleSheet.flatten(props.style);
    const flattenedLargeStyle = react_native_1.StyleSheet.flatten(props.largeStyle);
    return {
        ...options,
        title: props.children,
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