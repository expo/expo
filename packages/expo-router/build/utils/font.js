"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertTextStyleToRNTextStyle = convertTextStyleToRNTextStyle;
exports.convertFontWeightToComposeFontWeight = convertFontWeightToComposeFontWeight;
const react_native_1 = require("react-native");
function convertTextStyleToRNTextStyle(style) {
    const flattenedStyle = react_native_1.StyleSheet.flatten(style);
    if (!flattenedStyle) {
        return undefined;
    }
    if ('fontWeight' in flattenedStyle) {
        return {
            ...flattenedStyle,
            fontWeight: typeof flattenedStyle.fontWeight === 'number'
                ? String(flattenedStyle.fontWeight)
                : flattenedStyle.fontWeight,
        };
    }
    return flattenedStyle;
}
const SUPPORTED_FONT_WEIGHTS = new Set([
    '100',
    '200',
    '300',
    '400',
    '500',
    '600',
    '700',
    '800',
    '900',
    'normal',
    'bold',
]);
function convertFontWeightToComposeFontWeight(fontWeight) {
    if (fontWeight == null) {
        return undefined;
    }
    const value = String(fontWeight);
    if (!SUPPORTED_FONT_WEIGHTS.has(value)) {
        if (process.env.NODE_ENV !== 'production') {
            console.warn(`Unsupported fontWeight "${value}". Supported values are 100–900, "normal", and "bold".`);
        }
        return undefined;
    }
    return value;
}
//# sourceMappingURL=font.js.map