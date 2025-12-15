"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StackHeaderTitle = StackHeaderTitle;
exports.appendStackHeaderTitlePropsToOptions = appendStackHeaderTitlePropsToOptions;
const react_native_1 = require("react-native");
const style_1 = require("../../utils/style");
function StackHeaderTitle(props) {
    return null;
}
function appendStackHeaderTitlePropsToOptions(options, props) {
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
//# sourceMappingURL=StackHeaderTitle.js.map