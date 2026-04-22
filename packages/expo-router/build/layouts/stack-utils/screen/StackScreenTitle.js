import React, { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { useCompositionOption } from '../../../fork/native-stack/composition-options';
import { convertFontWeightToStringFontWeight } from '../../../utils/style';
import { areAllChildrenPrimitiveValues, convertChildrenToString } from '../toolbar/shared';
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
export function StackScreenTitle({ children, asChild, style, largeStyle, large, }) {
    const options = useMemo(() => appendStackScreenTitlePropsToOptions({}, 
    // satisfies ensures every prop is listed here
    { children, asChild, style, largeStyle, large }), [children, asChild, style, largeStyle, large]);
    useCompositionOption(options);
    return null;
}
export function appendStackScreenTitlePropsToOptions(options, props) {
    const flattenedStyle = StyleSheet.flatten(props.style);
    const flattenedLargeStyle = StyleSheet.flatten(props.largeStyle);
    let titleOptions = props.asChild
        ? { headerTitle: () => <>{props.children}</> }
        : { title: convertChildrenToString(props.children) };
    if (props.asChild && typeof props.children === 'string') {
        if (__DEV__) {
            console.warn("Stack.Screen.Title: 'asChild' expects a custom component as children, string received.");
        }
        titleOptions = {};
    }
    if (!props.asChild && props.children != null && !areAllChildrenPrimitiveValues(props.children)) {
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
                    fontWeight: convertFontWeightToStringFontWeight(flattenedStyle?.fontWeight),
                }
                : {}),
        },
        headerLargeTitleStyle: {
            ...flattenedLargeStyle,
            ...(flattenedLargeStyle?.fontWeight
                ? {
                    fontWeight: convertFontWeightToStringFontWeight(flattenedLargeStyle?.fontWeight),
                }
                : {}),
        },
    };
}
//# sourceMappingURL=StackScreenTitle.js.map