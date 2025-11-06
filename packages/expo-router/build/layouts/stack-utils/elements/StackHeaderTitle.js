"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StackHeaderTitle = StackHeaderTitle;
exports.appendStackHeaderTitlePropsToOptions = appendStackHeaderTitlePropsToOptions;
const react_native_1 = require("react-native");
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
function convertFontWeightToStringFontWeight(fontWeight) {
    if (typeof fontWeight === 'number') {
        return String(fontWeight);
    }
    return fontWeight;
}
//# sourceMappingURL=StackHeaderTitle.js.map